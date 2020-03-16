import React from 'react';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from '../components/search/searchGroups/GenericSearchGroup';
import { getTilesFromSHServiceV3 } from '../utils/ajax';
import { DATASOURCES, MISSION_DESCRIPTIONS } from '../store/config';

export const S5PDATASETS = ['O3', 'NO2', 'SO2', 'CO', 'HCHO', 'CH4', 'AER_AI', 'CLOUD'];

export default class Sentinel5PDataSourceHandler extends DataSourceHandler {
  urls = [];
  datasets = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  isChecked = false;

  willHandle(service, url, name, configs, preselected) {
    const { capabilities } = configs;
    if (service !== 'WMS') {
      return false;
    }

    if (!url.includes('creodias.sentinel-hub.com/ogc/')) {
      return false;
    }

    const s5pLayers = capabilities.layers.filter(l => l.dataset === 'S5PL2');
    if (s5pLayers.length === 0) {
      return false;
    }

    s5pLayers.forEach(l => {
      const dataset = S5PDATASETS.find(d =>
        Sentinel5PDataSourceHandler.isVisualizationLayerForDataset(d, l.id),
      );
      if (!dataset) {
        // if the layer is a channel, do not warn about it:
        const dataset = S5PDATASETS.find(d =>
          Sentinel5PDataSourceHandler.isChannelLayerForDataset(d, l.name),
        );
        if (!dataset) {
          console.warn(`Ignoring ${l.name} - not among supported S-5P datasets.`);
        }
        return;
      }
      this.datasets.push(dataset);
      if (preselected) {
        this.preselectedDatasets.add(dataset);
      }
    });

    this.urls.push(url);
    this.datasets = Array.from(new Set(this.datasets)); // make datasets unique
    return true;
  }

  static isVisualizationLayerForDataset(dataset, layerName) {
    return layerName.startsWith(dataset) && layerName.endsWith('_VISUALIZED');
  }

  static isChannelLayerForDataset(dataset, layerName) {
    switch (dataset) {
      case 'CLOUD':
        return [
          'CLOUD_BASE_HEIGHT',
          'CLOUD_BASE_PRESSURE',
          'CLOUD_FRACTION',
          'CLOUD_OPTICAL_THICKNESS',
          'CLOUD_TOP_HEIGHT',
          'CLOUD_TOP_PRESSURE',
        ].includes(layerName);
      case 'AER_AI':
        return ['AER_AI_340_380', 'AER_AI_354_388'].includes(layerName);
      default:
        return layerName === dataset;
    }
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
        key={`sentinel-5p`}
        label="Sentinel-5P"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={MISSION_DESCRIPTIONS['SENTINEL-5P']}
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

    const datasets = this.searchFilters.selectedOptions;
    datasets.forEach(k => {
      fetchingFunctions.push((offset, nResults) =>
        getTilesFromSHServiceV3(
          `https://creodias.sentinel-hub.com/index/v3/collections/S5PL2/searchIndex`,
          queryArea,
          fromMoment,
          toMoment,
          nResults,
          1.0, // no cloud coverage in S-5P
          offset,
          {
            productType: k,
            type: 'S5PL2',
          },
        ).then(({ tiles }) => {
          // hack until we clean result items format - "enrich" tiles with datasource information:
          const ds =
            DATASOURCES.filter(d => this.urls.includes(d.baseUrls.WMS)).find(ds => ds.id.endsWith(k)) ||
            DATASOURCES.find(ds2 => ds2.id === `S5P${k}`);

          return tiles.map(t => ({
            ...t,
            activeLayer: ds,
            datasource: ds.name,
            dataGeometry: t.tileDrawRegionGeometry,
          }));
        }),
      );
    });
    return fetchingFunctions;
  }
}
