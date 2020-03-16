import axios from 'axios';
import values from 'lodash/values';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import L from 'leaflet';
import uuid from 'uuid';
import { isTimeInterval } from '@sentinel-hub/eo-components';
import '../components/ext/leaflet-clip-wms-layer';
import Store from '../store';
import { getTokenFromLocalStorage, isTokenExpired } from './auth';
import { SentinelHub } from '../utils/sentinelhub';
import { evalSourcesMap } from '../store/config';
import { base64EncArr, strToUTF8Arr } from './base64MDN';

import '../components/ext/leaflet-tilelayer-wmts-src';

export function getMultipliedLayers(layers) {
  let result = [];
  for (let layer in layers) {
    if (layers.hasOwnProperty(layer)) {
      result.push(`${layers[layer]}*2.5`);
    }
  }
  return result.join(',');
}

export function getCrsLabel(tile) {
  const { dataGeometry, tileGeometry, dataUri } = tile;
  const crs = 'EPSG:' + (dataGeometry || tileGeometry).crs.properties.name.split('::')[1];
  const mgrsPath = dataUri.split('/');
  const mgrs = mgrsPath[4] + mgrsPath[5] + mgrsPath[6];
  return { crs, mgrs };
}

export function isCustomPreset(preset) {
  return preset === 'CUSTOM';
}

export function getLayersString(layers) {
  return values(layers).join(',');
}

export function hasPinSaved(currPin) {
  const { userPins } = Store.current;
  return userPins.find(pin => {
    return isEqual(pin, currPin);
  });
}

export function getZoomLimitsForSelectedLayer() {
  const defaultMinZoom = 5;
  const defaultMaxZoom = 16;
  //const defaultAllowOverZoomBy = 0

  let minZoomFromGetCapabilities = undefined;
  let maxZoomFromGetCapabilities = undefined;

  if (Store.current.selectedResult) {
    const selectedDatasourceLayers = Store.current.presets[Store.current.selectedResult.name];
    const selectedLayer = selectedDatasourceLayers
      ? selectedDatasourceLayers.find(l => l.id === Store.current.selectedResult.preset)
      : undefined;
    if (selectedLayer) {
      minZoomFromGetCapabilities = selectedLayer.minZoom;
      maxZoomFromGetCapabilities = selectedLayer.maxZoom;
    }
  }
  // no allowOverZoomBy (or similar) from getCapabilities

  let minZoomFromConfig = undefined;
  let maxZoomFromConfig = undefined;
  //let allowOverZoomByFromConfig = undefined;
  if (Store.current.selectedResult) {
    const selectedDatasourceFromConfig = Store.current.instances.find(
      d => d.name === Store.current.selectedResult.name,
    );
    minZoomFromConfig = selectedDatasourceFromConfig.minZoom;
    maxZoomFromConfig = selectedDatasourceFromConfig.maxZoom;
    //allowOverZoomByFromConfig = selectedDatasourceFromConfig.allowOverZoomBy;
  }

  const minZoom =
    minZoomFromGetCapabilities !== undefined
      ? minZoomFromGetCapabilities
      : minZoomFromConfig !== undefined
        ? minZoomFromConfig
        : defaultMinZoom;
  const maxZoom =
    maxZoomFromGetCapabilities !== undefined
      ? maxZoomFromGetCapabilities
      : maxZoomFromConfig !== undefined
        ? maxZoomFromConfig
        : defaultMaxZoom;

  // const allowOverZoomBy =
  //   allowOverZoomByFromConfig !== undefined ? allowOverZoomByFromConfig : defaultAllowOverZoomBy;
  const allowOverZoomBy = 2;

  return { minZoom, maxZoom, allowOverZoomBy };
}

