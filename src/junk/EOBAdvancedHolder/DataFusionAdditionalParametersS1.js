import React from 'react';
import { t } from 'ttag';

import './DataFusionAdditionalParametersS1.scss';

const ORTHORECTIFICATION_OPTIONS = {
  '': t`Disabled`,
  MAPZEN: t`Yes` + ' (Mapzen DEM)',
  COPERNICUS: t`Yes` + ' (Copernicus 10/30m DEM)',
  COPERNICUS_30: t`Yes` + ' (Copernicus 30m DEM)',
  COPERNICUS_90: t`Yes` + ' (Copernicus 90m DEM)',
};

function DataFusionAdditionalParametersS1(props) {
  const { additionalParameters = {} } = props;
  const { orthorectification = '' } = additionalParameters;

  const handleOrthorectificationChange = e => {
    props.onChange({
      ...additionalParameters,
      orthorectification: e.target.value,
    });
  };

  return (
    <div className="data-fusion-additional-parameters-s1">
      {t`Orthorectification`}:
      <select
        className="dropdown-normal-ui"
        value={orthorectification}
        onChange={handleOrthorectificationChange}
      >
        {Object.keys(ORTHORECTIFICATION_OPTIONS).map(o => (
          <option key={o} value={o}>
            {ORTHORECTIFICATION_OPTIONS[o]}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DataFusionAdditionalParametersS1;
