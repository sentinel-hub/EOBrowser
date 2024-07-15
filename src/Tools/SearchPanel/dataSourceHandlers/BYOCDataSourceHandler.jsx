import React from 'react';
import { BYOCLayer, DATASET_BYOC, BYOCSubTypes, CRS_EPSG4326 } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';
import moment from 'moment';

import DataSourceHandler from './DataSourceHandler';
import CopernicusServicesDataSourceHandler from './CopernicusServicesDataSourceHandler';
import OthersDataSourceHandler from './OthersDataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import { FetchingFunction } from '../search';
import { filterLayers } from './filter';
import { constructV3Evalscript, isFunction } from '../../../utils';
import { DATASOURCES } from '../../../const';
import { reprojectGeometry } from '../../../utils/reproject';
import { PLANET_SANDBOX_COLLECTIONS } from '../../../assets/protected_themes';

const CRS_EPSG4326_urn = 'urn:ogc:def:crs:EPSG::4326';

export default class BYOCDataSourceHandler extends DataSourceHandler {
  datasetSearchLabels = {};
  datasetSearchIds = {};
  collections = {};

  urls = [];
  datasets = [];
  preselectedDatasets = new Set();
  allLayers = [];
  searchFilters = {};
  isChecked = false;
  datasource = DATASOURCES.CUSTOM;

  leafletZoomConfig = {
    CUSTOM: { min: 0, max: 25 },
  };

  COPERNICUS_SERVICES_KNOWN_COLLECTIONS = new CopernicusServicesDataSourceHandler().getKnownCollectionsList();
  OTHER_KNOWN_COLLECTIONS = new OthersDataSourceHandler().getKnownCollectionsList();

  willHandle(service, url, name, layers, preselected) {
    name = isFunction(name) ? name() : name;
    const customLayers = layers.filter(
      (l) =>
        l instanceof BYOCLayer &&
        l.collectionId &&
        !this.COPERNICUS_SERVICES_KNOWN_COLLECTIONS.includes(l.collectionId) &&
        !this.OTHER_KNOWN_COLLECTIONS.includes(l.collectionId) &&
        !Object.values(PLANET_SANDBOX_COLLECTIONS).includes(l.collectionId),
    );
    if (customLayers.length === 0) {
      return false;
    }
    customLayers.forEach((layer) => {
      this.collections[layer.collectionId] = {
        title: layer.collectionTitle || layer.title,
        url: url,
        themeName: name.replace(t`Based on: `, ''),
        availableBands: layer.availableBands,
        subType: layer.subType,
      };
      // Once collections endpoint will be working properly,
      // title should be replaced with actual collection name (if service will provide such information)
    });

    if (Object.keys(this.collections).length === 0) {
      return;
    }

    this.datasets = Object.keys(this.collections);
    this.datasets.forEach((id) => {
      this.datasetSearchIds[id] = id;
      this.datasetSearchLabels[id] = this.collections[id].title;
    });

    this.urls.push(url);
    this.allLayers.push(...layers);
    this.saveFISLayers(url, layers);
    return true;
  }

  isHandlingAnyUrl() {
    return this.urls.length > 0;
  }

  getSearchFormComponents() {
    if (!this.isHandlingAnyUrl()) {
      return null;
    }
    return (
      <GenericSearchGroup
        key={'CUSTOM'}
        label={this.collections[this.datasets[0]].themeName}
        preselected={false}
        saveCheckedState={this.saveCheckedState}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets.length > 1 ? this.datasets : []}
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
    let datasets;

    if (this.datasets.length === 1) {
      datasets = this.datasets;
    } else {
      datasets = this.searchFilters.selectedOptions;
    }

    datasets.forEach((datasetId) => {
      // InstanceId, layerId and evalscript are required parameters, although we don't need them for findTiles.
      // As we don't have any layer related information at this stage, some dummy values are set for those 3 params to prevent
      // querying configuration service for dataset defaults
      const subType = this.collections[datasetId].subType
        ? this.collections[datasetId].subType
        : BYOCSubTypes.BYOC;
      const searchLayer = new BYOCLayer({
        instanceId: true,
        layerId: true,
        evalscript: '//',
        collectionId: datasetId,
        subType: subType,
      });
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
    const tiles = data.map((t) => {
      if (t.geometry && t.geometry.crs && t.geometry.crs.properties.name !== CRS_EPSG4326_urn) {
        reprojectGeometry(t.geometry, { toCrs: CRS_EPSG4326.authId });
      }
      return {
        sensingTime: moment(t.sensingTime).isValid() ? t.sensingTime : null,
        geometry: t.geometry,
        datasource: this.datasource,
        datasetId: datasetId,
        metadata: {},
      };
    });
    return tiles;
  };

  getUrlsForDataset = () => {
    return this.urls;
  };

  getSentinelHubDataset = () => DATASET_BYOC;

  getResolutionLimits() {
    return { resolution: 0.5 };
  }

  getMinMaxDates() {
    return { minDate: null, maxDate: null };
  }

  getLayers = (data, datasetId, url, layersExclude, layersInclude) => {
    let layers = data.filter((layer) => layer.collectionId === datasetId && filterLayers(layer.layerId));
    layers.forEach((l) => {
      l.url = url;
    });
    return layers;
  };

  supportsCustomLayer(datasetId) {
    const availableBands = this.collections[datasetId].availableBands;
    return availableBands && !!availableBands.length;
  }

  getDatasetLabel = (datasetId) => {
    let collectionLabel;
    const collectionData = this.collections[datasetId];
    if (collectionData) {
      //Use theme name as label if all layers in theme are based on same collection, otherwise use title( at the moment this represents layer name)
      collectionLabel = this.datasets.length === 1 ? collectionData.themeName : collectionData.title;
    }
    return collectionLabel || 'CUSTOM';
  };

  getBands = (datasetId) => {
    return this.collections[datasetId].availableBands;
  };

  generateEvalscript = (bands, dataSetId, config) => {
    // NOTE: changing the format will likely break parseEvalscriptBands method.
    if (config) {
      return constructV3Evalscript(bands, config);
    }

    return `//VERSION=3
function setup() {
  return {
    input: ["${[...new Set(Object.values(bands))].join('","')}", "dataMask"],
    output: { bands: 4 }
  };
}
let factor = 1/2000;
function evaluatePixel(sample) {
  return [${Object.values(bands)
    .map((e) => 'factor * sample.' + e)
    .join(',')}, sample.dataMask ];
}`;
  };

  getLeafletZoomConfig() {
    return this.leafletZoomConfig.CUSTOM;
  }

  supportsInterpolation() {
    return true;
  }

  getCopyrightText = () => '';

  isCopernicus = () => false;

  isSentinelHub = () => true;

  getDatasetParams = (datasetId) => {
    const layer = this.allLayers.find((l) => l.collectionId === datasetId);
    if (layer) {
      return {
        collectionId: datasetId,
        subType: layer.subType,
        locationId: layer.locationId,
      };
    }
    return {};
  };
}
