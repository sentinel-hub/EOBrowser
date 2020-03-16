import React from 'react';

import Store from '../store';
import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { DATASOURCES, MISSION_DESCRIPTIONS } from '../store/config';
import { getDatesFromGIBS } from '../utils/ajax';

export default class GibsDataSourceHandler extends DataSourceHandler {
  urls = [];
  datasets = [
    'MODIS Terra',
    'MODIS Aqua',
    'VIIRS SNPP Corrected Reflectance',
    'VIIRS SNPP DayNightBand ENCC',
    'CALIPSO Wide Field Camera Radiance v3-01',
    'CALIPSO Wide Field Camera Radiance v3-02',
    'BlueMarble',
    'Landsat WELD',
    'MISR',
    'ASTER GDEM',
  ];
  preselectedDatasets = new Set(['MODIS Terra']);
  searchFilters = {};
  isChecked = false;
  KNOWN_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi';

  willHandle(service, url, name, configs, preselected) {
    if (service !== 'WMTS') {
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
        key={`gibs`}
        label="GIBS"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['GIBS']}
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

    selectedDatasets.forEach(datesetName => {
      const datasource = DATASOURCES.find(ds => ds.name === `GIBS ${datesetName}`);
      fetchingFunctions.push((offset, nResults) =>
        getDatesFromGIBS(fromMoment, toMoment, datasource.id)
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
