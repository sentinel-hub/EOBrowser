import React, { Component } from 'react';
import axios from 'axios';
import ClientOAuth2 from 'client-oauth2';
import { t } from 'ttag';

import { decodeToken, saveTokenToLocalStorage, removeTokenFromLocalStorage } from './authHelpers';

class UserAuth extends Component {
  LOCAL_STORAGE_AUTH_KEY = 'eobrowser_oauth';
  oauth = new ClientOAuth2({
    clientId: process.env.REACT_APP_CLIENTID,
    accessTokenUri: process.env.REACT_APP_AUTH_BASEURL + 'oauth/token',
    authorizationUri: process.env.REACT_APP_AUTH_BASEURL + 'oauth/auth',
    redirectUri: `${process.env.REACT_APP_ROOT_URL}oauthCallback.html`,
    scopes: ['EOBrowser', 'SH'],
  });

  doLogin = () => {
    new Promise((resolve, reject) => {
      window.authorizationCallback = { resolve, reject };
      window.open(this.oauth.token.getUri(), 'popupWindow', 'width=800,height=600');
    }).then(token => {
      saveTokenToLocalStorage(token);
      this.props.onLogIn(token, decodeToken(token));
    });
  };

  doLogout = () => {
    axios
      .get(process.env.REACT_APP_AUTH_BASEURL + 'oauth/logout', {
        withCredentials: true,
        params: {
          client_id: process.env.REACT_APP_CLIENTID,
        },
      })
      .catch(e => {
        console.error(e);
      })
      .finally(() => {
        this.props.onLogOut();
        removeTokenFromLocalStorage();
      });
  };

  render() {
    const { user } = this.props;
    return (
      <span className="user-panel">
        {user ? (
          <div className="logout-button" onClick={this.doLogout} title={t`Logout`}>
            <i className="fa fa-power-off" />
          </div>
        ) : (
          <div
            className="login-button"
            onClick={this.doLogin}
            title={t`Login to unlock advanced features such as timelapse, analytical download, own configurations and more.`}
          >
            {t`Login`}
          </div>
        )}
      </span>
    );
  }
}

export default UserAuth;
