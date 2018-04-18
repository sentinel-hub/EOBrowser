import cloneDeep from 'lodash/cloneDeep';
import values from 'lodash/values';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import URI from 'urijs';
import {
  calcBboxFromXY,
  getPixelSize,
  getNativeRes,
  roundDegrees
} from '../utils/coords';
import { combineEpics } from 'redux-observable';
import { createEpicMiddleware } from 'redux-observable';
import initialState from './config';
import { createStore, applyMiddleware, compose } from 'redux';
import get from 'dlv';
import {
  getMultipliedLayers,
  syncPinsWithLocalStorage,
  b64EncodeUnicode,
  isScriptFromLayers,
  evalSourcesMap,
  isCustomPreset
} from '../utils/utils';

import request from 'axios';
import ClientOAuth2 from 'client-oauth2';
import jwt_dec from 'jwt-decode';

import Terraform from 'terraformer';
import WKT from 'terraformer-wkt-parser';
import L from 'leaflet';
// eslint-disable-next-line
import rxjs from 'rxjs';

const SET_MAXCC = 'SET_MAXCC',
  SET_DATE = 'SET_DATE',
  SET_PREV_DATE = 'SET_PREV_DATE',
  SET_NEXT_DATE = 'SET_NEXT_DATE',
  SET_LOGO = 'SET_LOGO',
  SET_MAP_VIEW = 'SET_MAP_VIEW',
  SET_MIN_DATE = 'SET_MIN_DATE',
  SET_USER_INSTANCES = 'SET_USER_INSTANCES',
  SET_DATASOURCE = 'SET_DATASOURCE',
  SET_DATASOURCES = 'SET_DATASOURCES',
  SET_INSTANCES = 'SET_INSTANCES',
  SET_EVAL_URL = 'SET_EVAL_URL',
  SET_EVAL_MODE = 'SET_EVAL_MODE',
  SET_PRESET = 'SET_PRESET',
  SET_ANALYTICAL = 'SET_ANALYTICAL',
  SET_CURR_VIEW = 'SET_CURR_VIEW',
  SET_CHANNELS = 'SET_CHANNELS',
  SET_LAYERS = 'SET_LAYERS',
  SET_RESOLUTION = 'SET_RESOLUTION',
  SET_PRESETS = 'SET_PRESETS',
  SET_FIS_SHADOW_LAYERS = 'SET_FIS_SHADOW_LAYERS',
  SET_PROBA = 'SET_PROBA',
  SET_USER = 'SET_USER',
  SET_PROBA_LAYERS = 'SET_PROBA_LAYERS',
  SET_MAP_BOUNDS = 'SET_MAP_BOUNDS',
  SET_ATM_FILTER = 'SET_ATM_FILTER',
  SET_AOI_BOUNDS = 'SET_AOI_BOUNDS',
  SET_IS_CLIPPING = 'SET_IS_CLIPPING',
  SET_EVAL_SCRIPT = 'SET_EVAL_SCRIPT',
  SET_AVAILABLE_DAYS = 'SET_AVAILABLE_DAYS',
  SET_START_LOC = 'SET_START_LOC',
  SET_GAIN = 'SET_GAIN',
  SET_GAMMA = 'SET_GAMMA',
  SET_LAT = 'SET_LAT',
  SET_LNG = 'SET_LNG',
  SET_ZOOM = 'SET_ZOOM',
  SET_SIZE = 'SET_SIZE',
  GENERATE_IMAGE_LINK = 'GENERATE_IMAGE_LINK',
  REFRESH = 'REFRESH',
  IS_SEARCHING = 'IS_SEARCHING',
  SET_PATH = 'SET_PATH',
  SET_TAB_INDEX = 'SET_TAB_INDEX',
  SET_SEARCH_RESULTS = 'SET_SEARCH_RESULTS',
  CLEAR_SEARCH_RESULTS = 'CLEAR_SEARCH_RESULTS',
  SET_COMPARE_MODE = 'SET_COMPARE_MODE',
  SET_COMPARE_MODE_TYPE = 'SET_COMPARE_MODE_TYPE',
  SET_FILTER_RESULTS = 'SET_FILTER_RESULTS',
  SET_SELECTED_RESULT = 'SET_SELECTED_RESULT',
  ADD_PIN_RESULT = 'ADD_PIN_RESULT',
  CHANGE_PIN_ORDER = 'CHANGE_PIN_ORDER',
  TOGGLE_ACTIVE_LAYER = 'TOGGLE_ACTIVE_LAYER',
  REMOVE_PIN = 'REMOVE_PIN',
  CLEAR_PINS = 'CLEAR_PINS',
  SET_PIN_OPACITY = 'SET_PIN_OPACITY',
  SHOW_LOGIN = 'SHOW_LOGIN',
  SET_ACTIVE_BASE_LAYER = 'SET_ACTIVE_BASE_LAYER',
  SET_SELECTED_CRS = 'SET_SELECTED_CRS',
  SET_IMAGE_FORMAT = 'SET_IMAGE_FORMAT';

