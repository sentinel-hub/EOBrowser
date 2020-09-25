import {
  ApiType,
  parseLegacyWmsGetMapParams,
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

export async function getMapDataFusion(wmsParams, dataFusionSettings, effects = null) {
  const { evalscript, evalscriptUrl, getMapParams } = parseLegacyWmsGetMapParams(wmsParams);
  const dataFusionLayer = await constructDataFusionLayer(
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
  dataFusionSettings,
  evalscript,
  evalscriptUrl,
  fromTime,
  toTime,
) {
  const layers = [];

  for (let dataset of dataFusionSettings) {
    let { id, alias, mosaickingOrder, timespan } = dataset;
    const layer = constructLayerFromDatasetId(id, mosaickingOrder);
    layers.push({
      layer: layer,
      id: alias,
      fromTime: timespan ? timespan[0] : fromTime,
      toTime: timespan ? timespan[1] : toTime,
    });
  }

  const dataFusionLayer = new ProcessingDataFusionLayer({
    evalscript: evalscript,
    evalscriptUrl: evalscriptUrl,
    layers: layers,
  });
  return dataFusionLayer;
}

// given the dataset ID, construct an empty sentinelhub-js layer:
export function constructLayerFromDatasetId(datasetId, mosaickingOrder) {
  switch (datasetId) {
    case DATASET_AWSEU_S1GRD.id:
      // we are setting evalscript to avoid exception when the layer is initialized without any parameters
      // (this should be fixed in sentinelhub-js)
      return new S1GRDAWSEULayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    case DATASET_S2L1C.id:
      return new S2L1CLayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
    case DATASET_S2L2A.id:
      return new S2L2ALayer({ evalscript: '//VERSION=3 ---', mosaickingOrder: mosaickingOrder });
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
