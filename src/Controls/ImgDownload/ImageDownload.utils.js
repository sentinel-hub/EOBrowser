import {
  LayersFactory,
  CRS_EPSG4326,
  CRS_EPSG3857,
  BBox,
  canvasToBlob,
  drawBlobOnCanvas,
  ApiType,
  ProcessingDataFusionLayer,
} from '@sentinel-hub/sentinelhub-js';
import moment from 'moment';
import { t } from 'ttag';

import {
  getDataSourceHandler,
  datasourceForDatasetId,
  datasetLabels,
  checkIfCustom,
  CUSTOM,
} from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { isDataFusionEnabled } from '../../utils';
import { overlayTileLayers } from '../../Map/Layers';
import { createGradients } from '../../Tools/VisualizationPanel/legendUtils';
import { b64EncodeUnicode } from '../../utils/base64MDN';
import { findMatchingLayerMetadata } from '../../Tools/VisualizationPanel/legendUtils';
import { IMAGE_FORMATS, IMAGE_FORMATS_INFO } from './consts';

import { constructDataFusionLayer } from '../../junk/EOBCommon/utils/dataFusion';
import { wgs84ToMercator } from '../../junk/EOBCommon/utils/coords';
import { getMapOverlayXYZ, getGlOverlay } from '../../junk/EOBCommon/utils/getMapOverlayXYZ';
import { getBaseUrlsForImageFormat } from './baseUrls';

import copernicus from '../../junk/EOBCommon/assets/copernicus.png';
import SHlogo from '../../junk/EOBCommon/assets/shLogo.png';
import SHlogoLarge from '../../junk/EOBCommon/assets/shLogoLarge.png';

const PARTITION_PADDING = 5;
const SCALEBAR_LEFT_PADDING = 10;

const FONT_FAMILY = 'Helvetica, Arial, sans-serif';
const FONT_BASE = 960;
const FONT_SIZES = {
  normal: { base: 6.5016, min: 11 },
  copyright: { base: 5, min: 9 },
};

const IMAGE_SIZE_LIMIT = 2500;

export const SENTINEL_COPYRIGHT_TEXT = `Credit: European Union, contains modified Copernicus Sentinel data ${moment
  .utc()
  .format('YYYY')}, processed with EO Browser`;

export function getMapDimensions(pixelBounds, resolutionDivisor = 1) {
  const width = pixelBounds.max.x - pixelBounds.min.x;
  const height = pixelBounds.max.y - pixelBounds.min.y;
  return { width: Math.floor(width / resolutionDivisor), height: Math.floor(height / resolutionDivisor) };
}

export function getDimensionsInMeters(bounds) {
  const { x: maxX, y: maxY } = wgs84ToMercator(bounds.getNorthEast());
  const { x: minX, y: minY } = wgs84ToMercator(bounds.getSouthWest());
  const width = maxX - minX;
  const height = maxY - minY;
  return { width: width, height: height };
}

export function getImageDimensionFromBounds(bounds, datasetId) {
  /*
    Accepts latLngBounds and converts them to Mercator (to use meters)
    Gets datasource max resolution (in meters per pixel)
    Calculates the image size at that resolution and dimension, caps it at IMAGE_SIZE_LIMIT
  */
  const { width, height } = getDimensionsInMeters(bounds);
  const ratio = height / width;
  const dsh = getDataSourceHandler(datasetId);
  const { resolution } = dsh.getResolutionLimits(datasetId);
  const maxResolution = resolution || 10;
  const maxImageWidth = Math.min(width / maxResolution, IMAGE_SIZE_LIMIT);
  const maxImageHeight = maxImageWidth * ratio;
  return { width: Math.floor(maxImageWidth), height: Math.floor(maxImageHeight) };
}

export async function fetchImage(layer, options) {
  const {
    datasetId,
    bounds,
    fromTime,
    toTime,
    width,
    height,
    imageFormat,
    apiType,
    cancelToken,
    selectedCrs,
    geometry,
    effects,
  } = options;

  const dsh = getDataSourceHandler(datasetId);
  const supportsTimeRange = dsh ? dsh.supportsTimeRange() : true; //We can only check if a datasetId is BYOC when the datasource handler for it is instantiated (thus, we are on the user instance which includes that BYOC collection), so we set default to `true` to cover that case.
  const bbox = constructBBoxFromBounds(bounds, selectedCrs);

  const getMapParams = {
    bbox: bbox,
    geometry: geometry,
    fromTime: supportsTimeRange ? fromTime : null,
    toTime: toTime,
    width: width,
    height: height,
    format: imageFormat,
    preview: 2,
    showlogo: false,
    effects: effects,
  };

  const reqConfig = {
    cancelToken: cancelToken,
  };
  if (width > IMAGE_SIZE_LIMIT || height > IMAGE_SIZE_LIMIT) {
    return layer.getHugeMap(getMapParams, apiType, reqConfig);
  } else {
    return layer.getMap(getMapParams, apiType, reqConfig);
  }
}

