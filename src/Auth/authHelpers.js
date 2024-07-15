import jwt_dec from 'jwt-decode';
import axios from 'axios';
import { t } from 'ttag';

import store, { authSlice, notificationSlice } from '../store';
import Keycloak from 'keycloak-js';
import { removeURLParameter } from '../utils';

const LOCAL_STORAGE_ANON_AUTH_KEY = 'eobrowser_anon_auth';

export const UPDATE_BEFORE_EXPIRY_USER_TOKEN = 3 * 60 * 1000; //minutes*seconds*miliseconds
export const UPDATE_BEFORE_EXPIRY_ANON_TOKEN = 10 * 1000; //seconds*miliseconds

const keycloak = new Keycloak({
  url: import.meta.env.VITE_AUTH_BASEURL + 'auth',
  realm: 'main',
  clientId: import.meta.env.VITE_CLIENTID,
});

const setAuthenticatedUser = () => {
  const userPayload = {
    userdata: keycloak.idTokenParsed,
    access_token: keycloak.token,
    token_expiration: keycloak.tokenParsed.exp * 1000,
  };
  store.dispatch(authSlice.actions.setUser(userPayload));
};

export const initKeycloak = async () => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
    });

    if (authenticated) {
      setAuthenticatedUser();
    }
    return authenticated;
  } catch (error) {
    console.error('Failed to initialize keycloak adapter:', error);
    return false;
  }
};

export const doLogin = async (idpHint) => {
  let options = {};
  // If idpHint was provided, remove it from the url before logging in
  if (idpHint) {
    const urlWithoutIdpHint = removeURLParameter(window.location.href, 'kc_idp_hint');
    window.history.replaceState({}, document.title, urlWithoutIdpHint);
    options = { idpHint };
  }

  try {
    const authenticated = await keycloak.login(options);

    if (authenticated) {
      setAuthenticatedUser();
    }
    return authenticated;
  } catch (error) {
    store.dispatch(notificationSlice.actions.displayError(t`An error has occurred during login process`));
    return false;
  }
};

export const isUserAuthenticated = () => {
  return keycloak.authenticated;
};

// Refresh user token
export const refreshUserToken = async () => {
  try {
    const refreshed = await keycloak.updateToken();
    if (refreshed) {
      setAuthenticatedUser();
    }
    return refreshed;
  } catch (error) {
    return false;
  }
};

export const scheduleTokenRefresh = (expires_at, updateBeforeExpiry, refreshTimeout, refresh = () => {}) => {
  const now = Date.now();
  const expires_in = expires_at - now;

  const timeout = Math.max(expires_in - updateBeforeExpiry, 0);
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  //schedule refresh
  refreshTimeout = setTimeout(() => {
    refresh();
  }, timeout);

  return refreshTimeout;
};

export async function doLogout() {
  try {
    await keycloak.logout();
  } catch (e) {
    console.error(e);
  } finally {
    store.dispatch(authSlice.actions.resetUser());
  }
}

export const getSignUpUrl = () => {
  try {
    const options = {
      redirectUri: window.location.origin + window.location.pathname,
    };
    return keycloak.createRegisterUrl(options);
  } catch (error) {
    console.error('Failed create registration url:', error);
    return '#';
  }
};

/**
 * Anonymous token helpers
 */

const getTokenFromLocalStorage = async (key) => {
  const token = await localStorage.getItem(key);
  let parsedToken;
  try {
    parsedToken = JSON.parse(token);
  } catch (err) {
    console.error(err);
  }

  if (parsedToken && !isTokenExpired(parsedToken)) {
    return parsedToken;
  }
};

export const getAnonTokenFromLocalStorage = () => getTokenFromLocalStorage(LOCAL_STORAGE_ANON_AUTH_KEY);

const saveTokenToLocalStorage = (key, token) => {
  localStorage.setItem(key, JSON.stringify(token));
};

export const saveAnonTokenToLocalStorage = (token) =>
  saveTokenToLocalStorage(LOCAL_STORAGE_ANON_AUTH_KEY, token);

const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }

  const now = new Date().valueOf();
  const expirationDate = getTokenExpiration(token);
  return expirationDate < now;
};

export const getTokenExpiration = (token) => {
  try {
    if (!token?.access_token) {
      return 0;
    }
    const decodedToken = jwt_dec(token.access_token);
    return decodedToken?.exp * 1000 ?? 0;
  } catch (e) {
    console.error('Error decoding token', e.message);
  }
  return 0;
};

export const fetchAnonTokenUsingService = async (anonTokenServiceUrl, body) => {
  try {
    const { data } = await axios.post(anonTokenServiceUrl, body, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    return data;
  } catch (err) {
    console.error('Error while fetching anonymous token', err.message);
  }
  return null;
};
