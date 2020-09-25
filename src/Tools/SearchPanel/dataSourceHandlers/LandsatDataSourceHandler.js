import React from 'react';
import {
  DATASET_EOCLOUD_LANDSAT5,
  DATASET_EOCLOUD_LANDSAT7,
  DATASET_EOCLOUD_LANDSAT8,
  DATASET_AWS_L8L1C,
} from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import LandsatTooltip from './DatasourceRenderingComponents/dataSourceTooltips/LandsatTooltip';
import { FetchingFunction } from '../search';
import { constructBasicEvalscript, constructV3Evalscript } from '../../../utils';
import { ESA_L5, ESA_L7, ESA_L8, AWS_L8L1C } from './dataSourceHandlers';

export default class LandsatDataSourceHandler extends DataSourceHandler {
  L5_BANDS = [
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

  L7_BANDS = [
    ...this.L5_BANDS,
    {
      name: 'B08',
      description: t`Band 8 - Panchromatic - 520-900 nm`,
      color: '#800000',
    },
  ];

  L8_BANDS = [
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
  ];
  urls = { ESA5: [], ESA7: [], ESA8: [], USGS8: [] };
  datasetSearchLabels = {
    [ESA_L5]: t`Landsat 5 (ESA archive)`,
    [ESA_L7]: t`Landsat 7 (ESA archive)`,
    [ESA_L8]: t`Landsat 8 (ESA archive)`,
    [AWS_L8L1C]: t`Landsat 8 (USGS archive)`,
  };
  allLayers = [];
  datasets = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  isChecked = false;
  datasource = 'Landsat';

  leafletZoomConfig = {
    [ESA_L5]: {
      min: 10,
      max: 18,
    },
    [ESA_L7]: {
      min: 10,
      max: 18,
    },
    [ESA_L8]: {
      min: 10,
      max: 18,
    },
    [AWS_L8L1C]: {
      min: 9,
      max: 18,
    },
  };

  willHandle(service, url, name, layers, preselected) {
    if (layers.find(l => l.dataset === DATASET_AWS_L8L1C)) {
      this.datasets.push(AWS_L8L1C);
      this.urls.USGS8.push(url);
      if (preselected) {
        this.preselectedDatasets.add(AWS_L8L1C);
      }
    } else if (layers.find(l => l.dataset === DATASET_EOCLOUD_LANDSAT5)) {
      this.datasets.push(ESA_L5);
      this.urls.ESA5.push(url);
      if (preselected) {
        this.preselectedDatasets.add(ESA_L5);
      }
    } else if (layers.find(l => l.dataset === DATASET_EOCLOUD_LANDSAT7)) {
      this.datasets.push(ESA_L7);
      this.urls.ESA7.push(url);
      if (preselected) {
        this.preselectedDatasets.add(ESA_L7);
      }
    } else if (layers.find(l => l.dataset === DATASET_EOCLOUD_LANDSAT8)) {
      this.datasets.push(ESA_L8);
      this.urls.ESA8.push(url);
      if (preselected) {
        this.preselectedDatasets.add(ESA_L8);
      }
    } else {
      return false;
    }

    this.datasets = Array.from(new Set(this.datasets)); // make datasets unique
    this.allLayers.push(
      ...layers.filter(l =>
        [
          DATASET_AWS_L8L1C,
          DATASET_EOCLOUD_LANDSAT5,
          DATASET_EOCLOUD_LANDSAT7,
          DATASET_EOCLOUD_LANDSAT8,
        ].includes(l.dataset),
      ),
    );
    this.saveFISLayers(url, layers);
    return true;
  }

  isHandlingAnyUrl() {
    return Object.values(this.urls).flat().length > 0;
  }

  saveSearchFilters = searchFilters => {
    this.searchFilters = searchFilters;
  };

  saveCheckedState = checkedState => {
    this.isChecked = checkedState;
  };

  getSearchFormComponents() {
    if (!this.isHandlingAnyUrl()) {
      return null;
    }
    const preselected = false;
    return (
      <GenericSearchGroup
        key={`landsat`}
        label="Landsat"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={<LandsatTooltip />}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        optionsLabels={this.datasetSearchLabels}
        preselectedOptions={Array.from(this.preselectedDatasets)}
        hasMaxCCFilter={true}
      />
    );
  }

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    let fetchingFunctions = [];

    const datasets = this.searchFilters.selectedOptions;
    const maxCC = this.searchFilters.maxCC;

    datasets.forEach(datasetId => {
      let searchLayer = this.allLayers.find(l => l.dataset === this.getSentinelHubDataset(datasetId));
      searchLayer.maxCloudCoverPercent = maxCC;

      const ff = new FetchingFunction(
        datasetId,
        searchLayer,
        fromMoment,
        toMoment,
        queryArea,
        this.convertToStandardTiles,
      );
      fetchingFunctions.push(ff);
    });

    return fetchingFunctions;
  }

