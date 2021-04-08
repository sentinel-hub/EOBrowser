import axios from 'axios';

import store from '../store';

export function getCollectionInformation(collectionId, locationId) {
  const auth = store.getState()['auth'];
  const token = auth.user && auth.user.access_token ? auth.user.access_token : auth.anonToken;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const requestConfig = {
    headers: headers,
  };
  return axios.get(
    `https://${
      locationId === 'creo' ? 'creodias' : 'services'
    }.sentinel-hub.com/api/v1/catalog/collections/${collectionId}`,
    requestConfig,
  );
}
