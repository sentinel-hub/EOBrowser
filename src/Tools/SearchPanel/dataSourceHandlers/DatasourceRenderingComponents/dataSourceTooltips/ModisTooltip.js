import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const getMarkdown = () => t`
Nasa's **MODIS** – (Moderate Resolution Imaging Spectroradiometer) acquires data with the objective
to improve our understanding of global processes occurring on land. EO browser provides data for
observation of land (bands 1-7).

**Spatial resolution:** 250m (bands 1-2), 500m (bands 3-7), 1000m (bands 8-36).

**Revisit time:** Global coverage in 1 – 2 days with both Aqua and Terra satellites.

**Data availability:** Since January 2013.

**Common usage:** Monitoring of land, clouds, ocean colour at a global scale.
`;

const ModisTooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href="https://earth.esa.int/web/guest/missions/3rd-party-missions/current-missions/terraaqua-modis">
            ESA
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default ModisTooltip;
