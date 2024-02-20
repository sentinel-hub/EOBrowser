import React from 'react';
import { connect } from 'react-redux';

import AnonymousAuth from './AnonymousAuth';
import store, { authSlice } from '../store';
import { decodeToken, getUserTokenFromLocalStorage } from './authHelpers';

class AuthProvider extends React.Component {
  state = {
    userAuthCompleted: false,
  };

  componentDidMount() {
    this.signInOnLoad();
  }

  signInOnLoad = async () => {
    try {
      const token = await getUserTokenFromLocalStorage();
      if (token) {
        store.dispatch(
          authSlice.actions.setUser({
            userdata: decodeToken(token),
            token_expiration: token.expires_in,
            access_token: token.access_token,
          }),
        );
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
          this.props.children
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
});
export default connect(mapStoreToProps)(AuthProvider);