export function createMapLayer(
  instanceObj,
  layerParams,
  pane,
  progress,
  recaptchaAuthToken,
  setTokenShouldBeUpdated,
) {
  if (instanceObj === undefined) return;

  let selectedLayerTileSize = 512;

  if (Store.current.selectedResult) {
    const selectedDatasourceLayers = Store.current.presets[instanceObj.name];
    let selectedLayer = selectedDatasourceLayers
      ? selectedDatasourceLayers.find(l => l.id === Store.current.selectedResult.preset)
      : undefined;
    selectedLayerTileSize = selectedLayer && selectedLayer.tileSize ? selectedLayer.tileSize : 512;
  }

  const {
    name,
    baseUrls,
    tileSize = selectedLayerTileSize,
    tilematrixSet = 'PopularWebMercator512',
  } = instanceObj;

  const { minZoom, maxZoom: maxNativeZoom, allowOverZoomBy } = getZoomLimitsForSelectedLayer();
  // const maxNativeZoom = maxZoom;

  // when we create compare layer, we will create CLIP layer, otherwise normal wms layer
  let layer =
    pane === 'compareLayer'
      ? L.tileLayer.clip(baseUrls.WMS, {
          showlogo: false,
          tileSize,
          minZoom,
          maxZoom: maxNativeZoom + allowOverZoomBy,
          maxNativeZoom: maxNativeZoom,
          pane,
          name,
        })
      : baseUrls.WMTS
        ? L.tileLayer.wmts(baseUrls.WMTS, {
            showlogo: false,
            style: 'default',
            tileSize,
            minZoom,
            maxZoom: maxNativeZoom + allowOverZoomBy,
            maxNativeZoom: maxNativeZoom,
            pane,
            name,
            tilematrixSet,
          })
        : L.tileLayer.wms(baseUrls.WMS, {
            showlogo: false,
            tileSize,
            maxZoom: maxNativeZoom + allowOverZoomBy,
            maxNativeZoom: maxNativeZoom,
            minZoom,
            pane,
            name,
          });

  layer.on('loading', function() {
    progress.start();
    progress.inc(0.1);
  });

  layer.on('load', function() {
    progress.done();
  });

  if (baseUrls.WMTS) {
    layer.createTile = function(coords, done) {
      const tile = document.createElement('img');
      tile.width = tile.height = this.options.tileSize;
      tile.setAttribute('data', 'retries');
      tile.dataset.retries = 0;
      tile.onload = function() {
        done(null, tile); // Syntax is 'done(error, tile)'
      };

      tile.onerror = function(error) {
        const src = tile.src;
        setTimeout(() => {
          if (tile.dataset.retries < 5) {
            // retry img download if retries below 5
            tile.src = '';
            tile.dataset.retries++;
            tile.src = src;
          }
        }, 1000);

        done(error, tile); // Syntax is 'done(error, tile)'
      };

      tile.src = `${this.getTileUrl(coords)}`;
      return tile;
    };
  } else {
    const sentinelhubLayer = new SentinelHub(baseUrls.WMS, baseUrls.ProcessingApi, recaptchaAuthToken);
    layer.createTile = function(coords, done) {
      const tile = L.DomUtil.create('img', 'leaflet-tile');
      tile.width = this.options.tileSize;
      tile.height = this.options.tileSize;
      const tileSize = tile.width;
      const nwPoint = coords.multiplyBy(tileSize);
      const sePoint = nwPoint.add([tileSize, tileSize]);

      // new API expects bbox to be in CRS84:
      const nw = this._crs.project(this._map.unproject(nwPoint, coords.z));
      const se = this._crs.project(this._map.unproject(sePoint, coords.z));
      const bbox =
        this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326
          ? [se.y, nw.x, nw.y, se.x]
          : [nw.x, se.y, se.x, nw.y];

      sentinelhubLayer
        .getMap({
          ...layerParams,
          showLogo: false,
          width: tileSize,
          height: tileSize,
          bbox: bbox,
          crs: this._crs.code,
        })
        .then(blob => {
          tile.onload = function() {
            URL.revokeObjectURL(tile.src);
            done(null, tile);
          };
          const objectURL = URL.createObjectURL(blob);
          tile.src = objectURL;
        })
        .catch(error => {
          if (error.response && error.response.status === 401) {
            setTokenShouldBeUpdated(true);
          }
          console.log('There has been a problem with your fetch operation: ', error.message);
          done(error, null);
        });

      return tile;
    };
  }

  return layer;
}

const PINS_LC_NAME = 'react-app-pins';

function isValidPinId(id) {
  const idRegex = /^[0-9].*-pin$/i;
  return idRegex.test(id);
}

export function uniquePinId() {
  const uniqueId = uuid();
  return `${uniqueId}-pin`;
}

export function fetchPinsFromServer() {
  getPinsFromServer()
    .then(serverPins => {
      let shouldUpdateOnServer = false;
      // at the same time, merge local pins: (if there are any)
      const localPins = getPinsFromSessionStorage();
      if (localPins.length === 0) {
        return [serverPins, shouldUpdateOnServer];
      }

      shouldUpdateOnServer = true;
      let mergedPins = [...serverPins];
      localPins.forEach(lPin => {
        if (!serverPins.find(sPin => sPin._id === lPin._id)) {
          mergedPins.push(lPin);
        }
      });
      return [mergedPins, shouldUpdateOnServer];
    })
    .then(([mergedPins, shouldUpdateOnServer]) => {
      Store.setPins(mergedPins);
      if (shouldUpdateOnServer) {
        updatePinsOnServer(mergedPins).catch(e => {
          console.error(e);
        });
      }
    })
    .catch(e => {
      if (e) {
        console.error(e);
      }
    });
}

