import React, { Component } from 'react';
import axios from 'axios';
import { t } from 'ttag';

import { decodeToken, removeTokenFromLocalStorage, openLoginWindow } from './authHelpers';

class UserAuth extends Component {
  doLogin = async () => {
    const token = await openLoginWindow();
    this.props.onLogIn(token, decodeToken(token));
  };

  doLogout = () => {
    axios
      .get(process.env.REACT_APP_AUTH_BASEURL + 'oauth/logout', {
        withCredentials: true,
        params: {
          client_id: process.env.REACT_APP_CLIENTID,
        },
      })
      .catch((e) => {
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
