import { t } from 'ttag';
import {
  ESA_L5,
  ESA_L7,
  ESA_L8,
  AWS_L8L1C,
  AWS_LOTL1,
  AWS_LOTL2,
  AWS_LTML1,
  AWS_LTML2,
} from '../dataSourceHandlers';

const L5_BANDS = [
  {
    name: 'B01',
    description: t`Band 1 - Blue - 450-515 nm`,
    color: '#699aff',
  },
  {
    name: 'B02',
    description: t`Band 2 - Green - 525-605 nm`,
    color: '#a4d26f',
  },
  {
    name: 'B03',
    description: t`Band 3 - Red - 630-690 nm`,
    color: '#e47121',
  },
  {
    name: 'B04',
    description: t`Band 4 - NIR - 750-900 nm`,
    color: '#c31e20',
  },
  {
    name: 'B05',
    description: t`Band 5 - SWIR-1 - 1550-1750 nm`,
    color: '#990134',
  },
  {
    name: 'B07',
    description: t`Band 7 - SWIR-2 - 2090-2350 nm`,
    color: '#800000',
  },
];

const L7_BANDS = [
  ...L5_BANDS,
  {
    name: 'B08',
    description: t`Band 8 - Panchromatic - 520-900 nm`,
    color: '#800000',
  },
];

export const L8_BANDS = [
  {
    name: 'B01',
    description: t`Band 1 - Coastal/Aerosol - 433-453 nm`,
    color: '#699aff',
  },
  {
    name: 'B02',
    description: t`Band 2 - Blue - 450-515 nm`,
    color: '#699aff',
  },
  {
    name: 'B03',
    description: t`Band 3 - Green - 525-600 nm`,
    color: '#a4d26f',
  },
  {
    name: 'B04',
    description: t`Band 4 - Red - 630-680 nm`,
    color: '#e47121',
  },
  {
    name: 'B05',
    description: t`Band 5 - NIR - 845-885 nm`,
    color: '#c31e20',
  },
  {
    name: 'B06',
    description: t`Band 6 - SWIR-1 - 1560-1660 nm`,
    color: '#990134',
  },
  {
    name: 'B07',
    description: t`Band 7 - SWIR-2 - 2100-2300 nm`,
    color: '#800000',
  },
  {
    name: 'B08',
    description: t`Band 8 - Panchromatic - 500-680 nm`,
    color: '#699aff',
  },
  {
    name: 'B09',
    description: t`Band 9 - Cirrus - 1360-1390 nm`,
    color: '#d71234',
  },
  {
    name: 'B10',
    description: t`Band 10 - Thermal Infrared (TIRS) - 10895 nm`,
    color: '#d51234',
  },
  {
    name: 'B11',
    description: t`Band 11 - Thermal Infrared (TIRS) - 12005 nm`,
    color: '#f76244',
  },
];

const L8_LOTL1_BANDS = [...L8_BANDS];

const L8_LOTL2_BANDS = [
  {
    name: 'B01',
    description: t`Ultra Blue (443 nm)`,
    color: '#699aff',
  },
  {
    name: 'B02',
    description: t`Blue (482 nm)`,
    color: '#699aff',
  },
  {
    name: 'B03',
    description: t`Green (561.5 nm)`,
    color: '#a4d26f',
  },
  {
    name: 'B04',
    description: t`Red (654.5 nm)`,
    color: '#e47121',
  },
  {
    name: 'B05',
    description: t`Near Infrared (NIR) (865 nm)`,
    color: '#c31e20',
  },
  {
    name: 'B06',
    description: t`Shortwave Infrared (SWIR) 1 (1608.5 nm)`,
    color: '#990134',
  },
  {
    name: 'B07',
    description: t`Shortwave Infrared (SWIR) 2 (2200.5 nm)`,
    color: '#800000',
  },

  {
    name: 'B10',
    description: t`Thermal Infrared (TIRS) 1(10895 nm)`,
    color: '#d51234',
  },
];

const L45_BANDS = [
  {
    name: 'B01',
    description: t`Blue (450-520 nm)`,
    color: '#699aff',
  },
  {
    name: 'B02',
    description: t`Green (520-600 nm)`,
    color: '#a4d26f',
  },
  {
    name: 'B03',
    description: t`Red (630-690 nm)`,
    color: '#e47121',
  },
  {
    name: 'B04',
    description: t`Near Infrared (NIR) (760-900 nm)`,
    color: '#c31e20',
  },
  {
    name: 'B05',
    description: t`Shortwave Infrared (SWIR) 1 (1550-1750 nm)`,
    color: '#990134',
  },
  {
    name: 'B06',
    description: t`Thermal Infrared (10400-12500 nm)`,
    color: '#d51234',
  },
  {
    name: 'B07',
    description: t`Shortwave Infrared (SWIR) 2 (2080-2350 nm)`,
    color: '#800000',
  },
];

export const getLandsatBandForDataset = datasetId => {
  switch (datasetId) {
    case ESA_L5:
      return L5_BANDS;
    case ESA_L7:
      return L7_BANDS;
    case ESA_L8:
    case AWS_L8L1C:
      return L8_BANDS;
    case AWS_LOTL1:
      return L8_LOTL1_BANDS;
    case AWS_LOTL2:
      return L8_LOTL2_BANDS;
    case AWS_LTML1:
    case AWS_LTML2:
      return L45_BANDS;
    default:
      return [];
  }
};
export const getGroupedBands = (datasetId, thermalBands = ['B10', 'B11']) => {
  let bands = getLandsatBandForDataset(datasetId);
  if (!bands.length) {
    return;
  }
  return {
    [t`Reflectance`]: bands.filter(c => !thermalBands.includes(c.name)),
    [t`Brightness temperature`]: bands.filter(c => thermalBands.includes(c.name)),
  };
};
