import React, { Component } from 'react';
import ExternalLink from '../../ExternalLink/ExternalLink';
import store, { authSlice } from '../../store';
import { connect } from 'react-redux';
import { t } from 'ttag';

import UserAuth from '../../Auth/UserAuth';
/* import LanguageSelector from '../../LanguageSelector/LanguageSelector'; */
import sgLogo from './sgLogo.png';
import './Header.scss';

class HeaderWithLogin extends Component {
  onLogIn = (token, decodedToken) => {
    store.dispatch(authSlice.actions.setUser({ userdata: decodedToken, access_token: token.access_token }));
  };

  onLogOut = () => {
    localStorage.removeItem(this.LOCAL_STORAGE_AUTH_KEY);
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
            <ExternalLink className="sgLogo" href="https://www.sinergise.com">
              <img src={sgLogo} alt="Sinergise" />
            </ExternalLink>
            EO Browser
          </div>
        </div>

        <div className="right">
          <div className="row">
            {/* <LanguageSelector /> */}
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

const mapStoreToProps = store => ({
  user: store.auth.user.userdata,
});

export default connect(mapStoreToProps, null)(HeaderWithLogin);
