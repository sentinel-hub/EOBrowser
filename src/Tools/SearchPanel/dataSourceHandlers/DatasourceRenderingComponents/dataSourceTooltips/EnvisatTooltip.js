import React from 'react';
import { t } from 'ttag';
import ReactMarkdown from 'react-markdown';

import ExternalLink from '../../../../../ExternalLink/ExternalLink';
import logoCreodias from './images/logo-tooltips-creodias.png';

const getMarkdown = () => t`
**MERIS** (Medium-resolution spectrometer) was a sensor on board the [ENVISAT](https://earth.esa.int/web/guest/missions/esa-operational-eo-missions/envisat) satellite with the primary mission to observe land and ocean colour and the atmosphere. It is no longer active and has been succeeded by Sentinel-3.

**Spatial resolution:** Full resolution land & coast: 260m x 290m (that is only details bigger than 260m x 290m can be seen).

**Revisit time:** maximum 3 days to revisit the same area.

**Data availability:** From June 2002 to April 2012.

**Common usage:** Ocean monitoring (phytoplankton, suspended matter), atmosphere (water vapour, CO2, clouds, aerosols), and land (vegetation index, global coverage, moisture).
`;

const EnvisatTooltip = () => {
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
          <ExternalLink href="https://earth.esa.int/web/guest/missions/esa-operational-eo-missions/envisat/instruments/meris">
            ESA
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default EnvisatTooltip;
