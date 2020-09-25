import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';
import logoCopernicus from './images/logo-tooltips-copernicus.png';
import logoCreodias from './images/logo-tooltips-creodias.png';

const getMarkdown = () => t`
**Sentinel-5P** is a satellite that provides atmospheric measurements to be used for air quality, ozone monitoring, UV radiation,
 and climate monitoring and forecasting.

**Spatial resolution:** 7 x 3.5km (that is, only details bigger than 7 x 3.5km can be seen).

**Revisit time:** Maximum 1 day to revisit the same area.

**Data availability:** Since April 2018 onwards.

**Common usage:** Monitoring the concentration of carbon monoxide (CO), nitrogen dioxide (NO2) and ozone (O3) in the air. Monitoring the UV aerosol index (AER_AI) and various geophysical parameters of clouds (Cloud).

`;

const Sentinel5Tooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href="https://creodias.eu/">
            <img src={logoCreodias} alt="Creodias" className="data-source-group-tooltip-logo" />
          </ExternalLink>
        </div>
        <div>
          <ExternalLink href="http://copernicus.eu/main/sentinels">
            <img src={logoCopernicus} alt="Copernicus" className="data-source-group-tooltip-logo" />
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default Sentinel5Tooltip;
