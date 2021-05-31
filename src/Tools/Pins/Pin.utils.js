import axios from 'axios';
import uuid from 'uuid';
import moment from 'moment';
import isEqual from 'lodash.isequal';
import { t } from 'ttag';
import { LayersFactory } from '@sentinel-hub/sentinelhub-js';

import store, { tabsSlice } from '../../store';
import { DEFAULT_THEMES } from '../../assets/default_themes.js';
import { VERSION_INFO } from '../../VERSION';
import { b64DecodeUnicode } from '../../utils/base64MDN';
import { getTokenFromLocalStorage } from '../../Auth/authHelpers';
import { getDataSourceHandler, getDatasetLabel } from '../SearchPanel/dataSourceHandlers/dataSourceHandlers';

import { datasourceToDatasetId, dataSourceToThemeId, datasourceToUrl } from '../../utils/handleOldUrls';
import { ensureCorrectDataFusionFormat, getThemeName } from '../../utils';
import {
  defaultGain,
  defaultGamma,
  defaultRange,
  isEffectValueSetAndNotDefault,
  isEffectRangeSetAndNotDefault,
} from '../../utils/effectsUtils';

const PINS_LC_NAME = 'eob-pins';

// check if the pin was already converted by this version of EOB3
const needsConversion = pin => {
  if (!pin.tag || pin.tag === '') {
    return true;
  }
  return pin.tag !== VERSION_INFO.tag;
};

const convertDataSource = (pin, newPin) => {
  const { datasource } = pin;
  if (datasource) {
    const datasetId = datasourceToDatasetId[datasource];
    const themeId = dataSourceToThemeId[datasource] ? dataSourceToThemeId[datasource] : 'DEFAULT-THEME';
    const visualizationUrl = datasourceToUrl[datasource];
    newPin.datasetId = datasetId;
    newPin.themeId = themeId;
    newPin.visualizationUrl = visualizationUrl;
  }
  return newPin;
};

const convertPreset = (pin, newPin) => {
  const { preset } = pin;
  if (preset) {
    newPin.layerId = preset;
  }
  return newPin;
};

const convertActiveLayer = (pin, newPin) => {
  const { activeLayer } = pin;
  if (activeLayer) {
    const visualizationUrl = pin.activeLayer.baseUrls.WMS;
    const theme = DEFAULT_THEMES.find(t => t.content.map(d => d.url).includes(visualizationUrl));
    newPin.datasetId = activeLayer.shortName ? activeLayer.shortName : activeLayer.id;
    newPin.themeId = theme ? theme.id : DEFAULT_THEMES[0].id;
    newPin.visualizationUrl = visualizationUrl;
  }
  return newPin;
};

const addTag = newPin => {
  newPin.tag = VERSION_INFO.tag;
  return newPin;
};

const convertTitle = (pin, newPin) => {
  const { pinTitle, datasource, preset } = pin;
  if (pinTitle) {
    newPin.title = pinTitle;
  } else if (!newPin.title) {
    newPin.title = `${datasource} ${preset}`;
  }
  return newPin;
};

const convertEvalscript = (pin, newPin) => {
  const { evalscript, time, preset } = pin;
  // We should only decode pins which have encoded evalscripts. Those are EOB2 pins and have to be identified with their distinct attributes.
  const isEOB2Pin = time && preset;
  if (!newPin.layerId && !newPin.evalscripturl && isEOB2Pin && evalscript && evalscript !== '') {
    newPin.evalscript = b64DecodeUnicode(evalscript);
  }
  return newPin;
};

const convertTime = (pin, newPin) => {
  const { time } = pin;

  if (time) {
    const times = time.split('/');
    if (times.length === 2) {
      newPin.fromTime = times[0];
      newPin.toTime = times[1];
    } else {
      newPin.fromTime = moment
        .utc(times[0])
        .startOf('day')
        .toISOString();
      newPin.toTime = moment
        .utc(times[0])
        .endOf('day')
        .toISOString();
    }
  }
  return newPin;
};