const Reducers = {
  SET_MAP_VIEW: ({ lat, lng, zoom = this.zoom, update }) => ({
    lat,
    lng,
    zoom,
    updatePosition: update
  }),
  SET_DATE: dateTo => ({ dateTo }),
  SET_PREV_DATE: prevDate => ({ prevDate }),
  SET_NEXT_DATE: nextDate => ({ nextDate }),
  SET_MIN_DATE: dateFrom => ({ dateFrom }),
  SET_DATASOURCE: datasource => ({ datasource }),
  SET_DATASOURCES: datasources => ({ datasources }),
  SET_PRESET: setPreset,
  SET_PRESETS: setPresets,
  SET_FIS_SHADOW_LAYERS: setFisShadowLayers,
  SET_CURR_VIEW: setCurrentView,
  SET_EVAL_URL: setEvalUrl,
  SET_EVAL_MODE: isEvalUrl => ({ isEvalUrl }),
  SET_USER_INSTANCES: userInstances => ({ userInstances }),
  SET_MAP_BOUNDS: setBoundsAdSquarePerMeter,
  SET_AVAILABLE_DAYS: availableDays => ({ availableDays }),
  SET_EVAL_SCRIPT: setEvalscript,
  SET_CHANNELS: setChannels,
  SET_START_LOC: startLocation => ({ startLocation }),
  SET_BASE64_URLS: base64Urls => ({ base64Urls }),
  SET_ANALYTICAL: setAnalytical,
  SET_LAYERS: setLayers,
  SET_PROBA: proba => ({ proba }),
  SET_LOGO: showLogo => ({ showLogo }),
  SET_PROBA_LAYERS: probaLayers => ({ probaLayers }),
  SET_LAT: lat => ({ lat }),
  SET_LNG: lng => ({ lng }),
  SET_INSTANCES: instances => ({ instances, mainLoaded: true }),
  SET_RESOLUTION: resolution => ({ resolution }),
  SET_USER: user => ({ user }),
  SET_ZOOM: zoom => ({ zoom }),
  SET_TAB_INDEX: mainTabIndex => ({ mainTabIndex, isActiveLayerVisible: true }),
  SET_SIZE: size => ({ size }),
  SET_COMPARE_MODE: compareMode => ({ compareMode }),
  SET_COMPARE_MODE_TYPE: compareModeType => ({ compareModeType }),
  SET_CURRENT_DATE: currentDate => ({ currentDate }),
  TOGGLE_ACTIVE_LAYER: isActiveLayerVisible => ({ isActiveLayerVisible }),
  SET_AOI_BOUNDS: aoiBounds => ({ aoiBounds }),
  SET_IS_CLIPPING: isAoiClip => ({ isAoiClip }),
  GENERATE_IMAGE_LINK: generateImageLink,
  SET_PATH: updatePath,
  ADD_PIN_RESULT: addPinResult,
  CHANGE_PIN_ORDER: changePinOrder,
  SET_CLOUDCOR: setCloudCor,
  SET_GAIN: setGain,
  SET_GAMMA: setGamma,
  SET_ATM_FILTER: setAtmFilter,
  REMOVE_PIN: removePin,
  CLEAR_PINS: clearPins,
  SET_PIN_OPACITY: setPinOpacity,
  REFRESH: doRefresh => ({ doRefresh }),
  SET_ACTIVE_BASE_LAYER: setActiveBaseLayer,
  SET_SELECTED_CRS: selectedCrs => ({ selectedCrs }),
  SET_IMAGE_FORMAT: ({ imageFormat, imageExt }) => ({ imageFormat, imageExt }),
  IS_SEARCHING: isSearching => ({ isSearching }),
  SHOW_LOGIN: showLogin => ({ showLogin }),
  SET_FILTER_RESULTS: searchFilterResults => ({ searchFilterResults }),
  SET_SELECTED_RESULT: setSelectedResult,
  SET_SEARCH_RESULTS: setSearchResults,
  CLEAR_SEARCH_RESULTS: clearSearchResults
};

