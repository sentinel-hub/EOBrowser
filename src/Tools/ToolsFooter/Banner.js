import React from 'react';

import ExternalLink from '../../ExternalLink/ExternalLink';
import banner from './banner-july-21.png';
import moment from 'moment';

export default class Banner extends React.Component {
  startDate = moment('2021-04-29');
  endDate = moment.utc('2021-07-25');

  render() {
    const shouldBeShown = moment().isBetween(this.startDate, this.endDate, 'minutes', '[]');
    if (!shouldBeShown) {
      return null;
    }

    return (
      <div className="footer-banner">
        <ExternalLink className="banner-link" href="https://www.sentinel-hub.com/develop/community/contest">
          <img src={banner} alt="EO Browser Custom Script" className="banner-img" />
        </ExternalLink>
      </div>
    );
  }
}
