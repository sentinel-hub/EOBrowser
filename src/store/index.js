import values from 'lodash/values';
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';
import { getNativeRes, roundDegrees } from '../utils/coords';
import { combineEpics } from 'redux-observable';
import { createEpicMiddleware } from 'redux-observable';
import initialState from './config';
import { createStore, applyMiddleware, compose } from 'redux';
import get from 'dlv';
import { getMultipliedLayers, b64EncodeUnicode, updatePins } from '../utils/utils';

import L from 'leaflet';
// eslint-disable-next-line
import rxjs from 'rxjs';

const SET_MAXCC = 'SET_MAXCC',
  SET_DATE = 'SET_DATE',
  SET_PREV_DATE = 'SET_PREV_DATE',
  SET_NEXT_DATE = 'SET_NEXT_DATE',
  SET_MAP_VIEW = 'SET_MAP_VIEW',
  SET_MIN_DATE = 'SET_MIN_DATE',
  SET_USER_INSTANCES = 'SET_USER_INSTANCES',
  SET_DATASOURCE = 'SET_DATASOURCE',
  SET_DATASOURCES = 'SET_DATASOURCES',
  SET_INSTANCES = 'SET_INSTANCES',
  SET_EVAL_URL = 'SET_EVAL_URL',
  SET_EVAL_MODE = 'SET_EVAL_MODE',
  SET_PRESET = 'SET_PRESET',
  SET_CURR_VIEW = 'SET_CURR_VIEW',
  SET_CHANNELS = 'SET_CHANNELS',
  SET_LAYERS = 'SET_LAYERS',
  SET_PRESETS = 'SET_PRESETS',
  SET_FIS_SHADOW_LAYERS = 'SET_FIS_SHADOW_LAYERS',
  SET_CLOUD_COVERAGE_LAYERS = 'SET_CLOUD_COVERAGE_LAYERS',
  SET_USER = 'SET_USER',
  SET_MAP_BOUNDS = 'SET_MAP_BOUNDS',
  SET_MAP_MAX_BOUNDS = 'SET_MAP_MAX_BOUNDS',
  SET_ATM_FILTER = 'SET_ATM_FILTER',
  SET_AOI_BOUNDS = 'SET_AOI_BOUNDS',
  SET_POI = 'SET_POI',
  SET_IS_CLIPPING = 'SET_IS_CLIPPING',
  SET_EVAL_SCRIPT = 'SET_EVAL_SCRIPT',
  SET_START_LOC = 'SET_START_LOC',
  SET_GAIN_OVERRIDE = 'SET_GAIN_OVERRIDE',
  SET_GAMMA_OVERRIDE = 'SET_GAMMA_OVERRIDE',
  SET_RED_RANGE_OVERRIDE = 'SET_RED_RANGE_OVERRIDE',
  SET_GREEN_RANGE_OVERRIDE = 'SET_GREEN_RANGE_OVERRIDE',
  SET_BLUE_RANGE_OVERRIDE = 'SET_BLUE_RANGE_OVERRIDE',
  SET_VALUE_RANGE_OVERRIDE = 'SET_VALUE_RANGE_OVERRIDE',
  SET_LAT = 'SET_LAT',
  SET_LNG = 'SET_LNG',
  SET_ZOOM = 'SET_ZOOM',
  REFRESH = 'REFRESH',
  SET_PATH = 'SET_PATH',
  SET_TAB_INDEX = 'SET_TAB_INDEX',
  SET_SEARCH_RESULTS = 'SET_SEARCH_RESULTS',
  CLEAR_SEARCH_RESULTS = 'CLEAR_SEARCH_RESULTS',
  SET_COMPARE_MODE = 'SET_COMPARE_MODE',
  SET_COMPARE_MODE_TYPE = 'SET_COMPARE_MODE_TYPE',
  SET_FILTER_RESULTS = 'SET_FILTER_RESULTS',
  SET_SELECTED_RESULT = 'SET_SELECTED_RESULT',
  ADD_MODAL_DIALOG = 'ADD_MODAL_DIALOG',
  REMOVE_MODAL_DIALOG = 'REMOVE_MODAL_DIALOG',
  SET_THEMES_URL = 'SET_THEMES_URL',
  SET_PINS = 'SET_PINS',
  SET_THEME_PINS = 'SET_THEME_PINS',
  SET_SELECTED_THEME = 'SET_SELECTED_THEME',
  SET_MODE = 'SET_MODE',
  ADD_PINS = 'ADD_PINS',
  CHANGE_PIN_ORDER = 'CHANGE_PIN_ORDER',
  TOGGLE_ACTIVE_LAYER = 'TOGGLE_ACTIVE_LAYER',
  REMOVE_PIN = 'REMOVE_PIN',
  CLEAR_PINS = 'CLEAR_PINS',
  SET_PIN_PROPERTY = 'SET_PIN_PROPERTY',
  SHOW_LOGIN = 'SHOW_LOGIN',
  SET_ACTIVE_BASE_LAYER = 'SET_ACTIVE_BASE_LAYER',
  SET_RECAPTCHA_AUTH_TOKEN = 'SET_RECAPTCHA_AUTH_TOKEN';

