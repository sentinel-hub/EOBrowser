import axios from 'axios';
import ClientOAuth2 from 'client-oauth2';
import jwt_dec from 'jwt-decode';
import Store from '../store';
import { loadInstances } from './ajax';
import { fetchPinsFromServer } from './utils';
const LC_NAME = 'eobrowser_oauth';

const oauth = new ClientOAuth2({
  clientId: process.env.REACT_APP_CLIENTID,
  accessTokenUri: process.env.REACT_APP_BASEURL + 'oauth/token',
  authorizationUri: process.env.REACT_APP_BASEURL + 'oauth/auth',
  redirectUri: `${process.env.REACT_APP_REDIRECT}oauthCallback.html`,
  scopes: ['EOBrowser', 'SH'],
});

export const doLogin = () => {
  return new Promise((resolve, reject) => {
    window.authorizationCallback = { resolve, reject };
    window.open(oauth.token.getUri(), 'popupWindow', 'width=800,height=600');
  }).then(token => {
    const user = jwt_dec(token['id_token']);
    loadInstances(token);
    Store.setUser(user);
    fetchPinsFromServer();
  });
};

export const doLogout = () => {
  return new Promise((resolve, reject) => {
    axios
      .get(process.env.REACT_APP_BASEURL + 'oauth/logout', {
        withCredentials: true,
      })
      .then(() => {
        removeTokenFromLocalStorage();
        resolve();
      })
      .catch(e => reject());
  });
};

export const checkAuthState = () => {
  const token = getTokenFromLocalStorage();
  if (token && !isTokenExpired(token)) {
    const user = decodeUserFromToken(token);
    loadInstances(token);
    Store.setUser(user);
    fetchPinsFromServer();
  }
};

export const getTokenFromLocalStorage = () => {
  const token = localStorage.getItem(LC_NAME);
  const user = JSON.parse(token);
  return user;
};

export const removeTokenFromLocalStorage = () => {
  localStorage.removeItem(LC_NAME);
};

const decodeUserFromToken = token => {
  const user = jwt_dec(token['id_token']);
  return user;
};

export const isTokenExpired = token => {
  const now = new Date().valueOf();
  // "expires_in" is a misnomer (it holds expiry time as timestamp in ms)
  const expirationDate = token ? token['expires_in'] : 0;
  return expirationDate < now;
};
