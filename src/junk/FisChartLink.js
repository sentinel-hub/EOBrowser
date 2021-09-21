import React from 'react';
import { t } from 'ttag';

import { isCustomPreset } from './EOBCommon/utils/utils';

export const FisChartLink = (props) => {
  const isSelectedResult = !!props.selectedResult;
  const isCustomLayer = props.selectedResult && isCustomPreset(props.selectedResult.preset);
  const isShadowLayerAvailable = props.selectedResult && !!props.fisShadowLayer;
  const isFisAvailableOnDatasource = !!(props.selectedResult && props.selectedResult.baseUrls.FIS);
  if (isSelectedResult && isFisAvailableOnDatasource && (isShadowLayerAvailable || isCustomLayer)) {
    return (
      // jsx-a11y/anchor-is-valid
      // eslint-disable-next-line
      <a
        onClick={() => props.openFisPopup(props.aoiOrPoi)}
        title={t`Statistical Info / Feature Info Service chart`}
      >
        <i className={`fa fa-bar-chart`} />
      </a>
    );
  } else {
    const errorMessage =
      t`Statistical Info / Feature Info Service chart - ` +
      `${
        !isSelectedResult
          ? t`please select a layer`
          : !isFisAvailableOnDatasource
          ? t`not available for ` + props.selectedResult.name
          : t`not available for "${props.presetLayerName}" (layer with value is not set up)`
      }`;
    return (
      // jsx-a11y/anchor-is-valid
      // eslint-disable-next-line
      <a
        onClick={(e) => {
          e.preventDefault();
          props.onErrorMessage(errorMessage);
        }}
        title={errorMessage}
        className="disabled"
      >
        <i className={`fa fa-bar-chart`} />
      </a>
    );
  }
};
