import React, { useState } from 'react';
import moment from 'moment';

import DataFusionSupplementalDataset from './DataFusionSupplementalDataset';

import './SupplementalDatasets.scss';

function SupplementalDatasets(props) {
  const { availableSupplementalDatasets, supplementalDatasets = [], initialTimespan } = props;
  const [selectedDataset, setSelectedDataset] = useState(Object.keys(availableSupplementalDatasets)[0]);

  return (
    <div className="supplemental-datasets">
      {supplementalDatasets.map((dataset, i) => {
        const additionalMosaickingOrders =
          availableSupplementalDatasets[dataset.id].additionalMosaickingOrders;
        const maxDate =
          availableSupplementalDatasets[dataset.id].dataset.maxDate === null
            ? moment.utc()
            : moment.utc(availableSupplementalDatasets[dataset.id].dataset.maxDate);
        const label = availableSupplementalDatasets[dataset.id].label;
        const minDate = moment.utc(availableSupplementalDatasets[dataset.id].dataset.minDate);

        return (
          <DataFusionSupplementalDataset
            key={i}
            alias={dataset.alias}
            label={label}
            checkAliasValidity={props.checkAliasValidity}
            timespan={dataset.timespan}
            initialTimespan={initialTimespan}
            additionalMosaickingOrders={additionalMosaickingOrders}
            mosaickingOrder={dataset.mosaickingOrder}
            minDate={minDate}
            maxDate={maxDate}
            updateAlias={props.updateAlias}
            updateTimespan={props.updateTimespan}
            updateMosaickingOrder={props.updateMosaickingOrder}
            onRemoveSupplementalDataset={props.onRemoveSupplementalDataset}
          />
        );
      })}

      <div className="add-dataset">
        <i className="fas fa-plus-circle" onClick={() => props.onAddSupplementalDataset(selectedDataset)} />
        <select
          className="dropdown"
          value={selectedDataset}
          onChange={ev => setSelectedDataset(ev.target.value)}
        >
          {Object.entries(availableSupplementalDatasets).map(([datasetId, datasetInfo]) => (
            <option key={datasetId} value={datasetId}>
              {datasetInfo.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SupplementalDatasets;
