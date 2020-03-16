import React from 'react';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { getTilesFromSHServiceV3 } from '../utils/ajax';
import { MISSION_DESCRIPTIONS } from '../store/config';

export default class Sentinel2AWSDataSourceHandler extends DataSourceHandler {
  urls = [];
  configs = {};
  datasets = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  isChecked = false;

  willHandle(service, url, name, configs, preselected) {
    const { capabilities } = configs;
    if (service !== 'WMS') {
      return false;
    }
    if (!url.includes('.sentinel-hub.com/ogc/')) {
      return false;
    }
    const usesS2L2ADataset = !!capabilities.datasets.find(d => d.name === 'S2L2A');
    const usesS2L1CDataset = !!capabilities.datasets.find(d => d.name === 'S2L1C');
    if (!usesS2L2ADataset && !usesS2L1CDataset) {
      return false;
    }
    if (usesS2L1CDataset && !this.datasets.includes('L1C')) {
      this.datasets.push('L1C');
    }
    if (usesS2L2ADataset && !this.datasets.includes('L2A')) {
      this.datasets.push('L2A');
    }
    if (preselected) {
      if (usesS2L1CDataset) {
        this.preselectedDatasets.add('L1C');
      }
      if (usesS2L2ADataset) {
        this.preselectedDatasets.add('L2A');
      }
    }

    this.urls.push(url);
    this.configs[url] = configs;
    return true;
  }

  isHandlingAnyUrl() {
    return this.urls.length > 0;
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
      <GenericSearchGroup
        key={`sentinel-2-aws`}
        label="Sentinel-2"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['SENTINEL-2']}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
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
    datasets.forEach(dataset => {
      fetchingFunctions.push((offset, nResults) =>
        getTilesFromSHServiceV3(
          `https://services.sentinel-hub.com/index/v3/collections/S2${dataset}/searchIndex`,
          queryArea,
          fromMoment,
          toMoment,
          nResults,
          maxCC / 100.0,
          offset,
        ).then(({ tiles }) =>
          this._enrichTilesWithLegacyStuffAWS(tiles, `S2${dataset}`, this.urls, this.configs),
        ),
      );
    });
    return fetchingFunctions;
  }
}
