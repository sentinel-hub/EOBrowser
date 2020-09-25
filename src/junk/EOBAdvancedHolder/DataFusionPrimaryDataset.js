import React, { useState, useEffect } from 'react';
import { MosaickingOrder } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

function DataFusionPrimaryDataset(props) {
  const { label, alias, mosaickingOrder = MosaickingOrder.MOST_RECENT, additionalMosaickingOrders } = props;

  const [isValid, setIsValid] = useState(true);
  const [currentAlias, setCurrentAlias] = useState(alias);

  useEffect(() => {
    if (isValid) {
      props.updateAlias(alias, currentAlias);
    }
    // Disable warning for values used not in the dependency array (we only want useEffect to run on currentAlias change)
    // eslint-disable-next-line
  }, [currentAlias]);

  function updateAlias(e) {
    const isValid = props.checkAliasValidity(e.target.value);
    if (isValid) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
    setCurrentAlias(e.target.value);
  }

  return (
    <div className="primary-dataset-info">
      <div className="primary-dataset-label">{`Primary dataset: ${label}`}</div>
      <label htmlFor={`${alias}-alias`}>Datasource alias: </label>
      <input
        id={`${alias}-alias`}
        className={isValid ? '' : 'invalid'}
        value={currentAlias}
        onChange={updateAlias}
      />

      <div className="mosaicking-order">
        {t`Mosaicking order`}:
        <select
          className="dropdown"
          value={mosaickingOrder}
          onChange={e => props.updateMosaickingOrder(alias, e.target.value)}
        >
          <option value={MosaickingOrder.MOST_RECENT}>{t`Most recent`}</option>
          <option value={MosaickingOrder.LEAST_RECENT}>{t`Least recent`}</option>
          {additionalMosaickingOrders.map(mo => (
            <option key={mo.id} value={mo.id}>
              {mo.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default DataFusionPrimaryDataset;
