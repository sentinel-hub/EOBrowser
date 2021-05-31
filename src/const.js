import { Polarization, AcquisitionMode, Resolution } from '@sentinel-hub/sentinelhub-js';
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

export const S1_DEFAULT_PARAMS = {
  polarization: Polarization.DV,
  acquisitionMode: AcquisitionMode.IW,
  resolution: Resolution.HIGH,
  orthorectification: '',
};
