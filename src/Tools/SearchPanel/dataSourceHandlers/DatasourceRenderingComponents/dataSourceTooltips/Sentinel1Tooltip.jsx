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

const S1ACQModeMarkdown =
  () => t`Sentinel-1 operates in 4 exclusive instrument acquisition modes. Depending on the instrument mode, the data products may be available in different polarisation, resolution and swath withs (between 20 km and 410 km). The four different modes are:
- Stripmap (SM) 
- Interferometric Wide swath (IW)
- Extra-Wide swath (EW)
- Wave (WV)
`;

const S1PolarizationMarkdown = () => t`
Determines with which polarisation the data was acquired. The first letter indicates the polarisation when sending the signal, the second letter when receiving the signal, e.g., HV = horizontal polarisation when sending the signal and vertical polarisation when receiving.

Data can be acquired in single polarisation HH (SH) or VV (SV) or in dual polarisation HH&HV (DH) or VV&VH (DV), depending on the instrument mode.

SM, IW and EW can be acquired in single or dual polarisation. WV can only be acquired in single polarisation.`;

const S1OrbitDirection = () =>
  t`Determines whether the data was recorded during a descending orbit (flight direction: north - south) or an ascending orbit (flight direction: south - north).`;

const Sentinel1Tooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown children={getMarkdown()} linkTarget="_blank" />
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

const S1ACQModeTooltip = () => <ReactMarkdown children={S1ACQModeMarkdown()} linkTarget="_blank" />;

const S1PolarizationTooltip = () => <ReactMarkdown children={S1PolarizationMarkdown()} linkTarget="_blank" />;

const S1OrbitDirectionTooltip = () => <ReactMarkdown children={S1OrbitDirection()} linkTarget="_blank" />;

export { Sentinel1Tooltip, S1ACQModeTooltip, S1PolarizationTooltip, S1OrbitDirectionTooltip };
