import React, { Component } from 'react';
import { connect } from 'react-redux';

import { VERSION_INFO } from '../../VERSION.js';
import ExternalLink from '../../ExternalLink/ExternalLink';
// import Banner from './Banner.js';
import esaLogo from './esa.png';
import { t } from 'ttag';

import './ToolsFooter.scss';

class ToolsFooter extends Component {
  render() {
    return (
      <div className="tools-footer">
        <div className="footer-info">
          {!this.props.user && (
            <p className="free-signup">
              <ExternalLink
                href={`${process.env.REACT_APP_AUTH_BASEURL}oauth/subscription?origin=EOBrowser&param_client_id=${process.env.REACT_APP_CLIENTID}`}
              >
                {t`Free sign up`}
              </ExternalLink>{' '}
              {t`for all features`}
            </p>
          )}
          {t`Powered by`} <ExternalLink href="https://www.sinergise.com">Sinergise</ExternalLink>{' '}
          {t`with contributions from the European Space Agency`}
          <br />
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
          <ExternalLink className="esa-logo" href="https://www.esa.int/">
            <img src={esaLogo} alt="ESA" />
          </ExternalLink>
        </div>

        {/* <Banner /> */}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  user: store.auth.user.userdata,
});

export default connect(mapStoreToProps, null)(ToolsFooter);
