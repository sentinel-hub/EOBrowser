import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';
import logoCopernicus from './images/logo-tooltips-copernicus.png';

const getMarkdown = () => t`
**Sentinel-2** provides high-resolution images in the visible and infrared wavelengths, to monitor vegetation, soil and water cover, inland waterways and coastal areas. .

**Spatial resolution:** 10m, 20m, and 60m, depending on the wavelength (that is, only details bigger than 10m, 20m, and 60m can be seen). More info [here](https://sentinel.esa.int/web/sentinel/user-guides/sentinel-2-msi/resolutions/spatial). 

**Revisit time:** maximum 5 days to revisit the same area, using both satellites.

**Data availability:** Since June 2015. Full global coverage since March 2017.

**Common usage:** Land-cover maps, land-change detection maps, vegetation monitoring, monitoring of burnt areas.
`;

const S2L2AMarkdown = () => t`
Level 2A data are high quality data where the effects of the atmosphere on the light being reflected off of the surface of the Earth and reaching the sensor are excluded. Data are available globally since March 2017.

More info about atmospheric correction [here](https://www.sentinel-hub.com/develop/api/ogc/custom-parameters/atmospheric-correction/).`;

const S2L1CMarkdown = () => t`
Level 1C data are data of sufficient quality for most investigations, where all image corrections were done except for the atmospheric correction. Data are available globally since June 2015 onwards.`;

const Sentinel2Tooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} linkTarget="_blank" />
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

const S2L2ATooltip = () => <ReactMarkdown source={S2L2AMarkdown()} linkTarget="_blank" />;

const S2L1CTooltip = () => <ReactMarkdown source={S2L1CMarkdown()} />;

export { Sentinel2Tooltip, S2L1CTooltip, S2L2ATooltip };
