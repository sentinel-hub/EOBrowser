import moment from 'moment';
import { BBox, CRS_EPSG4326 } from '@sentinel-hub/sentinelhub-js';
import L, { LatLngBounds } from 'leaflet';
import axios from 'axios';

import {
  fetchImage as fetchImageDownloadUtils,
  getMapDimensions,
  getAppropriateApiType,
} from '../ImgDownload/ImageDownload.utils';
import {
  getDataSourceHandler,
  checkIfCustom,
} from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

import SHlogo from '../../junk/EOBCommon/assets/shLogo.png';
import copernicus from '../../junk/EOBCommon/assets/copernicus.png';
import { addOverlays } from '../../junk/EOB3TimelapsePanel/imageOverlays';

export function getTimelapseBBox(pixelBounds, zoom) {
  const { width: mapWidth, height: mapHeight } = getMapDimensions(pixelBounds);
  const selectedMapDimension = Math.min(mapWidth, mapHeight);

  const { x, y } = pixelBounds.getCenter();
  const halfDimension = selectedMapDimension / 2 - 1;

  const { lat: south, lng: west } = L.CRS.EPSG3857.pointToLatLng(
    L.point(x - halfDimension, y + halfDimension),
    zoom,
  );
  const { lat: north, lng: east } = L.CRS.EPSG3857.pointToLatLng(
    L.point(x + halfDimension, y - halfDimension),
    zoom,
  );

  const imageWidthMeters = L.CRS.EPSG3857.distance(L.latLng(south, west), L.latLng(south, east));
  return {
    bbox: new BBox(CRS_EPSG4326, west, south, east, north),
    bounds: new LatLngBounds({ lat: south, lng: west }, { lat: north, lng: east }),
    selectedMapDimension: selectedMapDimension,
    imageWidthMeters: imageWidthMeters,
  };
}

export function getMinMaxDates(datasetId) {
  let minDate, maxDate;
  const dsh = getDataSourceHandler(datasetId);
  if (dsh) {
    ({ minDate, maxDate } = dsh.getMinMaxDates(datasetId));
  }
  minDate = minDate ? minDate : moment.utc('1970-01-01');
  maxDate = maxDate ? maxDate : moment.utc();
  return { minDate, maxDate };
}

export function getFlyoversToFetch(flyovers, period) {
  flyovers.forEach((f) => {
    f.fromTime = moment.utc(f.fromTime);
    f.toTime = moment.utc(f.toTime);
  });
  const flyoversByPeriod = createIntervalsFromFlyovers(flyovers, period);
  return findBestFlyoverPerInterval(flyoversByPeriod);
}

function createIntervalsFromFlyovers(flyovers, period) {
  if (period === 'orbit') {
    return flyovers.map((f) => [f]);
  }

  const intervalsForPeriod = [];
  let intervalIndex = 0;
  for (let flyoverIndex = 0; flyoverIndex < flyovers.length; flyoverIndex++) {
    if (flyoverIndex === 0) {
      intervalsForPeriod[intervalIndex] = [flyovers[flyoverIndex]];
      continue;
    }
    if (
      flyovers[flyoverIndex - 1].fromTime.isSame(flyovers[flyoverIndex].fromTime, period) ||
      flyovers[flyoverIndex - 1].toTime.isSame(flyovers[flyoverIndex].toTime, period) ||
      flyovers[flyoverIndex - 1].fromTime.isSame(flyovers[flyoverIndex].toTime, period) ||
      flyovers[flyoverIndex - 1].toTime.isSame(flyovers[flyoverIndex].fromTime, period)
    ) {
      intervalsForPeriod[intervalIndex].push(flyovers[flyoverIndex]);
    } else {
      intervalIndex++;
      intervalsForPeriod[intervalIndex] = [flyovers[flyoverIndex]];
    }
  }

  return intervalsForPeriod;
}

function findBestFlyoverPerInterval(flyovers) {
  const bestFlyovers = [];
  for (let period of flyovers) {
    period.sort(sortByBestCoverage);
    bestFlyovers.push(period[0]);
  }
  return bestFlyovers;
}

function sortByBestCoverage(a, b) {
  const aCoverage = a.coveragePercent !== undefined ? a.coveragePercent : 100;
  const bCoverage = b.coveragePercent !== undefined ? b.coveragePercent : 100;
  const aClearSkyCoverage =
    a.meta && a.meta.averageCloudCoverPercent !== undefined ? 100 - a.meta.averageCloudCoverPercent : 100;
  const bClearSkyCoverage =
    b.meta && b.meta.averageCloudCoverPercent !== undefined ? 100 - b.meta.averageCloudCoverPercent : 100;

  return bCoverage * bClearSkyCoverage - aCoverage * aClearSkyCoverage;
}

export async function fetchImage(params) {
  const {
    layer,
    toTime,
    selectedPeriod,
    datasetId,
    width,
    height,
    pixelBounds,
    zoom,
    showBorders,
    imageFormat,
  } = params;

  const { bbox, bounds, selectedMapDimension, imageWidthMeters } = getTimelapseBBox(pixelBounds, zoom);
  const apiType = await getAppropriateApiType(layer, imageFormat);
  const options = {
    ...params,
    bounds,
    apiType,
  };

  let blob = await fetchImageDownloadUtils(layer, options).catch((err) => {
    console.warn(err);
  });
  if (!blob) return;

  if (showBorders) {
    const bboxArr = [bbox.minX, bbox.minY, bbox.maxX, bbox.maxY];
    blob = await addOverlays(
      blob,
      selectedMapDimension,
      selectedMapDimension,
      bboxArr,
      [timelapseBorders],
      width,
      height,
    );
  }

  const showLogos = checkIfShouldShowCopernicusSHLogos(datasetId);
  // MAKE SURE TO REVOKE AT SOME POINT!!!!
  const objectURL = await addLabelsAndLogos(
    dateTimeDisplayFormat(toTime, selectedPeriod),
    blob,
    width,
    height,
    imageWidthMeters,
    showLogos,
  );

  return {
    url: objectURL,
  };
}

