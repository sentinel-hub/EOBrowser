import React from 'react';
import request from 'axios';
import { DATASET_S2L2A, DATASET_S2L1C } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import DataSourceHandler from './DataSourceHandler';
import Sentinel2SearchGroup from './DatasourceRenderingComponents/searchGroups/Sentinel2SearchGroup';
import Sentinel2Tooltip from './DatasourceRenderingComponents/dataSourceTooltips/Sentinel2Tooltip';
import { FetchingFunction } from '../search';
import { S2L1C, S2L2A } from './dataSourceHandlers';

export default class Sentinel2AWSDataSourceHandler extends DataSourceHandler {
  L1C_BANDS = [
    { name: 'B01', description: t`Band 1 - Coastal aerosol - 443 nm`, color: '#4c17e2' },
    { name: 'B02', description: t`Band 2 - Blue - 490 nm`, color: '#699aff' },
    { name: 'B03', description: t`Band 3 - Green - 560 nm`, color: '#a4d26f' },
    { name: 'B04', description: t`Band 4 - Red - 665 nm`, color: '#e47121' },
    { name: 'B05', description: t`Band 5 - Vegetation Red Edge - 705 nm`, color: '#ba0a0a' },
    { name: 'B06', description: t`Band 6 - Vegetation Red Edge - 740 nm`, color: '#cc1412' },
    { name: 'B07', description: t`Band 7 - Vegetation Red Edge - 783 nm`, color: '#c00607' },
    { name: 'B08', description: t`Band 8 - NIR - 842 nm`, color: '#c31e20' },
    { name: 'B09', description: t`Band 9 - Water vapour - 945 nm`, color: '#b31a1b' },
    { name: 'B10', description: t`Band 10 - SWIR - Cirrus - 1375 nm`, color: '#d71234' },
    { name: 'B11', description: t`Band 11 - SWIR - 1610 nm`, color: '#990134' },
    { name: 'B12', description: t`Band 12 - SWIR - 2190 nm`, color: '#800000' },
    { name: 'B8A', description: t`Band 8A - Vegetation Red Edge - 865 nm`, color: '#bc0e10' },
  ];

  L2A_BANDS = [...this.L1C_BANDS].filter(b => b.name !== 'B10');

  datasetSearchLabels = { [S2L1C]: 'L1C', [S2L2A]: 'L2A (atmospherically corrected)' };
  datasetSearchIds = { [S2L1C]: 'L1C', [S2L2A]: 'L2A' };

  urls = { L2A: [], L1C: [] };
  configs = {};
  datasets = [];
  allLayers = [];
  handlerId = 'S2AWS';
  resultId;
  preselectedDatasets = new Set();
  searchFilters = {};
  isChecked = false;
  datasource = 'Sentinel-2';

  leafletZoomConfig = {
    [S2L1C]: {
      min: 5,
      max: 18,
    },
    [S2L2A]: {
      min: 7,
      max: 18,
    },
  };

  willHandle(service, url, name, layers, preselected) {
    const usesS2L2ADataset = !!layers.find(l => l.dataset && l.dataset.id === DATASET_S2L2A.id);
    const usesS2L1CDataset = !!layers.find(l => l.dataset && l.dataset.id === DATASET_S2L1C.id);
    if (!usesS2L2ADataset && !usesS2L1CDataset) {
      return false;
    }
    if (usesS2L1CDataset && !this.datasets.includes(S2L1C)) {
      this.datasets.push(S2L1C);
      this.urls.L1C.push(url);
    }
    if (usesS2L2ADataset && !this.datasets.includes(S2L2A)) {
      this.datasets.push(S2L2A);
      this.urls.L2A.push(url);
    }
    if (preselected) {
      if (usesS2L1CDataset) {
        this.preselectedDatasets.add(S2L1C);
      }
      if (usesS2L2ADataset) {
        this.preselectedDatasets.add(S2L2A);
      }
    }

    this.allLayers.push(
      ...layers.filter(l => l.dataset && (l.dataset === DATASET_S2L2A || l.dataset === DATASET_S2L1C)),
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
    const preselected = this.preselectedDatasets.size > 0;
    return (
      <Sentinel2SearchGroup
        key={`sentinel-2-aws`}
        label="Sentinel-2"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={<Sentinel2Tooltip />}
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

    const { selectedOptions, maxCC } = this.searchFilters;
    selectedOptions.forEach(datasetId => {
      const searchLayer = this.allLayers.find(l => l.dataset === this.getSentinelHubDataset(datasetId));
      if (searchLayer.maxCloudCoverPercent !== undefined) {
        searchLayer.maxCloudCoverPercent = maxCC;
      }
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
        hasSciHubLink: true,
        tileId: t.meta.tileId,
        getSciHubLink: datasetId === S2L1C ? this.getS2L1CSciHubLink : this.getS2L2ASciHubLink,
        cloudCoverage: t.meta.cloudCoverPercent,
        tileCRS: 'EPSG:4326', //When we search results, this CRS is in accept headers
        MGRSLocation: t.meta.MGRSLocation,
      },
    }));
    return tiles;
  };

  getS2L1CSciHubLink = function(tileId) {
    return request.get(`https://services.sentinel-hub.com/index/s2/v3/tiles/${tileId}`).then(res => {
      return `https://scihub.copernicus.eu/dhus/odata/v1/Products('${
        res.data.product['@ref'].split('/').splice(-1)[0]
      }')/$value`;
    });
  };

  getS2L2ASciHubLink = function(tileId) {
    return request.get(`https://services.sentinel-hub.com/index/s2/v3/processedtiles/${tileId}`).then(res => {
      return `https://scihub.copernicus.eu/dhus/odata/v1/Products('${res.data.productId}')/$value`;
    });
  };

  getBands = datasetId => {
    switch (datasetId) {
      case S2L1C:
        return this.L1C_BANDS;
      case S2L2A:
        return this.L2A_BANDS;
      default:
        return [];
    }
  };

  getUrlsForDataset = datasetId => {
    switch (datasetId) {
      case S2L1C:
        return this.urls.L1C;
      case S2L2A:
        return this.urls.L2A;
      default:
        return [];
    }
  };

  getSentinelHubDataset = datasetId => {
    switch (datasetId) {
      case S2L1C:
        return DATASET_S2L1C;
      case S2L2A:
        return DATASET_S2L2A;
      default:
        return null;
    }
  };

  tilesHaveCloudCoverage() {
    return true;
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

  getResolutionLimits(datasetId) {
    switch (datasetId) {
      case S2L1C:
        return { resolution: 10 };
      case S2L2A:
        return { resolution: 10, fisResolutionCeiling: 1400 };
      default:
        return {};
    }
  }

  supportsInterpolation() {
    return true;
  }
}
