import {
  ApiType,
  parseLegacyWmsGetMapParams,
  MosaickingOrder,
  LayersFactory,
  DATASET_AWSEU_S1GRD,
  DATASET_S2L1C,
  DATASET_S2L2A,
  DATASET_S3OLCI,
  DATASET_S3SLSTR,
  DATASET_S5PL2,
  DATASET_AWS_L8L1C,
  DATASET_MODIS,
  DATASET_AWS_DEM,
  S1GRDAWSEULayer,
  S2L1CLayer,
  S2L2ALayer,
  S3SLSTRLayer,
  S3OLCILayer,
  S5PL2Layer,
  Landsat8AWSLayer,
  MODISLayer,
  DEMLayer,
  ProcessingDataFusionLayer,
} from '@sentinel-hub/sentinelhub-js';

export async function getMapDataFusion(baseUrl, wmsParams, dataFusionSettings, effects = null) {
  const { layers: primaryLayerId, evalscript, evalscriptUrl, getMapParams } = parseLegacyWmsGetMapParams(
    wmsParams,
  );
  const primaryLayer = await LayersFactory.makeLayer(baseUrl, primaryLayerId);
  const dataFusionLayer = await constructDataFusionLayer(
    primaryLayer,
    dataFusionSettings,
    evalscript,
    evalscriptUrl,
    getMapParams.fromTime,
    getMapParams.toTime,
  );
  if (effects) {
    getMapParams.effects = effects;
  }
  return await dataFusionLayer.getMap(getMapParams, ApiType.PROCESSING);
}

export async function constructDataFusionLayer(
  primaryLayer,
  dataFusionSettings,
  evalscript,
  evalscriptUrl,
  fromTime,
  toTime,
) {
  // supplementary layers:
  const enabledDatasetsIds = Object.keys(dataFusionSettings.supplementalDatasets).filter(
    supDatasetId => dataFusionSettings.supplementalDatasets[supDatasetId].enabled,
  );
  const supplementalLayers = enabledDatasetsIds.map(supDatasetId => {
    const settings = dataFusionSettings.supplementalDatasets[supDatasetId];
    const mosaickingOrder =
      settings && settings.mosaickingOrder ? settings.mosaickingOrder : MosaickingOrder.MOST_RECENT;
    const layer = constructLayerFromDatasetId(supDatasetId, mosaickingOrder);
    const timespan = settings.isCustomTimespan && settings.timespan ? settings.timespan : [fromTime, toTime];
    return {
      layer: layer,
      id: layer.dataset.shProcessingApiDatasourceAbbreviation.toLowerCase(),
      fromTime: timespan[0],
      toTime: timespan[1],
    };
  });

  const dataFusionLayer = new ProcessingDataFusionLayer({
    evalscript: evalscript,
    evalscriptUrl: evalscriptUrl,
    layers: [
      {
        layer: primaryLayer,
        id: primaryLayer.dataset.shProcessingApiDatasourceAbbreviation.toLowerCase(),
        fromTime: fromTime,
        toTime: toTime,
      },
      ...supplementalLayers,
    ],
  });
  return dataFusionLayer;
}

// given the dataset ID, construct an empty sentinelhub-js layer:
export function constructLayerFromDatasetId(datasetId, mosaickingOrder) {
  switch (datasetId) {
    case DATASET_AWSEU_S1GRD.id:
      // we are setting evalscript to avoid exception when the layer is initialized without any parameters
      // (this should be fixed in sentinelhub-js)
      return new S1GRDAWSEULayer({ evalscript: '//---', mosaickingOrder: mosaickingOrder });
    case DATASET_S2L1C.id:
      return new S2L1CLayer({ evalscript: '//---', mosaickingOrder: mosaickingOrder });
    case DATASET_S2L2A.id:
      return new S2L2ALayer({ evalscript: '//---', mosaickingOrder: mosaickingOrder });
    case DATASET_S3OLCI.id:
      return new S3OLCILayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    case DATASET_S3SLSTR.id:
      return new S3SLSTRLayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    case DATASET_S5PL2.id:
      return new S5PL2Layer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    case DATASET_AWS_L8L1C.id:
      return new Landsat8AWSLayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    case DATASET_MODIS.id:
      return new MODISLayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    case DATASET_AWS_DEM.id:
      return new DEMLayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    default:
      console.error('Data fusion: unknown dataset');
      return null;
  }
}
