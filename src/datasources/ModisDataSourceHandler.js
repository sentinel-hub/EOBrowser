import React from 'react';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { getTilesFromSHServiceV3 } from '../utils/ajax';
import { MISSION_DESCRIPTIONS } from '../store/config';

export default class ModisDataSourceHandler extends DataSourceHandler {
  urls = [];
  configs = {};
  datasets = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  preselected = false;
  isChecked = false;

  willHandle(service, url, name, configs, preselected) {
    const { capabilities } = configs;
    if (service !== 'WMS') {
      return false;
    }
    if (!url.includes('.sentinel-hub.com/ogc/')) {
      return false;
    }
    const usesDataset = !!capabilities.datasets.find(d => d.name === 'MODIS');
    if (!usesDataset) {
      return false;
    }

    this.preselected |= preselected;
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
    return (
      <GenericSearchGroup
        key={`modis`}
        label="MODIS"
        preselected={this.preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['MODIS']}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        preselectedOptions={Array.from(this.preselectedDatasets)}
        hasMaxCCFilter={false}
      />
    );
  }

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    let fetchingFunctions = [];
    fetchingFunctions.push((offset, nResults) =>
      getTilesFromSHServiceV3(
        'https://services-uswest2.sentinel-hub.com/index/v3/collections/MODIS/searchIndex',
        queryArea,
        fromMoment,
        toMoment,
        nResults,
        1.0,
        offset,
      ).then(({ tiles }) => this._enrichTilesWithLegacyStuffAWS(tiles, 'MODIS', this.urls, this.configs)),
    );
    return fetchingFunctions;
  }
}
