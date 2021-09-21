import { ApiType, isCancelled } from '@sentinel-hub/sentinelhub-js';

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

function getMapTileUrl(layer, params, minX, minY, maxX, maxY, width, height, callback, reqConfig) {
  mapTileRequestList.push(() => {
    getMapTileUrlInternal(layer, params, minX, minY, maxX, maxY, width, height, callback, reqConfig);
  });

  if (mapTileRequestTimerId == null) {
    mapTileRequestTimerId = setTimeout(mapTileRequestExecutor, mapTileRequestDelay);
  }
}

export function getMapTile(layer, getMapParams, minX, minY, maxX, maxY, width, height, callback, reqConfig) {
  mapTileRequestList.push(() => {
    getMapTileUrlInternal(layer, getMapParams, minX, minY, maxX, maxY, width, height, callback, reqConfig);
  });

  if (mapTileRequestTimerId == null) {
    mapTileRequestTimerId = setTimeout(mapTileRequestExecutor, mapTileRequestDelay);
  }
}

function getMapTileUrlInternal(layer, params, minX, minY, maxX, maxY, width, height, callback, reqConfig) {
  const apiType = layer.supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS;
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
        getMapTileUrl(layer, params, minX, minY, maxX, maxY, width, height, callback, reqConfig);
      } else {
        if (httpStatus !== 400 && !isCancelled(error)) {
          console.log(error.message);
        }
        callback(null);
      }
    });
}

export function getHeightFromZoom(zoom) {
  const starting = 20026376;
  return starting / Math.pow(2, zoom - 1);
}
