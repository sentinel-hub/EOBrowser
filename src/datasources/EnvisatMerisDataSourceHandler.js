import React from 'react';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { getTilesFromSHServiceV1Or2 } from '../utils/ajax';
import { MISSION_DESCRIPTIONS } from '../store/config';
import { DATASOURCES } from '../store/config';

export default class EnvisatMerisDataSourceHandler extends DataSourceHandler {
  urls = [];
  datasets = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  preselected = false;
  isChecked = false;

  willHandle(service, url, name, configs, preselected) {
    const { instanceConfig } = configs;
    if (service !== 'WMS') {
      return false;
    }
    if (url.includes('.sentinel-hub.com/v1/')) {
      const hasEnvisatLayer = !!instanceConfig.layers.find(l => l.settings.datasourceName.startsWith('ENV'));
      if (!hasEnvisatLayer) {
        return false;
      }
    } else {
      return false;
    }

    this.preselected |= preselected;
    this.urls.push(url);
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
        key={`landsat-meris`}
        label="Envisat Meris"
        preselected={this.preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['ENVISAT']}
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

    const datasource = DATASOURCES.find(d => d.baseUrls.WMS === this.urls[0]);

    let fetchingFunctions = [];
    fetchingFunctions.push((offset, nResults) =>
      getTilesFromSHServiceV1Or2(
        'https://eocloud.sentinel-hub.com/index/envisat/v1/search',
        '',
        queryArea,
        fromMoment,
        toMoment,
        nResults,
        1,
        offset,
      ).then(({ tiles }) =>
        this._enrichTilesWithLegacyStuffUsingDatasources(tiles, datasource ? datasource.id : 'ENV'),
      ),
    );
    return fetchingFunctions;
  }
}
