import React from 'react';

import ExternalLink from '../../ExternalLink/ExternalLink';
import banner from './webinar_promotion_banner.jpg';
import moment from 'moment';

export default class Banner extends React.Component {
  startDate = moment('2021-03-29');
  endDate = moment.utc('2021-04-15T12:00');

  render() {
    const shouldBeShown = moment().isBetween(this.startDate, this.endDate, 'minutes', '[]');
    if (!shouldBeShown) {
      return null;
    }

    return (
      <div className="footer-banner">
        <ExternalLink className="banner-link" href="https://www.sentinel-hub.com/explore/education/webinars/">
          <img src={banner} alt="EO Browser Webinar banner" className="banner-img" />
        </ExternalLink>
      </div>
    );
  }
}