const convertEffects = (pin, newPin) => {
  const { gainOverride, gammaOverride, redRangeOverride, greenRangeOverride, blueRangeOverride } = pin;
  const { gain, gamma, redRange, greenRange, blueRange } = pin;
  const { downsampling, upsampling } = pin;
  if (
    isEffectValueSetAndNotDefault(gainOverride, defaultGain) &&
    !isEffectValueSetAndNotDefault(gain, defaultGain)
  ) {
    newPin.gain = gainOverride;
  }
  if (
    isEffectValueSetAndNotDefault(gammaOverride, defaultGamma) &&
    !isEffectValueSetAndNotDefault(gamma, defaultGamma)
  ) {
    newPin.gamma = gammaOverride;
  }
  if (
    isEffectRangeSetAndNotDefault(redRangeOverride, defaultRange) &&
    isEffectRangeSetAndNotDefault(redRange, defaultRange)
  ) {
    newPin.redRange = redRangeOverride;
  }
  if (
    isEffectRangeSetAndNotDefault(greenRangeOverride, defaultRange) &&
    isEffectRangeSetAndNotDefault(greenRange, defaultRange)
  ) {
    newPin.greenRange = greenRangeOverride;
  }
  if (
    isEffectRangeSetAndNotDefault(blueRangeOverride, defaultRange) &&
    isEffectRangeSetAndNotDefault(blueRange, defaultRange)
  ) {
    newPin.blueRange = blueRangeOverride;
  }

  if (!!upsampling) {
    newPin.upsampling = upsampling;
  }

  if (!!downsampling) {
    newPin.downsampling = downsampling;
  }

  return newPin;
};

export function convertToNewFormat(pin) {
  if (needsConversion(pin)) {
    const {
      _id,
      lng,
      lat,
      zoom,
      fromTime,
      toTime,
      title,
      visualizationUrl,
      themeId,
      datasetId,
      layerId,
      evalscript,
      evalscripturl,
      dataFusion,
      description,
      gain,
      gamma,
      redRange,
      greenRange,
      blueRange,
      redCurve,
      greenCurve,
      blueCurve,
    } = pin;
    let newPin = {
      _id: _id,
      lng: lng,
      lat: lat,
      zoom: zoom,
      fromTime: fromTime,
      toTime: toTime,
      title: title,
      visualizationUrl: visualizationUrl,
      themeId: themeId,
      datasetId: datasetId,
      layerId: layerId,
      evalscript: evalscript,
      evalscripturl: evalscripturl,
      dataFusion: dataFusion,
      description: description,
      gain: gain,
      gamma: gamma,
      redRange: redRange,
      greenRange: greenRange,
      blueRange: blueRange,
      redCurve: redCurve,
      greenCurve: greenCurve,
      blueCurve: blueCurve,
    };
    // convert pin data
    newPin = convertTitle(pin, newPin);
    newPin = convertTime(pin, newPin);
    newPin = convertActiveLayer(pin, newPin);
    newPin = convertDataSource(pin, newPin);
    newPin = convertPreset(pin, newPin);
    newPin = convertEvalscript(pin, newPin);
    newPin = convertEffects(pin, newPin);
    // tag pin so we know that data was converted by this version of EOB3
    newPin = addTag(newPin);
    return newPin;
  }
  return pin;
}

