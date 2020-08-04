import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';
import logoCopernicus from './images/logo-tooltips-copernicus.png';
import logoCreodias from './images/logo-tooltips-creodias.png';

const getMarkdown = () => t`
**Sentinel-1** provides all-weather, day and night radar imagery for land and ocean services. EO
Browser provides data acquired in Interferometric Wide Swath (IW) and Extra Wide Swath (EW) modes
processed to Level-1 Ground Range Detected (GRD).

**Pixel spacing:** 10m (IW), 40m (EW).

**Revisit time:** <= 5 days using both satellites.

**Revisit time** (for asc/desc and overlap using both satellites): <= 3 days, see [observation scenario](https://sentinel.esa.int/web/sentinel/missions/sentinel-1/observation-scenario)

**Data availability:** Since October 2014.

**Common usage:** Maritime and land monitoring, emergency response, climate change.
`;

const Sentinel1Tooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} linkTarget="_blank" />
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

export default Sentinel1Tooltip;
