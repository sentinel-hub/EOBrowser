import React from 'react';
import { t } from 'ttag';
import { DATASET_AWS_LTML1, DATASET_AWS_LTML2 } from '@sentinel-hub/sentinelhub-js';

import LandsatDataSourceHandler from './LandsatDataSourceHandler';
import { Landsat45AWSTooltip } from './DatasourceRenderingComponents/dataSourceTooltips/LandsatTooltip';
import { AWS_LTML1, AWS_LTML2 } from './dataSourceHandlers';
import { getGroupedBands } from './datasourceAssets/landsatBands';
import { DATASOURCES } from '../../../const';

export default class Landsat45AWSDataSourceHandler extends LandsatDataSourceHandler {
  urls = { LTML1: [], LTML2: [] };
  datasource = DATASOURCES.AWS_LANDSAT45;
  searchGroupLabel = 'Landsat 4-5 TM';
  searchGroupKey = 'landsat45-aws';
  datasetSearchLabels = {
    [AWS_LTML1]: t`Level 1`,
    [AWS_LTML2]: t`Level 2`,
  };

  leafletZoomConfig = {
    [AWS_LTML1]: {
      min: 9,
      max: 18,
    },
    [AWS_LTML2]: {
      min: 9,
      max: 18,
    },
  };

  knownDatasets = [
    { shDataset: DATASET_AWS_LTML1, datasetId: AWS_LTML1, urlId: 'LTML1' },
    { shDataset: DATASET_AWS_LTML2, datasetId: AWS_LTML2, urlId: 'LTML2' },
  ];

  getDataSourceTooltip() {
    return <Landsat45AWSTooltip />;
  }

  getSibling = (datasetId) => {
    switch (datasetId) {
      case AWS_LTML1:
        return { siblingId: AWS_LTML2, siblingShortName: 'L2' };
      case AWS_LTML2:
        return { siblingId: AWS_LTML1, siblingShortName: 'L1' };
      default:
        return {};
    }
  };

  groupChannels = (datasetId) => getGroupedBands(datasetId);
}
