import { getUrlParams } from '../utils/index';

const COPERNICUS_BROWSER_LINK = 'https://browser.dataspace.copernicus.eu/';
const EOB_TO_CDSE_DATASET = {
  S1_AWS_EW_HH: 'S1_CDAS_EW_HH',
  S1_AWS_EW_HHHV: 'S1_CDAS_EW_HHHV',
  S1_AWS_IW_VV: 'S1_CDAS_IW_VV',
  S1_AWS_IW_VVVH: 'S1_CDAS_IW_VVVH',
  S2L2A: 'S2_L2A_CDAS',
  S2L1C: 'S2_L1C_CDAS',
  S3OLCI: 'S3OLCI_CDAS',
  S3SLSTR: 'S3SLSTR_CDAS',
  S5_AER_AI: 'S5_AER_AI_CDAS',
  S5_CLOUD: 'S5_CLOUD_CDAS',
  S5_CO: 'S5_CO_CDAS',
  S5_NO2: 'S5_NO2_CDAS',
  S5_CH4: 'S5_CH4_CDAS',
  S5_SO2: 'S5_SO2_CDAS',
  S5_O3: 'S5_O3_CDAS',
  S5_HCHO: 'S5_HCHO_CDAS',
  // "AWS_LOTL2": null,
  // "AWS_LOTL1": null,
};

export function generateCopernicusBrowserUrl() {
  const {
    zoom,
    lat,
    lng,
    fromTime,
    toTime,
    datasetId,
    layerId,
    evalscript,
    evalscripturl,
    themeId,
    gain,
    gamma,
    redRange,
    greenRange,
    blueRange,
    upsampling,
    downsampling,
  } = getUrlParams();

  const params = {
    zoom,
    lat,
    lng,
    fromTime,
    toTime,
    datasetId: EOB_TO_CDSE_DATASET[datasetId],
    layerId,
    themeId,
    evalscript,
    evalscripturl,
    gain,
    gamma,
    redRange,
    greenRange,
    blueRange,
    upsampling,
    downsampling,
  };

  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) {
      delete params[key];
    }
  });

  const copernicusBrowserUrl = new URL(COPERNICUS_BROWSER_LINK);
  copernicusBrowserUrl.search = new URLSearchParams(params);
  return copernicusBrowserUrl.toString();
}
