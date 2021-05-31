import React from 'react';
import { Polarization, AcquisitionMode, Resolution } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import { S1_DEFAULT_PARAMS } from '../../const';

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
  const {
    orthorectification = S1_DEFAULT_PARAMS.orthorectification,
    polarization = S1_DEFAULT_PARAMS.polarization,
    acquisitionMode = S1_DEFAULT_PARAMS.acquisitionMode,
    resolution = S1_DEFAULT_PARAMS.resolution,
  } = additionalParameters;

  const handleChange = (e, parameter) => {
    props.onChange({
      ...additionalParameters,
      [parameter]: e.target.value,
    });
  };

  return (
    <div className="data-fusion-additional-parameters-s1">
      {t`Orthorectification`}:
      <select
        className="dropdown-normal-ui"
        value={orthorectification}
        onChange={e => handleChange(e, 'orthorectification')}
      >
        {Object.keys(ORTHORECTIFICATION_OPTIONS).map(o => (
          <option key={o} value={o}>
            {ORTHORECTIFICATION_OPTIONS[o]}
          </option>
        ))}
      </select>
      {t`Polarization`}:
      <select
        className="dropdown-normal-ui"
        value={polarization}
        onChange={e => handleChange(e, 'polarization')}
      >
        {Object.keys(Polarization).map(o => (
          <option key={o} value={o}>
            {Polarization[o]}
          </option>
        ))}
      </select>
      {t`Acquisition mode`}:
      <select
        className="dropdown-normal-ui"
        value={acquisitionMode}
        onChange={e => handleChange(e, 'acquisitionMode')}
      >
        {Object.keys(AcquisitionMode).map(o => (
          <option key={o} value={o}>
            {AcquisitionMode[o]}
          </option>
        ))}
      </select>
      {t`Resolution`}:
      <select className="dropdown-normal-ui" value={resolution} onChange={e => handleChange(e, 'resolution')}>
        {Object.keys(Resolution).map(o => (
          <option key={o} value={o}>
            {Resolution[o]}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DataFusionAdditionalParametersS1;
