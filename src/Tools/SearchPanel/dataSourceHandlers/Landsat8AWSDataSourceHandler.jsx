import React from 'react';
import LandsatDataSourceHandler from './LandsatDataSourceHandler';
import { Landsat89AWSTooltip } from './DatasourceRenderingComponents/dataSourceTooltips/LandsatTooltip';
import { DATASET_AWS_L8L1C, DATASET_AWS_LOTL1, DATASET_AWS_LOTL2 } from '@sentinel-hub/sentinelhub-js';
import { AWS_L8L1C, AWS_LOTL1, AWS_LOTL2 } from './dataSourceConstants';
import { DATASOURCES } from '../../../const';

export default class Landsat8AWSDataSourceHandler extends LandsatDataSourceHandler {
  datasource = DATASOURCES.AWS_LANDSAT8;
  searchGroupLabel = 'Landsat 8-9';
  searchGroupKey = 'landsat8-aws';
  knownDatasets = [
    { shDataset: DATASET_AWS_L8L1C, datasetId: AWS_L8L1C, urlId: 'USGS8' },
    { shDataset: DATASET_AWS_LOTL1, datasetId: AWS_LOTL1, urlId: 'LOTL1' },
    { shDataset: DATASET_AWS_LOTL2, datasetId: AWS_LOTL2, urlId: 'LOTL2' },
  ];

  getDataSourceTooltip() {
    return <Landsat89AWSTooltip />;
  }
}
