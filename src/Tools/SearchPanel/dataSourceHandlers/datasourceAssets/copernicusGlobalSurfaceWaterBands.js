import { t } from 'ttag';

export const GLOBAL_SURFACE_WATER_BANDS = [
  {
    name: 'change',
    description: t`Changes in water occurrence between two epochs, the first ranging from 1984 to 1999 and the second covering 2000 to 2019.`,
  },
  {
    name: 'extent',
    description: t`Maximum extent of surface water bodies in the 36-year time range.`,
  },
  {
    name: 'occurrence',
    description: t`Intra- and inter-annual frequency of surface water presence in the time range between 1984 and 2019.`,
    color: '',
  },
  {
    name: 'recurrence',
    description: t`Inter-annual variability of surface water presence in a defined water period within the entire time range from 1984 to 2019.`,
  },
  {
    name: 'seasonality',
    description: t`Intra-annual distribution of surface water in 2019.`,
  },
  {
    name: 'transitions',
    description: t`Visualises changes in the three surface water classes (1) not water, (2) seasonal water, and (3) permanent water between the first and last year in the 36-year time period.`,
  },
];
