import jwt_dec from 'jwt-decode';
import axios from 'axios';
import { t } from 'ttag';

import { getUrlParams } from '../utils';
import store, { authSlice, notificationSlice } from '../store';

export const LOCAL_STORAGE_KC_NONCE = 'eobrowser_nonce'; // duplicated in public/oauthCallback.html
export const LOCAL_STORAGE_AUTH_KEY = 'eobrowser_oauth'; // duplicated in public/oauthCallback.html
export const LOCAL_STORAGE_ANON_AUTH_KEY = 'eobrowser_anon_auth';

export const UPDATE_BEFORE_EXPIRY_ANON_TOKEN = 10 * 1000; //seconds*miliseconds

const KC_IDP_HINT_PLANET = 'planet';

const oauth = {
  clientId: import.meta.env.VITE_CLIENTID,
  accessTokenUri: import.meta.env.VITE_AUTH_BASEURL + 'auth/realms/main/protocol/openid-connect/token',
  authorizationUri: import.meta.env.VITE_AUTH_BASEURL + 'auth/realms/main/protocol/openid-connect/auth',
  redirectUri: `${import.meta.env.VITE_ROOT_URL}oauthCallback.html`,
};

// nonce should not get changed in case user is redirected to EOB from signup email validation
let kcNonce = localStorage.getItem(LOCAL_STORAGE_KC_NONCE);
if (!kcNonce) {
  kcNonce = Math.round(Math.random() * Math.pow(10, 16)).toString();
  localStorage.setItem(LOCAL_STORAGE_KC_NONCE, kcNonce);
}

export const getSignUpUrl = () => {
  const url = import.meta.env.VITE_AUTH_BASEURL + 'auth/realms/main/protocol/openid-connect/registrations';
  const params = {
    response_type: 'token id_token',
    client_id: import.meta.env.VITE_CLIENTID,
    redirect_uri: oauth.redirectUri,
    kc_locale: 'en',
    scope: 'openid',
    nonce: kcNonce,
  };

  return url + '?' + new URLSearchParams(params);
};

const getOAuthURL = () => {
  const { kc_idp_hint } = getUrlParams();
  const params = {
    response_type: 'token id_token',
    redirect_uri: oauth.redirectUri,
    client_id: oauth.clientId,
    nonce: kcNonce,
  };
  if (kc_idp_hint === KC_IDP_HINT_PLANET) {
    params.kc_idp_hint = kc_idp_hint;
  }

  return oauth.authorizationUri + '?' + new URLSearchParams(params);
};

export const openLoginWindow = async () => {
  return new Promise((resolve, reject) => {
    window.authorizationCallback = { resolve, reject };
    window.open(getOAuthURL(), 'popupWindow', 'width=800,height=600');
  }).then((token) => {
    const idToken = decodeIdToken(token);
    if (idToken.nonce !== kcNonce) {
      throw new Error('Auth service returned nonce that is not equal to the nonce that was sent to it.');
    }

    saveUserTokenToLocalStorage(token);
    return token;
  });
};

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

export const getUserTokenFromLocalStorage = () => getTokenFromLocalStorage(LOCAL_STORAGE_AUTH_KEY);
export const getAnonTokenFromLocalStorage = () => getTokenFromLocalStorage(LOCAL_STORAGE_ANON_AUTH_KEY);

const saveTokenToLocalStorage = (key, token) => {
  localStorage.setItem(key, JSON.stringify(token));
};

export const saveUserTokenToLocalStorage = (token) => saveTokenToLocalStorage(LOCAL_STORAGE_AUTH_KEY, token);
export const saveAnonTokenToLocalStorage = (token) =>
  saveTokenToLocalStorage(LOCAL_STORAGE_ANON_AUTH_KEY, token);

const removeTokenFromLocalStorage = (key) => {
  localStorage.removeItem(key);
};

export const removeUserTokenFromLocalStorage = () => removeTokenFromLocalStorage(LOCAL_STORAGE_AUTH_KEY);
export const removeAnonTokenFromLocalStorage = () => removeTokenFromLocalStorage(LOCAL_STORAGE_ANON_AUTH_KEY);

export const isTokenExpired = (token) => {
  if (!token) {
    return true;
  }

  const now = new Date().valueOf();
  const expirationDate = getTokenExpiration(token);
  return expirationDate < now;
};

export const decodeToken = (token) => jwt_dec(token.access_token);
export const decodeIdToken = (token) => jwt_dec(token.id_token);

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

export async function doLogin() {
  try {
    const token = await openLoginWindow();
    store.dispatch(
      authSlice.actions.setUser({
        userdata: decodeToken(token),
        access_token: token.access_token,
        token_expiration: token.expires_in,
      }),
    );
  } catch (e) {
    console.error(e);
    store.dispatch(notificationSlice.actions.displayError(t`An error has occurred during login process`));
  }
}

function onLogOut() {
  removeUserTokenFromLocalStorage();
  store.dispatch(authSlice.actions.resetUser());
}

export async function doLogout() {
  try {
    const userToken = await getUserTokenFromLocalStorage();
    axios.get(import.meta.env.VITE_AUTH_BASEURL + 'auth/realms/main/protocol/openid-connect/logout', {
      withCredentials: true,
      params: {
        client_id: import.meta.env.VITE_CLIENTID,
        id_token_hint: userToken && userToken.id_token,
      },
    });
  } catch (e) {
    console.error(e);
  } finally {
    onLogOut();
  }
}