export function getPinsFromServer() {
  const access_token = store.getState().auth.user.access_token;
  return new Promise((resolve, reject) => {
    const url = `${process.env.REACT_APP_AUTH_BASEURL}userdata/`;
    const requestParams = {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };
    axios
      .get(url, requestParams)
      .then(async res => {
        try {
          if (res.data.pins_eob3) {
            resolve(res.data.pins_eob3);
          } else {
            // If pins_eob3 don't exist, create them
            const convertedPins = res.data.pins.map(pin => convertToNewFormat(pin));
            res.data.pins_eob3 = convertedPins;
            await axios.put(url, res.data, requestParams);
            resolve(preparePins(convertedPins));
          }
        } catch (e) {
          console.warn(e);
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

export function removePinsFromServer(ids) {
  const access_token = store.getState().auth.user.access_token;
  return new Promise((resolve, reject) => {
    const url = `${process.env.REACT_APP_AUTH_BASEURL}userdata/`;
    const requestParams = {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${access_token}`,
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
        userData.pins_eob3 = userData.pins_eob3.filter(p => !ids.includes(p._id));
        axios
          .put(url, userData, requestParams)
          .then(() => {
            resolve(userData.pins_eob3);
          })
          .catch(e => {
            console.error('Unable to remove the pin!', e);
            reject(e);
          });
      })
      .catch(e => {
        console.error('Unable to retrieve user data!', e);
        reject(e);
      });
  });
}

export function savePinsToServer(pins, replace = false) {
  const access_token = store.getState().auth.user.access_token;
  let lastUniqueId;
  pins = pins.map(p => {
    if (!p._id) {
      const uniqueId = `${uuid()}-pin`;
      p._id = uniqueId;
    }
    lastUniqueId = p._id;
    return p;
  });
  return new Promise((resolve, reject) => {
    const url = `${process.env.REACT_APP_AUTH_BASEURL}userdata/`;
    const requestParams = {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${access_token}`,
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
        if (Array.isArray(userData)) {
          // userData can be an array in some instances. If it's an empty array, we make it an object and use it normally. Otherwise, we don't change it.
          if (userData.length) {
            throw new Error('User data is not an object or an empty array.');
          } else {
            userData = {};
          }
        }
        if (!userData.pins_eob3 || replace) {
          userData.pins_eob3 = [...pins];
        } else {
          userData.pins_eob3 = [...pins, ...userData.pins_eob3];
        }

        axios
          .put(url, userData, requestParams)
          .then(() => {
            resolve({ uniqueId: lastUniqueId, pins: userData.pins_eob3 });
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

export function savePinsToSessionStorage(newPins, replace = false) {
  let lastUniqueId;
  newPins = newPins.map(p => {
    if (!p._id) {
      const uniqueId = `${uuid()}-pin`;
      p._id = uniqueId;
    }
    lastUniqueId = p._id;
    return p;
  });
  let pins = sessionStorage.getItem(PINS_LC_NAME);
  if (!pins) {
    pins = [];
  } else {
    pins = JSON.parse(pins);
  }
  if (!replace) {
    pins = [...newPins, ...pins];
  } else {
    pins = newPins;
  }

  sessionStorage.setItem(PINS_LC_NAME, JSON.stringify(pins));
  return lastUniqueId;
}

export function getPinsFromSessionStorage() {
  let pins = sessionStorage.getItem(PINS_LC_NAME);
  if (!pins) {
    pins = [];
  } else {
    pins = JSON.parse(pins);
  }
  return preparePins(pins);
}

export async function createShareLink(pins) {
  const url = `${process.env.REACT_APP_EOB_BACKEND}sharedpins`;
  const { data } = await axios.post(url, {
    items: pins,
  });
  return `${process.env.REACT_APP_ROOT_URL}?sharedPinsListId=${data.id}`;
}

export async function getSharedPins(sharedPinsListId) {
  const url = `${process.env.REACT_APP_EOB_BACKEND}sharedpins/${sharedPinsListId}`;
  const { data } = await axios.get(url);
  return data;
}

const pinPropertiesSubset = pin => ({
  datasetId: pin.datasetId,
  evalscript: pin.evalscript,
  evalscripturl: pin.evalscripturl,
  lat: pin.lat,
  lng: pin.lng,
  zoom: pin.zoom,
  layerId: pin.layerId,
  themeId: pin.themeId,
  fromTime: pin.fromTime,
  toTime: pin.toTime,
  title: pin.title,
  visualizationUrl: pin.visualizationUrl,
  dataFusion: pin.dataFusion,
  gain: pin.gain,
  gamma: pin.gamma,
  redRange: pin.redRange,
  greenRange: pin.greenRange,
  blueRange: pin.blueRange,
});

export function getPinsFromStorage(user) {
  return new Promise((resolve, reject) => {
    if (user) {
      getPinsFromServer().then(pins => resolve(pins));
    } else {
      const pinsFromLocalStorage = getPinsFromSessionStorage();
      resolve(pinsFromLocalStorage);
    }
  });
}

export async function importSharedPins(sharedPinsListId) {
  const isUserLoggedIn = await getTokenFromLocalStorage();
  const [existingPins] = await Promise.all([getPinsFromStorage(isUserLoggedIn)]);
  const sharedPins = await getSharedPins(sharedPinsListId);

  const N_PINS = sharedPins.items.length;
  if (
    !window.confirm(t`You are about to add ${N_PINS} pin(s) to your pin collection. Do you want to proceed?`)
  ) {
    return [];
  }

  store.dispatch(tabsSlice.actions.setTabIndex(3));

  //merge sharedPins with pins
  const newPins = [];
  sharedPins.items.forEach(sharedPin => {
    //for each shared pin check if it already exists in existing pins list
    const existingPin = existingPins.find(pin =>
      isEqual(pinPropertiesSubset(pin), pinPropertiesSubset(sharedPin)),
    );

    if (!existingPin) {
      newPins.push(sharedPin);
    }
  });
  //construct new list of pins and save it
  let result;
  if (newPins.length > 0) {
    const mergedPins = [...existingPins, ...newPins];

    if (isUserLoggedIn) {
      result = await savePinsToServer(mergedPins, true);
    } else {
      result = savePinsToSessionStorage(mergedPins, true);
    }
  }
  return result;
}

// Creates a sentinelhub-js Layer instance from the pin. Known limitation:
export async function layerFromPin(pin, reqConfig) {
  const { datasetId, visualizationUrl, layerId, evalscript, evalscripturl, dataFusion } = pin;

  const dsh = getDataSourceHandler(datasetId);
  const shJsDataset = dsh ? dsh.getSentinelHubDataset(datasetId) : null;
  const layers = await LayersFactory.makeLayers(
    visualizationUrl,
    (_, dataset) => (!shJsDataset ? true : dataset === shJsDataset),
    null,
    reqConfig,
  ).catch(err => {
    console.error(err);
    return null;
  });
  if (!layers || layers.length === 0) {
    return null;
  }
  let layer;
  if (layerId) {
    layer = layers.find(l => l.layerId === layerId);
    if (layer) {
      await layer.updateLayerFromServiceIfNeeded(reqConfig);
    }
  } else {
    layer = layers[0];
    if (Object.keys(dataFusion).length === 0) {
      layer.evalscript = evalscript;
      layer.evalscriptUrl = evalscripturl;
    }
  }
  return layer;
}

export const isOnEqualDate = (date1, date2) => {
  const date1Moment = moment.utc(date1);
  const date2Moment = moment.utc(date2);

  return date1Moment.isSame(date2Moment, 'day');
};

export const constructTimespanString = ({ fromTime, toTime } = {}) => {
  if (!toTime) {
    return null;
  }

  if (!fromTime || isOnEqualDate(fromTime, toTime)) {
    return moment.utc(toTime).format('YYYY-MM-DD');
  }

  return `${moment.utc(fromTime).format('YYYY-MM-DD')} - ${moment.utc(toTime).format('YYYY-MM-DD')}`;
};

function preparePins(pins) {
  return pins.map(pin => {
    if (pin.dataFusion) {
      const dataFusionInCorrectFormat = ensureCorrectDataFusionFormat(pin.dataFusion, pin.datasetId);
      pin.dataFusion = dataFusionInCorrectFormat;
    }
    return pin;
  });
}

export function isPinValid(pin) {
  const { _id, gain, gamma, redRange, greenRange, blueRange } = pin;
  try {
    isEffectValueSetAndNotDefault(gain, defaultGain);
    isEffectValueSetAndNotDefault(gamma, defaultGamma);
    isEffectRangeSetAndNotDefault(redRange, defaultRange);
    isEffectRangeSetAndNotDefault(greenRange, defaultRange);
    isEffectRangeSetAndNotDefault(blueRange, defaultRange);
  } catch (err) {
    return { isValid: false, error: `Pin ${_id} is invalid: ` + err.message };
  }
  return { isValid: true, error: null };
}

export function constructPinFromProps(props) {
  const {
    lat,
    lng,
    zoom,
    datasetId,
    layerId,
    visualizationUrl,
    fromTime,
    toTime,
    evalscript,
    evalscripturl,
    customSelected,
    dataFusion,
    gainEffect,
    gammaEffect,
    redRangeEffect,
    greenRangeEffect,
    blueRangeEffect,
    redCurveEffect,
    greenCurveEffect,
    blueCurveEffect,
    minQa,
    upsampling,
    downsampling,
    selectedThemeId,
    selectedThemesListId,
    themesLists,
    terrainViewerSettings,
  } = props;
  const isGIBS = !fromTime; //GIBS only has toTime
  const themeName = getThemeName(themesLists[selectedThemesListId].find(t => t.id === selectedThemeId));
  return {
    title: `${getDatasetLabel(datasetId)}: ${customSelected ? 'Custom' : layerId} (${themeName})`,
    lat: lat,
    lng: lng,
    zoom: zoom,
    datasetId: datasetId,
    layerId: layerId,
    visualizationUrl: visualizationUrl,
    fromTime: isGIBS ? null : fromTime.toISOString(),
    toTime: toTime.toISOString(),
    evalscript: evalscript && !evalscripturl && customSelected ? evalscript : '',
    evalscripturl: evalscripturl && customSelected ? evalscripturl : '',
    themeId: selectedThemeId,
    dataFusion: dataFusion,
    tag: VERSION_INFO.tag,
    gain: gainEffect,
    gamma: gammaEffect,
    redRange: redRangeEffect,
    greenRange: greenRangeEffect,
    blueRange: blueRangeEffect,
    redCurve: redCurveEffect ? redCurveEffect.points : undefined,
    greenCurve: greenCurveEffect ? greenCurveEffect.points : undefined,
    blueCurve: blueCurveEffect ? blueCurveEffect.points : undefined,
    minQa: minQa,
    upsampling: upsampling,
    downsampling: downsampling,
    terrainViewerSettings: terrainViewerSettings,
  };
}
