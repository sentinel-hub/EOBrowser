import React from 'react';
import moment from 'moment';

import { getUrlParams, parsePosition, parseDataFusion } from '../utils';
import {
  datasourceToDatasetId,
  dataSourceToThemeId,
  getDatasetIdFromInstanceId,
} from '../utils/handleOldUrls';
import store, { mainMapSlice, visualizationSlice, themesSlice } from '../store';
import { b64DecodeUnicode } from '../utils/base64MDN';

import { computeNewValuesFromPoints } from '../junk/EOBEffectsPanel/AdvancedRgbEffects/CurveEditor/CurveEditor.utils';
import { DEFAULT_LAT_LNG } from '../const';

class URLParamsParser extends React.Component {
  state = {
    params: null,
  };

  async componentDidMount() {
    let params = getUrlParams();

    // Check if the url contains EOB2 params and update them accordingly.
    if (this.containsEOB2Params(params)) {
      const translatedEOB2Params = await this.translateEOB2(params);
      params = {
        ...params,
        ...translatedEOB2Params,
      };
    }

    this.setStore(params);
    this.setState({
      params: params,
    });
  }

  containsEOB2Params = params => {
    return !!(
      params.instanceId ||
      params.time ||
      params.preset ||
      params.datasource ||
      params.gainOverride ||
      params.gammaOverride ||
      params.redRangeOverride ||
      params.greenRangeOverride ||
      params.blueRangeOverride
    );
  };

  translateEOB2 = async params => {
    let {
      time,
      preset,
      datasource,
      instanceId,
      gainOverride,
      gammaOverride,
      redRangeOverride,
      greenRangeOverride,
      blueRangeOverride,
    } = params;

    const EOB3Params = {};

    if (instanceId) {
      EOB3Params.themeId = instanceId.split('/').pop();
    }

    if (time) {
      const times = time.split('/');
      if (times.length === 2) {
        EOB3Params.fromTime = moment.utc(times[0]);
        EOB3Params.toTime = moment.utc(times[1]);
      } else {
        EOB3Params.fromTime = moment.utc(times[0]).startOf('day');
        EOB3Params.toTime = moment.utc(times[0]).endOf('day');
      }

      if (!EOB3Params.fromTime.isValid()) {
        EOB3Params.fromTime = moment.utc().startOf('day');
      }
      if (!EOB3Params.toTime.isValid()) {
        EOB3Params.toTime = moment.utc().endOf('day');
      }
    }

    //If datasource, 2 possible cases.
    //1. Basic link -> Convert datasource to datasetId and add it to params.
    //2. Theme link -> Convert datasource to datasetId + get the themeId -> add it to params.
    if (datasource) {
      let dataset = datasourceToDatasetId[datasource];
      if (dataset) {
        EOB3Params.datasetId = dataset;
        EOB3Params.layerId = preset;
      }
      const themeId = dataSourceToThemeId[datasource];
      if (themeId) {
        EOB3Params.themeId = themeId;
      }
    }

    if (instanceId) {
      const dataset = await getDatasetIdFromInstanceId(instanceId, preset);
      if (dataset) {
        EOB3Params.datasetId = dataset;
        EOB3Params.layerId = preset;
      }
    }

    if (gainOverride !== undefined) {
      EOB3Params.gain = gainOverride;
    }
    if (gammaOverride !== undefined) {
      EOB3Params.gamma = gammaOverride;
    }
    if (redRangeOverride !== undefined) {
      EOB3Params.redRange = redRangeOverride;
    }
    if (greenRangeOverride !== undefined) {
      EOB3Params.greenRange = greenRangeOverride;
    }
    if (blueRangeOverride !== undefined) {
      EOB3Params.blueRange = blueRangeOverride;
    }

    return EOB3Params;
  };

  setStore = params => {
    const {
      zoom,
      lat,
      lng,
      fromTime,
      toTime,
      datasetId,
      visualizationUrl,
      layerId,
      evalscript,
      evalscripturl,
      themesUrl,
      gain,
      gamma,
      redRange,
      greenRange,
      blueRange,
      redCurve,
      greenCurve,
      blueCurve,
      minQa,
      upsampling,
      downsampling,
      dataFusion,
    } = params;

    let { lat: parsedLat, lng: parsedLng, zoom: parsedZoom } = parsePosition(lat, lng, zoom);

    if (parsedLat > 90 || parsedLat < -90 || parsedLng > 180 || parsedLng < -180) {
      parsedLng = DEFAULT_LAT_LNG.lng;
      parsedLat = DEFAULT_LAT_LNG.lat;
    }
    store.dispatch(mainMapSlice.actions.setPosition({ zoom: parsedZoom, lat: parsedLat, lng: parsedLng }));

    const newVisualizationParams = {
      datasetId,
      fromTime: fromTime ? moment.utc(fromTime) : null,
      toTime: moment.utc(toTime),
      visualizationUrl,
      layerId,
      evalscript: evalscript && !evalscripturl ? b64DecodeUnicode(evalscript) : undefined,
      customSelected: evalscript || evalscripturl ? true : undefined,
      evalscripturl,
      gainEffect: gain ? parseFloat(gain) : undefined,
      gammaEffect: gamma ? parseFloat(gamma) : undefined,
      redRangeEffect: redRange ? JSON.parse(redRange) : undefined,
      greenRangeEffect: greenRange ? JSON.parse(greenRange) : undefined,
      blueRangeEffect: blueRange ? JSON.parse(blueRange) : undefined,

      redCurveEffect: redCurve
        ? { points: JSON.parse(redCurve), values: computeNewValuesFromPoints(JSON.parse(redCurve)) }
        : undefined,
      greenCurveEffect: greenCurve
        ? { points: JSON.parse(greenCurve), values: computeNewValuesFromPoints(JSON.parse(greenCurve)) }
        : undefined,
      blueCurveEffect: blueCurve
        ? { points: JSON.parse(blueCurve), values: computeNewValuesFromPoints(JSON.parse(blueCurve)) }
        : undefined,

      minQa: minQa ? parseInt(minQa) : undefined,
      upsampling: upsampling,
      downsampling: downsampling,
      dataFusion: dataFusion ? parseDataFusion(dataFusion, datasetId) : undefined,
    };
    store.dispatch(visualizationSlice.actions.setVisualizationParams(newVisualizationParams));

    if (themesUrl) {
      store.dispatch(themesSlice.actions.setThemesUrl(themesUrl));
    }
  };

  render() {
    const { params } = this.state;
    if (!params) {
      return null;
    }
    return this.props.children(params.themeId, params.sharedPinsListId);
  }
}

export default URLParamsParser;
