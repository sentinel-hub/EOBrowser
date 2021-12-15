import {
  ApiType,
  isCancelled,
  MimeTypes,
  drawBlobOnCanvas,
  canvasToBlob,
} from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';
import L from 'leaflet';
import proj4 from 'proj4';

import { addImageOverlays, getTitle } from '../Controls/ImgDownload/ImageDownload.utils';
import { getDataSourceHandler } from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { findMatchingLayerMetadata } from '../Tools/VisualizationPanel/legendUtils';
import store, { mainMapSlice, terrainViewerSlice } from '../store';
import { wgs84ToMercator } from '../junk/EOBCommon/utils/coords';
import { toRad } from '../junk/EOB3TimelapsePanel/timelapseUtils';
import { getBoundsZoomLevel } from '../utils/coords';

let mapTileRequestDelay = 1;
const mapTileRequestList = [];
let mapTileRequestTimerId = null;
const maxDelayBeforeSwitch = 500;

function mapTileRequestExecutor() {
  mapTileRequestTimerId = null;

  if (mapTileRequestList.length > 0) {
    const exec = mapTileRequestList.shift();
    exec();

    mapTileRequestTimerId = setTimeout(mapTileRequestExecutor, mapTileRequestDelay);
  }
}

function getMapTileUrl(
  layer,
  params,
  minX,
  minY,
  maxX,
  maxY,
  width,
  height,
  callback,
  reqConfig,
  onTileError,
) {
  mapTileRequestList.push(() => {
    getMapTileUrlInternal(
      layer,
      params,
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      callback,
      reqConfig,
      onTileError,
    );
  });

  if (mapTileRequestTimerId == null) {
    mapTileRequestTimerId = setTimeout(mapTileRequestExecutor, mapTileRequestDelay);
  }
}

export function getMapTile(
  layer,
  getMapParams,
  minX,
  minY,
  maxX,
  maxY,
  width,
  height,
  callback,
  reqConfig,
  onTileError,
) {
  mapTileRequestList.push(() => {
    getMapTileUrlInternal(
      layer,
      getMapParams,
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      callback,
      reqConfig,
      onTileError,
    );
  });

  if (mapTileRequestTimerId == null) {
    mapTileRequestTimerId = setTimeout(mapTileRequestExecutor, mapTileRequestDelay);
  }
}

function getMapTileUrlInternal(
  layer,
  params,
  minX,
  minY,
  maxX,
  maxY,
  width,
  height,
  callback,
  reqConfig,
  onTileError,
) {
  const apiType = layer.supportsApiType(ApiType.PROCESSING)
    ? ApiType.PROCESSING
    : layer.supportsApiType(ApiType.WMTS)
    ? ApiType.WMTS
    : ApiType.WMS;
  layer
    .getMap(params, apiType, reqConfig)
    .then((blob) => {
      mapTileRequestDelay = Math.max(1, 0.5 * mapTileRequestDelay); // reduce the delay
      let url = URL.createObjectURL(blob);
      callback(url);
    })
    .catch((error) => {
      const httpStatus = error.response && error.response.status ? error.response.status : 0;
      if (httpStatus === 429) {
        // too many requests, must wait a little and retry
        mapTileRequestDelay = Math.min(5000, mapTileRequestDelay / 0.8);
        if (mapTileRequestDelay > maxDelayBeforeSwitch) {
          reqConfig.authToken = null;
        }
        getMapTileUrl(layer, params, minX, minY, maxX, maxY, width, height, callback, reqConfig, onTileError);
      } else {
        if (!isCancelled(error)) {
          onTileError(error);
        }
        callback(null);
      }
    });
}

export function getHeightFromZoom(zoom) {
  const starting = 20026376;
  return starting / Math.pow(2, zoom - 1);
}

export async function getTerrainViewerImage({
  fromTime,
  toTime,
  datasetId,
  layerId,
  customSelected,
  selectedThemeId,
  terrainViewerId,
  width,
  height,
  showCaptions,
  imageFormat,
  userDescription,
  showLegend,
}) {
  const imageUrl = await new Promise((resolve) =>
    setTimeout(async () => {
      resolve(window.print3D(terrainViewerId, width, height));
    }, 500),
  );
  const blob = await fetch(imageUrl).then((res) => res.blob());
  const title = showCaptions ? getTitle(fromTime, toTime, datasetId, layerId, customSelected) : null;

  const dsh = getDataSourceHandler(datasetId);
  const drawCopernicusLogo = dsh.isCopernicus();
  const addLogos = dsh.isSentinelHub();

  let legendDefinition;

  if (showLegend) {
    const predefinedLayerMetadata = findMatchingLayerMetadata(datasetId, layerId, selectedThemeId);
    if (predefinedLayerMetadata && predefinedLayerMetadata.legend) {
      legendDefinition = predefinedLayerMetadata.legend;
    }
  }

  let imageWithOverlays = await addImageOverlays(
    blob,
    width,
    height,
    imageFormat.mimeType,
    null,
    null,
    null,
    showLegend,
    showCaptions,
    false,
    false,
    userDescription,
    null,
    legendDefinition,
    null,
    showCaptions ? dsh.getCopyrightText(datasetId) : null,
    title,
    false,
    addLogos,
    drawCopernicusLogo,
  );

  if (!showLegend && !showCaptions && imageFormat.mimeType === MimeTypes.JPEG) {
    // If we haven't added any overlays, the image was never converted from PNG to JPEG
    imageWithOverlays = await convertImageToMimeType(imageWithOverlays, imageFormat.mimeType, width, height);
  }

  return imageWithOverlays;
}