export async function fetchImageFromParams(params) {
  const {
    fromTime,
    toTime,
    datasetId,
    customSelected,
    isRawBand,
    bandName,
    showLegend,
    showCaptions,
    addMapOverlays,
    showLogo,
    layerId,
    selectedThemeId,
    lat,
    lng,
    zoom,
    width,
    height,
    imageFormat,
    userDescription,
    enabledOverlaysId,
    cancelToken,
  } = params;

  const layer = await getLayerFromParams(params, cancelToken);
  if (!layer) {
    throw Error('No applicable layer found');
  }

  const apiType = await getAppropriateApiType(layer, imageFormat, isRawBand, cancelToken);
  const mimeType =
    apiType === ApiType.PROCESSING
      ? IMAGE_FORMATS_INFO[imageFormat].mimeTypeProcessing
      : IMAGE_FORMATS_INFO[imageFormat].mimeType;

  if (
    !(imageFormat === IMAGE_FORMATS.JPG || imageFormat === IMAGE_FORMATS.PNG) &&
    (width > IMAGE_SIZE_LIMIT || height > IMAGE_SIZE_LIMIT)
  ) {
    throw Error(
      `Can't download images with mimetype '${mimeType}' having any dimension greater than ${IMAGE_SIZE_LIMIT} pixels.`,
    );
  }

  const options = {
    ...params,
    apiType: apiType,
    imageFormat: mimeType,
  };
  const blob = await fetchImage(layer, options).catch(err => {
    throw err;
  });

  let legendUrl, legendDefinition, copyrightText, title;

  if (showLegend) {
    legendUrl = layer.legendUrl;
    const predefinedLayerMetadata = findMatchingLayerMetadata(datasetId, layerId, selectedThemeId);
    legendDefinition =
      predefinedLayerMetadata && predefinedLayerMetadata.legend
        ? predefinedLayerMetadata.legend
        : layer.legend;
  }

  if (showCaptions) {
    const isBYOC = checkIfCustom(datasetId);
    copyrightText =
      isBYOC || datasourceForDatasetId(datasetId).includes('Sentinel') ? SENTINEL_COPYRIGHT_TEXT : '';
    title = getTitle(fromTime, toTime, datasetId, layer.title, customSelected);
  }

  const imageWithOverlays = await addImageOverlays(
    blob,
    width,
    height,
    mimeType,
    lat,
    lng,
    zoom,
    showLegend,
    showCaptions,
    addMapOverlays,
    showLogo,
    userDescription,
    enabledOverlaysId,
    legendDefinition,
    legendUrl,
    copyrightText,
    title,
  );

  const nicename = getNicename(fromTime, toTime, datasetId, layer.title, customSelected, isRawBand, bandName);
  return { blob: imageWithOverlays, nicename: nicename };
}

async function getAppropriateApiType(layer, imageFormat, isRawBand, cancelToken) {
  if (layer instanceof ProcessingDataFusionLayer) {
    return ApiType.PROCESSING;
  }
  if (layer.supportsApiType(ApiType.PROCESSING)) {
    if (isRawBand) {
      const isKMZ = imageFormat === IMAGE_FORMATS.KMZ_JPG || imageFormat === IMAGE_FORMATS.KMZ_PNG;
      if (isKMZ) {
        return ApiType.WMS;
      }
      return ApiType.PROCESSING;
    }
    const isJPGorPNG = imageFormat === IMAGE_FORMATS.JPG || imageFormat === IMAGE_FORMATS.PNG;
    if (isJPGorPNG) {
      if (!layer.evalscript && !layer.evalscriptUrl) {
        await layer.updateLayerFromServiceIfNeeded({ cancelToken: cancelToken });
      }
      return layer.supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS;
    }
  }
  return ApiType.WMS;
}

export function getTitle(fromTime, toTime, datasetId, layerTitle, customSelected) {
  const format = 'YYYY-MM-DD HH:mm';
  const datasetLabel = checkIfCustom(datasetId) ? datasetLabels[CUSTOM] : datasetLabels[datasetId];
  return `${fromTime
    .clone()
    .utc()
    .format(format)} - ${toTime
    .clone()
    .utc()
    .format(format)}, ${datasetLabel}, ${customSelected ? 'Custom script' : layerTitle}`;
}