export function dateTimeDisplayFormat(datetime, period) {
  return period === 'orbit'
    ? datetime.clone().format('YYYY-MM-DD HH:mm:ss')
    : datetime.clone().format('YYYY-MM-DD');
}

function checkIfShouldShowCopernicusSHLogos(datasetId) {
  const dsh = getDataSourceHandler(datasetId);
  const isBYOC = checkIfCustom(datasetId);
  if (isBYOC || dsh?.isCopernicus() || dsh?.isSentinelHub()) {
    return true;
  }
  return false;
}

export function addLabelsAndLogos(
  dateToBeShown,
  blob,
  width,
  height,
  imageWidthMeters,
  showSHCopernicusLogos = true,
) {
  const canvas = document.createElement('canvas');
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

        if (showSHCopernicusLogos) {
          //sentinel hub logo
          const shResizeFactor = 0.85;
          const shWidth = sh.width * shResizeFactor;
          const shHeight = sh.height * shResizeFactor;
          const shXpos = canvas.width - shWidth - 10;
          const shYpos = canvas.height - shHeight - 4;
          ctx.drawImage(sh, shXpos, shYpos, shWidth, shHeight);

          //copernicus logo
          const cpImgResizeFactor = 0.8;
          const cpImgWidth = cpImg.width * cpImgResizeFactor;
          const cpImgHeight = cpImg.height * cpImgResizeFactor;
          const cpImgXpos = shXpos - cpImgWidth - 8;
          const cpImgYpos = canvas.height - cpImgHeight - 8;
          ctx.drawImage(cpImg, cpImgXpos, cpImgYpos, cpImgWidth, cpImgHeight);
        }

        const dataUrl = canvas.toDataURL('image/jpg', 0.9);
        URL.revokeObjectURL(mainImg.src);
        resolve(dataUrl);
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

export function scalebarPixelWidthAndDistance(metersPerPixel) {
  const proposedScaleBarWidth = 50;
  const roundedMeters = roundScalebarMeters(metersPerPixel * proposedScaleBarWidth);
  const meterOrKilo = getMorKm(roundedMeters);
  const width = roundedMeters / metersPerPixel;
  return {
    widthPx: width,
    label: meterOrKilo,
  };
}

function roundScalebarMeters(distance) {
  const ceilingFactor = getRoundingFactor(distance);
  return Math.round(distance / ceilingFactor) * ceilingFactor;
}

function getMorKm(distance) {
  const divided = distance / 1000;
  if (divided >= 1) {
    return `${divided} km`;
  } else {
    return `${distance} m`;
  }
}

function getRoundingFactor(imageWidthInMeters) {
  const fact = Math.round(Math.log10(imageWidthInMeters)); // 1876 -> log10(1000) = 3
  return Math.pow(10, fact) / 2; // 1000 / 2 = 500;
}

function timelapseBorders(width, height, bbox) {
  return {
    sortIndex: 1,
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_BORDERS}/static/${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}/${width}x${height}.png?key=${process.env.REACT_APP_MAPTILER_KEY}&attribution=false`,
    params: {},
  };
}

export const findDefaultActiveImageIndex = (
  images,
  canWeFilterByClouds,
  canWeFilterByCoverage,
  maxCCPercentAllowed,
  minCoverageAllowed,
) => {
  const index = images.findIndex((image) =>
    isImageApplicable(
      image,
      canWeFilterByClouds,
      canWeFilterByCoverage,
      maxCCPercentAllowed,
      minCoverageAllowed,
    ),
  );
  if (index < 0) {
    return null;
  }
  return index;
};

export const findNextActiveImageIndex = (
  images,
  canWeFilterByClouds,
  canWeFilterByCoverage,
  maxCCPercentAllowed,
  minCoverageAllowed,
  activeImage,
) => {
  if (!images) {
    return null;
  }

  for (let i = 1; i <= images.length; i++) {
    const index = (activeImage + i) % images.length;
    if (
      isImageApplicable(
        images[index],
        canWeFilterByClouds,
        canWeFilterByCoverage,
        maxCCPercentAllowed,
        minCoverageAllowed,
      )
    ) {
      return index;
    }
  }
};

export const isImageApplicable = (
  image,
  canWeFilterByClouds,
  canWeFilterByCoverage,
  maxCCPercentAllowed,
  minCoverageAllowed,
) => {
  return (
    image &&
    image.isSelected &&
    (canWeFilterByClouds ? image.averageCloudCoverPercent <= maxCCPercentAllowed : true) &&
    (canWeFilterByCoverage ? image.coveragePercent >= minCoverageAllowed : true)
  );
};

export const generateS3PreSignedPost = async (access_token, filename) => {
  try {
    const url = `${process.env.REACT_APP_EOB_BACKEND}generatepresignedpost`;
    const requestParams = {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      params: {
        filename,
      },
    };

    const res = await axios.get(url, requestParams);
    return res.data;
  } catch (e) {}
};

export const uploadFileToS3 = async (preSignedPost, file) => {
  try {
    const postData = new FormData();
    for (let key in preSignedPost.fields) {
      postData.append(key, preSignedPost.fields[key]);
    }
    postData.append('file', file);

    await axios.post(preSignedPost.url, postData);
  } catch (e) {}
};

export const getS3FileUrl = (res) => {
  return res.url + res.fields.key;
};
