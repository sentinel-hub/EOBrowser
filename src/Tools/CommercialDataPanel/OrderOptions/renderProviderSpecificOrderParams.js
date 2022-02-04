import React from 'react';
import Toggle from 'react-toggle';
import { PlanetProductBundle, TPDICollections, ResamplingKernel } from '@sentinel-hub/sentinelhub-js';
import { OrderInputTooltip } from './OrderInputTooltip';
import { t } from 'ttag';

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
        <label title={t`Harmonize data`}>{t`Harmonize data`}</label>
        <div>
          <Toggle
            defaultChecked={orderOptions.harmonizeData}
            disabled={
              !!actionInProgress ||
              searchParams.productBundle === PlanetProductBundle.ANALYTIC_SR_UDM2 ||
              searchParams.productBundle === PlanetProductBundle.ANALYTIC_SR
            }
            icons={false}
            onChange={() => setOrderOptions({ ...orderOptions, harmonizeData: !orderOptions.harmonizeData })}
          />
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
