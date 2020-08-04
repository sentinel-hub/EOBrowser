import { b64EncodeUnicode } from './base64MDN';
import round from 'lodash.round';
export function getUrlParams() {
  const urlParamString = window.location.search.length > 0 ? window.location.search : window.location.hash;
  const searchParams = new URLSearchParams(urlParamString);
  return Object.fromEntries(searchParams.entries());
}

export function userCanAccessLockedFunctionality(user, selectedTheme) {
  if (selectedTheme && selectedTheme.type && selectedTheme.type === 'EDUCATION') {
    return true;
  }

  return !!user;
}

/*
  List of all supported URL parameters: (with exception of legacy EOB2 parameters)
  - themesUrl: URL of the JSON file which contains the themes definitions. If not
    specified, one of the included JSON files is used (either default_themes.js
    or education_themes.js, depending on themeId which must exist in one of them).
  - themeId: value of the id field in the theme definition
  - datasetId: id of the dataset that was chosen when searching. It is specified so
    that we know which layers to list in Visualization panel.
  - visualizationUrl: WMS URL from the selected theme (the information about the
    layerId is available through GetCapabilities request there)
  - layerId: id of the selected layer. If not set, "custom layer" is selected and
    either evalscript or evalscripturl parameters must be set.
  - zoom: zoom level
  - lat: latitude
  - lng: longitude
  - fromTime: date and time of the start of timespan, or null if toTime is a date
    or if layer doesn't support time dimension.
  - toTime: date and time of the end of timespan, or date if a single date is selected,
    or null if layer doesn't support time dimension.
  - evalscript: evalscript of the layer (if layerId and evalscripturl are not specified)
  - evalscripturl: evalscripturl of the layer (if layerId is not specified)
  - gain: gain effect
  - gamma: gamma effect
  - dataFusion: dataFusion settings
*/
export function updatePath(props) {
  let {
    currentZoom,
    currentLat,
    currentLng,
    fromTime,
    toTime,
    datasetId,
    visualizationUrl,
    layerId,
    evalscript,
    evalscripturl,
    customSelected,
    selectedThemeId,
    themesUrl,
    selectedTabIndex,
    gainEffect,
    gammaEffect,
    redRangeEffect,
    greenRangeEffect,
    blueRangeEffect,
    minQa,
    upsampling,
    downsampling,
    dataFusion,
  } = props;
  currentLat = Math.round(100000 * currentLat) / 100000;
  currentLng = Math.round(100000 * currentLng) / 100000;

  let params = {
    zoom: currentZoom,
    lat: currentLat,
    lng: currentLng,
  };

  if (selectedThemeId) {
    params.themeId = selectedThemeId;
  }
  if (themesUrl) {
    params.themesUrl = themesUrl;
  }

  if (selectedTabIndex === 2) {
    // Visualize tab is selected
    if (datasetId) {
      params.datasetId = datasetId;
    }
    if (fromTime) {
      params.fromTime = fromTime.toISOString();
    }
    if (toTime) {
      params.toTime = toTime.toISOString();
    }
    if (layerId) {
      params.layerId = layerId;
    }
    if (visualizationUrl) {
      params.visualizationUrl = visualizationUrl;
    }
    if (customSelected && evalscript && !evalscripturl) {
      params.evalscript = b64EncodeUnicode(evalscript);
    }
    if (customSelected && evalscripturl) {
      params.evalscripturl = evalscripturl;
    }
    if (gainEffect !== undefined && gainEffect !== 1) {
      params.gain = gainEffect;
    }
    if (gammaEffect !== undefined && gammaEffect !== 1) {
      params.gamma = gammaEffect;
    }
    if (redRangeEffect && !(redRangeEffect[0] === 0 && redRangeEffect[1] === 1)) {
      params.redRange = JSON.stringify(redRangeEffect);
    }
    if (greenRangeEffect && !(greenRangeEffect[0] === 0 && greenRangeEffect[1] === 1)) {
      params.greenRange = JSON.stringify(greenRangeEffect);
    }
    if (blueRangeEffect && !(blueRangeEffect[0] === 0 && blueRangeEffect[1] === 1)) {
      params.blueRange = JSON.stringify(blueRangeEffect);
    }
    if (minQa !== undefined) {
      params.minQa = minQa;
    }
    if (upsampling !== undefined) {
      params.upsampling = upsampling;
    }
    if (downsampling !== undefined) {
      params.downsampling = downsampling;
    }
    if (isDataFusionEnabled(dataFusion)) {
      params.dataFusion = JSON.stringify(dataFusion);
    }
  }

  const escapedParams = Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
  const newUrl = window.location.origin + window.location.pathname + '?' + escapedParams;
  window.history.pushState({}, '', newUrl);
}
// eslint-disable-next-line
function hexToRgb(hex) {
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return `[${round(r / 255, 2)},${round(g / 255, 2)},${round(b / 255, 2)}]`;
}