export function getNicename(fromTime, toTime, datasetId, layerTitle, customSelected, isRawBand, bandName) {
  const format = 'YYYY-MM-DD-HH:mm';
  let layerName;

  if (isRawBand) {
    layerName = `${bandName}_(Raw)`;
  } else if (customSelected) {
    layerName = 'Custom_script';
  } else {
    layerName = layerTitle.replace(/ /gi, '_');
  }

  const datasetLabel = checkIfCustom(datasetId) ? datasetLabels[CUSTOM] : datasetLabels[datasetId];

  return `${fromTime
    .clone()
    .utc()
    .format(format)}_${toTime
    .clone()
    .utc()
    .format(format)}_${datasetLabel.replace(/ /gi, '_')}_${layerName}`;
}

export async function getLayerFromParams(params, cancelToken) {
  /// Check if BYOC works!!!!!!!
  const {
    visualizationUrl,
    layerId,
    datasetId,
    customSelected,
    dataFusion,
    evalscript,
    evalscripturl,
    fromTime,
    toTime,
    minQa,
    upsampling,
    downsampling,
    imageFormat,
  } = params;
  let layer;

  const reqConfig = {
    cancelToken: cancelToken,
  };

  if (layerId) {
    // Use baseUrl with V1 evalscripts if TIFF
    const url = getBaseUrlsForImageFormat(visualizationUrl, imageFormat);
    layer = await LayersFactory.makeLayer(url, layerId, null, reqConfig);
  } else if (isDataFusionEnabled(dataFusion)) {
    layer = constructDataFusionLayer(dataFusion, evalscript, evalscripturl, fromTime, toTime);
  } else if (customSelected) {
    const dsh = getDataSourceHandler(datasetId);
    const shJsDataset = dsh ? dsh.getSentinelHubDataset(datasetId) : null;
    const layers = await LayersFactory.makeLayers(
      visualizationUrl,
      (_, dataset) => (!shJsDataset ? true : dataset.id === shJsDataset.id),
      null,
      reqConfig,
    );
    if (layers.length > 0) {
      layer = layers[0];
      layer.evalscript = evalscript;
      layer.evalscripturl = evalscripturl;
    }
  }
  if (layer) {
    if (layer.maxCloudCoverPercent !== undefined) {
      layer.maxCloudCoverPercent = 100;
    }
    if (minQa !== undefined) {
      layer.minQa = minQa;
    }
    if (upsampling) {
      layer.upsampling = upsampling;
    }
    if (downsampling) {
      layer.downsampling = downsampling;
    }
  }
  return layer;
}

function constructBBoxFromBounds(bounds, crs = CRS_EPSG4326.authId) {
  if (crs === CRS_EPSG4326.authId) {
    return new BBox(CRS_EPSG4326, bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth());
  }
  if (crs === CRS_EPSG3857.authId) {
    const { x: maxX, y: maxY } = wgs84ToMercator(bounds.getNorthEast());
    const { x: minX, y: minY } = wgs84ToMercator(bounds.getSouthWest());
    return new BBox(CRS_EPSG3857, minX, minY, maxX, maxY);
  }
}