const Reducers = {
  SET_MAP_VIEW: setMapView,
  SET_DATE: dateTo => ({ dateTo }),
  SET_PREV_DATE: prevDate => ({ prevDate }),
  SET_NEXT_DATE: nextDate => ({ nextDate }),
  SET_MIN_DATE: dateFrom => ({ dateFrom }),
  SET_DATASOURCE: datasource => ({ datasource }),
  SET_DATASOURCES: datasources => ({ datasources }),
  SET_PRESET: setPreset,
  SET_PRESETS: setPresets,
  SET_FIS_SHADOW_LAYERS: setFisShadowLayers,
  SET_CLOUD_COVERAGE_LAYERS: setCloudCoverageLayer,
  SET_CURR_VIEW: setCurrentView,
  SET_EVAL_URL: setEvalUrl,
  SET_EVAL_MODE: isEvalUrl => ({ isEvalUrl }),
  SET_USER_INSTANCES: userInstances => ({ userInstances }),
  SET_MAP_BOUNDS: setBoundsAdSquarePerMeter,
  SET_MAP_MAX_BOUNDS: setMapMaxBounds,
  SET_EVAL_SCRIPT: setEvalscript,
  SET_CHANNELS: setChannels,
  SET_START_LOC: startLocation => ({ startLocation }),
  SET_BASE64_URLS: base64Urls => ({ base64Urls }),
  SET_LAYERS: setLayers,
  SET_LAT: lat => ({ lat }),
  SET_LNG: lng => ({ lng }),
  SET_INSTANCES: instances => ({ instances, allGetCapabilitiesLoaded: true }),
  SET_USER: user => ({ user }),
  SET_ZOOM: zoom => ({ zoom }),
  SET_TAB_INDEX: mainTabIndex => ({ mainTabIndex, isActiveLayerVisible: true }),
  SET_COMPARE_MODE: compareMode => ({ compareMode }),
  SET_COMPARE_MODE_TYPE: compareModeType => ({ compareModeType }),
  SET_CURRENT_DATE: currentDate => ({ currentDate }),
  TOGGLE_ACTIVE_LAYER: isActiveLayerVisible => ({ isActiveLayerVisible }),
  SET_AOI_BOUNDS: aoiBounds => ({ aoiBounds }),
  SET_POI: poi => ({ poi }),
  SET_IS_CLIPPING: isAoiClip => ({ isAoiClip }),
  SET_PATH: updatePath,
  ADD_MODAL_DIALOG: addModalDialog,
  REMOVE_MODAL_DIALOG: removeModalDialog,
  SET_THEMES_URL: themesUrl => ({ themesUrl }),
  SET_PINS: userPins => ({ userPins }),
  SET_THEME_PINS: setThemePins,
  SET_SELECTED_THEME: setSelectedTheme,
  SET_MODE: setMode,
  ADD_PINS: addPins,
  CHANGE_PIN_ORDER: changePinOrder,
  SET_CLOUDCOR: setCloudCor,
  SET_GAIN_OVERRIDE: setGainOverride,
  SET_GAMMA_OVERRIDE: setGammaOverride,
  SET_RED_RANGE_OVERRIDE: setRedRangeOverride,
  SET_GREEN_RANGE_OVERRIDE: setGreenRangeOverride,
  SET_BLUE_RANGE_OVERRIDE: setBlueRangeOverride,
  SET_VALUE_RANGE_OVERRIDE: setValueRangeOverride,

  SET_ATM_FILTER: setAtmFilter,
  REMOVE_PIN: removePin,
  CLEAR_PINS: clearPins,
  SET_PIN_PROPERTY: setPinProperty,
  REFRESH: doRefresh => ({ doRefresh }),
  SET_ACTIVE_BASE_LAYER: setActiveBaseLayer,
  SHOW_LOGIN: showLogin => ({ showLogin }),
  SET_FILTER_RESULTS: searchFilterResults => ({ searchFilterResults }),
  SET_SELECTED_RESULT: setSelectedResult,
  SET_SEARCH_RESULTS: setSearchResults,
  CLEAR_SEARCH_RESULTS: clearSearchResults,

  SET_RECAPTCHA_AUTH_TOKEN: recaptchaAuthToken => ({ recaptchaAuthToken }),
};

