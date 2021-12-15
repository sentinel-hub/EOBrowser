import {
  Polarization,
  AcquisitionMode,
  Resolution,
  CacheTarget,
  SpeckleFilterType,
  DEMInstanceTypeOrthorectification,
} from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import { DEFAULT_THEMES } from './assets/default_themes.js';
import { EDUCATION_THEMES } from './assets/education_themes.js';

export const MODE_THEMES_LIST = 'mode';
export const URL_THEMES_LIST = 'url';
export const USER_INSTANCES_THEMES_LIST = 'user_instances';

export const EDUCATION_MODE = {
  id: 'education',
  label: () => t`Education`,
  themes: EDUCATION_THEMES,
};

export const DEFAULT_MODE = {
  id: 'default',
  label: () => t`Normal`,
  themes: DEFAULT_THEMES,
};

export const DEFAULT_LAT_LNG = {
  lat: 41.9,
  lng: 12.5,
};

export const MODES = [EDUCATION_MODE, DEFAULT_MODE];

export const EXPIRED_ACCOUNT_DUMMY_INSTANCE_ID = 'expired_account_dummy_instance_id';

export const AOI_SHAPE = {
  polygon: 'Polygon',
  rectangle: 'Rectangle',
};

export const S1_DEFAULT_PARAMS = {
  polarization: Polarization.DV,
  acquisitionMode: AcquisitionMode.IW,
  resolution: Resolution.HIGH,
  orthorectification: '',
  speckleFilter: { type: SpeckleFilterType.NONE },
};

export const reqConfigMemoryCache = {
  cache: {
    expiresIn: Number.POSITIVE_INFINITY,
    targets: [CacheTarget.MEMORY],
  },
};

export const reqConfigGetMap = {
  cache: {
    expiresIn: 86400,
  },
};

export const MAX_SH_IMAGE_SIZE = 2500; // SH services have a limit for a max image size of 2500px*2500px

export const SEARCH_PANEL_TABS = {
  SEARCH_TAB: 0,
  COMMERCIAL_DATA_TAB: 1,
  HIGHLIGHTS_TAB: 2,
};

export const TABS = {
  DISCOVER_TAB: 0,
  VISUALIZE_TAB: 2,
  COMPARE_TAB: 4,
  PINS_TAB: 3,
};

export const DISABLED_ORTHORECTIFICATION = 'DISABLED';

export const ORTHORECTIFICATION_OPTIONS = {
  [DISABLED_ORTHORECTIFICATION]: t`Disabled`,
  [DEMInstanceTypeOrthorectification.MAPZEN]: t`Yes` + ' (Mapzen DEM)',
  [DEMInstanceTypeOrthorectification.COPERNICUS]: t`Yes` + ' (Copernicus 10/30m DEM)',
  [DEMInstanceTypeOrthorectification.COPERNICUS_30]: t`Yes` + ' (Copernicus 30m DEM)',
  [DEMInstanceTypeOrthorectification.COPERNICUS_90]: t`Yes` + ' (Copernicus 90m DEM)',
};

export const DATASOURCES = {
  S1: 'Sentinel-1',
  S2: 'Sentinel-2',
  S3: 'Sentinel-3',
  S5: 'Sentinel-5',
  MODIS: 'MODIS',
  PROBAV: 'Proba-V',
  EOCLOUD_LANDSAT: 'LandsatEOCloud',
  AWS_LANDSAT8: 'Landsat8AWS',
  AWS_LANDSAT15: 'Landsat15AWS',
  AWS_LANDSAT45: 'Landsat45AWS',
  ENVISAT_MERIS: 'Envisat Meris',
  AWS_LANDSAT7_ETM: 'Landsat7ETMAWS',
  GIBS: 'GIBS',
  DEM: 'DEM',
  COPERNICUS: 'Copernicus Services',
  PLANET_NICFI: 'Planet NICFI',
  CUSTOM: 'CUSTOM',
};

export const POWERED_BY_GOOGLE_LABEL = 'powered_by_google_img';

export const defaultEffects = {
  gainEffect: 1,
  gammaEffect: 1,
  redRangeEffect: [0, 1],
  greenRangeEffect: [0, 1],
  blueRangeEffect: [0, 1],
  redCurveEffect: {
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  greenCurveEffect: {
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  blueCurveEffect: {
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  minQa: 50,
  upsampling: '',
  downsampling: '',
  speckleFilter: '',
  orthorectification: '',
};
