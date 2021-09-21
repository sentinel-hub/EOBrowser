import axios from 'axios';
import moment from 'moment';
import { BBox, CRS_EPSG4326, legacyGetMapFromUrl } from '@sentinel-hub/sentinelhub-js';
import {
  calcBboxFromXY,
  bboxToPolygon,
  getRecommendedResolution,
  getMapDOMSize,
} from '../EOBCommon/utils/coords';
import { scalebarPixelWidthAndDistance } from './scalebarUtils';
import { addOverlays } from './imageOverlays';
import copernicus from '../EOBCommon/assets/copernicus.png';
import SHlogo from '../EOBCommon/assets/shLogo.png';
import { applyFilterMonthsToDateRange } from '../EOBCommon/utils/filterDates';
import { getMapDataFusion } from '../EOBCommon/utils/dataFusion';
import { isDataFusionEnabled } from '../../utils';
import { b64EncodeUnicode } from '../../utils/base64MDN';
import { constructGetMapParamsEffects } from '../../utils/effectsUtils';

const PADDING = 80;
const REQUEST_RETRY_LIMIT = 2;
const TIMELAPSE_SIZE = 512;

let imageWidthMeters;

export function getWidthOrHeight() {
  const size = getMapDOMSize();
  const widthOrHeight = Math.min(size.width, size.height);
  return widthOrHeight;
}

export function createTimelapseBbox(lat, lng, zoom, mapBounds, aoiBounds) {
  const widthOrHeight = getWidthOrHeight();

  return calcBboxFromXY({
    lat,
    lng,
    zoom,
    width: widthOrHeight,
    height: widthOrHeight,
    wgs84: true,
    mapBounds,
    aoiBounds,
  });
}

export async function legacyFetchDates(
  { from, to },
  lat,
  lng,
  zoom,
  mapBounds,
  aoiBounds,
  filterMonths,
  selectedResult,
  presets,
  canWeFilterByClouds,
  cloudCoverageLayers,
  onFetchAvailableDates,
  cancelToken,
) {
  const bbox = createTimelapseBbox(lat, lng, zoom, mapBounds, aoiBounds);
  const boundsGeojson = bboxToPolygon(bbox);
  imageWidthMeters = distance(boundsGeojson.coordinates[0][3], boundsGeojson.coordinates[0][4]);
  const fromDate = moment.utc(from).startOf('day');
  const toDate = moment.utc(to).endOf('day');

  const intervals = applyFilterMonthsToDateRange(fromDate, toDate, filterMonths);
  let fakeFlyovers = [];
  for (let interval of intervals) {
    const newDates = await onFetchAvailableDates(interval.fromMoment, interval.toMoment, boundsGeojson);

    let newFlyovers = await Promise.all(
      newDates.map(async (d) => {
        let flyover = {
          fromTime: moment.utc(d).startOf('day'),
          toTime: moment.utc(d).endOf('day'),
          coveragePercent: 100,
          meta: { averageCloudCoverPercent: 0 },
        };

        if (canWeFilterByClouds) {
          const ccInfo = await legacyGetCC(
            { from: d, to: d },
            lat,
            lng,
            zoom,
            selectedResult,
            presets,
            cloudCoverageLayers,
            mapBounds,
            aoiBounds,
            cancelToken,
          );

          if (ccInfo.length > 0) {
            flyover.meta.averageCloudCoverPercent = ccInfo[0].basicStats.mean * 100;
          }
        }

        return flyover;
      }),
    );

    fakeFlyovers = fakeFlyovers.concat(newFlyovers);
  }
  fakeFlyovers.sort((a, b) => a.fromTime.unix() - b.fromTime.unix());
  return fakeFlyovers;
}

