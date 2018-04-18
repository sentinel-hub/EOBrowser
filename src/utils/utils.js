import values from 'lodash/values';
import isEqual from 'lodash/isEqual';
import L from 'leaflet';
import '../components/ext/leaflet-clip-wms-layer';
import Store from '../store';

export function getMultipliedLayers(layers) {
  let result = [];
  for (let layer in layers) {
    if (layers.hasOwnProperty(layer)) {
      result.push(`${layers[layer]}*2.5`);
    }
  }
  return result.join(',');
}

export function isScriptFromLayers(script, layers) {
  return (
    b64EncodeUnicode('return [' + getMultipliedLayers(layers) + '];') === script
  );
}

export function getCrsLabel(tile) {
  const { dataGeometry, tileGeometry, dataUri } = tile;
  const crs =
    'EPSG:' + (dataGeometry || tileGeometry).crs.properties.name.split('::')[1];
  const mgrsPath = dataUri.split('/');
  const mgrs = mgrsPath[4] + mgrsPath[5] + mgrsPath[6];
  return { crs, mgrs };
}

export const evalSourcesMap = {
  'Sentinel-1': 'S1',
  'Sentinel-1 GRD IW': 'S1',
  'Sentinel-1 GRD EW': 'S1_EW',
  'Sentinel-1 GRD EW SH': 'S1_EW_SH',
  'Sentinel-2 L1C': 'S2',
  MODIS: 'Modis',
  'Sentinel-2': 'S2',
  'Sentinel-2 L2A': 'S2L2A',
  'Sentinel-3 OLCI': 'S3',
  'Landsat 5 ESA': 'L5',
  'Landsat 7 ESA': 'L7',
  'Landsat 8': 'L8',
  'Landsat 8 ESA': 'L8',
  'Landsat 8 USGS': 'L8',
  'Envisat Meris': 'ENV'
};
export function isCustomPreset(preset) {
  return preset === 'CUSTOM';
}

export function getLayersString(layers) {
  return values(layers).join(',');
}

export function hasPinSaved(currPin) {
  const { pinResults } = Store.current;
  return pinResults.find(pin => {
    return isEqual(pin, currPin);
  });
}

export function createMapLayer(instanceObj, pane, progress) {
  if (instanceObj === undefined) return;
  const {
    name,
    baseUrl,
    minZoom = 5,
    maxZoom = 16,
    tileSize = 512
  } = instanceObj;
  // when we create compare layer, we will create CLIP layer, otherwise normal wms layer
  let layer =
    pane === 'compareLayer'
      ? L.tileLayer.clip(baseUrl, {
          showlogo: false,
          tileSize,
          minZoom,
          maxZoom,
          pane,
          name
        })
      : L.tileLayer.wms(baseUrl, {
          showlogo: false,
          tileSize,
          minZoom,
          maxZoom,
          pane,
          name
        });
  layer.on('loading', function() {
    progress.start();
    progress.inc(0.1);
  });
  layer.on('load', function() {
    progress.done();
  });
  return layer;
}

// Store pins to localStorage
function hasLocalStorage() {
  // inspired by Modernizr's test
  // https://github.com/Modernizr/Modernizr/blob/5eea7e2a213edc9e83a47b6414d0250468d83471/feature-detects/storage/localstorage.js
  // as of 02.03.2017
  var mod = 'modernizr';
  try {
    localStorage.setItem(mod, mod);
    localStorage.removeItem(mod);
    return true;
  } catch (e) {
    return false;
  }
}

const PINS_LC_NAME = 'react-app-pins';

function isValidId(id) {
  const idRegex = /^[0-9].*-pin$/i;
  return idRegex.test(id);
}
export function uniquePinId() {
  return `${Math.floor(
    Math.random() * 1000 + 100
  )}-${new Date().valueOf()}-pin`;
}