const DoesNeedRefresh = [
  SET_PRESET,
  SET_LAYERS,
  SET_SELECTED_RESULT,
  SET_GAIN_OVERRIDE,
  SET_GAMMA_OVERRIDE,
  SET_RED_RANGE_OVERRIDE,
  SET_GREEN_RANGE_OVERRIDE,
  SET_BLUE_RANGE_OVERRIDE,
  SET_VALUE_RANGE_OVERRIDE,
  REFRESH,
  SET_ATM_FILTER,
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
  SET_GAIN_OVERRIDE,
  SET_GAMMA_OVERRIDE,
  SET_RED_RANGE_OVERRIDE,
  SET_GREEN_RANGE_OVERRIDE,
  SET_BLUE_RANGE_OVERRIDE,
  SET_VALUE_RANGE_OVERRIDE,
  SET_ATM_FILTER,
];

function setMapView({ lat, lng, zoom = undefined, update }) {
  let result = {
    lat: lat,
    lng: lng,
    updatePosition: update,
  };
  if (zoom) {
    result.zoom = zoom;
  }
  return result;
}

function setChannels(datasource, channels) {
  return {
    channels: merge(this.channels, { [datasource]: channels }),
  };
}

function setPresets(datasource, presets) {
  return {
    presets: {
      ...this.presets,
      ...{
        [datasource]: presets,
      },
    },
  };
}
function setFisShadowLayers(datasource, fisShadowLayers) {
  return {
    fisShadowLayers: merge(this.fisShadowLayers, {
      [datasource]: fisShadowLayers,
    }),
  };
}
function setCloudCoverageLayer(datasource, cloudCoverageLayers) {
  return {
    cloudCoverageLayers: merge(this.cloudCoverageLayers, {
      [datasource]: cloudCoverageLayers,
    }),
  };
}
function setCurrentView(currView) {
  return {
    currView,
  };
}
function setSelectedResult(result) {
  if (result === null) {
    return { selectedResult: null };
  }
  const { datasource, layers, evalscripturl, evalscript, preset: defaultPreset } = result;

  const instance = this.instances.find(inst => inst.name === datasource) || {};
  const preset = defaultPreset || this.presets[datasource][0].id;
  let startLayers = null;
  if (this.channels[datasource] && this.channels[datasource].length > 0) {
    startLayers = {
      r: this.channels[datasource][0].name,
      g:
        this.channels[datasource].length < 3
          ? this.channels[datasource][0].name
          : this.channels[datasource][1].name,
      b:
        this.channels[datasource].length < 3
          ? this.channels[datasource][0].name
          : this.channels[datasource][2].name,
    };
  }
  const layersObj = layers && preset === 'CUSTOM' ? layers : startLayers;
  const defaultEvalscript = b64EncodeUnicode('return [' + getMultipliedLayers(layersObj) + '];');
  const selectedResult = {
    ...instance,
    preset,
    evalscripturl,
    ...result,
    evalscript: !evalscript || evalscript === '' ? defaultEvalscript : evalscript,
    layers: layersObj,
    typename: instance.typename,
  };
  const currView = getCurrView(layers, evalscript);
  return {
    selectedResult,
    currView,
  };
}
function getCurrView(layers, evalscript) {
  if (evalscript) {
    if (!layers) {
      return '3';
    }
    if (evalscript !== b64EncodeUnicode('return [' + getMultipliedLayers(layers) + '];')) {
      return '3';
    }
  }
  return '2';
}
function setPreset(preset) {
  const isCustom = preset === 'CUSTOM';
  const { layers, evalscript } = this.selectedResult || {};
  const isESFromLayers = b64EncodeUnicode('return [' + getMultipliedLayers(layers) + '];') === evalscript;
  const currView = isCustom ? (isESFromLayers ? this.views.BANDS : this.views.SCRIPT) : this.views.PRESETS;
  return {
    currView,
    selectedResult: { ...this.selectedResult, preset },
  };
}
function setEvalUrl(evalscripturl) {
  return {
    selectedResult: { ...this.selectedResult, evalscripturl },
    currView: this.views.SCRIPT,
  };
}
function setEvalscript(evalscript) {
  return {
    selectedResult: { ...this.selectedResult, evalscript },
    currView: this.views.SCRIPT,
  };
}
function setLayers(layers) {
  const evalscript = b64EncodeUnicode('return [' + getMultipliedLayers(layers) + '];');
  return { selectedResult: { ...this.selectedResult, evalscript, layers } };
}