async function legacyGetCC(
  { from, to },
  lat,
  lng,
  zoom,
  selectedResult,
  presets,
  cloudCoverageLayers,
  mapBounds,
  aoiBounds,
  cancelToken,
) {
  const url = selectedResult.baseUrls.FIS;
  let layerInfo;
  const widthOrHeight = getWidthOrHeight() + PADDING;
  const originalLayerId = selectedResult.preset;
  const originalLayerInfo = presets[selectedResult.name].find((layer) => layer.id === originalLayerId);

  const cloudCoverageLayerinfo = cloudCoverageLayers[selectedResult.name]
    ? cloudCoverageLayers[selectedResult.name]
    : null;

  if (cloudCoverageLayerinfo) {
    layerInfo = {
      ...cloudCoverageLayerinfo,
      image: originalLayerInfo ? originalLayerInfo.image : cloudCoverageLayerinfo.image,
    };
  } else {
    layerInfo = originalLayerInfo;
  }

  const bbox = calcBboxFromXY({
    lat,
    lng,
    zoom,
    width: widthOrHeight,
    height: widthOrHeight,
    wgs84: true,
    mapBounds,
    aoiBounds,
  });
  const resolution = getRecommendedResolution(bboxToPolygon(bbox), selectedResult);
  const requestUrl = `${url}?LAYER=${layerInfo.id}&CRS=CRS:84&TIME=${from}/${to}&RESOLUTION=${resolution}m&BBOX=${bbox}&MAXCC=100`;
  try {
    const { data } = await legacyGetMapFromUrl(requestUrl);
    return data['C0'].reverse();
  } catch (err) {
    if (axios.isCancel(err)) {
      console.log('Request canceled', err.message);
    } else {
      console.error(err);
      throw err;
    }
  }
}

export async function fetchSHLayerFlyovers(
  selectedLayerSHJS,
  { from, to },
  lat,
  lng,
  zoom,
  mapBounds,
  aoiBounds,
  filterMonths,
) {
  // some random numbers that seems like a reasonable number at the moment but will bite us in the future
  const MAX_TILES_PER_FINDTILES_REQUEST = 100;
  const MAX_FINDTILES_REQUESTS = 100;

  // currently we get only a date for (from, to), so we just set the time to start/end of day
  // when we will use the date and time, we can just remove startof / endof
  const fromDate = moment.utc(from).startOf('day');
  const toDate = moment.utc(to).endOf('day');

  const filterMonthsIntervals = applyFilterMonthsToDateRange(fromDate, toDate, filterMonths);

  const bbox = createTimelapseBbox(lat, lng, zoom, mapBounds, aoiBounds);
  const boundsGeojson = bboxToPolygon(bbox);
  imageWidthMeters = distance(boundsGeojson.coordinates[0][3], boundsGeojson.coordinates[0][4]);

  // BBox(crs, minX, minY, maxX, maxY)
  const bboxSHJS = new BBox(CRS_EPSG4326, ...bbox);

  let allFlyovers = [];

  for (let interval of filterMonthsIntervals) {
    const requestedFlyovers = await selectedLayerSHJS.findFlyovers(
      bboxSHJS,
      interval.fromMoment.toDate(),
      interval.toMoment.toDate(),
      MAX_FINDTILES_REQUESTS,
      MAX_TILES_PER_FINDTILES_REQUEST,
    );
    allFlyovers = [...allFlyovers, ...requestedFlyovers];
  }

  // sentinelhub-js returns Date objects that must be transformed to Moment objects
  // https://link.medium.com/2zIHrAfLi5
  allFlyovers = allFlyovers.map((f) => ({
    ...f,
    fromTime: moment.utc(f.fromTime),
    toTime: moment.utc(f.toTime),
  }));
  return allFlyovers;
}

function getActiveInstance(name, instances) {
  return instances.find((inst) => inst.name === name) || {};
}

