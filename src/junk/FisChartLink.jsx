import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { LayersFactory } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import { checkAllMandatoryOutputsExist } from '../utils/parseEvalscript';
import {
  FATHOM_TRACK_EVENT_LIST,
  reqConfigMemoryCache,
  STATISTICS_MANDATORY_OUTPUTS,
  STATISTICS_MANDATORY_OUTPUTS_POI,
} from '../const';
import {
  getStatisticalInfoMsg,
  getLayerNotSelectedMsg,
  getNotAvailableForErrorMsg,
  getLoggedInErrorMsg,
  getHowToConfigLayersStatInfoMsg,
} from '../junk/ConstMessages';
import { handleFathomTrackEvent } from '../utils';
import { POI_STRING } from '../Controls/controls.utils';

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
          layerName = t`Custom`;
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
          // if POI: evalscript can have eobrowserStats or eobrowserStatsPOI (statinfo disabled for AOI)
          if (props.aoiOrPoi === POI_STRING) {
            const checkEobStatsOutput = checkAllMandatoryOutputsExist(
              evalscript,
              STATISTICS_MANDATORY_OUTPUTS,
            );
            const checkEobStatsOutputPoi = checkAllMandatoryOutputsExist(
              evalscript,
              STATISTICS_MANDATORY_OUTPUTS_POI,
            );
            statApiSupported[idx] = checkEobStatsOutput || checkEobStatsOutputPoi;
          } else {
            statApiSupported[idx] = checkAllMandatoryOutputsExist(evalscript, STATISTICS_MANDATORY_OUTPUTS);
          }
        }
        setLayerName(layerName);
      }
      setStatisticalApiSupported(statApiSupported);
    };
    fetchEvalscript();
  }, [props.selectedResults, props.aoiOrPoi]);

  const isSelectedResult = props.selectedResults.some((selectedResult) => selectedResult !== null);

  const isStatAvailableOnDatasource =
    isSelectedResult && statisticalApiSupported.some((supported) => supported);

  const isLoggedIn = !!props.user.userdata;

  const getTitleBasedOnStatus = (errorMessage) => {
    if (!isLoggedIn) {
      return errorMessage;
    }

    return `${getStatisticalInfoMsg()} (${
      !isSelectedResult ? getLayerNotSelectedMsg() : getNotAvailableForErrorMsg(layerName)
    }).`;
  };

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
    return (
      // jsx-a11y/anchor-is-valid
      // eslint-disable-next-line
      <a
        onClick={(e) => {
          e.preventDefault();
          props.onErrorMessage(errorMessage);
        }}
        title={getTitleBasedOnStatus(errorMessage)}
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
    const statisticalInfoMsg = getStatisticalInfoMsg();
    const additionalErrorMsg = !isSelectedResult
      ? `(${getLayerNotSelectedMsg()})`
      : `(${getNotAvailableForErrorMsg(layerName)}). ${getHowToConfigLayersStatInfoMsg()}`;
    const combinedStatErrorMsg = `${statisticalInfoMsg} ${additionalErrorMsg}`;

    return statsError(combinedStatErrorMsg);
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