export async function addImageOverlays(
  blob,
  width,
  height,
  imageFormat,
  lat,
  lng,
  zoom,
  showLegend,
  showCaptions,
  addMapOverlays,
  showLogo,
  userDescription,
  enabledOverlaysId,
  legendDefinition,
  legendUrl,
  copyrightText,
  title,
  showScaleBar = true,
) {
  if (!(showLegend || showCaptions || addMapOverlays || showLogo)) {
    return blob;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  await drawBlobOnCanvas(ctx, blob, 0, 0);

  if (addMapOverlays) {
    await drawMapOverlaysOnCanvas(ctx, lat, lng, zoom, width, enabledOverlaysId);
  }
  if (showCaptions) {
    let scalebar;
    if (showScaleBar) {
      scalebar = getScaleBarInfo();
    }
    await drawCaptions(ctx, width, userDescription, title, copyrightText, scalebar, true);
  }
  if (showLegend) {
    const legendImageUrl = legendDefinition
      ? 'data:image/svg+xml;base64,' + b64EncodeUnicode(createSVGLegend(legendDefinition))
      : legendUrl
      ? legendUrl
      : null;
    if (legendImageUrl !== null) {
      const legendImage = await loadImage(legendImageUrl);
      drawLegendImage(ctx, legendImage, true, showCaptions);
    }
  }
  if (showLogo) {
    await applyLogo(ctx);
  }

  return await canvasToBlob(canvas, imageFormat);
}

export function getAllBands(datasetId) {
  const dsh = getDataSourceHandler(datasetId);
  return dsh ? dsh.getBands(datasetId) : [];
}

export async function getAllLayers(url, datasetId, selectedTheme) {
  const dsh = getDataSourceHandler(datasetId);
  const shJsDataset = dsh ? dsh.getSentinelHubDataset(datasetId) : null;
  const { layersExclude, layersInclude } = selectedTheme.content.find(t => t.url === url);
  const allLayers = await LayersFactory.makeLayers(url, (layerId, dataset) =>
    !shJsDataset ? true : dataset.id === shJsDataset.id,
  );
  await Promise.all(
    allLayers.map(async l => {
      await l.updateLayerFromServiceIfNeeded();
    }),
  );
  return dsh.getLayers(allLayers, datasetId, url, layersExclude, layersInclude);
}

export function getSupportedImageFormats(url) {
  // This method should either be implemented properly in sentinelhub-js or datasource handlers
  // Currently just using the same as before, as it is not crucial
  if (url.includes('eocloud')) {
    return Object.values(IMAGE_FORMATS).filter(
      f => f !== IMAGE_FORMATS.KMZ_JPG && f !== IMAGE_FORMATS.KMZ_PNG,
    );
  }
  return Object.values(IMAGE_FORMATS);
}

export function constructV3Evalscript(layer, datasetId, imageFormat, bands, addDataMask = false) {
  const sampleType = IMAGE_FORMATS_INFO[imageFormat].sampleType;
  let factor;
  if (sampleType) {
    if (sampleType === 'UINT8') {
      factor = 255;
    }
    if (sampleType === 'UINT16') {
      factor = 65535;
    }
  }
  if (datasetId.startsWith('CUSTOM')) {
    // This is a hack to make raw bands for BYOC layers display anything
    // Service stretches values from 0-1 to 0-255, but if our BYOC bands can be UINT8 or UINT16
    // https://docs.sentinel-hub.com/api/latest/#/Evalscript/V3/README?id=sampletype
    const sampleType = bands[datasetId][0].sampleType;
    if (sampleType === 'UINT8') {
      factor = 1.0 / 2 ** 8;
    }
    if (sampleType === 'UINT16') {
      factor = 1.0 / 2 ** 16;
    }
  }

  factor = factor ? `${factor} *` : '';

  return `//VERSION=3
function setup() {
  return {
    input: ["${layer}"${addDataMask ? ', "dataMask"' : ''}],
    output: { bands: ${addDataMask ? 2 : 1}, sampleType: "${sampleType}" }
  };
}

function evaluatePixel(sample) {
  return [${`${factor} sample.` + layer}${addDataMask ? ', sample.dataMask' : ''} ];}`;
}

export function constructBasicEvalscript(band) {
  return `return [${band}]`;
}

/*

  METHODS BELOW ARE VIRTUALLY UNCHANGED FROM EOB3IMAGEDOWNLOADPANEL

*/

async function applyLogo(ctx) {
  const sentinelHubLogo = await loadImage(SHlogoLarge);

  const bottomYAxis = getLowerYAxis(ctx);
  const proposedWidth = Math.max(ctx.canvas.width * 0.1, sentinelHubLogo.width);
  const ratio = proposedWidth / sentinelHubLogo.width;
  const imagePadding = 0;

  const sentinelHubLogoWidth = sentinelHubLogo.width * ratio;
  const sentinelHubLogoHeight = sentinelHubLogo.height * ratio;

  let sentinelHubLogoX;
  let sentinelHubLogoY;

  sentinelHubLogoX = imagePadding;
  sentinelHubLogoY = bottomYAxis - sentinelHubLogoHeight - imagePadding;

  ctx.drawImage(
    sentinelHubLogo,
    sentinelHubLogoX,
    sentinelHubLogoY,
    sentinelHubLogoWidth,
    sentinelHubLogoHeight,
  );
}

export const drawMapOverlaysOnCanvas = async (ctx, lat, lng, zoom, width, enabledOverlaysId) => {
  const enabledOverlays = overlayTileLayers().filter(overlayTileLayer =>
    enabledOverlaysId.includes(overlayTileLayer.id),
  );
  enabledOverlays.sort((a, b) => a.zIndex - b.zIndex);
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  // currently we have two types of overlays
  // One served as images and the other as vector tiles
  // Vector tiles are drawn by mapbox-gl on to a canvas element
  for (const overlay of enabledOverlays) {
    let overlayCanvas;
    if (overlay.urlType === 'VECTOR') {
      overlayCanvas = await getGlOverlay(overlay.pane);
    } else {
      overlayCanvas = await getMapOverlayXYZ(
        overlay.url,
        lat,
        lng,
        zoom,
        canvasWidth,
        canvasHeight,
        overlay.tileSize,
        overlay.makeReadable,
        overlay.zoomOffset,
      );
    }
    ctx.drawImage(overlayCanvas, 0, 0);
  }
};

export const getScaleBarInfo = () => {
  const scaleBarEl = document.querySelector('.leaflet-control-scale-line');
  const scaleBar = scaleBarEl
    ? {
        text: scaleBarEl.innerHTML,
        width: scaleBarEl.offsetWidth,
      }
    : null;
  return scaleBar;
};

export const drawCaptions = async (
  ctx,
  width,
  userDescription,
  title,
  copyrightText,
  scaleBar,
  logos = true,
) => {
  const scalebarPartitionWidth = scaleBar
    ? Math.max(getScalebarWidth(ctx, scaleBar, width), ctx.canvas.width * 0.33)
    : ctx.canvas.width * 0.33;
  const copyrightPartitionWidth = (ctx.canvas.width - scalebarPartitionWidth) * 0.6 - PARTITION_PADDING;
  const logosPartitionWidth = (ctx.canvas.width - scalebarPartitionWidth) * 0.4 - PARTITION_PADDING;
  const bottomYAxis = getLowerYAxis(ctx);
  const copyrightPartitionXCoords = scalebarPartitionWidth + PARTITION_PADDING;

  if (title || userDescription) {
    const TOP_RECT_SIZE = { width: ctx.canvas.width, height: ctx.canvas.height * 0.04 };
    drawTextBoxBackground(ctx, TOP_RECT_SIZE.width, TOP_RECT_SIZE.height);
    drawDescription(ctx, TOP_RECT_SIZE.width, TOP_RECT_SIZE.height, title, userDescription);
  }
  if (scaleBar) {
    drawScalebar(ctx, scaleBar, width);
  }
  if (logos) {
    await drawLogos(ctx, logosPartitionWidth, bottomYAxis);
  }
  if (copyrightText) {
    drawCopyrightText(ctx, copyrightText, copyrightPartitionXCoords, copyrightPartitionWidth, bottomYAxis);
  }
};

function drawDescription(ctx, containerWidth, containerHeight, title, userDescription) {
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const normalFont = getFont(ctx.canvas.width, { font: 'normal', bold: false });
  const userDescriptionFont = getFont(ctx.canvas.width, { font: 'normal', bold: true });
  const titleWidth = title !== null ? getTextWidth(ctx, title, normalFont) : 0;
  const userDescriptionWidth =
    userDescription !== null ? getTextWidth(ctx, userDescription, userDescriptionFont) : 0;
  const totalTextWidth = titleWidth + userDescriptionWidth;
  const x = containerWidth / 2 - totalTextWidth / 2;
  const y = containerHeight / 2;

  if (userDescription !== null) {
    ctx.font = userDescriptionFont;
    ctx.fillText(userDescription, x, y);
  }
  if (title !== null) {
    ctx.font = normalFont;
    ctx.fillText(title, x + userDescriptionWidth, y);
  }
}

function getLowerYAxis(ctx) {
  return ctx.canvas.height * 0.99;
}

function getScalebarWidth(ctx, scaleBar, mapWidth) {
  const width = (scaleBar.width * ctx.canvas.width) / mapWidth;
  const textWidth = ctx.measureText(scaleBar.text);
  return width + textWidth.width + SCALEBAR_LEFT_PADDING + 20;
}

function getScalebarHeight(ctx) {
  return ctx.canvas.height * 0.016;
}

function drawScalebar(ctx, scaleBar, mapWidth) {
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';
  const strokeRatio = 1 / 900;
  ctx.lineWidth = Math.round(Math.max(ctx.canvas.width * strokeRatio, 1));
  ctx.beginPath();
  const width = (scaleBar.width * ctx.canvas.width) / mapWidth;
  const yAxisLineLength = getScalebarHeight(ctx);
  const baseLine = getLowerYAxis(ctx);
  ctx.moveTo(SCALEBAR_LEFT_PADDING, baseLine - yAxisLineLength);
  ctx.lineTo(SCALEBAR_LEFT_PADDING, baseLine);
  ctx.lineTo(width + SCALEBAR_LEFT_PADDING, baseLine);
  ctx.lineTo(width + SCALEBAR_LEFT_PADDING, baseLine - yAxisLineLength);
  //halfway mark
  ctx.moveTo(width / 2 + SCALEBAR_LEFT_PADDING, baseLine);
  ctx.lineTo(width / 2 + SCALEBAR_LEFT_PADDING, baseLine - yAxisLineLength / 2);
  ctx.stroke();
  //scalebar text
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = getFont(ctx.canvas.width, { font: 'normal', bold: false });
  ctx.fillText(scaleBar.text, width + 20, baseLine);
}

function drawTextBoxBackground(ctx, width, height) {
  ctx.fillStyle = 'rgba(44,48,51,0.7)';
  ctx.fillRect(0, 0, width, height);
}

function drawCopyrightText(ctx, text, copyrightPartitionX, copyrightPartitionWidth, baselineY) {
  ctx.fillStyle = '#fff';
  const x = copyrightPartitionX + copyrightPartitionWidth / 2;
  const fontSize = getFontSize(ctx.canvas.width, 'copyright');
  const lineHeight = fontSize;
  ctx.font = getFont(ctx.canvas.width, { font: 'copyright', bold: false });
  ctx.textAlign = 'center';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const lines = getWrappedLines(ctx, text, copyrightPartitionWidth);
  lines.forEach((line, index) => {
    const y = baselineY - (lines.length - index - 1) * lineHeight;
    ctx.fillText(line, x, y);
  });
}

async function drawLogos(ctx, logosPartitionWidth, bottomY) {
  const sentinelHubLogo = await loadImage(SHlogo);
  const copernicusLogo = await loadImage(copernicus);

  const proposedWidth = Math.max(ctx.canvas.width * 0.05, 50);
  const ratio = proposedWidth / copernicusLogo.width;
  const imagePadding = 10;

  const copernicusLogoWidth = copernicusLogo.width * ratio;
  const copernicusLogoHeight = copernicusLogo.height * ratio;

  const sentinelHubLogoWidth = sentinelHubLogo.width * ratio;
  const sentinelHubLogoHeight = sentinelHubLogo.height * ratio;

  const allImagesWidth = sentinelHubLogoWidth + copernicusLogoWidth;

  let copernicusLogoX;
  let copernicusLogoY;
  let sentinelHubLogoX;
  let sentinelHubLogoY;

  if (allImagesWidth > logosPartitionWidth) {
    sentinelHubLogoX = ctx.canvas.width - copernicusLogoWidth - imagePadding;
    sentinelHubLogoY = bottomY - sentinelHubLogoHeight * 0.8; // Capital letter in image is large, so offset image y postition
    copernicusLogoX = ctx.canvas.width - copernicusLogoWidth - imagePadding;
    copernicusLogoY = sentinelHubLogoY - copernicusLogoHeight - 2;
  } else {
    copernicusLogoX = ctx.canvas.width - allImagesWidth - imagePadding * 2;
    copernicusLogoY = bottomY - copernicusLogoHeight * 0.9; // Capital letter in image is large, so offset image y postition
    sentinelHubLogoX = copernicusLogoX + copernicusLogoWidth + imagePadding;
    sentinelHubLogoY = bottomY - sentinelHubLogoHeight * 0.8;
  }

  ctx.shadowColor = 'black';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(copernicusLogo, copernicusLogoX, copernicusLogoY, copernicusLogoWidth, copernicusLogoHeight);
  ctx.drawImage(
    sentinelHubLogo,
    sentinelHubLogoX,
    sentinelHubLogoY,
    sentinelHubLogoWidth,
    sentinelHubLogoHeight,
  );
}

function getFontSize(width, font) {
  // y = 0.0048x + 6.5016
  const size = Math.max((4.4 / FONT_BASE) * width + FONT_SIZES[font].base, FONT_SIZES[font].min);
  return size;
}

function getFont(width, { font, bold }) {
  const size = getFontSize(width, font);
  return ` ${bold ? 'Bold' : ''} ${Math.round(size)}px  ${FONT_FAMILY}`;
}

function getTextWidth(ctx, text, font) {
  ctx.font = font;
  const widthObj = ctx.measureText(text);
  return widthObj.width;
}

function getWrappedLines(ctx, text, maxWidth) {
  let lines = [];
  let line = '';
  let lineTest = '';
  let words = text.split(' ');
  for (let word of words) {
    lineTest = line + word + ' ';

    if (ctx.measureText(lineTest).width > maxWidth) {
      lines.push(line);
      line = word + ' ';
    } else {
      line = lineTest;
    }
  }

  if (line.length > 0) {
    lines.push(line.trim());
  }

  return lines;
}

export async function loadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(t`Error fetching image: url is empty!`);
      return;
    }
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = e => {
      reject(t`Error fetching image:` + ` ${url} ${e}`);
    };
    img.src = url;
  });
}

