import React from 'react';
import { t } from 'ttag';
import ReactMarkdown from 'react-markdown';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';
import logoCopernicus from './images/logo-tooltips-copernicus.png';
import logoCreodias from './images/logo-tooltips-creodias.png';

const s3Markdown = () => t`
The main objective of the Sentinel-3 mission is to measure sea surface topography, sea and land
surface temperature, and ocean and land surface colour with high accuracy and reliability (source:
ESA). Both Sentinel-3 satellites have four different sensors on board. Data acquired by OLCI and
SLSTR sensors are available in EO Browser.
`;

const S3SLSTRMarkdown = () => t`
**Sentinel-3 SLSTR** provides global and regional Sea and Land Surface Temperature. EO
Browser provides data acquired in nadir view while descending. Measurements are processed at
Level 1B and represent top of atmosphere reflectance or brightness temperature.

**Spatial resolution:** 500m for bands S1 to S6, 1km for bands S7 to S9, F1, and F2.

**Revisit time:** <= 1 day using both satellites.

**Data availability:** Since May 2016.

**Common usage:** Climate change monitoring, vegetation monitoring, active fire detection,
land and sea surface temperature monitoring. Sentinel-3 SLSTR instrument ensures continuity of
the Envisat AATSR.
`;

const S3OLCIMarkdown = () => t`
**Sentinel-3 OLCI** provides more frequent optical imagery than Sentinel-2 but at lower
resolution and with more spectral bands to support the ocean, environmental, and climate
monitoring. EO Browser provides data acquired with the OLCI sensor at full resolution and
processed at Level 1 reflectance.

**Spatial resolution:** 300m.

**Revisit time:**  2 days using both satellites.

**Data availability:** Since May 2016.

**Common usage:** Surface topography observations, ocean and land surface colour
observation and monitoring. The Sentinel-3 OLCI instrument ensures the continuity of Envisat
Meris.
`;

const Sentinel3Tooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={s3Markdown()} />
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

const S3SLSTRTooltip = () => <ReactMarkdown source={S3SLSTRMarkdown()} />;

const S3OLCITooltip = () => <ReactMarkdown source={S3OLCIMarkdown()} />;

export { Sentinel3Tooltip, S3SLSTRTooltip, S3OLCITooltip };
