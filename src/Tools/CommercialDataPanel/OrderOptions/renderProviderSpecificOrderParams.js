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

const renderMaxarOrderParams = (actionInProgress, searchParams, orderOptions, setOrderOptions) => {
  return (
    <div className="row">
      <label title={t`Resampling kernel`}>{t`Resampling kernel`}</label>
      <div>
        <select
          className="dropdown"
          disabled={!!actionInProgress}
          value={orderOptions.productKernel}
          onChange={(e) =>
            setOrderOptions({ ...orderOptions, productKernel: ResamplingKernel[e.target.value] })
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

const renderPlanetScopeOrderParams = (actionInProgress, searchParams, orderOptions, setOrderOptions) => {
  return (
    <>
      <div className="row">
        <label title={t`Harmonize to`}>{t`Harmonize to`}</label>
        <div>
          <select
            className="dropdown"
            disabled={
              !!actionInProgress ||
              !isPlanetHarmonizationSupported(searchParams.itemType, searchParams.productBundle)
            }
            value={orderOptions.harmonizeTo}
            onChange={(e) => {
              setOrderOptions({ ...orderOptions, harmonizeTo: e.target.value });
            }}
          >
            <option key={PlanetScopeHarmonization.NONE} value={PlanetScopeHarmonization.NONE}>
              {PlanetScopeHarmonization.NONE}
            </option>

            <option
              key={defaultPlanetHarmonizeTo[searchParams.itemType]}
              value={defaultPlanetHarmonizeTo[searchParams.itemType]}
            >
              {defaultPlanetHarmonizeTo[searchParams.itemType]}
            </option>
          </select>
          <OrderInputTooltip inputId="harmonizeData" />
        </div>
      </div>

      <div className="row">
        <label title={t`Planet API Key`}>{t`Planet API Key`}</label>
        <div>
          <input
            type="text"
            disabled={!!actionInProgress}
            defaultValue={orderOptions.planetApiKey}
            onChange={(e) => setOrderOptions({ ...orderOptions, planetApiKey: e.target.value })}
            placeholder={t`Your Planet API key`}
          ></input>
          <OrderInputTooltip inputId="planetApiKey" />
        </div>
      </div>
    </>
  );
};

export const renderProviderSpecificOrderParams = (
  dataProvider,
  { actionInProgress, searchParams, orderOptions, setOrderOptions },
) => {
  switch (dataProvider) {
    case TPDICollections.PLANET_SCOPE:
      return renderPlanetScopeOrderParams(actionInProgress, searchParams, orderOptions, setOrderOptions);
    case TPDICollections.MAXAR_WORLDVIEW:
      return renderMaxarOrderParams(actionInProgress, searchParams, orderOptions, setOrderOptions);

    default:
      return null;
  }
};
