import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import UserAuth from '../../Auth/UserAuth';
import LanguageSelector from '../../LanguageSelector/LanguageSelector';
import './Header.scss';

class HeaderWithLogin extends Component {
  render() {
    const user = this.props.user;
    const impersonatedName = this.props.impersonatedName;
    return (
      <header id="logo-header">
        <div className="left">
          <div className="toggle-settings" onClick={this.props.toggleTools}>
            <i className="fa fa-chevron-left" />
          </div>
          <div className="app-title">
            <span>
              EO Browser
              {import.meta.env.VITE_REPLACE_SERVICES_HOSTNAME && (
                <div className="replace-services-hostname">
                  <i className="fa fa-random" /> {import.meta.env.VITE_REPLACE_SERVICES_HOSTNAME}
                </div>
              )}
            </span>
          </div>
        </div>

        <div className="right">
          <div className="row">
            <LanguageSelector />
            <UserAuth user={user} />
          </div>
          {impersonatedName ? (
            <div className="user-hello user-hello-impersonated">
              {t`Managing - `} <b>{impersonatedName}</b>
            </div>
          ) : user ? (
            <div className="user-hello">
              {t`Hello,`} <b>{user.name && user.name.trim() ? user.name : user.email}</b>
            </div>
          ) : null}
        </div>
      </header>
    );
  }
}

const mapStoreToProps = (store) => ({
  user: store.auth.user.userdata,
  selectedLanguage: store.language.selectedLanguage,
  impersonatedName: store.auth.impersonatedUser.name,
});

export default connect(mapStoreToProps, null)(HeaderWithLogin);
