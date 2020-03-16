import React from 'react';

import Store from '../store';
import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { DATASOURCES, MISSION_DESCRIPTIONS } from '../store/config';
import { getDatesFromProbaV } from '../utils/ajax';

export default class ProbaVDataSourceHandler extends DataSourceHandler {
  urls = [];
  datasets = ['1 day (S1)', '5 day (S5)', '10 day (S10)'];
  preselectedDatasets = new Set(['1 day (S1)']);
  searchFilters = {};
  isChecked = false;
  KNOWN_URL = 'https://proba-v-mep.esa.int/applications/geo-viewer/app/geoserver/ows';

  willHandle(service, url, name, configs, preselected) {
    if (service !== 'WMS') {
      return false;
    }
    if (url !== this.KNOWN_URL) {
      return false;
    }
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
    const preselected = false;
    return (
      <GenericSearchGroup
        key={`proba-v`}
        label="Proba-V"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['PROBAV']}
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

    const selectedDatasets = this.searchFilters.selectedOptions;

    selectedDatasets.forEach(k => {
      const probaDays = k.match(/S(10|5|1)/)[1];
      const datasource = DATASOURCES.find(ds => ds.id === `PROBAV_S${probaDays}`);
      fetchingFunctions.push((offset, nResults) =>
        getDatesFromProbaV(fromMoment, toMoment, datasource.id)
          .then(datesYYYYMMDD => {
            return datesYYYYMMDD.splice(offset, offset + nResults);
          })
          .then(foundDates => {
            const tiles = foundDates.map(d => ({
              datasource: datasource.name,
              time: d,
              sensingTime: d,
              cloudCoverage: -1,
              activeLayer: datasource,
              lat: Store.current.lat,
              lng: Store.current.lng,
            }));
            return tiles;
          }),
      );
    });

    return fetchingFunctions;
  }
}
