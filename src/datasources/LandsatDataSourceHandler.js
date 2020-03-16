import React from 'react';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { getTilesFromSHServiceV3, getTilesFromSHServiceV1Or2 } from '../utils/ajax';
import { MISSION_DESCRIPTIONS, DATASOURCES } from '../store/config';

export default class LandsatDataSourceHandler extends DataSourceHandler {
  urls = [];
  configs = {};
  datasets = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  isChecked = false;

  willHandle(service, url, name, configs, preselected) {
    const { capabilities, instanceConfig } = configs;
    if (service !== 'WMS') {
      return false;
    }

    if (url.includes('.sentinel-hub.com/ogc/')) {
      const usesThisDataset = !!capabilities.datasets.find(d => d.name === 'L8L1C');
      if (!usesThisDataset) {
        return false;
      }
      this.datasets.push('Landsat 8 (USGS archive)');
      if (preselected) {
        this.preselectedDatasets.add('Landsat 8 (USGS archive)');
      }
    } else if (url.includes('.sentinel-hub.com/v1/')) {
      // EOCloud has L5, L7 and L8 datasets:
      let hasLayerWithThisDataset = false;
      ['5', '7', '8'].forEach(k => {
        if (!!instanceConfig.layers.find(l => l.settings.datasourceName === `L${k}`)) {
          this.datasets.push(`Landsat ${k} (ESA archive)`);
          hasLayerWithThisDataset = true;
          if (preselected) {
            this.preselectedDatasets.add(`Landsat ${k} (ESA archive)`);
          }
        }
      });

      if (!hasLayerWithThisDataset) {
        return false;
      }
    } else {
      return false;
    }

    this.urls.push(url);
    this.configs[url] = configs;
    this.datasets = Array.from(new Set(this.datasets)); // make datasets unique
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
    const preselected = false;
    return (
      <GenericSearchGroup
        key={`landsat`}
        label="Landsat"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['LANDSAT']}
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

    const themeDatasource = DATASOURCES.find(d => d.baseUrls.WMS === this.urls[0]);

    datasets.filter(d => d.endsWith('(USGS archive)')).forEach(k => {
      fetchingFunctions.push((offset, nResults) =>
        getTilesFromSHServiceV3(
          `https://services-uswest2.sentinel-hub.com/index/v3/collections/L8L1C/searchIndex`,
          queryArea,
          fromMoment,
          toMoment,
          nResults,
          maxCC / 100.0,
          offset,
        ).then(({ tiles }) =>
          this._enrichTilesWithLegacyStuffAWS(
            tiles,
            'L8L1C',
            this.urls,
            this.configs,
            themeDatasource ? themeDatasource.id : null,
          ),
        ),
      );
    });

    datasets.filter(d => d.endsWith('(ESA archive)')).forEach(k => {
      const landsatNumber = k.match(/[578]/)[0];
      fetchingFunctions.push((offset, nResults) =>
        getTilesFromSHServiceV1Or2(
          `https://eocloud.sentinel-hub.com/index/landsat${landsatNumber}/v2/search`,
          '',
          queryArea,
          fromMoment,
          toMoment,
          nResults,
          maxCC / 100.0,
          offset,
        ).then(({ tiles }) => this._enrichTilesWithLegacyStuffUsingDatasources(tiles, `L${landsatNumber}`)),
      );
    });

    return fetchingFunctions;
  }
}