const DoesNeedRefresh = [
  SET_PRESET,
  SET_LAYERS,
  SET_PROBA,
  SET_SELECTED_RESULT,
  SET_GAIN,
  SET_GAMMA,
  REFRESH,
  SET_ATM_FILTER
];
const DoRefreshUrl = [
  REFRESH,
  SET_LAT,
  SET_LNG,
  SET_ZOOM,
  SET_DATE,
  SET_PRESET,
  SET_LAYERS,
  SET_MAP_VIEW,
  SET_TAB_INDEX,
  SET_SELECTED_RESULT,
  SET_GAIN,
  SET_GAMMA,
  SET_ATM_FILTER
];

function setChannels(datasource, channels) {
  return {
    channels: merge(this.channels, { [datasource]: channels })
  };
}

function setAnalytical(isAnalytical) {
  return {
    imageFormat: isAnalytical ? this.imageFormat : this.imageFormats[0].value,
    imageExt: isAnalytical ? this.imageExt : this.imageFormats[0].ext,
    isAnalytical
  };
}

function setPresets(datasource, presets) {
  return {
    presets: merge(this.presets, { [datasource]: presets })
  };
}
function setFisShadowLayers(datasource, fisShadowLayers) {
  return {
    fisShadowLayers: merge(this.fisShadowLayers, { [datasource]: fisShadowLayers })
  };
}
function setCurrentView(currView) {
  return {
    currView
  };
}
function setSelectedResult(result) {
  if (result === null) {
    return { selectedResult: null };
  }
  const {
    datasource,
    layers,
    evalscripturl,
    evalscript,
    preset: defaultPreset
  } = result;
  const instance = this.instances.find(inst => inst.name === datasource) || {};
  const preset = defaultPreset || this.presets[datasource][0].id;
  let startLayers = null;
  if (this.channels[datasource]) {
    startLayers = {
      r: datasource.includes('Sentinel-1')
        ? this.channels[datasource][0].name
        : this.channels[datasource][0].name,
      g: datasource.includes('Sentinel-1')
        ? this.channels[datasource][0].name
        : this.channels[datasource][1].name,
      b: datasource.includes('Sentinel-1')
        ? this.channels[datasource][0].name
        : this.channels[datasource][2].name
    };
  }
  const layersObj = layers && preset === 'CUSTOM' ? layers : startLayers;
  const defaultEvalscript = b64EncodeUnicode(
    'return [' + getMultipliedLayers(layersObj) + '];'
  );
  const selectedResult = {
    ...instance,
    preset,

    evalscripturl,
    ...result,
    evalscript:
      !evalscript || evalscript === '' ? defaultEvalscript : evalscript,
    layers: layersObj,
    typename: instance.typename
  };
  const currView = getCurrView(layers, evalscript);
  return {
    selectedResult,
    currView
  };
}
function getCurrView(layers, evalscript) {
  if (evalscript) {
    if (!layers) {
      return '3';
    }
    if (
      evalscript !==
      b64EncodeUnicode('return [' + getMultipliedLayers(layers) + '];')
    ) {
      return '3';
    }
  }
  return '2';
}
function setPreset(preset) {
  const isCustom = preset === 'CUSTOM';
  const { layers, evalscript } = this.selectedResult || {};
  const isESFromLayers =
    b64EncodeUnicode('return [' + getMultipliedLayers(layers) + '];') ===
    evalscript;
  const currView = isCustom
    ? isESFromLayers ? this.views.BANDS : this.views.SCRIPT
    : this.views.PRESETS;
  return {
    currView,
    selectedResult: { ...this.selectedResult, preset }
  };
}
function setEvalUrl(evalscripturl) {
  return {
    selectedResult: { ...this.selectedResult, evalscripturl },
    currView: this.views.SCRIPT
  };
}
function setEvalscript(evalscript) {
  return {
    selectedResult: { ...this.selectedResult, evalscript },
    currView: this.views.SCRIPT
  };
}
function setLayers(layers) {
  const evalscript = b64EncodeUnicode(
    'return [' + getMultipliedLayers(layers) + '];'
  );
  return { selectedResult: { ...this.selectedResult, evalscript, layers } };
}