function setCloudCor(cloudCor) {
  return { selectedResult: { ...this.selectedResult, cloudCor } };
}

function setGainOverride(gainOverride) {
  return { selectedResult: { ...this.selectedResult, gainOverride } };
}
function setGammaOverride(gammaOverride) {
  return { selectedResult: { ...this.selectedResult, gammaOverride } };
}
function setRedRangeOverride(redRangeOverride) {
  return { selectedResult: { ...this.selectedResult, redRangeOverride } };
}
function setGreenRangeOverride(greenRangeOverride) {
  return { selectedResult: { ...this.selectedResult, greenRangeOverride } };
}
function setBlueRangeOverride(blueRangeOverride) {
  return { selectedResult: { ...this.selectedResult, blueRangeOverride } };
}
function setValueRangeOverride(valueRangeOverride) {
  return { selectedResult: { ...this.selectedResult, valueRangeOverride } };
}

function setAtmFilter(atmFilter) {
  return { selectedResult: { ...this.selectedResult, atmFilter } };
}

function addModalDialog(id, component) {
  return {
    modalDialogs: [
      ...this.modalDialogs,
      {
        id,
        component,
      },
    ],
  };
}
function removeModalDialog(id) {
  return {
    modalDialogs: this.modalDialogs.filter(tc => tc.id !== id),
  };
}

function changePinOrder(oldIndex, newIndex, readOnly) {
  const pins = readOnly ? this.themePins : this.userPins;
  const newPins = [...pins];
  const draggedPin = pins[oldIndex];
  newPins.splice(oldIndex, 1);
  newPins.splice(newIndex, 0, draggedPin);

  if (readOnly) {
    return {
      themePins: newPins,
    };
  } else {
    updatePins(newPins).catch(e => {
      console.error(e);
    });
    return {
      userPins: newPins,
    };
  }
}

function setThemePins(pins) {
  let themePins = pins;
  if (pins) {
    themePins = pins.map(pin => {
      return {
        ...pin,
        opacity: [0, 1],
      };
    });
  }
  return {
    themePins,
  };
}

function setSelectedTheme(selectedTheme) {
  return { selectedTheme: selectedTheme };
}

function setMode(mode) {
  return { mode: mode };
}

