import React from 'react';
import axios from 'axios';
import moment from 'moment';
import { t } from 'ttag';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import ProbaVTooltip from './DatasourceRenderingComponents/dataSourceTooltips/ProbaVTooltip';
import { FetchingFunction } from '../search';
import { PROBAV_S1, PROBAV_S5, PROBAV_S10 } from './dataSourceHandlers';
import { filterLayers } from './filter';

export default class ProbaVDataSourceHandler extends DataSourceHandler {
  urls = [];
  datasets = [PROBAV_S1, PROBAV_S5, PROBAV_S10];
  preselectedDatasets = new Set([PROBAV_S1]);
  datasetSearchLabels = {
    [PROBAV_S1]: t`1 day (S1)`,
    [PROBAV_S5]: t`5 day (S5)`,
    [PROBAV_S10]: t`10 day (S10)`,
  };
  datasetSearchIds = { [PROBAV_S1]: 'PROBAV_S1', [PROBAV_S5]: 'PROBAV_S5', [PROBAV_S10]: 'PROBAV_S10' };
  searchFilters = {};
  isChecked = false;
  KNOWN_URL = 'https://proba-v-mep.esa.int/applications/geo-viewer/app/geoserver/ows';
  allResults = null;
  datasource = 'Proba-V';

  leafletZoomConfig = {
    [PROBAV_S1]: {
      min: 1,
      max: 18,
    },
    [PROBAV_S5]: {
      min: 1,
      max: 18,
    },
    [PROBAV_S10]: {
      min: 1,
      max: 18,
    },
  };

  willHandle(service, url, name, configs, preselected) {
    if (url !== this.KNOWN_URL) {
      return false;
    }
    this.urls.push(url);
    this.allLayers = configs;
    return true;
  }

  isHandlingAnyUrl() {
    return this.urls.length > 0;
  }

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
        dataSourceTooltip={<ProbaVTooltip />}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        optionsLabels={this.datasetSearchLabels}
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

    selectedDatasets.forEach(selectedDataset => {
      // Performance optimization - instead of WMS GetCapabilities request:
      //   const url = `${this.KNOWN_URL}?SERVICE=WMS&REQUEST=GetCapabilities&time=${new Date().valueOf()}`;
      // we use a cached version:
      const url = 'https://eob-getcapabilities-cache.s3.eu-central-1.amazonaws.com/probav.xml';
      const func = this.getResultsFromProbaV;
      const ff = new FetchingFunction(
        selectedDataset,
        null,
        fromMoment,
        toMoment,
        queryArea,
        this.convertToStandardTiles,
        {
          url: url,
          searchFunction: func,
          searchParams: { datasetId: this.datasetSearchIds[selectedDataset] },
        },
      );
      fetchingFunctions.push(ff);
    });

    return fetchingFunctions;
  }

  getResultsFromProbaV = async (
    url,
    mapBounds,
    fromMoment,
    toMoment,
    datasetId,
    convertToStandardTiles,
    maxCount = 50,
    offset = 0,
    params = {},
  ) => {
    const datasourceId = params.datasetId;
    let allLayers;

    if (this.allResults) {
      allLayers = this.allResults;
    } else {
      const capabilities = await axios.get(url).then(r => {
        return r.data;
      });
      const parseString = require('xml2js').parseString;
      const data = await new Promise((resolve, reject) =>
        parseString(capabilities, function(err, result) {
          if (err) reject(err);
          else resolve(result);
        }),
      );

      allLayers = {};
      for (let l in data.WMS_Capabilities.Capability[0].Layer[0].Layer) {
        let currLayer = data.WMS_Capabilities.Capability[0].Layer[0].Layer[l];

        let dimension = {};
        for (let d in currLayer.Dimension) {
          dimension[d] = {
            name: currLayer.Dimension[d]['$'].name,
            default: currLayer.Dimension[d]['$'].default,
            unitSymbol: currLayer.Dimension[d]['$'].unitSymbol ? currLayer.Dimension[d]['$'].unitSymbol : '',
            units: currLayer.Dimension[d]['$'].units ? currLayer.Dimension[d]['$'].units : '',
            values: currLayer.Dimension[d]['_'].split(','),
          };
        }

        allLayers[l] = {
          name: currLayer.Name[0],
          dimension: dimension,
        };
      }
      this.allResults = allLayers;
    }

    const applicableLayer = Object.values(allLayers).find(l => l.name.startsWith(`${datasourceId}_`)); //All layers with the same probaDay have the same dates, so we take the first one
    const allDates = applicableLayer.dimension[0].values.map(d => moment(d));

    const filteredDates = allDates.filter(d => d.isBetween(fromMoment, toMoment));
    filteredDates.sort((a, b) => b.diff(a));
    const foundDates = filteredDates.map(d => d.toISOString());
    const datesForOffset = foundDates.slice(offset, foundDates.length);
    const tiles = convertToStandardTiles(datesForOffset, datasetId);
    const hasMore = filteredDates.length > offset + datesForOffset.length ? true : false;
    return { tiles, hasMore };
  };

  convertToStandardTiles = (data, datasetId) => {
    return data.map(d => ({
      datasetId,
      datasource: this.datasource,
      sensingTime: d,
      metadata: {},
    }));
  };

  getUrlsForDataset = () => {
    return this.urls;
  };

  getSentinelHubDataset = () => {
    return null;
  };

  getLayers = (data, datasetId, url, layersExclude, layersInclude) => {
    let layers = data.filter(
      layer =>
        filterLayers(layer.layerId, layersExclude, layersInclude) &&
        this.filterLayersProbaV(layer.layerId, datasetId),
    );
    layers.forEach(l => {
      l.url = url;
    });
    return layers;
  };

  filterLayersProbaV = (layerId, datasetId) => {
    switch (datasetId) {
      case PROBAV_S1:
        return ['PROBAV_S1_TOA_333M', 'PROBAV_S1_TOC_333M'].includes(layerId);
      case PROBAV_S5:
        return ['PROBAV_S5_TOA_100M', 'PROBAV_S5_TOC_100M', 'PROBAV_S5_TOC_100M_NIR'].includes(layerId);
      case PROBAV_S10:
        return ['PROBAV_S10_TOC_333M', 'PROBAV_S10_TOC_333M_NIR'].includes(layerId);
      default:
        return true;
    }
  };

  supportsCustomLayer() {
    return false;
  }

  updateLayersOnVisualization() {
    return false;
  }

  supportsV3Evalscript() {
    return false;
  }

  supportsIndex = () => {
    return false;
  };

  getCopyrightText = () => '';

  isCopernicus = () => false;

  isSentinelHub = () => false;
}