function setCloudCor(cloudCor) {
  return { selectedResult: { ...this.selectedResult, cloudCor } };
}
function setGain(gain) {
  return { selectedResult: { ...this.selectedResult, gain } };
}
function setGamma(gamma) {
  return { selectedResult: { ...this.selectedResult, gamma } };
}
function setAtmFilter(atmFilter) {
  return { selectedResult: { ...this.selectedResult, atmFilter } };
}

function changePinOrder(oldIndex, newIndex) {
  const oldPin = this.pinResults[oldIndex];
  const pins = this.pinResults;
  const nextState = pins.slice();
  nextState.splice(oldIndex, 1);
  nextState.splice(newIndex, 0, oldPin);
  syncPinsWithLocalStorage(nextState);
  return {
    pinResults: nextState
  };
}
function addPinResult(item) {
  const { lat, lng, zoom = 10 } = this;
  let pinItem = { lat, lng, zoom, ...item };
  let pinResults = [pinItem, ...this.pinResults].map(pin => {
    return { ...pin, opacity: 1 };
  });
  syncPinsWithLocalStorage(pinResults);
  return {
    pinResults
  };
}
function removePin(index) {
  let result = this.pinResults.filter((obj, i) => i !== index);
  syncPinsWithLocalStorage(result);

  return {
    pinResults: result
  };
}
function clearPins() {
  let result = [];

  syncPinsWithLocalStorage(result);

  return {
    pinResults: result
  };
}
function setPinOpacity(index, value) {
  return {
    pinResults: this.pinResults.map((pin, i) => {
      if (index !== i) {
        return pin;
      }
      return {
        ...pin,
        opacity: value
      };
    })
  };
}
function setBoundsAdSquarePerMeter(bounds, pixelBounds) {
  const equatorLength = 40075016.685578488;
  const unitsToMetersRatio =
    360 / (equatorLength * Math.cos(this.lat * Math.PI / 180));
  const bboxH = bounds._northEast.lat - bounds._southWest.lat;
  const bboxW = bounds._northEast.lng - bounds._southWest.lng;
  const res = getNativeRes();
  const imageWidth = bboxW / (unitsToMetersRatio * res);
  const imageHeight = bboxH / (unitsToMetersRatio * res);
  const mapGeometry = createPolygonFromBounds(bounds);
  return {
    mapBounds: bounds,
    mapGeometry,
    squaresPerMtr: [Math.ceil(imageWidth), Math.ceil(imageHeight)]
  };
}

function updatePath() {
  if (!this.mainLoaded) return;
  const {
    lat,
    lng,
    zoom,
    selectedResult,
    isActiveLayerVisible,
    isEvalUrl,
    mainTabIndex
  } = this;
  let params = [];
  params.push(`lat=${roundDegrees(lat, zoom)}`);
  params.push(`lng=${roundDegrees(lng, zoom)}`);
  params.push(`zoom=${zoom}`);

  if (!isEmpty(selectedResult) && isActiveLayerVisible && mainTabIndex === 2) {
    const {
      datasource,
      gain,
      gamma,
      atmFilter,
      time,
      evalscript,
      evalscripturl,
      layers,
      preset,
      activeLayer
    } = selectedResult;
    params.push(`time=${time}`);
    params.push(`preset=${preset}`);
    gain && params.push(`gain=${gain}`);
    gamma && params.push(`gamma=${gamma}`);
    atmFilter && params.push(`atmFilter=${atmFilter}`);
    const instanceId = get(activeLayer, '@id');
    if (instanceId) {
      params.push(`instanceId=${window.encodeURIComponent(instanceId)}`);
    } else {
      params.push(`datasource=${window.encodeURIComponent(datasource)}`);
    }
    if (selectedResult.preset === 'CUSTOM') {
      const evalUrl = evalscripturl;
      params.push(`layers=${values(layers).join(',')}`);
      params.push(`evalscript=${window.encodeURIComponent(evalscript)}`);
      evalUrl !== '' && isEvalUrl && params.push(`evalscripturl=${evalUrl}`);
    }
  }

  const path = params.join('&');
  window.location.hash = path;
  return { path };
}

function setActiveBaseLayer(name, minmax) {
  return {
    activeBaseLayer: {
      name: name,
      minmax: { min: minmax.min, max: minmax.max }
    }
  };
}