function addPins(items) {
  const { lat, lng, zoom = 10 } = this;
  let pinItems = items.map(item => ({ lat, lng, zoom, ...item }));
  let userPins = [...pinItems, ...this.userPins].map(pin => {
    return { ...pin, opacity: 1 };
  });
  updatePins(userPins).catch(e => {
    console.error(e);
  });
  return {
    userPins,
  };
}
function removePin(index) {
  let result = this.userPins.filter((obj, i) => i !== index);
  updatePins(result).catch(e => {
    console.error(e);
  });
  return {
    userPins: result,
  };
}
function clearPins() {
  let result = [];

  updatePins(result).catch(e => {
    console.error(e);
  });
  return {
    userPins: result,
  };
}
function setPinProperty(index, propertyName, value) {
  const userPins = this.userPins.map((pin, i) => {
    if (index !== i) {
      return pin;
    }
    return {
      ...pin,
      [propertyName]: value,
    };
  });

  const shouldUpdateSavedPins = propertyName !== 'opacity';

  if (shouldUpdateSavedPins) {
    updatePins(userPins).catch(e => {
      console.error(e);
    });
  }

  return {
    userPins: userPins,
  };
}
function setBoundsAdSquarePerMeter(bounds, pixelBounds) {
  const equatorLength = 40075016.685578488;
  const unitsToMetersRatio = 360 / (equatorLength * Math.cos(this.lat * Math.PI / 180));
  const bboxH = bounds._northEast.lat - bounds._southWest.lat;
  const bboxW = bounds._northEast.lng - bounds._southWest.lng;
  const res = getNativeRes();
  const imageWidth = bboxW / (unitsToMetersRatio * res);
  const imageHeight = bboxH / (unitsToMetersRatio * res);
  const mapGeometry = createPolygonFromBounds(bounds);
  return {
    mapBounds: bounds,
    mapGeometry,
    squaresPerMtr: [Math.ceil(imageWidth), Math.ceil(imageHeight)],
  };
}

function setMapMaxBounds(mapMaxBounds) {
  return {
    mapMaxBounds: mapMaxBounds,
  };
}

function updatePath() {
  if (!this.allGetCapabilitiesLoaded) return;
  const { lat, lng, zoom, selectedResult, isActiveLayerVisible, isEvalUrl, mainTabIndex, themesUrl } = this;
  let params = [];
  params.push(`lat=${roundDegrees(lat, zoom)}`);
  params.push(`lng=${roundDegrees(lng, zoom)}`);
  params.push(`zoom=${zoom}`);
  if (themesUrl) {
    params.push(`themesUrl=${themesUrl}`);
  }

  if (!isEmpty(selectedResult) && isActiveLayerVisible && mainTabIndex === 2) {
    const {
      datasource,
      gainOverride,
      gammaOverride,
      redRangeOverride,
      greenRangeOverride,
      blueRangeOverride,
      valueRangeOverride,
      atmFilter,
      time,
      evalscript,
      evalscripturl,
      layers,
      preset,
      activeLayer,
    } = selectedResult;
    params.push(`time=${time}`);
    params.push(`preset=${preset}`);
    atmFilter && params.push(`atmFilter=${atmFilter}`);

    // don't encode evalscriptoverride params for EOB url so it's
    // easier to get params directly from EOB url when copying / sharing
    if (gainOverride) {
      params.push(`gainOverride=${gainOverride}`);
    }
    if (gammaOverride) {
      params.push(`gammaOverride=${gammaOverride}`);
    }
    if (redRangeOverride) {
      params.push(`redRangeOverride=${JSON.stringify(redRangeOverride)}`);
    }
    if (greenRangeOverride) {
      params.push(`greenRangeOverride=${JSON.stringify(greenRangeOverride)}`);
    }
    if (blueRangeOverride) {
      params.push(`blueRangeOverride=${JSON.stringify(blueRangeOverride)}`);
    }
    if (valueRangeOverride) {
      params.push(`valueRangeOverride=${JSON.stringify(valueRangeOverride)}`);
    }

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
  const newUrl =
    window.location.protocol + '//' + window.location.host + window.location.pathname + '?' + path;
  window.history.pushState({}, '', newUrl);

  return { path };
}

function setActiveBaseLayer(name, minmax) {
  return {
    activeBaseLayer: {
      name: name,
      minmax: { min: minmax.min, max: minmax.max },
    },
  };
}

function setSearchResults(results, datasource, returnParams) {
  return {
    searchResults: { ...this.searchResults, [datasource]: results },
    searchParams: { ...this.searchParams, [datasource]: returnParams },
  };
}

function clearSearchResults() {
  return {
    searchResults: {},
    searchParams: {},
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
    lng: latLngBounds.getCenter().lng,
  }); //top center
  latlngs.push(latLngBounds.getNorthWest()); //top left
  latlngs.push({
    lat: latLngBounds.getCenter().lat,
    lng: latLngBounds.getWest(),
  }); //center left

  return new L.polygon(latlngs).toGeoJSON();
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
    return Object.assign({}, currentState, Reducers[action.type].call(currentState, ...action.args), {
      action,
    });
  }
  return currentState; // DO NOTHING IF NO MATCH
}

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;

