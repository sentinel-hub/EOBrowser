import {
  CRS_EPSG3857,
  CRS_EPSG4326,
  LayersFactory,
  StatisticsProviderType,
} from '@sentinel-hub/sentinelhub-js';
import moment from 'moment';
import { t } from 'ttag';
import {
  reqConfigMemoryCache,
  DATAMASK_OUTPUT,
  EOBROWSERSTATS_OUTPUT,
  EOBROWSERSTATS_OUTPUT_POI,
} from '../../const';
import {
  getRecommendedResolutionForDatasetId,
  getRequestGeometry,
  getStatisticsLayer,
} from '../FIS/FIS.utils';
import { refetchWithDefaultToken } from '../../utils/fetching.utils';
import { checkAllMandatoryOutputsExist } from '../../utils/parseEvalscript';

const PIXEL_EXPLORER_ENABLED = true;
const PIXEL_VALUE_OUTPUT = EOBROWSERSTATS_OUTPUT;
const PIXEL_VALUE_OUTPUT_POI = EOBROWSERSTATS_OUTPUT_POI;
const PIXEL_VALUE_MANDATORY_OUTPUTS = [PIXEL_VALUE_OUTPUT, DATAMASK_OUTPUT];
const PIXEL_VALUE_MANDATORY_OUTPUTS_POI = [PIXEL_VALUE_OUTPUT_POI, DATAMASK_OUTPUT];

// initialize the statistics layer that will be used to obtain pixel-related valuess
const initializeStatisticsLayer = async ({
  geometry,
  customSelected,
  evalscript,
  layerId,
  visualizationUrl,
  datasetId,
  fromTime,
  toTime,
  user,
}) => {
  if (!user?.userdata) {
    return { enabled: false, statisticsLayer: null };
  }

  if (!(PIXEL_EXPLORER_ENABLED && geometry && visualizationUrl)) {
    return { enabled: false, statisticsLayer: null };
  }

  // visualizationUrl is set, but layer is not selected (happens when user closes custom layer)
  if (!layerId && !customSelected) {
    return { enabled: false, statisticsLayer: null };
  }

  //disable for timespan
  if (fromTime && toTime && toTime.diff(fromTime, 'days') > 0) {
    return { enabled: false, statisticsLayer: null };
  }

  const paramsForStatsLayer = {
    customSelected,
    datasetId,
    evalscript,
    layerId,
    visualizationUrl,
  };
  let { supportStatisticalApi, statisticsLayer } = await getStatisticsLayer(
    paramsForStatsLayer,
    PIXEL_VALUE_MANDATORY_OUTPUTS,
  );

  // check if evalscript has 'eobrowserStatsPOI' output instead of 'eobrowserStats'
  if (!supportStatisticalApi) {
    const { supportStatisticalApi: supportStatApiPoi, statisticsLayer: statsLayerPoi } =
      await getStatisticsLayer(paramsForStatsLayer, PIXEL_VALUE_MANDATORY_OUTPUTS_POI);

    if (supportStatApiPoi) {
      supportStatisticalApi = supportStatApiPoi;
      statisticsLayer = statsLayerPoi;
    }
  }

  if (!(statisticsLayer && supportStatisticalApi)) {
    return { enabled: false, statisticsLayer: null };
  }

  if (!supportStatisticalApi) {
    // for FIS request we want to display the title of the original layer and not the __FIS shadow layer
    const visualizationLayer = await LayersFactory.makeLayer(visualizationUrl, layerId);
    statisticsLayer.title = visualizationLayer?.title || layerId;
  }

  if (customSelected) {
    statisticsLayer.title = t`Custom`;
  }

  return {
    enabled: true,
    statisticsLayer: statisticsLayer,
    indexValueFetchingFunction: supportStatisticalApi ? getStatisticalIndexValue : getFISIndexValue,
  };
};

const formatIndexValue = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return t`N/A`;
  }
  return Math.round(value * 10000) / 10000;
};

const getIndexValue = async (
  statisticsLayer,
  supportStatisticalApi,
  { fromTime, toTime, cancelToken, requestGeometry, crs, recommendedResolution, userToken },
) => {
  // update layer with evalscript if needed
  await refetchWithDefaultToken((reqConfig) => statisticsLayer.updateLayerFromServiceIfNeeded(reqConfig), {
    ...reqConfigMemoryCache,
    cancelToken: cancelToken,
    ...(userToken ? { authToken: userToken } : {}),
  });

  // check if evalscript has 'eobrowserStatsPOI' output instead of 'eobrowserStats'
  const checkEobStatsOutputPoi = checkAllMandatoryOutputsExist(
    statisticsLayer.evalscript,
    PIXEL_VALUE_MANDATORY_OUTPUTS_POI,
  );
  const outputName = checkEobStatsOutputPoi ? PIXEL_VALUE_OUTPUT_POI : PIXEL_VALUE_OUTPUT;

  const statsParams = {
    geometry: requestGeometry,
    crs: crs,
    fromTime: fromTime,
    toTime: toTime.diff(fromTime, 'days') > 0 ? toTime : moment.utc(toTime).add(1, 'days').startOf('day'),
    resolution: recommendedResolution,
    bins: 1,
    output: outputName,
  };
  let indexValue = null;
  const response = await refetchWithDefaultToken(
    (reqConfig) => statisticsLayer.getStats(statsParams, reqConfig, StatisticsProviderType.STAPI),

    { ...reqConfigMemoryCache, cancelToken: cancelToken, ...(userToken ? { authToken: userToken } : {}) },
  );

  if (supportStatisticalApi) {
    indexValue = response.data?.[0]?.outputs?.[outputName]?.bands?.B0?.stats?.mean;
  } else {
    indexValue = response.C0?.[0]?.basicStats?.mean;
  }
  return indexValue;
};

const getStatisticalIndexValue = async (
  statisticsLayer,
  { datasetId, geometry, fromTime, toTime, cancelToken, userToken },
) => {
  const crs = CRS_EPSG3857;
  const recommendedResolution = getRecommendedResolutionForDatasetId(datasetId, geometry);
  const requestGeometry = getRequestGeometry(datasetId, geometry, crs);
  return getIndexValue(statisticsLayer, true, {
    fromTime,
    toTime,
    cancelToken,
    requestGeometry,
    crs,
    recommendedResolution,
    userToken,
  });
};

const getFISIndexValue = async (statisticsLayer, { datasetId, geometry, fromTime, toTime, cancelToken }) => {
  const crs = CRS_EPSG4326;
  const recommendedResolution = getRecommendedResolutionForDatasetId(datasetId, geometry);
  const requestGeometry = getRequestGeometry(datasetId, geometry, crs);
  return getIndexValue(statisticsLayer, false, {
    fromTime,
    toTime,
    cancelToken,
    requestGeometry,
    crs,
    recommendedResolution,
  });
};

export { formatIndexValue, initializeStatisticsLayer };
