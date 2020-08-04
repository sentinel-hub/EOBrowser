import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const getMarkdown = () => t`
**Landsat** – NASA's Landsat satellites are similar to Sentinel-2, capturing visible and infrared
wavelengths and additionally thermal in Landsat 8. It also has a long history spanning nearly five
decades of imagery from the first Landsat mission, making it a unique resource for those who work in
agriculture, geology, forestry, regional planning, education, mapping, and global change research.
EO Browser provides imagery acquired from satellites Landsat 5, 7 and 8 processed at Level-1
reflectance.

**Spatial resolution:** 130m, thermal (100m resampled to 30m) and panchromatic (15m) bands.

**Revisit time:** <= 8 days with the two operational satellites Landsat 7 and Landsat 8.

**Data availability:** Europe and North Africa from 1984 - 2011 (Landsat 5), 1999 - 2003
(Landsat 7), 2013 until present (Landsat 8) from the ESA archive. The global USGS archive since
April 2013 until present (Landsat 8 only).

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
          <ExternalLink href="https://landsat.usgs.gov/landsat-project-description">USGS</ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default LandsatTooltip;