const middleware = createEpicMiddleware(combineEpics(mustRefresh, refreshPath));
const enhancer = composeEnhancers(applyMiddleware(middleware));

const store = createStore(reducer, initialState, enhancer);

function action(x) {
  return (...args) => {
    store.dispatch({ type: x, args });
  };
}
export default {
  get current() {
    return store.getState();
  },
  get Store() {
    return store;
  },
  setMaxcc: action(SET_MAXCC),
  setDate: action(SET_DATE),
  nextDate: action(SET_NEXT_DATE),
  prevDate: action(SET_PREV_DATE),
  setDateFrom: action(SET_MIN_DATE),
  setDatasource: action(SET_DATASOURCE),
  setDatasources: action(SET_DATASOURCES),
  setIsClipping: action(SET_IS_CLIPPING),
  setCurrentView: action(SET_CURR_VIEW),
  setChannels: action(SET_CHANNELS),
  setMapBounds: action(SET_MAP_BOUNDS),
  setMapMaxBounds: action(SET_MAP_MAX_BOUNDS),
  setLat: action(SET_LAT),
  setLng: action(SET_LNG),
  setZoom: action(SET_ZOOM),
  setTabIndex: action(SET_TAB_INDEX),
  toggleActiveLayer: action(TOGGLE_ACTIVE_LAYER),
  setActiveBaseLayer: action(SET_ACTIVE_BASE_LAYER),
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
  setPinProperty: action(SET_PIN_PROPERTY),
  addModalDialog: action(ADD_MODAL_DIALOG),
  removeModalDialog: action(REMOVE_MODAL_DIALOG),
  setThemesUrl: action(SET_THEMES_URL),
  addPins: action(ADD_PINS),
  setPins: action(SET_PINS),
  setThemePins: action(SET_THEME_PINS),
  setSelectedTheme: action(SET_SELECTED_THEME),
  setMode: action(SET_MODE),
  changePinOrder: action(CHANGE_PIN_ORDER),
  showLogin: action(SHOW_LOGIN),
  setUser: action(SET_USER),
  setAOIBounds: action(SET_AOI_BOUNDS),
  setPOI: action(SET_POI),
  setMapView: action(SET_MAP_VIEW),
  setUserInstances: action(SET_USER_INSTANCES),

  // tile specific methods
  setPreset: action(SET_PRESET),
  setPresets: action(SET_PRESETS),
  setFISShadowLayers: action(SET_FIS_SHADOW_LAYERS),
  setCloudCoverageLayer: action(SET_CLOUD_COVERAGE_LAYERS),
  setEvalScript: action(SET_EVAL_SCRIPT),
  refresh: action(REFRESH),
  setSelectedResult: action(SET_SELECTED_RESULT),
  setAtmFilter: action(SET_ATM_FILTER),
  setEvalMode: action(SET_EVAL_MODE),
  setEvalUrl: action(SET_EVAL_URL),

  // evalscriptoverrides
  setGainOverride: action(SET_GAIN_OVERRIDE),
  setGammaOverride: action(SET_GAMMA_OVERRIDE),
  setRedRangeOverride: action(SET_RED_RANGE_OVERRIDE),
  setGreenRangeOverride: action(SET_GREEN_RANGE_OVERRIDE),
  setBlueRangeOverride: action(SET_BLUE_RANGE_OVERRIDE),
  setValueRangeOverride: action(SET_VALUE_RANGE_OVERRIDE),

  setRecaptchaAuthToken: action(SET_RECAPTCHA_AUTH_TOKEN),
};