async function convertImageToMimeType(blob, mimeType, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  await drawBlobOnCanvas(ctx, blob, 0, 0);
  return await canvasToBlob(canvas, mimeType);
}

function formatDistance(distance) {
  if (distance >= 1000) {
    return Number(distance / 1000).toFixed(2) + ' km';
  }
  return Number(distance).toFixed(2) + ' m';
}

export function getPositionString(latitude, longitude, z) {
  const magnitude = Math.floor(Math.log10(Math.max(1, z)));
  const numDecimals = 8 - Math.min(8, magnitude);
  return (
    'Lat: ' +
    Number(latitude).toFixed(numDecimals) +
    ', Lng: ' +
    Number(longitude).toFixed(numDecimals) +
    ', ' +
    t`Eye height` +
    ': ' +
    formatDistance(z)
  );
}

export function getEyeHeightFromBounds(bounds) {
  try {
    const { lat } = bounds.getCenter();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();
    const width = getLngDistanceInMeters({ minLng, maxLng, lat });
    return width / 2;
  } catch (err) {
    return 8000;
  }
}

function getEarthCircumferenceAtLat(lat) {
  const equatorialRadius = 6378137.0;
  const polarRadius = 6356752.314;
  var f1 = Math.pow(Math.pow(equatorialRadius, 2) * Math.cos(lat), 2);
  var f2 = Math.pow(Math.pow(polarRadius, 2) * Math.sin(lat), 2);
  var f3 = Math.pow(equatorialRadius * Math.cos(lat), 2);
  var f4 = Math.pow(polarRadius * Math.sin(lat), 2);

  var radius = Math.sqrt((f1 + f2) / (f3 + f4));
  const horizontalRadius = Math.cos(lat) * radius;
  return 2 * Math.PI * horizontalRadius;
}

function getLngDistanceInMeters({ minLng, maxLng, lat }) {
  lat = (Math.PI * lat) / 180;
  const circumference = getEarthCircumferenceAtLat(lat);
  const distance = ((maxLng - minLng) * circumference) / 360;
  return distance;
}

export function setTerrainViewerFromPin({ terrainViewerSettings, is3D, lat, lng, zoom, terrainViewerId }) {
  if (terrainViewerSettings && Object.keys(terrainViewerSettings).length > 0) {
    if (is3D) {
      const { x, y, z, rotH, rotV, sunTime, settings } = terrainViewerSettings;
      window.set3DPosition(terrainViewerId, x, y, z, rotH, rotV);
      window.set3DSunTime(terrainViewerId, sunTime);
      window.set3DSettings(terrainViewerId, settings);
    } else {
      store.dispatch(terrainViewerSlice.actions.setTerrainViewerSettings(terrainViewerSettings));
      store.dispatch(mainMapSlice.actions.setIs3D(true));
    }
  } else {
    if (is3D) {
      const { x, y } = wgs84ToMercator({ lat: lat, lng: lng });
      const z = getHeightFromZoom(zoom);
      window.set3DPosition(terrainViewerId, x, y, z, 0, 0);
    }
  }
}

export function getBoundsFrom3DPosition({ x, y, z, rotH, rotV, width, height }) {
  const N = Math.ceil(Math.min(Math.tan(Math.min(Math.PI / 4 + toRad(rotV), Math.PI / 2)), 10));
  const closeX = x - N * z;
  const closeY = y - N * z;
  const farX = x + N * z;
  const farY = y + N * z;

  const [closeLng, closeLat] = proj4('EPSG:3857', 'EPSG:4326', [closeX, closeY]);
  const [farLng, farLat] = proj4('EPSG:3857', 'EPSG:4326', [farX, farY]);

  const bounds = L.latLngBounds(L.latLng(closeLat, closeLng), L.latLng(farLat, farLng));
  const pixelBounds = L.bounds(L.point(0, 0), L.point(width, height));
  return { pixelBounds: pixelBounds, bounds: bounds };
}

export function getZoomFromEyeHeight(x, y, z) {
  const [lng, lat] = proj4('EPSG:3857', 'EPSG:4326', [x, y]);
  const circumference = getEarthCircumferenceAtLat((Math.PI * lat) / 180);
  const halfEyeHeightDegreesLng = (180 * z) / circumference;
  const minLng = lng - halfEyeHeightDegreesLng;
  const maxLng = lng + halfEyeHeightDegreesLng;
  const bounds = L.latLngBounds(L.latLng(lat, minLng), L.latLng(lat, maxLng));
  return Math.max(getBoundsZoomLevel(bounds) - 1, 0);
}

export function getEyeHeightFromZoom(lat, zoom, width) {
  const fullPixelWidth = Math.pow(2, zoom) * 256;
  const circumference = getEarthCircumferenceAtLat((Math.PI * lat) / 180);
  const widthMeters = (circumference * width) / fullPixelWidth;
  return widthMeters / 2;
}