function setSearchResults(results, datasource, returnParams) {
  return {
    isSearching: false,
    searchResults: { ...this.searchResults, [datasource]: results },
    searchParams: { ...this.searchParams, [datasource]: returnParams }
  };
}

function clearSearchResults() {
  return {
    isSearching: false,
    searchResults: {},
    searchParams: {}
  };
}

function generateImageLink() {
  const {
    selectedResult: {
      datasource,
      preset,
      evalscript,
      evalscripturl,
      gain,
      gamma,
      atmFilter,
      layers,
      time
    },
    showLogo,
    instances,
    imageExt,
    isAnalytical,
    isEvalUrl,
    resolution,
    imageFormat,
    aoiBounds
  } = this;
  const isJp2 = imageFormat.includes('jp2');
  const isKMZ = imageFormat.includes('application');
  const activeLayer = instances.find(inst => inst.name === datasource);
  const isPngJpg = ['jpg', 'png'].includes(imageExt);
  const { width: imageW, height: imageH } = getPixelSize();
  const isScript = !isScriptFromLayers(evalscript, layers);
  const url = new URI(`${activeLayer.baseUrl}?SERVICE=WMS&REQUEST=GetMap`);

  // build url
  url.addQuery('SHOWLOGO', showLogo && !isPngJpg);
  url.addQuery('MAXCC', 100);
  url.addQuery('TIME', `${time}/${time}`);
  url.addQuery('CRS', this.selectedCrs);
  url.addQuery(
    'FORMAT',
    imageFormat.includes('jpg') ? 'image/jpeg' : imageFormat
  );

  if (aoiBounds) {
    if (this.selectedCrs === 'EPSG:4326') {
      const wgsCoords = {
        geometry: {
          type: 'Polygon',
          coordinates: [
            aoiBounds.geometry.coordinates[0].map(coord => [coord[1], coord[0]])
          ]
        }
      };
      const wgsGeom = new Terraform.Primitive(cloneDeep(wgsCoords.geometry));
      url.addQuery('GEOMETRY', WKT.convert(wgsGeom));
    } else {
      const mercGeom = new Terraform.Primitive(
        cloneDeep(aoiBounds.geometry)
      ).toMercator();
      url.addQuery('GEOMETRY', WKT.convert(mercGeom));
    }
    const mercGeom = new Terraform.Primitive(
      cloneDeep(aoiBounds.geometry)
    ).toMercator();
    url.addQuery('GEOMETRY', WKT.convert(mercGeom));
  } else {
    url.addQuery('BBOX', getBbox(this));
  }
  gain && url.addQuery('gain', gain);
  atmFilter && atmFilter !== 'null' && url.addQuery('ATMFILTER', atmFilter);
  gamma && url.addQuery('gamma', gamma);

  if (isCustomPreset(preset)) {
    url.addQuery('EVALSCRIPT', evalscript);
    evalscripturl !== '' &&
      isEvalUrl &&
      url.addQuery('EVALSCRIPTURL', evalscripturl);

    isScript && url.addQuery('EVALSCRIPT', evalscript);
    evalscripturl !== '' && isEvalUrl && url.addQuery('EVALSCRIPT', evalscript);
    url.addQuery('EVALSOURCE', evalSourcesMap[datasource]);
  }
  url.addQuery(
    'LAYERS',
    preset === 'CUSTOM' ? this.presets[datasource][0].id : preset
  );

  if (datasource.includes('EW') && preset.includes('NON_ORTHO')) {
    url.addQuery('ORTHORECTIFY', false);
  }
  const imageSizeW = isAnalytical
    ? Math.round(imageW / resolution)
    : aoiBounds ? imageW : this.size[0];
  const imageSizeH = isAnalytical
    ? Math.round(imageH / resolution)
    : aoiBounds ? imageH : this.size[1];
  url.addQuery('WIDTH', imageSizeW);
  url.addQuery('HEIGHT', imageSizeH);
  if (isPngJpg || isKMZ) {
    url.addQuery(
      'NICENAME',
      `${datasource} from ${time}.${isKMZ ? 'kmz' : imageExt}`
    );
    url.addQuery('TRANSPARENT', imageFormat.includes('png') ? 0 : 1);
    url.addQuery('BGCOLOR', '00000000');
    // const browserUrl = url
    //   .toString()
    //   .replace(/%2f/gi, '/')
    //   .replace(/%2c/gi, ',');
    // return {
    //   imgWmsUrl: browserUrl,
    //   imageW: imageSizeW,
    //   imageH: imageSizeH
    // };
  } else {
    url.addQuery(
      'NICENAME',
      `${datasource} from ${time}.${isJp2 ? 'jp2' : 'tiff'}`
    );
    url.addQuery(
      'COVERAGE',
      preset[datasource] === 'CUSTOM'
        ? values(layers[datasource]).join(',')
        : preset[datasource]
    );
  }
  const finalUrl = url
    .toString()
    .replace(/%2f/gi, '/')
    .replace(/%2c/gi, ',');
  return {
    imgWmsUrl: finalUrl,
    imageW: imageSizeW,
    imageH: imageSizeH
  };
}

