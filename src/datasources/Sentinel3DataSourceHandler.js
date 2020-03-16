import React from 'react';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { getTilesFromSHServiceV3 } from '../utils/ajax';
import { DATASOURCES, MISSION_DESCRIPTIONS } from '../store/config';
import Sentinel3SLSTRFilters from '../components/search/searchGroups/Sentinel3SLSTRFilters';
import HelpTooltip from '../components/HelpTooltip';

export default class Sentinel3DataSourceHandler extends DataSourceHandler {
  VIEWS = {
    NADIR: 'Nadir',
    OBLIQUE: 'Oblique',
  };
  ORBIT_DIRECTIONS = {
    ASCENDING: 'Ascending',
    DESCENDING: 'Descending',
  };

  urls = [];
  datasets = [];
  preselectedDatasets = new Set();
  configs = {};
  capabilities = {};
  searchFilters = {};
  searchFiltersSLSTR = {}; // SLSTR specific parameters
  isChecked = false;

  willHandle(service, url, name, configs, preselected) {
    const { capabilities } = configs;
    if (service !== 'WMS') {
      return false;
    }
    // Creodias, SLSTR and OLCI:
    if (!url.includes('.sentinel-hub.com/ogc/')) {
      return false;
    }
    const usesS3SLSTRDataset = !!capabilities.layers.find(l => l.dataset === 'S3SLSTR');
    const usesS3OLCIDataset = !!capabilities.layers.find(l => l.dataset === 'S3OLCI');

    if (!usesS3SLSTRDataset && !usesS3OLCIDataset) {
      return;
    }

    if (usesS3SLSTRDataset && !this.datasets.includes('SLSTR')) {
      this.datasets.push('SLSTR');
    }
    if (usesS3OLCIDataset && !this.datasets.includes('OLCI')) {
      this.datasets.push('OLCI');
    }

    if (preselected) {
      if (usesS3SLSTRDataset) {
        this.preselectedDatasets.add('SLSTR');
      }
      if (usesS3OLCIDataset) {
        this.preselectedDatasets.add('OLCI');
      }
    }

    this.urls.push(url);
    this.configs[url] = configs;
    this.capabilities[url] = capabilities;
    return true;
  }

  isHandlingAnyUrl() {
    return this.urls.length > 0;
  }

  saveSearchFilters = searchFilters => {
    this.searchFilters = searchFilters;
  };

  saveSLSTRSearchFilters = searchFilters => {
    this.searchFiltersSLSTR = searchFilters;
  };

  saveCheckedState = checkedState => {
    this.isChecked = checkedState;
  };

