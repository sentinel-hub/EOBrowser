import { ApiType, DEMLayer, MimeTypes, BBox, CRS_EPSG4326, CacheTarget } from '@sentinel-hub/sentinelhub-js';
import moment from 'moment';
import L from 'leaflet';

import { getLayerFromParams, getDimensionsInMeters } from '../Controls/ImgDownload/ImageDownload.utils';

export async function getTerrainData(params, abortToken) {
  const { mapBounds, imageWidth, imageHeight } = params;
  const bbox = new BBox(
    CRS_EPSG4326,
    mapBounds.getWest(),
    mapBounds.getSouth(),
    mapBounds.getEast(),
    mapBounds.getNorth(),
  );
  const baseGetMapParams = {
    bbox: bbox,
    format: MimeTypes.PNG,
    width: imageWidth,
    height: imageHeight,
  };
  const { width: widthInMeters } = getDimensionsInMeters(mapBounds);
  const resolution = imageWidth / widthInMeters;
  abortToken.check();
  const textureData = await getTextureData(baseGetMapParams, params, abortToken);
  abortToken.check();
  const { elevationData, minAltitude, maxAltitude, maxAltitudePixels } = await getElevationData(
    baseGetMapParams,
    resolution,
    abortToken,
  );
  return {
    textureData: textureData,
    elevationData: elevationData,
    minAltitude: minAltitude,
    maxAltitude: maxAltitude,
    maxAltitudePixels: maxAltitudePixels,
  };
}

export function calculateBoundsFromTile(coordX, coordY, tileSize, zoom, originLat, originLng) {
  const originPoint = L.CRS.EPSG3857.latLngToPoint(L.latLng(originLat, originLng), zoom);
  const newPointNorthWest = L.point(originPoint.x + coordX * tileSize, originPoint.y + coordY * tileSize);
  const newPointSouthEast = L.point(
    originPoint.x + (coordX + 1) * tileSize,
    originPoint.y + (coordY + 1) * tileSize,
  );
  const southEast = L.CRS.EPSG3857.pointToLatLng(newPointSouthEast, zoom);
  const northWest = L.CRS.EPSG3857.pointToLatLng(newPointNorthWest, zoom);
  return L.latLngBounds(southEast, northWest);
}

async function getTextureData(baseGetMapParams, params, abortToken) {
  abortToken.check();
  const textureLayer = await getLayerFromParams(params, abortToken.cancelToken);
  const reqConfig = {
    cancelToken: abortToken.cancelToken,
    cache: {
      expiresIn: 5000,
      targets: [CacheTarget.CACHE_API],
    },
  };
  abortToken.check();
  await textureLayer.updateLayerFromServiceIfNeeded(reqConfig);
  const apiType = textureLayer.supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS;
  const getMapParams = {
    ...baseGetMapParams,
    fromTime: params.fromTime,
    toTime: params.toTime,
  };
  const { width, height } = baseGetMapParams;
  abortToken.check();
  const blob = await textureLayer.getHugeMap(getMapParams, apiType, reqConfig);
  abortToken.check();
  const data = await getPixelDataFromBlob(blob, width, height);
  return data.filter((_, i) => i % 4 !== 3);
}

async function getElevationData(baseGetMapParams, resolution, abortToken) {
  /*
        We are running a hack to get nice data from the service (until we implement reading TIFFs in sentinelhub-js)
        DEM has values in meters, so we first add 12000, so all values are postive.
        Then we convert it to 16-bit binary number and split it in two 8-bit binary numbers
        We pass those in R and G channels as integers
        After we get the image, we take the values, convert them to binary, pad zeros, concatenate them and obtain the original number.
    */
  abortToken.check();
  const elevationLayer = await getElevationLayer();
  const getMapParams = {
    ...baseGetMapParams,
    fromTime: moment.utc().subtract(1, 'year'),
    toTime: moment.utc(),
  };
  const { width, height } = baseGetMapParams;
  abortToken.check();
  const blob = await elevationLayer.getHugeMap(getMapParams, ApiType.PROCESSING, {
    cancelToken: abortToken.cancelToken,
  });
  abortToken.check();
  let data = await getPixelDataFromBlob(blob, width, height);
  abortToken.check();
  const { rescaledData, min, max } = dataToPixelHeight(data, resolution);
  return {
    elevationData: rescaledData,
    minAltitude: min,
    maxAltitude: max,
    maxAltitudePixels: max * resolution,
  };
}

function dataToPixelHeight(data, resolution) {
  let min = Infinity,
    max = -Infinity;
  const reconstructedData = [];
  for (let i = 0; i < data.length; i += 4) {
    let newValue;

    newValue = ((data[i] << 8) | data[i + 1]) - 12000;
    if (newValue < min) {
      min = newValue;
    }
    if (newValue > max) {
      max = newValue;
    }

    reconstructedData.push(newValue * resolution);
  }

  return { rescaledData: reconstructedData, min: min, max: max };
}

async function getPixelDataFromBlob(blob, width, height) {
  const imgCanvas = document.createElement('canvas');
  const imgCtx = imgCanvas.getContext('2d');
  const imgObjectUrl = window.URL.createObjectURL(blob);
  const img = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imgObjectUrl;
  });

  imgCanvas.width = width;
  imgCanvas.height = height;
  imgCtx.drawImage(img, 0, 0);
  const data = imgCtx.getImageData(0, 0, width, height).data;
  window.URL.revokeObjectURL(imgObjectUrl);
  return data;
}

async function getElevationLayer() {
  const DEM_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: ["DEM"],
    output: { bands: 3, sampleType: "UINT8" }
  };
}

function evaluatePixel(sample) {
  const positiveDEM = sample.DEM + 12000 // So that all values are positive
  return [positiveDEM >> 8, positiveDEM & 0xff, 0];
}

`;
  return await new DEMLayer({ evalscript: DEM_EVALSCRIPT });
}

export function generateTexture(data, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const imageData = image.data;

  for (var i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {
    imageData[i] = data[3 * j];
    imageData[i + 1] = data[3 * j + 1];
    imageData[i + 2] = data[3 * j + 2];
  }

  context.putImageData(image, 0, 0);
  return canvas;
}
