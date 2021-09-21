import jwt_dec from 'jwt-decode';
import ClientOAuth2 from 'client-oauth2';

export const LOCAL_STORAGE_AUTH_KEY = 'eobrowser_oauth';
export const oauth = new ClientOAuth2({
  clientId: process.env.REACT_APP_CLIENTID,
  accessTokenUri: process.env.REACT_APP_AUTH_BASEURL + 'oauth/token',
  authorizationUri: process.env.REACT_APP_AUTH_BASEURL + 'oauth/auth',
  redirectUri: `${process.env.REACT_APP_ROOT_URL}oauthCallback.html`,
  scopes: ['EOBrowser', 'SH'],
});

export const openLoginWindow = async () => {
  return new Promise((resolve, reject) => {
    window.authorizationCallback = { resolve, reject };
    window.open(oauth.token.getUri(), 'popupWindow', 'width=800,height=600');
  }).then((token) => {
    saveTokenToLocalStorage(token);
    return token;
  });
};

export const getTokenFromLocalStorage = async () => {
  const token = await localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
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

export const saveTokenToLocalStorage = (token) => {
  localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(token));
};

export const removeTokenFromLocalStorage = () => {
  localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
};

export const isTokenExpired = (token) => {
  const now = new Date().valueOf();
  // "expires_in" is a misnomer (it holds expiry time as timestamp in ms)
  const expirationDate = token ? token['expires_in'] : 0;
  return expirationDate < now;
};

export const decodeToken = (token) => jwt_dec(token['id_token']);