function createPolygonFromBounds(latLngBounds) {
  const center = latLngBounds.getCenter(),
    latlngs = [];

  latlngs.push(latLngBounds.getSouthWest()); //bottom left
  latlngs.push({ lat: latLngBounds.getSouth(), lng: center.lng }); //bottom center
  latlngs.push(latLngBounds.getSouthEast()); //bottom right
  latlngs.push({ lat: center.lat, lng: latLngBounds.getEast() }); // center right
  latlngs.push(latLngBounds.getNorthEast()); //top right
  latlngs.push({
    lat: latLngBounds.getNorth(),
    lng: latLngBounds.getCenter().lng
  }); //top center
  latlngs.push(latLngBounds.getNorthWest()); //top left
  latlngs.push({
    lat: latLngBounds.getCenter().lat,
    lng: latLngBounds.getWest()
  }); //center left

  return new L.polygon(latlngs).toGeoJSON();
}

function getBbox(store) {
  const { mapBounds, selectedCrs, lat, lng, zoom, resolution: factor } = store;
  const bbox =
    selectedCrs === 'EPSG:4326'
      ? mapBounds
          .toBBoxString()
          .split(',')
          .reverse()
          .join(',')
      : calcBboxFromXY({ lat, lng, zoom, factor }).join(',');
  return bbox;
}

function mustRefresh(actions) {
  // NOTE: even though rxjs documentation says to use .debounce,
  // you are actually supposed to use debounceTime
  return actions
    .filter(action => DoesNeedRefresh.includes(action.type))
    .debounceTime(600)
    .mapTo({ type: REFRESH, args: [] });
}
function refreshPath(actions) {
  return actions
    .filter(action => DoRefreshUrl.includes(action.type))
    .debounceTime(1500)
    .mapTo({ type: SET_PATH, args: [] });
}

function reducer(currentState, action) {
  if (Reducers[action.type]) {
    return Object.assign(
      {},
      currentState,
      Reducers[action.type].call(currentState, ...action.args),
      { action }
    );
  }
  return currentState; // DO NOTHING IF NO MATCH
}

const store = createStore(
  reducer,
  initialState,
  compose(
    applyMiddleware(
      createEpicMiddleware(combineEpics(mustRefresh, refreshPath))
    ),
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )
);

if (window.devToolsExtension) {
  window.devToolsExtension.updateStore(store);
}

function action(x) {
  return (...args) => {
    store.dispatch({ type: x, args });
  };
}


const selectedConfig = {
  cliendId: process.env.REACT_APP_CLIENTID,
  redirect: process.env.REACT_APP_REDIRECT,
  baseUrl: process.env.REACT_APP_BASEURL
};
const callbackUrl = selectedConfig.redirect;
const baseOauthURL = selectedConfig.baseUrl;

const LC_NAME = 'eobrowser_oauth';
let token = null;
let user = null;
const oauth = new ClientOAuth2({
  clientId: selectedConfig.cliendId,
  accessTokenUri: baseOauthURL + 'oauth/token',
  authorizationUri: baseOauthURL + 'oauth/auth',
  redirectUri: `${callbackUrl}oauthCallback.html`
});

function getTokenFromLC(throwErrors = false) {
  let localToken = localStorage.getItem(LC_NAME);
  if (localToken) {
    localToken = JSON.parse(localToken);
    const now = new Date().valueOf();
    const expiration = parseInt(localToken['expires_in'], 10);
    const domain = localToken['domain'];
    if (expiration > now && domain === window.location.pathname) {
      token = localToken;
      user = jwt_dec(localToken['id_token']);
      return true;
    } else if (throwErrors) {
      throw new Error('Token expired');
    }
  } else if (throwErrors) {
    throw new Error('Token not found');
  }
}

