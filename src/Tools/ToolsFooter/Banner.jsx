import React from 'react';

import ExternalLink from '../../ExternalLink/ExternalLink';
import banner from './new-planet-insights-platform-banner.png';
import moment from 'moment';

const Banner = ({ isUserLoggedIn }) => {
  const startDate = moment.utc('2024-04-09');
  const endDate = moment.utc('2025-04-10').endOf('day');

  const shouldBeShown = moment().isBetween(startDate, endDate, 'minutes', '[]');

  if (!shouldBeShown) {
    return null;
  }

  return (
    <div className="footer-banner">
      <ExternalLink className="banner-link" href="https://www.planet.com/products/planet-insights-platform/">
        <img
          src={banner}
          alt="EO Browser is now part of Planet Insights Platform - the all-in-one place for multidimensional Earth Insights."
          className="banner-img"
        />
      </ExternalLink>
    </div>
  );
};

export default Banner;