export function constructV3Evalscript(bands, config) {
  // custom config formula used in index feature
  if (config) {
    const { equation, colorRamp, values } = config;
    const indexEquation = [...equation]
      .map(item => (item === 'B' && `samples.${bands.b}`) || (item === 'A' && `samples.${bands.a}`) || item)
      .join('');

    // temp fix with index instead of actual positions, to be removed in next commit
    return `//VERSION=3
      const colorRamp = [${colorRamp.map((color, index) => `[${values[index]},${color.replace('#', '0x')}]`)}]
    
      let viz = new ColorRampVisualizer(colorRamp);
      
      function setup() {
        return {
          input: ["${[...new Set(Object.values(bands))].join('","')}", "dataMask"],
          output: { bands: 4 }
        };
      }

      function evaluatePixel(samples) {
        let index = ${indexEquation}
          return [...viz.process(index),samples.dataMask]; 
      }`;
  }

  // If no configuration is passed a default evalscript gets generated
  // NOTE: changing the format will likely break parseEvalscriptBands method.
  return `//VERSION=3
    function setup() {
      return {
        input: ["${[...new Set(Object.values(bands))].join('","')}", "dataMask"],
        output: { bands: 4 }
      };
    }

    function evaluatePixel(sample) {
      return [${Object.values(bands)
        .map(e => '2.5 * sample.' + e)
        .join(',')}, sample.dataMask ];
    }`;
}

export function constructBasicEvalscript(bands, config) {
  // custom config used for index feature
  if (config) {
    const { equation, colorRamp, values } = config;

    const indexEquation = [...equation]
      .map(item => (item === 'B' && `${bands.b}`) || (item === 'A' && `${bands.a}`) || item)
      .join('');

    return `var index = ${indexEquation};
    return colorBlend(
      index,
      [${values.map(value => value)}],
      [${colorRamp.map(color => hexToRgb(color.replace('#', '0x')))}]
    );`;
  }
  // NOTE: changing the format will likely break parseEvalscriptBands method.
  return `return [${Object.values(bands)
    .map(e => '2.5*' + e)
    .join(',')}];`;
}

export function parseEvalscriptBands(evalscript) {
  try {
    if (evalscript.startsWith('//VERSION=3')) {
      return evalscript
        .split('\n')[9]
        .split('[')[1]
        .split(']')[0]
        .split(',')
        .map(b => b.replace('2.5 * sample.', ''))
        .map(b => b.replace('factor * sample.', ''))
        .slice(0, -1);
    }
    return evalscript
      .split('[')[1]
      .split(']')[0]
      .split(',')
      .map(b => b.replace('2.5*', ''));
  } catch (e) {
    return [];
  }
}

export function parsePosition(lat, lng, zoom) {
  zoom = isNaN(parseInt(zoom)) ? undefined : parseInt(zoom);
  lat = isNaN(parseFloat(lat)) ? undefined : parseFloat(lat);
  lng = isNaN(parseFloat(lng)) ? undefined : parseFloat(lng);
  return { lat, lng, zoom };
}

export function isDataFusionEnabled(dataFusionOptions) {
  return Boolean(
    dataFusionOptions &&
      dataFusionOptions.enabled &&
      dataFusionOptions.supplementalDatasets &&
      Object.keys(dataFusionOptions.supplementalDatasets).some(
        supDatasetId => dataFusionOptions.supplementalDatasets[supDatasetId].enabled,
      ),
  );
}