function assureLoggedIn() {
  if (isTokenExpired()) {
    // must get new token, open OAuth callback and wait for resolution
    return new Promise((resolve, reject) => {
      window.authorizationCallback = { resolve, reject };
      window.open(oauth.token.getUri(), 'popupWindow', 'width=800,height=600');
    }).then(() => {
      getTokenFromLC(true);
      return { user, token };
    });
  } else {
    // token is fine, we are still logged in
    return Promise.resolve({ user, token });
  }
}

function logout() {
  return new Promise((resolve, reject) => {
    request
      .get(baseOauthURL + 'oauth/logout', {
        withCredentials: true
      })
      .then(res => {
        localStorage.removeItem(LC_NAME);
        token = null;
        user = null;
        resolve();
      })
      .catch(e => reject());
  });
}

function isTokenExpired() {
  const now = new Date().valueOf();
  return now > (token ? token['expires_in'] : 0);
}

export default {
  get current() {
    return store.getState();
  },
  get Store() {
    return store;
  },
  get getConfig() {
    return selectedConfig;
  },

  doLogin() {
    return assureLoggedIn();
  },
  doLogout() {
    return logout();
  },
  getTokenFromLC() {
    return getTokenFromLC();
  },

  setMaxcc: action(SET_MAXCC),
  setDate: action(SET_DATE),
  nextDate: action(SET_NEXT_DATE),
  prevDate: action(SET_PREV_DATE),
  setDateFrom: action(SET_MIN_DATE),
  setDatasource: action(SET_DATASOURCE),
  setDatasources: action(SET_DATASOURCES),
  setAvailableDates: action(SET_AVAILABLE_DAYS),
  setIsClipping: action(SET_IS_CLIPPING),
  setCurrentView: action(SET_CURR_VIEW),
  setChannels: action(SET_CHANNELS),
  setMapBounds: action(SET_MAP_BOUNDS),
  setLat: action(SET_LAT),
  setLng: action(SET_LNG),
  setZoom: action(SET_ZOOM),
  setSize: action(SET_SIZE),
  setTabIndex: action(SET_TAB_INDEX),
  toggleActiveLayer: action(TOGGLE_ACTIVE_LAYER),
  generateImageLink: action(GENERATE_IMAGE_LINK),
  setActiveBaseLayer: action(SET_ACTIVE_BASE_LAYER),
  setProbaParams: action(SET_PROBA),
  setProbaLayers: action(SET_PROBA_LAYERS),
  setSearchingIsOn: action(IS_SEARCHING),
  setSearchResults: action(SET_SEARCH_RESULTS),
  clearSearchResults: action(CLEAR_SEARCH_RESULTS),
  setInstances: action(SET_INSTANCES),
  setLayers: action(SET_LAYERS),
  setStartLocation: action(SET_START_LOC),
  setFilterResults: action(SET_FILTER_RESULTS),
  setCompareMode: action(SET_COMPARE_MODE),
  setCompareModeType: action(SET_COMPARE_MODE_TYPE),
  clearPins: action(CLEAR_PINS),
  removePin: action(REMOVE_PIN),
  setPinOpacity: action(SET_PIN_OPACITY),
  addPinResult: action(ADD_PIN_RESULT),
  changePinOrder: action(CHANGE_PIN_ORDER),
  showLogin: action(SHOW_LOGIN),
  setUser: action(SET_USER),
  setSelectedCrs: action(SET_SELECTED_CRS),
  setImageFormat: action(SET_IMAGE_FORMAT),
  setAOIBounds: action(SET_AOI_BOUNDS),
  setLogo: action(SET_LOGO),
  setMapView: action(SET_MAP_VIEW),
  setUserInstances: action(SET_USER_INSTANCES),

  // tile specific methods
  setPreset: action(SET_PRESET),
  setPresets: action(SET_PRESETS),
  setFISShadowLayers: action(SET_FIS_SHADOW_LAYERS),
  setEvalScript: action(SET_EVAL_SCRIPT),
  refresh: action(REFRESH),
  setSelectedResult: action(SET_SELECTED_RESULT),
  setResolution: action(SET_RESOLUTION),
  setAtmFilter: action(SET_ATM_FILTER),
  setGain: action(SET_GAIN),
  setEvalMode: action(SET_EVAL_MODE),
  setEvalUrl: action(SET_EVAL_URL),
  setAnalytical: action(SET_ANALYTICAL),
  setGamma: action(SET_GAMMA)
};
