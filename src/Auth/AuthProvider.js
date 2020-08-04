import React from 'react';
import { connect } from 'react-redux';

import AnonymousAuth from './AnonymousAuth';
import store, { authSlice } from '../store';
import { decodeToken, getTokenFromLocalStorage } from './authHelpers';

class AuthProvider extends React.Component {
  state = {
    userAuthCompleted: false,
  };

  componentDidMount() {
    this.signInOnLoad();
  }

  signInOnLoad = async () => {
    try {
      const token = await getTokenFromLocalStorage();
      if (token) {
        store.dispatch(
          authSlice.actions.setUser({
            userdata: decodeToken(token),
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

  setAnonToken = token => {
    store.dispatch(authSlice.actions.setAnonToken(token));
  };

  render() {
    const { anonToken } = this.props;
    const { userAuthCompleted } = this.state;
    return (
      <>
        <AnonymousAuth setAnonToken={this.setAnonToken} />
        {anonToken && userAuthCompleted ? (
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

const mapStoreToProps = store => ({
  anonToken: store.auth.anonToken,
});
export default connect(mapStoreToProps)(AuthProvider);