function getPinsFromServer() {
  return new Promise((resolve, reject) => {
    const token = getTokenFromLocalStorage();
    if (!token || isTokenExpired(token)) {
      reject();
      return;
    }
    const url = `${process.env.REACT_APP_BASEURL}userdata/`;
    const requestParams = {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    };
    axios
      .get(url, requestParams)
      .then(res => {
        try {
          const serverPins = res.data.pins;
          resolve(serverPins ? serverPins : []);
        } catch (e) {
          resolve([]);
        }
      })
      .catch(e => {
        if (e && e.response && e.response.status === 404) {
          resolve([]);
          return;
        }
        reject(e);
      });
  });
}

export function updatePins(pins) {
  const token = getTokenFromLocalStorage();
  if (!token || isTokenExpired(token)) {
    return updatePinsInSessionStorage(pins);
  } else {
    return updatePinsOnServer(pins);
  }
}

async function updatePinsInSessionStorage(pins) {
  return await window.sessionStorage.setItem(PINS_LC_NAME, JSON.stringify(pins));
}

export async function updatePinsOnServer(pins) {
  return new Promise((resolve, reject) => {
    // get the original userData, fix it and upload again:
    const token = getTokenFromLocalStorage();
    if (!token || isTokenExpired(token)) {
      reject();
      return;
    }
    const url = `${process.env.REACT_APP_BASEURL}userdata/`;
    const requestParams = {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    };
    axios
      .get(url, requestParams)
      .then(res => res.data)
      .catch(e => {
        // if no user data is found, ignore the error:
        if (e && e.response && e.response.status === 404) {
          return {};
        }
        throw e;
      })
      .then(userData => {
        const newData = cloneDeep(userData);
        newData.pins = pins;
        axios
          .put(url, newData, requestParams)
          .then(() => {
            resolve(pins);
          })
          .catch(e => {
            console.error('Unable to save pins!', e);
            reject(e);
          });
      })
      .catch(e => {
        console.error('Unable to retrieve user data!', e);
        reject(e);
      });
  });
}

export function getPinsFromSessionStorage() {
  let pinsString = window.sessionStorage.getItem(PINS_LC_NAME);
  if (!pinsString) {
    return [];
  }

  const localPins = JSON.parse(pinsString)
    .filter(pin => pin.name || pin.datasource)
    .map((pin, index) => {
      if (pin.properties) {
        // legacy format
        const {
          name,
          properties: {
            rawData: { time },
          },
          map: { latitude, longitude, zoom },
          ...rest
        } = pin;
        return {
          ...rest,
          _id: isValidPinId(pin._id) ? pin._id : uniquePinId(),
          datasource: name,
          lat: latitude,
          lng: longitude,
          zoom,
          time,
        };
      }
      return {
        ...pin,
        opacity: [0, 1],
        _id: isValidPinId(pin._id) ? pin._id : uniquePinId(),
      };
    });
  return localPins;
}

export function b64EncodeUnicode(str) {
  return base64EncArr(strToUTF8Arr(str));
}

export function evalscriptoverridesToString(overridesObj) {
  let encodedOverrides = '';
  if (overridesObj.gainOverride) {
    encodedOverrides += `gainOverride=${overridesObj.gainOverride};`;
  }
  if (overridesObj.gammaOverride) {
    encodedOverrides += `gammaOverride=${overridesObj.gammaOverride};`;
  }

  if (checkIfFisLayer()) {
    if (overridesObj.valueRangeOverride) {
      encodedOverrides += `rangeOverrides=${JSON.stringify([overridesObj.valueRangeOverride])};`;
    }
  } else if (
    overridesObj.redRangeOverride ||
    overridesObj.greenRangeOverride ||
    overridesObj.blueRangeOverride
  ) {
    let rgbRangeOverrides = [[0, 1], [0, 1], [0, 1]];
    if (overridesObj.redRangeOverride) {
      rgbRangeOverrides[0] = overridesObj.redRangeOverride;
    }
    if (overridesObj.greenRangeOverride) {
      rgbRangeOverrides[1] = overridesObj.greenRangeOverride;
    }
    if (overridesObj.blueRangeOverride) {
      rgbRangeOverrides[2] = overridesObj.blueRangeOverride;
    }
    encodedOverrides += `rangeOverrides=${JSON.stringify(rgbRangeOverrides)};`;
  }

  return encodedOverrides;
}

