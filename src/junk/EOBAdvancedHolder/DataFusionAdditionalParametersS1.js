import React from 'react';
import { Polarization, AcquisitionMode, Resolution } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import { S1_DEFAULT_PARAMS, ORTHORECTIFICATION_OPTIONS } from '../../const';
import { S1_SUPPORTED_SPECKLE_FILTERS } from '../../Tools/SearchPanel/dataSourceHandlers/Sentinel1DataSourceHandler';
import { findSpeckleFilterIndex } from '../EOBEffectsPanel/EOBEffectsPanel';

import './DataFusionAdditionalParametersS1.scss';

function DataFusionAdditionalParametersS1(props) {
  const { additionalParameters = {} } = props;
  const {
    orthorectification = S1_DEFAULT_PARAMS.orthorectification,
    speckleFilter = S1_DEFAULT_PARAMS.speckleFilter,
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

  const handleSpeckleFilterChange = (e, parameter) => {
    props.onChange({
      ...additionalParameters,
      [parameter]: S1_SUPPORTED_SPECKLE_FILTERS[e.target.value].params,
    });
  };

  const speckleFilterIndex = findSpeckleFilterIndex(S1_SUPPORTED_SPECKLE_FILTERS, speckleFilter);

  return (
    <div className="data-fusion-additional-parameters-s1">
      {t`Orthorectification`}:
      <select
        className="dropdown-normal-ui"
        value={orthorectification}
        onChange={(e) => handleChange(e, 'orthorectification')}
      >
        {Object.keys(ORTHORECTIFICATION_OPTIONS).map((o) => (
          <option key={o} value={o}>
            {ORTHORECTIFICATION_OPTIONS[o]}
          </option>
        ))}
      </select>
      {t`Polarization`}:
      <select
        className="dropdown-normal-ui"
        value={polarization}
        onChange={(e) => handleChange(e, 'polarization')}
      >
        {Object.keys(Polarization).map((o) => (
          <option key={o} value={o}>
            {Polarization[o]}
          </option>
        ))}
      </select>
      {t`Acquisition mode`}:
      <select
        className="dropdown-normal-ui"
        value={acquisitionMode}
        onChange={(e) => handleChange(e, 'acquisitionMode')}
      >
        {Object.keys(AcquisitionMode).map((o) => (
          <option key={o} value={o}>
            {AcquisitionMode[o]}
          </option>
        ))}
      </select>
      {t`Resolution`}:
      <select
        className="dropdown-normal-ui"
        value={resolution}
        onChange={(e) => handleChange(e, 'resolution')}
      >
        {Object.keys(Resolution).map((o) => (
          <option key={o} value={o}>
            {Resolution[o]}
          </option>
        ))}
      </select>
      {t`Speckle Filter`}:
      <select
        className="dropdown-normal-ui"
        value={speckleFilterIndex}
        onChange={(e) => handleSpeckleFilterChange(e, 'speckleFilter')}
      >
        {S1_SUPPORTED_SPECKLE_FILTERS.map((speckleFilter, index) => (
          <option key={index} value={index}>
            {speckleFilter.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DataFusionAdditionalParametersS1;
