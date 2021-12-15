import React from 'react';

import ExternalLink from '../../ExternalLink/ExternalLink';
import banner from './base_banner_green4.jpg';
import moment from 'moment';

export default class Banner extends React.Component {
  startDate = moment('2021-11-09');
  endDate = moment.utc('2021-11-24');

  render() {
    const shouldBeShown = moment().isBetween(this.startDate, this.endDate, 'minutes', '[]');
    if (!shouldBeShown) {
      return null;
    }

    return (
      <div className="footer-banner">
        <ExternalLink
          className="banner-link"
          href="https://www.sentinel-hub.com/develop/community/twitter-challenge-nov-2021/"
        >
          <img src={banner} alt="EO Browser Twitter Challenge" className="banner-img" />
        </ExternalLink>
      </div>
    );
  }
}