  renderOptionsHelpTooltips = option => {
    switch (option) {
      case 'SLSTR':
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <div>
              <b>Sentinel-3 SLSTR</b> provides global and regional Sea and Land Surface Temperature. EO
              Browser provides data acquired in nadir view while descending. Measurements are processed at
              Level 1B and represent top of atmosphere reflectance or brightness temperature.
              <p>
                <b>Spatial resolution:</b> 500m for bands S1 to S6, 1km for bands S7 to S9, F1, and F2.
              </p>
              <p>
                <b>Revisit time:</b> {'<='} 1 day using both satellites.
              </p>
              <p>
                <b>Data availability:</b> Since May 2016.
              </p>
              <p>
                <b>Common usage:</b> Climate change monitoring, vegetation monitoring, active fire detection,
                land and sea surface temperature monitoring. Sentinel-3 SLSTR instrument ensures continuity of
                the Envisat AATSR.
              </p>
            </div>
          </HelpTooltip>
        );
      case 'OLCI':
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <div>
              <b>Sentinel-3 OLCI</b> provides more frequent optical imagery than Sentinel-2 but at lower
              resolution and with more spectral bands to support the ocean, environmental, and climate
              monitoring. EO Browser provides data acquired with the OLCI sensor at full resolution and
              processed at Level 1 reflectance.
              <p>
                <b>Spatial resolution:</b> 300m.
              </p>
              <p>
                <b>Revisit time:</b> {'<='} 2 days using both satellites.
              </p>
              <p>
                <b>Data availability:</b> Since May 2016.
              </p>
              <p>
                <b>Common usage:</b> Surface topography observations, ocean and land surface colour
                observation and monitoring. The Sentinel-3 OLCI instrument ensures the continuity of Envisat
                Meris.
              </p>
            </div>
          </HelpTooltip>
        );
      default:
        return null;
    }
  };

  getSearchFormComponents() {
    if (!this.isHandlingAnyUrl()) {
      return null;
    }
    return (
      <GenericSearchGroup
        key={`sentinel-3`}
        label="Sentinel-3"
        preselected={false}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['SENTINEL-3']}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        preselectedOptions={Array.from(this.preselectedDatasets)}
        hasMaxCCFilter={false}
        renderOptionsFilters={option => {
          // SLSTR allows additional filters:
          if (option === 'SLSTR') {
            return (
              <Sentinel3SLSTRFilters
                saveFiltersValues={this.saveSLSTRSearchFilters}
                views={this.VIEWS}
                orbitDirections={this.ORBIT_DIRECTIONS}
              />
            );
          }
          return null;
        }}
        renderOptionsHelpTooltips={this.renderOptionsHelpTooltips}
      />
    );
  }

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    let fetchingFunctions = [];

    const datasets = this.searchFilters.selectedOptions;
    datasets.forEach(dataset => {
      const { maxCC, views, orbitDirections } = this.searchFiltersSLSTR;
      // both views and orbitDirections should only be specified in datasetParameters if exactly one of the
      // options was checked - otherwise we don't limit search:
      let datasetParameters = {
        type: undefined,
      };
      if (dataset === 'OLCI') {
        datasetParameters = {
          type: 'S3',
        };
      } else if (dataset === 'SLSTR') {
        datasetParameters = {
          type: 'S3SLSTR',
        };
        if (views.length === 1) {
          datasetParameters['view'] = views[0];
        }
        if (orbitDirections.length === 1) {
          datasetParameters['orbitDirection'] = orbitDirections[0];
        }
      }

      fetchingFunctions.push((offset, nResults) =>
        getTilesFromSHServiceV3(
          `https://creodias.sentinel-hub.com/index/v3/collections/S3${dataset}/searchIndex`,
          queryArea,
          fromMoment,
          toMoment,
          nResults,
          maxCC / 100.0,
          offset,
          datasetParameters,
        ).then(({ tiles }) => {
          // "enrich" tiles with datasource information
          // We check for the url in themes; if the dataset id in themes is among the default
          // the specific one is used - it comes from a custom theme instance.
          const ds1 = DATASOURCES.find(ds2 => ds2.id === `S3${dataset}`);
          const ds2 = DATASOURCES.find(
            d => this.urls.includes(d.baseUrls.WMS) && d.id.startsWith(`S3${dataset}`),
          );
          const ds = !['S3OLCI', 'S3SLSTR'].includes(ds2.id) ? ds2 : ds1;

          return tiles.map(t => ({
            ...t,
            activeLayer: ds,
            datasource: ds.name,
            cloudCoverage: t.cloudCoverPercentage === undefined ? -1 : Math.round(t.cloudCoverPercentage),
          }));
        }),
      );
    });
    return fetchingFunctions;
  }

  static isSLSTRBand = layerId => {
    const allBands = [
      'S1',
      'S2',
      'S3',
      'S4',
      'S5',
      'S6',
      'S7',
      'S8',
      'S9',
      'F1',
      'F2',
      'CLOUD_FRACTION',
      'SEA_ICE_FRACTION',
      'SEA_SURFACE_TEMPERATURE',
      'DEW_POINT',
      'SKIN_TEMPERATURE',
      'SNOW_ALBEDO',
      'SNOW_DEPTH',
      'SOIL_WETNESS',
      'TEMPERATURE',
      'TOTAL_COLUMN_OZONE',
      'TOTAL_COLUMN_WATER_VAPOR',
    ];
    return allBands.includes(layerId);
  };

  static groupChannels = channels => {
    // With S-3 SLSTR, custom layer configuration is a bit more complex - some bands can be mixed while others
    // can't be.
    const groupedBands = {
      Reflectance: channels.filter(c => ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(c.name)),
      'Brightness temperature': channels.filter(c => ['S7', 'S8', 'S9', 'F1', 'F2'].includes(c.name)),
      'Auxiliary meteorological data': channels.filter(c =>
        [
          'CLOUD_FRACTION',
          'SEA_ICE_FRACTION',
          'SEA_SURFACE_TEMPERATURE',
          'DEW_POINT',
          'SKIN_TEMPERATURE',
          'SNOW_ALBEDO',
          'SNOW_DEPTH',
          'SOIL_WETNESS',
          'TEMPERATURE',
          'TOTAL_COLUMN_OZONE',
          'TOTAL_COLUMN_WATER_VAPOR',
        ].includes(c.name),
      ),
    };
    return groupedBands;
  };
}
