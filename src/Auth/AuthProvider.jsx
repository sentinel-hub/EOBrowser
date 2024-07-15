import React from 'react';
import { connect } from 'react-redux';

import AnonymousAuth from './AnonymousAuth';
import store, { authSlice } from '../store';
import { doLogin, initKeycloak } from './authHelpers';
import UserTokenRefresh from './UserTokenRefresh';
import { getUrlParams } from '../utils';

class AuthProvider extends React.Component {
  state = {
    userAuthCompleted: false,
  };

  componentDidMount() {
    this.signInOnLoad();
  }

  signInOnLoad = async () => {
    const { kc_idp_hint, impersonatedAccountId, impersonatedUserId } = getUrlParams();

    if (impersonatedAccountId || impersonatedUserId) {
      store.dispatch(authSlice.actions.setImpersonatedIds({ impersonatedAccountId, impersonatedUserId }));
    }

    try {
      const isUserAuthenticated = await initKeycloak();
      if (!isUserAuthenticated && kc_idp_hint !== undefined) {
        await doLogin(kc_idp_hint);
      }
    } catch (err) {
      console.error(err);
    }

    this.setState({
      userAuthCompleted: true,
    });
  };

  setAnonToken = (token) => {
    store.dispatch(authSlice.actions.setAnonToken(token));
  };

  render() {
    const { anonToken, termsPrivacyAccepted } = this.props;
    const { userAuthCompleted } = this.state;
    return (
      <>
        {termsPrivacyAccepted && <AnonymousAuth setAnonToken={this.setAnonToken} />}
        {userAuthCompleted && (termsPrivacyAccepted ? anonToken : true) ? (
          <UserTokenRefresh>{this.props.children}</UserTokenRefresh>
        ) : (
          <div className="initial-loader">
            <i className="fa fa-cog fa-spin fa-3x fa-fw" />
          </div>
        )}
      </>
    );
  }
}

const mapStoreToProps = (store) => ({
  anonToken: store.auth.anonToken,
  termsPrivacyAccepted: store.auth.terms_privacy_accepted,
  kc_idp_hint: store.auth.kc_idp_hint,
});
export default connect(mapStoreToProps)(AuthProvider);