  convertToStandardTiles = (data, datasetId) => {
    const tiles = data.map(t => ({
      sensingTime: t.sensingTime,
      geometry: t.geometry,
      datasource: this.datasource,
      datasetId,
      metadata: {
        previewUrl: this.getUrl(t.links, 'preview'),
        AWSPath: this.getUrl(t.links, 'aws'),
        EOCloudPath: this.getUrl(t.links, 'eocloud'),
        sunElevation: t.meta.sunElevation,
        cloudCoverage: t.meta.cloudCoverPercent,
      },
    }));
    return tiles;
  };

  getUrlsForDataset = datasetId => {
    switch (datasetId) {
      case ESA_L5:
        return this.urls.ESA5;
      case ESA_L7:
        return this.urls.ESA7;
      case ESA_L8:
        return this.urls.ESA8;
      case AWS_L8L1C:
        return this.urls.USGS8;
      default:
        return [];
    }
  };

  getBands = datasetId => {
    switch (datasetId) {
      case ESA_L5:
        return this.L5_BANDS;
      case ESA_L7:
        return this.L7_BANDS;
      case ESA_L8:
      case AWS_L8L1C:
        return this.L8_BANDS;
      default:
        return [];
    }
  };

  getSentinelHubDataset = datasetId => {
    switch (datasetId) {
      case ESA_L5:
        return DATASET_EOCLOUD_LANDSAT5;
      case ESA_L7:
        return DATASET_EOCLOUD_LANDSAT7;
      case ESA_L8:
        return DATASET_EOCLOUD_LANDSAT8;
      case AWS_L8L1C:
        return DATASET_AWS_L8L1C;
      default:
        return null;
    }
  };

  generateEvalscript = (bands, datasetId, config) => {
    switch (datasetId) {
      case ESA_L5:
      case ESA_L7:
      case ESA_L8:
        return constructBasicEvalscript(bands, config);
      case AWS_L8L1C:
        return constructV3Evalscript(bands, config);
      default:
        return '';
    }
  };

  tilesHaveCloudCoverage() {
    return true;
  }

  getResolutionLimits(datasetId) {
    switch (datasetId) {
      case ESA_L5:
      case ESA_L7:
      case ESA_L8:
        return { resolution: 1 };
      case AWS_L8L1C:
        return { resolution: 30, fisResolutionCeiling: 1490 };
      default:
        return {};
    }
  }

  getFISLayer(url, datasetId, layerId, isCustom) {
    if (isCustom) {
      return true;
    }
    return super.getFISLayer(url, datasetId, layerId);
  }

  hasFISLayer(url, datasetId, layerId, isCustom) {
    return !!this.getFISLayer(url, datasetId, layerId, isCustom);
  }

  supportsInterpolation() {
    return true;
  }

  supportsV3Evalscript(datasetId) {
    if (datasetId === AWS_L8L1C) {
      return true;
    }
    return false;
  }
}