export function drawLegendImage(ctx, legendImage, left, showCaptions) {
  if (legendImage === null || legendImage === undefined) {
    return;
  }
  const initialWidth = ctx.canvas.width * 0.05; //5%
  let ratio = initialWidth / legendImage.width;
  if (ratio < 0.6) {
    ratio = 0.6;
  }
  if (ratio > 1) {
    ratio = 1;
  }

  const legendWidth = Math.round(legendImage.width * ratio);
  const legendHeight = Math.round(legendImage.height * ratio);
  let legendX;
  let legendY;
  if (left) {
    legendX = SCALEBAR_LEFT_PADDING;
  } else {
    legendX = ctx.canvas.width - legendWidth - SCALEBAR_LEFT_PADDING;
  }
  legendY =
    (showCaptions ? getLowerYAxis(ctx) : ctx.canvas.height) -
    legendHeight -
    (showCaptions ? getScalebarHeight(ctx) + 10 : 10);

  ctx.lineJoin = 'round';
  ctx.lineWidth = '1';
  ctx.strokeStyle = 'black';
  ctx.strokeRect(legendX - 1, legendY - 1, legendWidth + 2, legendHeight + 2);

  ctx.drawImage(
    legendImage,
    0,
    0,
    legendImage.width,
    legendImage.height,
    legendX,
    legendY,
    legendWidth,
    legendHeight,
  );
}

