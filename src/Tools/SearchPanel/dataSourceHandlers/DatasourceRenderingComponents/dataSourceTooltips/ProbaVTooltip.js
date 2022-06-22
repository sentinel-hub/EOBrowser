import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const getMarkdown = () => t`
The **Proba-V** satellite is a small satellite designed to map land cover and vegetation growth
across the entire globe every two days. EO Browser provides derived products which minimize cloud
cover by combining cloud-free measurement within a 1 day (S1), 5 days (S5) and 10 days (S10) period.

**Spatial resolution:** 100m for S1 and S5, 333m for S1 and S10, 1000m for S1 and S10.

**Revisit time:** 1 day for latitudes 35-75°N and 35-56°S, 2 days for latitudes between 35°N
and 35°S.

**Data availability:** Since October 2013.

**Common usage:** The observation of land cover, vegetation growth, climate impact assessment,
water resource management, agricultural monitoring and food security estimates, inland water
resource monitoring and tracking the steady spread of deserts and deforestation.
`;

const ProbaVTooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href="https://www.esa.int/Our_Activities/Observing_the_Earth/Proba-V/">
            ESA
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default ProbaVTooltip;
