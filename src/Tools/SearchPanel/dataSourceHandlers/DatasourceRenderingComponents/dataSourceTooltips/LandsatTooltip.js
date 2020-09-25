import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const getMarkdown = () => t`
The series of **Landsat** satellites of NASA/ U.S. Geological Survey are similar to Sentinel-2 (they capture visible and infrared wavelengths)
 and additionally can capture thermal infrared (Landsat 8). The Landsat series has a long history of imagery spanning nearly five decades.
  This platform gives you access to imagery acquired by Landsat 5, 7 and 8.

**Spatial resolution:** 15m, 30m, and 100m resampled to 30m, depending on the wavelength (that is, only details bigger than 10m and 30m, can be seen). More info [here](https://www.usgs.gov/faqs/what-are-band-designations-landsat-satellites?qt-news_science_products=0#qt-news_science_products).

**Revisit time:** Maximum 8 days to revisit the same area using the two operational satellites Landsat 7 and Landsat 8.

**Data availability:** Europe and North Africa from 1984 - 2011 (Landsat 5), 1999 - 2003 (Landsat 7), 2013 until present (Landsat 8) from the ESA archive. The global U.S. Geological Survey (USGS) archive since April 2013 until today (Landsat 8 only)   .

**Common usage:** Vegetation monitoring, land use, land cover maps, change monitoring, etc.
`;

const LandsatTooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href="https://www.usgs.gov/core-science-systems/nli/landsat/landsat-satellite-missions">
            USGS
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default LandsatTooltip;