// METHODS IN THIS FILE ARE ALMOST UNCHANGED FROM EOB2

/*
create SVG for discrete legend
*/

function createSVGLegendDiscrete(legend) {
  const MARGIN_LEFT = 5;
  const MARGIN_TOP = 5;
  const LEGEND_ITEM_HEIGHT = 30;
  const LEGEND_ITEM_BORDER = 'rgb(119,119,119);';
  const LEGEND_ITEM_WIDTH = '3px';
  const FONT_COLOR = 'black';
  const FONT_SIZE = '18px';
  const FONT_FAMILY = 'Arial';
  const BACKGROUND_COLOR = 'white';

  const { items } = legend;

  const svg = createSVGElement('svg');
  setSVGElementAttributes(svg, {
    height: `${items.length * LEGEND_ITEM_HEIGHT + 2 * MARGIN_TOP}px`,
    style: `background-color: ${BACKGROUND_COLOR}`,
  });

  items.forEach((item, index) => {
    let circle = createSVGElement('circle');
    setSVGElementAttributes(circle, {
      cx: MARGIN_LEFT + LEGEND_ITEM_HEIGHT / 2,
      cy: MARGIN_TOP + LEGEND_ITEM_HEIGHT / 2 + index * LEGEND_ITEM_HEIGHT,
      r: LEGEND_ITEM_HEIGHT / 2 - 4,
      style: `fill: ${item.color}; stroke: ${LEGEND_ITEM_BORDER}; stroke-width: ${LEGEND_ITEM_WIDTH};`,
    });
    svg.appendChild(circle);

    let text = createSVGElement('text');
    setSVGElementAttributes(text, {
      x: MARGIN_LEFT + LEGEND_ITEM_HEIGHT + 5,
      y: MARGIN_TOP + LEGEND_ITEM_HEIGHT / 2 + index * LEGEND_ITEM_HEIGHT,
      'alignment-baseline': 'central',
      style: `fill:${FONT_COLOR}; font-family:${FONT_FAMILY}; font-size:${FONT_SIZE}`,
    });

    text.textContent = item.label;
    svg.appendChild(text);
  });

  let maxLabelWidth = 0;
  maxLabelWidth = Math.max(
    ...items.filter(item => item.label).map(item => getLabelWidth(item.label, FONT_SIZE, FONT_FAMILY) + 5),
    maxLabelWidth,
  );
  svg.setAttribute('width', `${maxLabelWidth + 2 * MARGIN_LEFT + LEGEND_ITEM_HEIGHT}px`);

  return new XMLSerializer().serializeToString(svg);
}