// JUST FOR SENTINEL-2
export function checkIfFisLayer() {
  const isSelectedResult = !!Store.current.selectedResult;
  const isCustomLayer = Store.current.selectedResult && isCustomPreset(Store.current.selectedResult.preset);
  const isShadowLayerAvailable =
    Store.current.selectedResult &&
    !!getFisShadowLayer(Store.current.selectedResult.name, Store.current.selectedResult.preset);
  const isFisAvailableOnDatasource = !!(
    Store.current.selectedResult && Store.current.selectedResult.baseUrls.FIS
  );

  return isSelectedResult && isFisAvailableOnDatasource && (isShadowLayerAvailable || isCustomLayer);
}

export function checkIfKnownValueLayer() {
  // NDVI
  // moisture index
  // NDWI
  //

  return null;
}

export const getFisShadowLayer = (instanceName, originalLayerId) => {
  const { fisShadowLayers } = Store.current;
  if (!fisShadowLayers || !fisShadowLayers[instanceName]) {
    return null;
  }
  return fisShadowLayers[instanceName].find(
    l => l.id === `__FIS_${originalLayerId}` || l.name === `__FIS_${originalLayerId}`,
  );
};

export function userCanAccessLockedFunctionality(user, selectedTheme) {
  if (selectedTheme && selectedTheme.type && selectedTheme.type === 'EDUCATION') {
    return true;
  }

  return !!user;
}

const COMPARE_LAYER_PANE = 'compareLayer';
const ACTIVE_LAYER_PANE = 'activeLayer';

export function getUpdateParams(item) {
  let { selectedResult, presets, compareMode, isEvalUrl } = Store.current;
  let {
    datasource: datasourceName,
    gainOverride,
    gammaOverride,
    redRangeOverride,
    greenRangeOverride,
    blueRangeOverride,
    valueRangeOverride,
    time,
    evalscript,
    evalscripturl,
    atmFilter,
    preset: layerId,
  } =
    item || selectedResult || {};

  // datasource is just a string (name of selected datasource/satellite)
  // we need data of the selected datasource from the presets in Store
  let datasourceLayers = presets[datasourceName];

  // preset is just a string (name of selected layer)
  // item is usually data of the selected layer from config.js (but apparently not always - not when Pins made from Results are being compared)
  // selectedResult is just data of the selected layer from config.js
  // item and selectedResult are basically the same if it's not a custom layer
  // we need data of the selected layer from the presets in Store
  let selectedLayer = datasourceLayers.find(l => l.id === layerId);

  if (!datasourceName) return;
  let obj = {};
  obj.format = selectedLayer && selectedLayer.format ? selectedLayer.format : 'image/png';
  obj.pane = compareMode ? COMPARE_LAYER_PANE : ACTIVE_LAYER_PANE;
  obj.transparent = true;
  obj.maxcc = 100;
  if (datasourceName.includes('EW') && layerId.includes('NON_ORTHO')) {
    obj.orthorectify = false;
  }

  if (isCustomPreset(layerId)) {
    selectedResult && selectedResult.baseUrls.WMTS
      ? (obj.layer = presets[datasourceName][0].id)
      : (obj.layers = presets[datasourceName][0].id);

    evalscripturl && isEvalUrl && (obj.evalscripturl = evalscripturl);
    !isEvalUrl && (obj.evalscript = evalscript);
    obj.evalsource = evalSourcesMap[datasourceName];
    obj.PREVIEW = 3;
  } else {
    selectedResult && selectedResult.baseUrls.WMTS ? (obj.layer = layerId) : (obj.layers = layerId);
  }

  const evalscriptoverridesObj = {
    gainOverride,
    gammaOverride,
    redRangeOverride,
    greenRangeOverride,
    blueRangeOverride,
    valueRangeOverride,
  };
  obj.evalscriptoverrides = b64EncodeUnicode(evalscriptoverridesToString(evalscriptoverridesObj));

  atmFilter && (obj.ATMFILTER = atmFilter === 'null' ? null : atmFilter);

  if (item.baseUrls && item.baseUrls.WMTS) {
    obj.time = `${time}`;
    obj.tilematrixSet = selectedLayer.tilematrixSetName;
    obj.minZoom = selectedLayer.minZoom;
    obj.maxZoom = selectedLayer.maxZoom;
  } else {
    obj.time = isTimeInterval(time) ? time : `${time}/${time}`;
  }
  if (selectedResult && typeof selectedResult.defaultStyle === 'function') {
    obj.styles = selectedResult.defaultStyle(layerId);
  }
  return cloneDeep(obj);
}
