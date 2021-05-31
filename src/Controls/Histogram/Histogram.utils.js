import { t } from 'ttag';
import { fromBlob } from 'geotiff';
import { LayersFactory, ApiType } from '@sentinel-hub/sentinelhub-js';

import {
  getMapDimensions,
  getImageDimensionFromBounds,
  constructBBoxFromBounds,
} from '../../Controls/ImgDownload/ImageDownload.utils.js';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { constructErrorMessage } from '../../utils';
import { checkIfIndexOutputInEvalscript } from '../../utils/parseEvalscript';

export const MISSING_INDEX_OUTPUT_ERROR =
  t`Setup function in evalscript does not contain the correct index output` +
  ` ('{ id: "index", bands: 1, sampleType: "FLOAT32" }')`;

export async function getLayerName(visualizationUrl, layerId, cancelToken) {
  try {
    let layer = await LayersFactory.makeLayer(visualizationUrl, layerId, null, { cancelToken: cancelToken });
    return layer.title;
  } catch (e) {
    return layerId;
  }
}

async function getTiffImage(layer, props, cancelToken) {
  const { bounds, fromTime, toTime, pixelBounds, aoiGeometry, datasetId } = props;

  const { width: defaultWidth, height: defaultHeight } = getImageDimensionFromBounds(bounds, datasetId);
  const originalBBox = constructBBoxFromBounds(bounds);
  let { width, height } = getMapDimensions(pixelBounds);

  // code copied from ImageDownload.js
  if (aoiGeometry) {
    // defaultWidth and defaultHeight are in this case referring to bounds of the geometry
    // We keep one of the map dimensions and scale the other
    const ratio = defaultWidth / defaultHeight;

    if (ratio >= 1) {
      height = Math.floor(width / ratio);
    } else {
      width = Math.floor(ratio * height);
    }
  }

  const getMapParams = {
    fromTime,
    toTime,
    bbox: originalBBox,
    format: 'image/tiff',
    outputResponseId: 'index',
    width: width,
    height: height,
    geometry: aoiGeometry,
  };

  const reqConfig = {
    cancelToken: cancelToken,
    cache: { expiresIn: 0 },
  };

  const blob = await layer.getMap(getMapParams, ApiType.PROCESSING, reqConfig);
  return blob;
}

export async function getDataForLayer(props, cancelToken) {
  try {
    const { visualizationUrl, layerId } = props;
    let layer = await LayersFactory.makeLayer(visualizationUrl, layerId, null, { cancelToken: cancelToken });
    await layer.updateLayerFromServiceIfNeeded({ cancelToken: cancelToken });
    // add minQa, upsampling, downsampling, but no effects (they are only for visualization)

    const isIndexOutputPresent = checkIfIndexOutputPresent(props);
    if (!isIndexOutputPresent) {
      throw new Error(MISSING_INDEX_OUTPUT_ERROR);
    }

    const blob = await getTiffImage(layer, props, cancelToken);
    const histogram = await getHistogramFromTiff(blob);
    return { histogram: histogram };
  } catch (e) {
    const errMessage = await constructErrorMessage(e);
    console.error(e);
    return { error: errMessage };
  }
}

export async function getDataForIndex(props, cancelToken) {
  try {
    const { visualizationUrl, datasetId, evalscript } = props;

    const isIndexOutputPresent = checkIfIndexOutputPresent(props);
    if (!isIndexOutputPresent) {
      throw new Error(MISSING_INDEX_OUTPUT_ERROR);
    }

    const dsh = getDataSourceHandler(datasetId);
    const shJsDataset = dsh ? dsh.getSentinelHubDataset(datasetId) : null;
    let layers = await LayersFactory.makeLayers(
      visualizationUrl,
      (_, dataset) => (!shJsDataset ? true : dataset.id === shJsDataset.id),
      null,
      { cancelToken: cancelToken },
    );
    let layer;
    if (layers.length > 0) {
      layer = layers[0];
      layer.evalscript = evalscript;
    }
    // add minQa, upsampling, downsampling, but no effects (they are only for visualization)

    const blob = await getTiffImage(layer, props, cancelToken);
    const histogram = await getHistogramFromTiff(blob);
    return { histogram: histogram };
  } catch (e) {
    const errMessage = await constructErrorMessage(e);
    console.error(e);
    return { error: errMessage };
  }
}

async function getHistogramFromTiff(blob) {
  const numOfDigits = 3;
  const tiffData = await fromBlob(blob);
  const imageData = await tiffData.getImage();
  const [data] = await imageData.readRasters();
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let v of data) {
    if (v < min) {
      min = v;
    }
    if (v > max) {
      max = v;
    }
  }

  const nBins = 10000;
  const step = (max - min) / nBins;

  let histogramArray = new Array(nBins);
  for (let i = 0; i < nBins; i++) {
    histogramArray[i] = { value: parseFloat((min + i * step).toFixed(numOfDigits)), occurrences: 0 };
  }

  for (let v of data) {
    if (isNaN(v)) {
      continue;
    }
    let histogramArrayIndex = Math.floor((v - min) / step);
    if (histogramArrayIndex >= nBins) {
      histogramArrayIndex--;
    }
    histogramArray[histogramArrayIndex].occurrences++;
  }

  return histogramArray;
}

export async function checkIfIndexOutputPresent(props, cancelToken) {
  const { customSelected, evalscript, layerId, visualizationUrl } = props;

  if ((!customSelected && !layerId) || (customSelected && !evalscript)) {
    return false;
  }

  if (customSelected) {
    return checkIfIndexOutputInEvalscript(evalscript);
  }

  let layer = null;
  try {
    layer = await LayersFactory.makeLayer(visualizationUrl, layerId, null, { cancelToken: cancelToken });
  } catch (e) {
    return false;
  }

  if (layer.evalscript) {
    return checkIfIndexOutputInEvalscript(layer.evalscript);
  }

  try {
    await layer.updateLayerFromServiceIfNeeded({ cancelToken: cancelToken });
    return checkIfIndexOutputInEvalscript(layer.evalscript);
  } catch (e) {
    return false;
  }
}