export function getCurrentBboxUrl(
  lat,
  lng,
  zoom,
  isEvalUrl,
  selectedResult,
  presets,
  instances,
  evalscriptoverrides,
  mapBounds,
  aoiBounds,
  effects,
) {
  const { name, preset, evalscript, evalscripturl, atmFilter, evalsource } = selectedResult;
  const widthOrHeight = getWidthOrHeight();
  const datasetLayers = presets[name];
  const { baseUrls } = getActiveInstance(name, instances);
  const bbox = calcBboxFromXY({
    lat,
    lng,
    zoom,
    width: widthOrHeight,
    height: widthOrHeight,
    mapBounds,
    aoiBounds,
  });

  let effectsUrlParams = '';
  if (effects.upsampling) {
    effectsUrlParams += `&upsampling=${effects.upsampling}`;
  }
  if (effects.downsampling) {
    effectsUrlParams += `&downsampling=${effects.downsampling}`;
  }
  // gain, gamma, RGB effects, minQa are not WMS params, they are used for
  // overrideGetMapParams and overrideLayerConstructorParams in fetchBlobObj

  return `${
    baseUrls.WMS
  }?SERVICE=WMS&REQUEST=GetMap&width=${TIMELAPSE_SIZE}&height=${TIMELAPSE_SIZE}&layers=${
    preset === 'CUSTOM' ? datasetLayers[0].id : preset
  }&evalscript=${
    preset !== 'CUSTOM' ? '' : isEvalUrl ? '' : window.encodeURIComponent(evalscript)
  }&evalscripturl=${isEvalUrl ? evalscripturl : ''}&evalscriptoverrides=${b64EncodeUnicode(
    evalscriptoverrides,
  )}&evalsource=${evalsource}&atmfilter=${
    atmFilter ? atmFilter : ''
  }&bbox=${bbox}&CRS=EPSG%3A3857&MAXCC=100&FORMAT=image/jpeg${effectsUrlParams}`;
}

export async function fetchBlobObj(
  request,
  width,
  height,
  bbox,
  overlayLayers,
  cancelToken,
  apiType,
  effects,
  dataFusion,
  supportsTimeRange,
  showSHLogo,
  showCopernicusLogo,
) {
  try {
    // something here went wrong, time is added here and in EOB3TimelapsePanel.js where it is called from
    request.url += `&time=${moment.utc(request.date).startOf('day').toISOString()}/${moment
      .utc(request.date)
      .endOf('day')
      .toISOString()}&preview=3`;

    const overrideGetMapParams = {};

    const shjsEffects = constructGetMapParamsEffects(effects);
    if (shjsEffects) {
      overrideGetMapParams.effects = shjsEffects;
    }

    if (!supportsTimeRange) {
      overrideGetMapParams.fromTime = null;
      overrideGetMapParams.toTime = moment.utc(request.date).endOf('day').toDate();
    }

    const overrideLayerConstructorParams = {};
    if (effects.minQa !== undefined) {
      overrideLayerConstructorParams.minQa = effects.minQa;
    }
    if (effects.speckleFilter !== undefined) {
      overrideLayerConstructorParams.speckleFilter = effects.speckleFilter;
    }
    if (effects.demInstanceType !== undefined) {
      if (effects.demInstanceType === 'DISABLED') {
        overrideLayerConstructorParams.orthorectify = false;
      } else {
        overrideLayerConstructorParams.orthorectify = true;
        overrideLayerConstructorParams.demInstanceType = effects.demInstanceType;
      }
    }

    let blob;

    if (isDataFusionEnabled(dataFusion)) {
      const url = new URL(request.url);
      let params = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      blob = await getMapDataFusion(params, dataFusion, shjsEffects);
    } else {
      blob = await legacyGetMapFromUrl(
        request.url,
        apiType,
        null,
        overrideLayerConstructorParams,
        overrideGetMapParams,
      );
    }

    //add overlays
    if (overlayLayers && overlayLayers.length > 0) {
      blob = await addOverlays(blob, width, height, bbox, overlayLayers, TIMELAPSE_SIZE, TIMELAPSE_SIZE);
    }

    return decorateBlob(request.date, request.dateToBeShown, blob, showSHLogo, showCopernicusLogo);
  } catch (err) {
    if (axios.isCancel(err)) {
      throw err;
    } else {
      if (request.try < REQUEST_RETRY_LIMIT) {
        request.try++;
        fetchBlobObj(
          request,
          width,
          height,
          bbox,
          overlayLayers,
          cancelToken,
          apiType,
          effects,
          dataFusion,
          supportsTimeRange,
        );
        throw err;
      }
    }
  }
}

