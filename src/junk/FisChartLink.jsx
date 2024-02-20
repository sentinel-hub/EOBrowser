import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { LayersFactory } from '@sentinel-hub/sentinelhub-js';

import { checkAllMandatoryOutputsExist } from '../utils/parseEvalscript';
import { FATHOM_TRACK_EVENT_LIST, reqConfigMemoryCache, STATISTICS_MANDATORY_OUTPUTS } from '../const';
import {
  getStatisticalInfoMsg,
  getLayerNotSelectedMsg,
  getNotAvailableForErrorMsg,
  getLoggedInErrorMsg,
} from '../junk/ConstMessages';
import { handleFathomTrackEvent } from '../utils';

const FisChartLink = (props) => {
  const [statisticalApiSupported, setStatisticalApiSupported] = useState(
    props.selectedResults.map((_) => false),
  );
  const [layerName, setLayerName] = useState();

  useEffect(() => {
    const fetchEvalscript = async () => {
      const statApiSupported = props.selectedResults.map((_) => false);
      for (const idx in props.selectedResults) {
        const selectedResult = props.selectedResults[idx];

        if (selectedResult === null) {
          continue;
        }

        let evalscript;
        let layerName;

        if (selectedResult.isCustomSelected) {
          evalscript = selectedResult.evalscript;
        } else {
          if (selectedResult.layerId) {
            const layer = await LayersFactory.makeLayer(
              selectedResult.visualizationUrl,
              selectedResult.layerId,
              null,
              reqConfigMemoryCache,
            );
            if (layer) {
              await layer.updateLayerFromServiceIfNeeded(reqConfigMemoryCache);
              layerName = layer.title;
              evalscript = layer.evalscript;
            }
          }
        }
        if (evalscript) {
          statApiSupported[idx] = checkAllMandatoryOutputsExist(evalscript, STATISTICS_MANDATORY_OUTPUTS);
        }
        setLayerName(layerName);
      }
      setStatisticalApiSupported(statApiSupported);
    };
    fetchEvalscript();
  }, [props.selectedResults]);

  const isSelectedResult = props.selectedResults.some((selectedResult) => selectedResult !== null);

  const isStatAvailableOnDatasource = !!(
    props.selectedResults.some((selectedResult) => selectedResult !== null && selectedResult.baseUrls.FIS) ||
    statisticalApiSupported.some((supported) => supported)
  );

  const isLoggedIn = !!props.user.userdata;

  const statsEnabled = () => (
    // jsx-a11y/anchor-is-valid
    // eslint-disable-next-line
    <a
      onClick={() => {
        props.openFisPopup(props.aoiOrPoi);
        handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.STATISTICAL_INFO_CHART_ICON_CLICKED);
      }}
      title={getStatisticalInfoMsg()}
      className="active"
    >
      <i className={`fa fa-bar-chart`} />
    </a>
  );

  const statsError = (errorMessage) => {
    const errorMsgWithTitle = `${getStatisticalInfoMsg()} - ${errorMessage}`;

    return (
      // jsx-a11y/anchor-is-valid
      // eslint-disable-next-line
      <a
        onClick={(e) => {
          e.preventDefault();
          props.onErrorMessage(errorMsgWithTitle);
        }}
        title={errorMsgWithTitle}
        className="disabled"
      >
        <i className={`fa fa-bar-chart`} />
      </a>
    );
  };

  if (!isLoggedIn) {
    return statsError(getLoggedInErrorMsg());
  }

  if (!isStatAvailableOnDatasource) {
    return statsError(!isSelectedResult ? getLayerNotSelectedMsg() : getNotAvailableForErrorMsg(layerName));
  }

  return statsEnabled();
};

const mapStoreToProps = (store) => ({
  visualizationUrl: store.visualization.visualizationUrl,
  layerId: store.visualization.layerId,
  evalscript: store.visualization.evalscript,
  customSelected: store.visualization.customSelected,
  user: store.auth.user,
});

export default connect(mapStoreToProps, null)(FisChartLink);
