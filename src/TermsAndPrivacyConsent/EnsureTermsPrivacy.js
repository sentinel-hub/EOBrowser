import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import store, { modalSlice, authSlice } from '../store';
import { ModalId, LOCAL_STORAGE_PRIVACY_CONSENT_KEY } from '../const';

function EnsureTermsPrivacy({ children, termsPrivacyAccepted, userToken }) {
  const [ensuringConsentComplete, setEnsuringConsentComplete] = useState(false);

  useEffect(() => {
    if (userToken) {
      store.dispatch(authSlice.actions.setTermsPrivacyAccepted(true));
    } else {
      const consent = localStorage.getItem(LOCAL_STORAGE_PRIVACY_CONSENT_KEY);

      if (consent !== 'true') {
        store.dispatch(modalSlice.actions.addModal({ modal: ModalId.TERMS_AND_PRIVACY_CONSENT }));
      } else {
        store.dispatch(authSlice.actions.setTermsPrivacyAccepted(true));
      }
    }
    setEnsuringConsentComplete(true);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (userToken) {
      store.dispatch(authSlice.actions.setTermsPrivacyAccepted(true));
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_CONSENT_KEY, true);
    }
  }, [userToken]);

  if (ensuringConsentComplete) {
    return children;
  }
  return (
    <div className="initial-loader">
      <i className="fa fa-cog fa-spin fa-3x fa-fw" />
    </div>
  );
}

const mapStoreToProps = (store) => ({
  termsPrivacyAccepted: store.auth.terms_privacy_accepted,
  userToken: store.auth.user.access_token,
});

export default connect(mapStoreToProps, null)(EnsureTermsPrivacy);
