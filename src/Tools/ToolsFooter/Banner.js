import React from 'react';

import ExternalLink from '../../ExternalLink/ExternalLink';
import banner from './eo_browser_banner.jpg';

export default class Banner extends React.Component {
  render() {
    return (
      <div className="footer-banner">
        <ExternalLink className="banner-link" href="https://www.sentinel-hub.com/contest">
          <img src={banner} alt="Sentinel Hub Custom script Contest" className="banner-img" />
        </ExternalLink>
      </div>
    );
  }
}