function getLabelWidth(txt, fontSize, fontFamily) {
  if (!txt) {
    return 0;
  }
  let element = document.createElement('canvas');
  let context = element.getContext('2d');
  context.font = `${fontSize} ${fontFamily}`;
  return context.measureText(txt).width;
}

/*
create SVG element
*/
const createSVGElement = elem => document.createElementNS('http://www.w3.org/2000/svg', elem);

/*
set SVG element attributes.
*/

const setSVGElementAttributes = (elem, attributes) => {
  Object.keys(attributes).forEach(key => elem.setAttributeNS(null, key, attributes[key]));
};

/*
create SVG for continous legend
*/

function createSVGLegendContinous(legend) {
  const MARGIN_LEFT = 15;
  const MARGIN_TOP = 15;
  const HEIGHT = 320;
  const LEGEND_WIDTH = 50;
  const LEGEND_HEIGHT = HEIGHT - 2 * MARGIN_TOP;
  const LEGEND_BORDER_COLOR = 'black';
  const LEGEND_BORDER_WIDTH = '2px';
  const FONT_COLOR = 'black';
  const FONT_SIZE = '18px';
  const FONT_FAMILY = 'Arial';
  const BACKGROUND_COLOR = 'white';

  const { gradients, minPosition, maxPosition } = createGradients(legend);
  let items = [];
  Object.assign(items, gradients);

  let ticks = [];
  Object.assign(ticks, legend.gradients);

  //svg container
  const svg = createSVGElement('svg');
  setSVGElementAttributes(svg, {
    height: `${HEIGHT}px`,
    style: `background-color: ${BACKGROUND_COLOR}`,
  });

  //add border
  const border = createSVGElement('rect');
  setSVGElementAttributes(border, {
    x: MARGIN_LEFT,
    y: MARGIN_TOP,
    width: LEGEND_WIDTH,
    height: LEGEND_HEIGHT + 1,
    style: `fill:none;stroke:${LEGEND_BORDER_COLOR}; stroke-width:${LEGEND_BORDER_WIDTH}`,
  });
  svg.appendChild(border);

  //gradient definitions
  const defs = createSVGElement('defs');
  svg.appendChild(defs);

  items.forEach((item, index) => {
    const itemHeight = LEGEND_HEIGHT * item.size;
    let linearGradient = createSVGElement('linearGradient');
    setSVGElementAttributes(linearGradient, {
      x1: '0%',
      y1: '0%',
      x2: '0%',
      y2: '100%',
      id: `id${index}`,
    });
    //add stops to gradient
    const stops = [
      {
        color: item.endColor,
        offset: '0%',
      },
      {
        color: item.startColor,
        offset: '100%',
      },
    ];

    stops.forEach(s => {
      let stop = createSVGElement('stop');
      setSVGElementAttributes(stop, {
        offset: s.offset,
        'stop-color': s.color,
      });
      linearGradient.appendChild(stop);
    });
    //add gradient to definiton
    defs.appendChild(linearGradient);

    let rect = createSVGElement('rect');
    setSVGElementAttributes(rect, {
      x: MARGIN_LEFT,
      y: MARGIN_TOP + LEGEND_HEIGHT * (1 - item.pos - item.size),
      width: LEGEND_WIDTH,
      height: itemHeight + 1,
      style: `fill:url(#id${index});stroke:none`,
    });

    svg.appendChild(rect);
  });

  //add ticks
  ticks.forEach(line => {
    if (line.label) {
      let l = createSVGElement('line');
      const pos = (1 - (line.position - minPosition) / (maxPosition - minPosition)) * LEGEND_HEIGHT;
      setSVGElementAttributes(l, {
        x1: MARGIN_LEFT + LEGEND_WIDTH,
        x2: MARGIN_LEFT + LEGEND_WIDTH + 5,
        y1: MARGIN_TOP + pos,
        y2: MARGIN_TOP + pos,
        style: `stroke: ${FONT_COLOR}`,
      });
      svg.appendChild(l);
    }
  });

  //add labels
  ticks.forEach(item => {
    if (item.label) {
      let text = createSVGElement('text');
      const pos = (1 - (item.position - minPosition) / (maxPosition - minPosition)) * LEGEND_HEIGHT;
      setSVGElementAttributes(text, {
        x: MARGIN_LEFT + LEGEND_WIDTH + 10,
        y: MARGIN_TOP + pos + 5,
        style: `fill: ${FONT_COLOR}; font-family: ${FONT_FAMILY}; font-size  : ${FONT_SIZE};`,
      });
      text.textContent = item.label;
      svg.appendChild(text);
    }
  });
  //calculate max label width
  let maxLabelWidth = 0;
  maxLabelWidth = Math.max(
    ...ticks.filter(t => t.label).map(val => getLegendTextWidth(val.label, FONT_SIZE, FONT_FAMILY) + 10),
    maxLabelWidth,
  );

  //set svg width
  setSVGElementAttributes(svg, {
    width: `${maxLabelWidth + 2 * MARGIN_LEFT + LEGEND_WIDTH}px`,
  });
  return new XMLSerializer().serializeToString(svg);
}

export const createSVGLegend = legendSpec =>
  legendSpec.type === 'discrete' ? createSVGLegendDiscrete(legendSpec) : createSVGLegendContinous(legendSpec);

function getLegendTextWidth(txt, fontSize, fontFamily) {
  if (!txt) {
    return 0;
  }
  let element = document.createElement('canvas');
  let context = element.getContext('2d');
  context.font = `${fontSize} ${fontFamily}`;
  return context.measureText(txt).width;
}
