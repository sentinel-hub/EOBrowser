import React, { Component } from 'react';
import ExternalLink from '../../ExternalLink/ExternalLink';
import store, { authSlice } from '../../store';
import { connect } from 'react-redux';
import { t } from 'ttag';

import UserAuth from '../../Auth/UserAuth';
import { LOCAL_STORAGE_AUTH_KEY } from '../../Auth/authHelpers';
import LanguageSelector from '../../LanguageSelector/LanguageSelector';
import sgLogo from './sgLogo.png';
import './Header.scss';

class HeaderWithLogin extends Component {
  onLogIn = (token, decodedToken) => {
    store.dispatch(
      authSlice.actions.setUser({
        userdata: decodedToken,
        access_token: token.access_token,
        token_expiration: token.expires_in,
      }),
    );
  };

  onLogOut = () => {
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    store.dispatch(authSlice.actions.resetUser());
  };

  render() {
    const user = this.props.user;
    return (
      <header id="logo-header">
        <div className="left">
          <div className="toggle-settings" onClick={this.props.toggleTools}>
            <i className="fa fa-chevron-left" />
          </div>
          <div className="app-title">
            <ExternalLink className="sgLogo" href="https://www.sentinel-hub.com/">
              <img src={sgLogo} alt="Sentinel Hub" />
            </ExternalLink>
            <span>
              EO Browser
              {process.env.REACT_APP_REPLACE_SERVICES_HOSTNAME && (
                <div className="replace-services-hostname">
                  <i className="fa fa-random" /> {process.env.REACT_APP_REPLACE_SERVICES_HOSTNAME}
                </div>
              )}
            </span>
          </div>
        </div>

        <div className="right">
          <div className="row">
            <LanguageSelector />
            <UserAuth onLogIn={this.onLogIn} onLogOut={this.onLogOut} user={user} />
          </div>
          {user && (
            <div className="user-hello">
              {t`Hello,`} <b>{user.name && user.name.trim() ? user.name : user.email}</b>
            </div>
          )}
        </div>
      </header>
    );
  }
}

const mapStoreToProps = (store) => ({
  user: store.auth.user.userdata,
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(HeaderWithLogin);
