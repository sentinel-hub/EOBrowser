import React from 'react';

import ExternalLink from '../../ExternalLink/ExternalLink';
import banner from './cbrowser-promo-banner.png';
import moment from 'moment';

const Banner = () => {
  const startDate = moment('2022-06-30');
  const endDate = moment.utc('2025-09-11T21:59');

  const shouldBeShown = moment().isBetween(startDate, endDate, 'minutes', '[]');

  if (!shouldBeShown) {
    return null;
  }

  return (
    <div className="footer-banner">
      <ExternalLink className="banner-link" href="https://dataspace.copernicus.eu/browser/">
        <img src={banner} alt="Explore the Copernicus Data Space Ecosystem" className="banner-img" />
      </ExternalLink>
    </div>
  );
};

export default Banner;
