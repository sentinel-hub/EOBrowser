import {
  Polarization,
  AcquisitionMode,
  Resolution,
  CacheTarget,
  SpeckleFilterType,
  DEMInstanceTypeOrthorectification,
  BackscatterCoeff,
  DEMInstanceType,
} from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import { DEFAULT_THEMES } from './assets/default_themes.js';
import { EDUCATION_THEMES } from './assets/education_themes.js';
import {
  DEM_COPERNICUS_30,
  DEM_COPERNICUS_90,
} from './Tools/SearchPanel/dataSourceHandlers/dataSourceConstants.js';
import { PlanetPVType } from '@sentinel-hub/sentinelhub-js';
import { PlanetPVId } from '@sentinel-hub/sentinelhub-js';

export const ModalId = {
  ELEVATION_PROFILE: 'ElevationProfile',
  IMG_DOWNLOAD: 'ImgDownload',
  TIMELAPSE: 'Timelapse',
  FIS: 'FIS',
  SHAREPINSLINK: 'SharePinsLink',
  PINS_STORY_BUILDER: 'PinsStoryBuilder',
  TERRAIN_VIEWER: 'TerrainViewer',
  PRIVATE_THEMEID_LOGIN: 'PrivateThemeIdLogin',
  TERMS_AND_PRIVACY_CONSENT: 'TermsAndPrivacy',
  SPECTRAL_EXPLORER: 'SpectralExplorer',
  RESTRICTED_ACCESS: 'RestrictedAccess',
};

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

export const TRANSITION = {
  none: 'none',
  fade: 'fade',
};

export const EXPORT_FORMAT = {
  gif: 'GIF',
  mpeg4: 'MPEG4',
};

