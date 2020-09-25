import React from 'react';

import ExternalLink from '../../ExternalLink/ExternalLink';
import banner from './eo_browser_banner.jpg';
import moment from 'moment';

export default class Banner extends React.Component {
  startDate = moment('2020-08-04');
  endDate = moment('2020-10-31');

  render() {
    const shouldBeShown = moment().isBetween(this.startDate, this.endDate, 'day', '[]');
    if (!shouldBeShown) {
      return null;
    }

    return (
      <div className="footer-banner">
        <ExternalLink className="banner-link" href="https://www.sentinel-hub.com/contest">
          <img src={banner} alt="Sentinel Hub Custom script Contest" className="banner-img" />
        </ExternalLink>
      </div>
    );
  }
}
