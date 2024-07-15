import { TPDICollections } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

export const TPDI_PROVIDER_ORDER_WARNINGS = {
  [TPDICollections.AIRBUS_PLEIADES]: null,
  [TPDICollections.AIRBUS_SPOT]: null,
  [TPDICollections.PLANET_SCOPE]: null,
  [TPDICollections.MAXAR_WORLDVIEW]: null,
  [TPDICollections.PLANET_SKYSAT]: t`The minimum area for ordering SkySat data is 25 km². This means that you will be charged 25 km² even for AOIs smaller than 25 km²!`,
};

export const PLANET_SKYSAT_MIN_ORDER_SIZE = 25;

export const GEOCENTO_EARTHIMAGES = 'GEOCENTO_EARTHIMAGES';

export const TPDICollectionsWithLabels = [
  {
    value: TPDICollections.AIRBUS_PLEIADES,
    label: 'Airbus Pleiades',
    requiresQuotas: true,
    requiresPlanetKey: false,
  },
  {
    value: TPDICollections.AIRBUS_SPOT,
    label: 'Airbus SPOT',
    requiresQuotas: true,
    requiresPlanetKey: false,
  },
  {
    value: TPDICollections.MAXAR_WORLDVIEW,
    label: 'Maxar WorldView',
    requiresQuotas: true,
    requiresPlanetKey: false,
  },
  {
    value: TPDICollections.PLANET_ARPS,
    label: 'Planet ARPS',
    requiresQuotas: false,
    requiresPlanetKey: true,
  },
  {
    value: TPDICollections.PLANET_SCOPE,
    label: 'Planet PlanetScope',
    requiresQuotas: false,
    requiresPlanetKey: true,
  },
  {
    value: TPDICollections.PLANET_SKYSAT,
    label: 'Planet SkySat',
    requiresQuotas: false,
    requiresPlanetKey: true,
  },
  {
    value: TPDICollections.PLANETARY_VARIABLES,
    label: 'Planet Planetary Variables',
    requiresQuotas: false,
    requiresPlanetKey: true,
  },
  {
    value: GEOCENTO_EARTHIMAGES,
    label: 'Geocento EarthImages',
    requiresQuotas: true,
    requiresPlanetKey: false,
  },
];