export const S1_DEFAULT_PARAMS = {
  polarization: Polarization.DV,
  acquisitionMode: AcquisitionMode.IW,
  resolution: Resolution.HIGH,
  orthorectification: '',
  speckleFilter: { type: SpeckleFilterType.NONE },
  backscatterCoeff: BackscatterCoeff.GAMMA0_ELLIPSOID,
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

export const SEARCH_PANEL_TABS_HASH = {
  [SEARCH_PANEL_TABS.SEARCH_TAB]: '#search',
  [SEARCH_PANEL_TABS.COMMERCIAL_DATA_TAB]: '#commercial-data',
  [SEARCH_PANEL_TABS.HIGHLIGHTS_TAB]: '#highlights',
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

export const BACK_COEF_OPTIONS = [
  BackscatterCoeff.BETA0,
  BackscatterCoeff.GAMMA0_ELLIPSOID,
  BackscatterCoeff.GAMMA0_TERRAIN,
  BackscatterCoeff.SIGMA0_ELLIPSOID,
];

export const DEM_3D_SOURCES = {
  [DEMInstanceType.MAPZEN]: 'Mapzen DEM',
  NASA_ASTER_GDEM: 'NASA ASTER GDEM',
  [DEMInstanceType.COPERNICUS_30]: 'Copernicus 30m DEM',
  [DEMInstanceType.COPERNICUS_90]: 'Copernicus 90m DEM',
};

export const DEM_3D_CUSTOM_TO_DATASOURCE = {
  [DEMInstanceType.COPERNICUS_30]: DEM_COPERNICUS_30,
  [DEMInstanceType.COPERNICUS_90]: DEM_COPERNICUS_90,
};

export const DEM_3D_MAX_ZOOM = {
  [DEMInstanceType.MAPZEN]: 18,
  NASA_ASTER_GDEM: 18,
  [DEMInstanceType.COPERNICUS_30]: 14,
  [DEMInstanceType.COPERNICUS_90]: 14,
};

export const DEFAULT_DEM_SOURCE = DEMInstanceType.MAPZEN;

export const EQUATOR_LENGTH = 40075016.685578488;

export const DATASOURCES = {
  S1: 'Sentinel-1',
  S2: 'Sentinel-2',
  S3: 'Sentinel-3',
  S5: 'Sentinel-5P',
  MODIS: 'MODIS',
  PROBAV: 'Proba-V',
  EOCLOUD_LANDSAT: 'LandsatEOCloud',
  AWS_LANDSAT8: 'Landsat8AWS',
  AWS_LANDSAT15: 'Landsat15AWS',
  AWS_LANDSAT45: 'Landsat45AWS',
  AWS_HLS: 'HLSAWS',
  ENVISAT_MERIS: 'Envisat Meris',
  AWS_LANDSAT7_ETM: 'Landsat7ETMAWS',
  GIBS: 'GIBS',
  DEM: 'DEM',
  COPERNICUS: 'Copernicus Services',
  PLANET_NICFI: 'Planet NICFI',
  CUSTOM: 'CUSTOM',
  OTHER: 'OTHER',
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
  demSource3D: DEMInstanceType.MAPZEN,
};

export const DATAMASK_OUTPUT = 'dataMask';
export const EOBROWSERSTATS_OUTPUT = 'eobrowserStats';
export const ALL_BANDS_OUTPUT = 'bands';
export const STATISTICS_MANDATORY_OUTPUTS = [EOBROWSERSTATS_OUTPUT, DATAMASK_OUTPUT];

export const LOCAL_STORAGE_PRIVACY_CONSENT_KEY = 'eobrowser-privacy-consent';

export const TRANSACTION_TYPE = {
  ORDER: 'ORDER',
  SUBSCRIPTION: 'SUBSCRIPTION',
};

export const OrderType = {
  PRODUCTS: 'PRODUCTS',
  QUERY: 'QUERY',
};

export const FUNCTIONALITY_TEMPORARILY_UNAVAILABLE_MSG =
  'This functionality is temporarily unavailable due to updates. Please try again later.';

export const SH_ACCOUNT_TYPE = {
  FREE: 1,
  TRIAL: 11000,
  EXPLORATION: 12000,
  BASIC: 13000,
  ENTERPRISE: 14000,
  ENTERPRISE_S: 14001,
  ENTERPRISE_L: 14002,
  ROOT: 20000,
};

export const SH_PAYING_ACCOUNT_TYPES = [
  SH_ACCOUNT_TYPE.EXPLORATION,
  SH_ACCOUNT_TYPE.BASIC,
  SH_ACCOUNT_TYPE.ENTERPRISE,
  SH_ACCOUNT_TYPE.ENTERPRISE_S,
  SH_ACCOUNT_TYPE.ENTERPRISE_L,
  SH_ACCOUNT_TYPE.ROOT,
];

// Templates for Planetary Variables user configurations
export const PLANETARY_VARIABLES_TYPE_CONFIGURATION_IDS = {
  [PlanetPVType.BiomassProxy]: 'd8cd73-YOUR-INSTANCEID-HERE',
  [PlanetPVType.LandSurfaceTemperature]: 'e3e9b0-YOUR-INSTANCEID-HERE',
  [PlanetPVType.SoilWaterContent]: '46d34e-YOUR-INSTANCEID-HERE',
};

export const PLANETARY_VARIABLES_ID_CONFIGURATION_IDS = {
  [PlanetPVId.CANOPY_HEIGHT_V1_0_0_30]: 'b1fe05-YOUR-INSTANCEID-HERE',
  [PlanetPVId.CANOPY_COVER_V1_0_0_30]: 'f49d16-YOUR-INSTANCEID-HERE',
  [PlanetPVId.ABOVEGROUND_CARBON_DENSITY_V1_0_0_30]: '9629ce-YOUR-INSTANCEID-HERE',
  [PlanetPVId.DAY_OF_YEAR_V1_0_0_30]: '5d9398-YOUR-INSTANCEID-HERE',
};

export const FATHOM_TRACK_EVENT_LIST = {
  SEARCH_BUTTON: 'Search button clicked',
  COMMERCIAL_SEARCH_BUTTON: 'Commercial search button clicked',
  THEME_OPTION_SELECTED: 'Theme selected',
  HIGHLIGHT_OPTION_SELECTED: 'Highlight selected',
  ADD_TO_PINS_BUTTON: 'Add to Pins button clicked',
  ADD_TO_COMPARE_BUTTON: 'Add to Compare button clicked',
  PIN_OPTION_SELECTED: 'Pin visualized from pins tab',
  RGB_BANDS_CHANGED: 'Bands in custom composite changed',
  INDEX_BANDS_CHANGED: 'Bands in custom index changed',
  CUSTOM_SCRIPT_REFRESH_EVALSCRIPT_BUTTON: 'Refresh evalscript button clicked',
  SHOW_TUTORIAL_BUTTON: 'Tutorial button clicked',
  BASIC_DOWNLOAD_BUTTON: 'Basic download button clicked',
  ANALYTICAL_DOWNLOAD_BUTTON: 'Analytical download button clicked',
  HIGH_RES_DOWNLOAD_BUTTON: 'High-res download button clicked',
  START_TIMELAPSE: 'Create timelapse play button clicked',
  TIMELAPSE_DOWNLOAD_BUTTON: 'Timelapse download button clicked',
  TIMELAPSE_SHARE_BUTTON: 'Timelapse Share button clicked',
  HISTOGRAM_WIDGET: 'Histogram widget clicked and loaded',
  EDUCATION_MODE_SELECTED: 'Education mode selected',
  '2D_MODE_WIDGET': '2D icon clicked',
  '3D_MODE_WIDGET': '3D icon clicked',
  STATISTICAL_INFO_CHART_ICON_CLICKED: 'Statistical info icon clicked',
  SPECTRAL_EXPLORER_CHART_ICON_CLICKED: 'Spectral explorer icon clicked',
  ELEVATION_PROFILE_CHART_ICON_CLICKED: 'Elevation profile icon clicked',
  VISUALIZE_BUTTON: 'Visualize button clicked',
  VISUALIZATION_LAYER_CHANGED: 'Visualization Layer changed',
};
