import moment from 'moment';

import { constructV3Evalscript } from '../../../utils';
import { datasetLabels } from './dataSourceHandlers';
import { filterLayers } from './filter';
// DataSourceHandler subclasses take care of:
// - recognizing (WMS / WMTS) URLs as "theirs"
// - fetching additional information from their services as needed
// - displaying search form
// - returning search results corresponding to search input
// - ...

export const DEFAULT_ZOOM_CONFIGURATION = {
  min: undefined,
  max: undefined,
};

export default class DataSourceHandler {
  fetchingFunctions = [];
  FISLayers = {};

  willHandle(service, url, name, configs, preselected) {
    // Returns boolean, indicating if the protocol (typically WMS / WMTS) and URL are
    // supported by this class; that is, this class knows how to handle them.
    // Should remember protocol / url so it can handle the subsequent method invocations.
    // Note that `configs` is an object which can have 2 keys, `capabilities` and `instanceConfig`.
    return false;
  }
  isHandlingAnyUrl() {
    // Returns whether this handler accepted handling of anything.
    return false;
  }
  getSearchFormComponents() {
    return [];
  }

  getLeafletZoomConfig(datasetId) {
    // returns an object containing min and max zoom options for a specific dataset Id
    // if a config object for the provided datasetId is not found it retuns both options as undefined
    if (!datasetId) {
      throw new Error('datasetId not provided.');
    }

    if (this.leafletZoomConfig && this.leafletZoomConfig[datasetId]) {
      return this.leafletZoomConfig[datasetId];
    }

    return DEFAULT_ZOOM_CONFIGURATION;
  }

  prepareNewSearch(fromMoment, toMoment, queryArea = null) {
    this.fetchingFunctions = this.getNewFetchingFunctions(fromMoment, toMoment, queryArea);
    return this.fetchingFunctions;
  }

  getUrlsForDataset(datasetId) {
    return [];
  }

  getLayers = (data, datasetId, url, layersExclude, layersInclude) => {
    let layers = data.filter(layer => filterLayers(layer.layerId, layersExclude, layersInclude));
    layers.forEach(l => {
      l.url = url;
    });
    return layers;
  };

  getBands = () => {
    return [];
  };

  supportsCustomLayer() {
    return true;
  }

  supportsTimeRange() {
    return true;
  }

  supportsTimelapse() {
    return true;
  }

  tilesHaveCloudCoverage() {
    return false;
  }

  updateLayersOnVisualization() {
    return true;
  }

  hasFISLayer() {
    return false;
  }

  supportsMinQa() {
    return false;
  }

  getDefaultMinQa(datasetId) {
    return null;
  }

  supportsInterpolation() {
    return false;
  }

  saveFISLayers(url, layers) {
    this.FISLayers[url] = {};
    for (let datasetId of this.datasets) {
      const shJsDataset = this.getSentinelHubDataset(datasetId);
      const datasetFISLayers = layers
        .filter(l => (l.layerId.startsWith('__FIS_') && l.dataset ? l.dataset === shJsDataset : true))
        .map(l => l.layerId);
      this.FISLayers[url][datasetId] = datasetFISLayers;
    }
  }

  getFISLayer(url, datasetId, layerId) {
    const FISLayerId = `__FIS_${layerId}`;
    if (
      this.FISLayers[url] &&
      this.FISLayers[url][datasetId] &&
      this.FISLayers[url][datasetId].includes(FISLayerId)
    ) {
      return FISLayerId;
    }
    return null;
  }

  getResolutionLimits() {
    return {};
  }

  getMinMaxDates(datasetId) {
    const datasetInfo = this.getSentinelHubDataset(datasetId);
    if (!datasetInfo) {
      return { minDate: null, maxDate: null };
    }
    const minDate = datasetInfo.minDate ? moment(datasetInfo.minDate) : null;
    const maxDate = datasetInfo.maxDate ? moment(datasetInfo.maxDate) : null;
    return { minDate, maxDate };
  }

  generateEvalscript = (bands, dataSetId, config) => {
    return constructV3Evalscript(bands, config);
  };

  getUrl = (links, type) => {
    const link = links.find(l => l.type === type);
    if (link) {
      return link.target;
    }
    return null;
  };

  getDatasetLabel = datasetId => datasetLabels[datasetId];

  supportsV3Evalscript() {
    return true;
  }
}
