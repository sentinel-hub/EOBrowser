import React, { Component } from 'react';
import { connect } from 'react-redux';

import { VERSION_INFO } from '../../VERSION.js';
import ExternalLink from '../../ExternalLink/ExternalLink';
import Banner from './Banner';
import { t } from 'ttag';
import { getSignUpUrl } from '../../Auth/authHelpers.js';

import './ToolsFooter.scss';

class ToolsFooter extends Component {
  render() {
    return (
      <div className="tools-footer">
        {!this.props.user && (
          <p className="free-signup">
            <ExternalLink href={getSignUpUrl()}>{t`Free sign up`}</ExternalLink> {t`for all features`}
          </p>
        )}
        <div className="footer-info">
          <div className="footer-attribution">
            {t`Powered by`}{' '}
            <ExternalLink href="https://www.planet.com/products/">Planet Insights Platform</ExternalLink>
          </div>
          <div className="footer-version">
            {VERSION_INFO.tag ? (
              VERSION_INFO.tag
            ) : VERSION_INFO.commit ? (
              <span>
                {VERSION_INFO.branch ? ` ${VERSION_INFO.branch}` : null}
                {VERSION_INFO.commit ? ` [${VERSION_INFO.commit.substring(0, 8)}]` : null}
              </span>
            ) : (
              <span>Local build</span>
            )}
          </div>
        </div>
        <Banner isUserLoggedIn={this.props.user !== null} />
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  user: store.auth.user.userdata,
});

export default connect(mapStoreToProps, null)(ToolsFooter);
