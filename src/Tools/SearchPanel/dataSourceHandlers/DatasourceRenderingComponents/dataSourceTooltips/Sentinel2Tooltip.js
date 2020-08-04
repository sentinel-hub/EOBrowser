import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';
import logoCopernicus from './images/logo-tooltips-copernicus.png';

const getMarkdown = () => t`
**Sentinel-2** provides high-resolution imagery in the visible and infrared part of the spectrum
aiming to support the monitoring of vegetation, soil and water cover, inland waterways and coastal
areas. EO Browser provides data processed to two levels: L1C (orthorectified Top-Of-Atmosphere
reflectance) and L2A (orthorectified Bottom-Of-Atmosphere reflectance).

**Spatial resolution:** 10m, 20m, and 60m, depending on the wavelength.

**Revisit time:** <= 5 days using both satellites.

**Data availability:** Since June 2015.

**Common usage:** Land-cover maps, land-change detection maps, vegetation monitoring,
monitoring of burnt areas.
`;

const Sentinel2Tooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href="http://copernicus.eu/main/sentinels">
            <img src={logoCopernicus} alt="Copernicus" className="data-source-group-tooltip-logo" />
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default Sentinel2Tooltip;
