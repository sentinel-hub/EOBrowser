import moment from 'moment';
import { t } from 'ttag';

import {
  AirbusProcessingLevel,
  MaxarSensor,
  PlanetItemType,
  PlanetPVId,
  PlanetPVType,
  PlanetProductBundle,
  PlanetSupportedPVIds,
  PlanetSupportedProductBundles,
  TPDICollections,
  PlanetARPSType,
  PlanetARPSId,
} from '@sentinel-hub/sentinelhub-js';

import { SelectInput } from './SelectInput';
import { SliderInput } from './SliderInput';
import { ToggleInput } from './ToggleInput';
import { createSelectOptions } from '../commercialData.utils';
import { Link } from './Link';
import { TextInput } from './TextInput';

import { GEOCENTO_EARTHIMAGES } from '../const.js';

export const minDateRange = moment.utc('1982-01-01');
export const maxDateRange = moment.utc().add(10, 'years').endOf('year');

export const providerSpecificSearchParameters = {
  [TPDICollections.PLANET_SCOPE]: [
    {
      id: 'itemType',
      label: () => t`Item type`,
      render: SelectInput,
      options: [{ value: PlanetItemType.PSScene, label: PlanetItemType.PSScene }],
    },
    {
      id: 'productBundle',
      label: () => t`Product bundle`,
      render: SelectInput,
      options: createSelectOptions(PlanetProductBundle),
      filterOptions: (option, { itemType }) => PlanetSupportedProductBundles[itemType].includes(option.value),
    },
    {
      id: 'maxCloudCoverage',
      label: () => t`Max. Cloud Coverage`,
      render: SliderInput,
      min: 0,
      max: 100,
      showIcons: false,
      unit: '%',
    },
    {
      id: 'planetApiKey',
      label: () => t`Planet API Key`,
      render: TextInput,
      placeholder: t`Your Planet API key`,
      trialAccount: true,
    },
  ],
  [TPDICollections.PLANET_SKYSAT]: [
    {
      id: 'itemType',
      label: () => t`Item type`,
      render: SelectInput,
      options: [{ value: PlanetItemType.SkySatCollect, label: PlanetItemType.SkySatCollect }],
    },
    {
      id: 'productBundle',
      label: () => t`Product bundle`,
      render: SelectInput,
      options: createSelectOptions(PlanetProductBundle),
      filterOptions: (option, { itemType }) => PlanetSupportedProductBundles[itemType].includes(option.value),
    },
    {
      id: 'maxCloudCoverage',
      label: () => t`Max. Cloud Coverage`,
      render: SliderInput,
      min: 0,
      max: 100,
      showIcons: false,
      unit: '%',
    },
    {
      id: 'planetApiKey',
      label: () => t`Planet API Key`,
      render: TextInput,
      placeholder: t`Your Planet API key`,
      trialAccount: true,
    },
  ],
  [TPDICollections.PLANET_ARPS]: [
    {
      id: 'itemType',
      label: () => t`Source Type`,
      render: SelectInput,
      options: createSelectOptions(PlanetARPSType),
    },
    {
      id: 'id',
      label: () => t`Source ID`,
      render: SelectInput,
      options: createSelectOptions(PlanetARPSId),
    },
  ],
  [TPDICollections.PLANETARY_VARIABLES]: [
    {
      id: 'type',
      label: () => t`Source Type`,
      render: SelectInput,
      options: createSelectOptions(PlanetPVType),
    },
    {
      id: 'id',
      label: () => t`Source ID`,
      render: SelectInput,
      options: createSelectOptions(PlanetPVId),
      filterOptions: (option, { type }) => PlanetSupportedPVIds[type]?.includes(option.value),
    },
  ],
  [TPDICollections.MAXAR_WORLDVIEW]: [
    {
      id: 'maxCloudCoverage',
      label: () => t`Max. Cloud Coverage`,
      render: SliderInput,
      min: 0,
      max: 100,
      showIcons: false,
      unit: '%',
    },
    {
      id: 'advancedOptions',
      label: () => t`Advanced options`,
      render: ToggleInput,
    },
    {
      id: 'minOffNadir',
      label: () => t`Min. Off Nadir`,
      render: SliderInput,
      min: 0,
      max: 45,
      showIcons: false,
      defaultValue: 0,
      advanced: true,
    },
    {
      id: 'maxOffNadir',
      label: () => t`Max. Off Nadir`,
      render: SliderInput,
      min: 0,
      max: 45,
      showIcons: false,
      defaultValue: 45,
      advanced: true,
    },
    {
      id: 'minSunElevation',
      label: () => t`Min. Sun Elevation`,
      render: SliderInput,
      min: 0,
      max: 90,
      showIcons: false,
      unit: '°',
      defaultValue: 0,
      advanced: true,
    },
    {
      id: 'maxSunElevation',
      label: () => t`Max. Sun Elevation`,
      render: SliderInput,
      min: 0,
      max: 90,
      showIcons: false,
      unit: '°',
      defaultValue: 90,
      advanced: true,
    },
    {
      id: 'sensor',
      label: () => t`Sensor`,
      render: SelectInput,
      options: createSelectOptions(MaxarSensor),
      nullValues: true,
      nullValueLabel: 'Any',
      advanced: true,
    },
  ],
  [TPDICollections.AIRBUS_SPOT]: [
    {
      id: 'advancedOptions',
      label: () => t`Advanced options`,
      render: ToggleInput,
    },

    {
      id: 'maxCloudCoverage',
      label: () => t`Max. Cloud Coverage`,
      render: SliderInput,
      min: 0,
      max: 100,
      showIcons: false,
      unit: '%',
      advanced: true,
    },
    {
      id: 'processingLevel',
      label: () => t`Processing Level`,
      render: SelectInput,
      options: createSelectOptions(AirbusProcessingLevel),
      nullValues: true,
      nullValueLabel: 'Default',
      advanced: true,
    },
    {
      id: 'maxSnowCoverage',
      label: () => t`Snow Coverage`,
      render: SliderInput,
      min: 0,
      max: 100,
      unit: '%',
      showIcons: false,
      defaultValue: 100,
      advanced: true,
    },
    {
      id: 'maxIncidenceAngle',
      label: () => t`Incidence Angle`,
      render: SliderInput,
      min: 0,
      max: 90,
      showIcons: false,
      unit: '°',
      defaultValue: 90,
      advanced: true,
    },
  ],
  [TPDICollections.AIRBUS_PLEIADES]: [
    {
      id: 'advancedOptions',
      label: () => t`Advanced options`,
      render: ToggleInput,
    },

    {
      id: 'maxCloudCoverage',
      label: () => t`Max. Cloud Coverage`,
      render: SliderInput,
      min: 0,
      max: 100,
      showIcons: false,
      unit: '%',
      advanced: true,
    },
    {
      id: 'processingLevel',
      label: () => t`Processing Level`,
      render: SelectInput,
      options: createSelectOptions(AirbusProcessingLevel),
      nullValues: true,
      nullValueLabel: 'Default',
      advanced: true,
    },
    {
      id: 'maxSnowCoverage',
      label: () => t`Snow Coverage`,
      render: SliderInput,
      min: 0,
      max: 100,
      unit: '%',
      showIcons: false,
      defaultValue: 100,
      advanced: true,
    },
    {
      id: 'maxIncidenceAngle',
      label: () => t`Incidence Angle`,
      render: SliderInput,
      min: 0,
      max: 90,
      showIcons: false,
      unit: '°',
      defaultValue: 90,
      advanced: true,
    },
  ],
  [GEOCENTO_EARTHIMAGES]: [
    {
      id: 'advancedOptions',
      label: () => t`Data transfer instructions`,
      render: Link,
    },
  ],
};
