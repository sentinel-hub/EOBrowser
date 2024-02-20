import { isFunction } from './index';
import { ModalId } from '../const';
import store, { modalSlice } from '../store';

export async function refetchWithDefaultToken(fetchingFunction, reqConfig, restrictedAccountCallback = null) {
  try {
    return await fetchingFunction(reqConfig);
  } catch (err) {
    let shouldRefetchWithDefaultToken = false;
    let isRestricted = false;

    if (err.response) {
      const { status } = err.response;
      switch (status) {
        case 403:
          isRestricted = reqConfig && !!reqConfig.authToken;
          break;
        case 429:
          shouldRefetchWithDefaultToken = true;
          break;
        default:
          shouldRefetchWithDefaultToken = false;
      }
    }

    if (shouldRefetchWithDefaultToken) {
      reqConfig = { ...reqConfig, authToken: null };
      return await fetchingFunction(reqConfig);
    }

    if (isRestricted) {
      store.dispatch(modalSlice.actions.addModal({ modal: ModalId.RESTRICTED_ACCESS }));
      if (restrictedAccountCallback && isFunction(restrictedAccountCallback)) {
        restrictedAccountCallback();
      }
      return null;
    }

    throw err;
  }
}
