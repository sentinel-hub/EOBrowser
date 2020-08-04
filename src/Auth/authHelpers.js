import jwt_dec from 'jwt-decode';

export const LOCAL_STORAGE_AUTH_KEY = 'eobrowser_oauth';

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

export const saveTokenToLocalStorage = token => {
  localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(token));
};

export const removeTokenFromLocalStorage = () => {
  localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
};

export const isTokenExpired = token => {
  const now = new Date().valueOf();
  // "expires_in" is a misnomer (it holds expiry time as timestamp in ms)
  const expirationDate = token ? token['expires_in'] : 0;
  return expirationDate < now;
};

export const decodeToken = token => jwt_dec(token['id_token']);
