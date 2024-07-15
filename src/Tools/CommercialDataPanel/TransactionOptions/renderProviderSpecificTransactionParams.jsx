import React from 'react';
import { PlanetScopeHarmonization, TPDICollections, ResamplingKernel } from '@sentinel-hub/sentinelhub-js';
import { OrderInputTooltip } from './OrderInputTooltip';
import { t } from 'ttag';
import { isPlanetHarmonizationSupported, defaultPlanetHarmonizeTo } from '../CommercialDataPanel';

const getResamplingKernelLabel = (productKernel) => {
  const ResamplingKernelLabel = {
    [ResamplingKernel.CC]: `CC - ${t`4x4 cubic convolution`}`,
    [ResamplingKernel.NN]: `NN - ${t`nearest neighbour`}`,
    [ResamplingKernel.MTF]: `MTF - ${t`proprietary MTF kernel`}`,
  };

  return ResamplingKernelLabel[productKernel] || productKernel;
};

const renderMaxarTransactionParams = (actionInProgress, transactionOptions, setTransactionOptions) => {
  return (
    <div className="row">
      <label title={t`Resampling kernel`}>{t`Resampling kernel`}</label>
      <div>
        <select
          className="dropdown"
          disabled={!!actionInProgress}
          value={transactionOptions.productKernel}
          onChange={(e) =>
            setTransactionOptions({ ...transactionOptions, productKernel: ResamplingKernel[e.target.value] })
          }
        >
          {Object.keys(ResamplingKernel).map((productKernel, index) => (
            <option key={index} value={productKernel}>
              {getResamplingKernelLabel(productKernel)}
            </option>
          ))}
        </select>
        <OrderInputTooltip inputId="productKernel" />
      </div>
    </div>
  );
};

const renderPlanetScopeTransactionParams = (
  actionInProgress,
  searchParams,
  transactionOptions,
  setTransactionOptions,
  planetApiKeyHidden,
  setPlanetApiKeyHidden,
) => {
  const harmonizeOptions = [PlanetScopeHarmonization.NONE, defaultPlanetHarmonizeTo[searchParams.itemType]];
  return (
    <>
      {renderHarmonizeTransactionParams(
        actionInProgress,
        searchParams,
        transactionOptions,
        setTransactionOptions,
        harmonizeOptions,
      )}
      {renderPlanetAPIKeyTransactionParam(
        actionInProgress,
        transactionOptions,
        setTransactionOptions,
        planetApiKeyHidden,
        setPlanetApiKeyHidden,
      )}
    </>
  );
};

const renderPlanetSkySatTransactionParams = (
  actionInProgress,
  searchParams,
  transactionOptions,
  setTransactionOptions,
  planetApiKeyHidden,
  setPlanetApiKeyHidden,
) => {
  const harmonizeOptions = [PlanetScopeHarmonization.NONE];
  return (
    <>
      {renderHarmonizeTransactionParams(
        actionInProgress,
        searchParams,
        transactionOptions,
        setTransactionOptions,
        harmonizeOptions,
      )}
      {renderPlanetAPIKeyTransactionParam(
        actionInProgress,
        transactionOptions,
        setTransactionOptions,
        planetApiKeyHidden,
        setPlanetApiKeyHidden,
      )}
    </>
  );
};

const renderHarmonizeTransactionParams = (
  actionInProgress,
  searchParams,
  transactionOptions,
  setTransactionOptions,
  harmonizeOptions,
) => {
  return (
    <div className="row">
      <label title={t`Harmonize to`}>{t`Harmonize to`}</label>
      <div>
        <select
          className="dropdown"
          disabled={
            !!actionInProgress ||
            !isPlanetHarmonizationSupported(searchParams.itemType, searchParams.productBundle)
          }
          value={transactionOptions.harmonizeTo}
          onChange={(e) => {
            setTransactionOptions({ ...transactionOptions, harmonizeTo: e.target.value });
          }}
        >
          {harmonizeOptions.map((harmonizeOption) => {
            return (
              <option key={harmonizeOption} value={harmonizeOption}>
                {harmonizeOption}
              </option>
            );
          })}
        </select>
        <OrderInputTooltip inputId="harmonizeData" />
      </div>
    </div>
  );
};

const renderPlanetAPIKeyTransactionParam = (
  actionInProgress,
  transactionOptions,
  setTransactionOptions,
  planetApiKeyHidden,
  setPlanetApiKeyHidden,
) => {
  return (
    <>
      <div className="row">
        <label title={t`Planet API Key`}>{t`Planet API Key`}</label>
        <div>
          <input
            type={planetApiKeyHidden ? 'password' : 'text'}
            disabled={!!actionInProgress}
            defaultValue={transactionOptions.planetApiKey}
            onChange={(e) => setTransactionOptions({ ...transactionOptions, planetApiKey: e.target.value })}
            placeholder={t`Your Planet API key`}
          ></input>
          <span className="hide-planet-key-icon">
            <i
              className={planetApiKeyHidden ? 'fa fa-eye' : 'fa fa-eye-slash'}
              onClick={() => setPlanetApiKeyHidden(!planetApiKeyHidden)}
            />
          </span>
          <OrderInputTooltip inputId="planetApiKey" />
        </div>
      </div>
    </>
  );
};

export const renderProviderSpecificTransactionParams = (
  dataProvider,
  {
    actionInProgress,
    searchParams,
    transactionOptions,
    setTransactionOptions,
    planetApiKeyHidden,
    setPlanetApiKeyHidden,
  },
) => {
  switch (dataProvider) {
    case TPDICollections.PLANET_ARPS:
      return renderPlanetAPIKeyTransactionParam(
        actionInProgress,
        transactionOptions,
        setTransactionOptions,
        planetApiKeyHidden,
        setPlanetApiKeyHidden,
      );
    case TPDICollections.PLANET_SCOPE:
      return renderPlanetScopeTransactionParams(
        actionInProgress,
        searchParams,
        transactionOptions,
        setTransactionOptions,
        planetApiKeyHidden,
        setPlanetApiKeyHidden,
      );
    case TPDICollections.PLANET_SKYSAT:
      return renderPlanetSkySatTransactionParams(
        actionInProgress,
        searchParams,
        transactionOptions,
        setTransactionOptions,
        planetApiKeyHidden,
        setPlanetApiKeyHidden,
      );
    case TPDICollections.PLANETARY_VARIABLES:
      return renderPlanetAPIKeyTransactionParam(
        actionInProgress,
        transactionOptions,
        setTransactionOptions,
        planetApiKeyHidden,
        setPlanetApiKeyHidden,
      );
    case TPDICollections.MAXAR_WORLDVIEW:
      return renderMaxarTransactionParams(actionInProgress, transactionOptions, setTransactionOptions);

    default:
      return null;
  }
};