function decorateBlob(date, dateToBeShown, blob, showSHLogo = true, showCopernicusLogo = true) {
  const canvas = document.createElement('canvas');
  const height = TIMELAPSE_SIZE;
  const width = TIMELAPSE_SIZE;
  const { widthPx, label } = scalebarPixelWidthAndDistance(imageWidthMeters / width);
  return new Promise((resolve, reject) => {
    const mainImg = new Image();
    const sh = new Image();
    sh.crossOrigin = '';
    const cpImg = new Image();
    cpImg.crossOrigin = '';
    mainImg.crossOrigin = '';
    canvas.width = width;
    canvas.height = height;
    mainImg.onload = () => {
      try {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(mainImg, 0, 0);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';

        const dateSize = ctx.measureText(dateToBeShown);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const rightLeftPadding = 5;
        ctx.fillRect(
          canvas.width - dateSize.width - rightLeftPadding * 2,
          0,
          dateSize.width + rightLeftPadding * 4,
          parseInt(ctx.font, 10) + 10,
        );
        ctx.textAlign = 'left';
        ctx.fillStyle = '#eee';

        ctx.fillText(dateToBeShown, canvas.width - dateSize.width - rightLeftPadding, 16);
        //scale
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.beginPath();
        ctx.moveTo(10, 15);
        ctx.lineTo(10, 5);
        ctx.font = '11px Arial';
        ctx.lineTo(widthPx + 10, 5);
        ctx.lineTo(widthPx + 10, 15);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#767777';
        ctx.strokeText(label, widthPx / 2 + 10, 17);
        ctx.fillText(label, widthPx / 2 + 10, 17);

        // logos
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        let shXpos = canvas.width - 10;

        if (showSHLogo) {
          //sentinel hub logo
          const shResizeFactor = 0.85;
          const shWidth = sh.width * shResizeFactor;
          const shHeight = sh.height * shResizeFactor;
          shXpos = canvas.width - shWidth - 10;
          const shYpos = canvas.height - shHeight - 4;
          ctx.drawImage(sh, shXpos, shYpos, shWidth, shHeight);
        }
        if (showCopernicusLogo) {
          //copernicus logo
          const cpImgResizeFactor = 0.8;
          const cpImgWidth = cpImg.width * cpImgResizeFactor;
          const cpImgHeight = cpImg.height * cpImgResizeFactor;
          const cpImgXpos = shXpos - cpImgWidth - 8;
          const cpImgYpos = canvas.height - cpImgHeight - 8;
          ctx.drawImage(cpImg, cpImgXpos, cpImgYpos, cpImgWidth, cpImgHeight);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        URL.revokeObjectURL(mainImg.src);
        resolve({
          objectUrl: dataUrl,
          date: date,
          success: true,
        });
      } catch (e) {
        reject('Error generating image');
      }
    };

    mainImg.onerror = (err) => {
      reject(err);
    };
    mainImg.src = URL.createObjectURL(blob);
    sh.src = SHlogo;
    cpImg.src = copernicus;
  });
}

function sqr(x) {
  return x * x;
}

function toRad(degree) {
  return (degree * Math.PI) / 180;
}

function distance(point1, point2) {
  const dLat = toRad(point2[1] - point1[1]);
  const dLon = toRad(point2[0] - point1[0]);
  const lat1 = toRad(point1[1]);
  const lat2 = toRad(point2[1]);

  const a = sqr(Math.sin(dLat / 2)) + sqr(Math.sin(dLon / 2)) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  const radius = 6373000; //meter

  const distance = radius * c;
  return distance;
}