export function getPinsFromLocalStorage() {
  //return [];
  if (!hasLocalStorage) return [];
  let pins = window.localStorage.getItem(PINS_LC_NAME);
  if (pins) {
    return JSON.parse(pins)
      .filter(pin => pin.name || pin.datasource)
      .map((pin, index) => {
        if (pin.properties) {
          // legacy format
          const {
            name,
            properties: { rawData: { time } },
            map: { latitude, longitude, zoom },
            ...rest
          } = pin;
          return {
            ...rest,
            _id: isValidId(pin._id) ? pin._id : uniquePinId(),
            datasource: name,
            lat: latitude,
            lng: longitude,
            zoom,
            time
          };
        }
        return {
          ...pin,
          opacity: [0, 1],
          _id: isValidId(pin._id) ? pin._id : uniquePinId()
        };
      });
  }

  return [];
}

export function syncPinsWithLocalStorage(pins) {
  if (!hasLocalStorage) return;

  window.localStorage.setItem(PINS_LC_NAME, JSON.stringify(pins));
}

export function b64DecodeUnicode(str) {
  try {
    atob(str);
  } catch (e) {
    return '';
  }
  return atob(str);
}
export function b64EncodeUnicode(str) {
  return btoa(str);
}

export function getPolyfill() {
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {  // eslint-disable-line no-extend-native
      value: function(searchElement, fromIndex) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If len is 0, return false.
        if (len === 0) {
          return false;
        }

        // 4. Let n be ? ToInteger(fromIndex).
        //    (If fromIndex is undefined, this step produces the value 0.)
        var n = fromIndex | 0;

        // 5. If n ≥ 0, then
        //  a. Let k be n.
        // 6. Else n < 0,
        //  a. Let k be len + n.
        //  b. If k < 0, let k be 0.
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        function sameValueZero(x, y) {
          return (
            x === y ||
            (typeof x === 'number' &&
              typeof y === 'number' &&
              isNaN(x) &&
              isNaN(y))
          );
        }

        // 7. Repeat, while k < len
        while (k < len) {
          // a. Let elementK be the result of ? Get(O, ! ToString(k)).
          // b. If SameValueZero(searchElement, elementK) is true, return true.
          // c. Increase k by 1.
          if (sameValueZero(o[k], searchElement)) {
            return true;
          }
          k++;
        }

        // 8. Return false
        return false;
      }
    });
  }

  if (!Array.prototype.map) {
    Array.prototype.map = function(callback /*, thisArg*/) {  // eslint-disable-line no-extend-native
      var T, A, k;

      if (this == null) {
        throw new TypeError('this is null or not defined');
      }

      // 1. Let O be the result of calling ToObject passing the |this|
      //    value as the argument.
      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get internal
      //    method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0;

      // 4. If IsCallable(callback) is false, throw a TypeError exception.
      // See: http://es5.github.com/#x9.11
      if (typeof callback !== 'function') {
        throw new TypeError(callback + ' is not a function');
      }

      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
      if (arguments.length > 1) {
        T = arguments[1];
      }

      // 6. Let A be a new array created as if by the expression new Array(len)
      //    where Array is the standard built-in constructor with that name and
      //    len is the value of len.
      A = new Array(len);

      // 7. Let k be 0
      k = 0;

      // 8. Repeat, while k < len
      while (k < len) {
        var kValue, mappedValue;
        if (k in O) {
          // i. Let kValue be the result of calling the Get internal
          //    method of O with argument Pk.
          kValue = O[k];

          // ii. Let mappedValue be the result of calling the Call internal
          //     method of callback with T as the this value and argument
          //     list containing kValue, k, and O.
          mappedValue = callback.call(T, kValue, k, O);

          // For best browser support, use the following:
          A[k] = mappedValue;
        }
        // d. Increase k by 1.
        k++;
      }

      // 9. return A
      return A;
    };
  }

  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {  // eslint-disable-line no-extend-native
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }
}
