import React from 'react';
import { DATASET_S5PL2, S5PL2Layer } from '@sentinel-hub/sentinelhub-js';

import { t } from 'ttag';
import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import {
  Sentinel5Tooltip,
  S5O3Tooltip,
  S5NO2Tooltip,
  S5SO2Tooltip,
  S5COTooltip,
  S5HCHOTooltip,
  S5CH4Tooltip,
  S5AERAITooltip,
  S5CloudTooltip,
} from './DatasourceRenderingComponents/dataSourceTooltips/Sentinel5Tooltip';
import { FetchingFunction } from '../search';
import {
  S5_O3,
  S5_NO2,
  S5_SO2,
  S5_CO,
  S5_HCHO,
  S5_CH4,
  S5_AER_AI,
  S5_CLOUD,
  S5_OTHER,
} from './dataSourceConstants';
import { filterLayers } from './filter';
import { DATASOURCES } from '../../../const';
import { getS5ProductType } from './datasourceAssets/getS5ProductType';
import HelpTooltip from './DatasourceRenderingComponents/HelpTooltip';

export default class Sentinel5PDataSourceHandler extends DataSourceHandler {
  S5PDATASETS = [S5_O3, S5_NO2, S5_SO2, S5_CO, S5_HCHO, S5_CH4, S5_AER_AI, S5_CLOUD];

  getDatasetSearchLabels = () => ({
    [S5_O3]: t`O3 (Ozone)`,
    [S5_NO2]: t`NO2 (Nitrogen dioxide)`,
    [S5_SO2]: t`SO2 (Sulfur dioxide)`,
    [S5_CO]: t`CO (Carbon monoxide)`,
    [S5_HCHO]: t`HCHO (Formaldehyde)`,
    [S5_CH4]: t`CH4 (Methane)`,
    [S5_AER_AI]: t`AER AI (Aerosol Index)`,
    [S5_CLOUD]: t`Cloud`,
    [S5_OTHER]: t`Other`,
  });
  datasetSearchIds = {
    [S5_O3]: 'O3',
    [S5_NO2]: 'NO2',
    [S5_SO2]: 'SO2',
    [S5_CO]: 'CO',
    [S5_HCHO]: 'HCHO',
    [S5_CH4]: 'CH4',
    [S5_AER_AI]: 'AER_AI',
    [S5_CLOUD]: 'CLOUD',
    [S5_OTHER]: 'Other',
  };

  urls = [];
  datasets = [];
  otherLayers = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  isChecked = false;
  datasource = DATASOURCES.S5;

  leafletZoomConfig = {
    [S5_O3]: {
      min: 3,
      max: 19,
    },
    [S5_NO2]: {
      min: 3,
      max: 19,
    },
    [S5_SO2]: {
      min: 3,
      max: 19,
    },
    [S5_CO]: {
      min: 3,
      max: 19,
    },
    [S5_HCHO]: {
      min: 3,
      max: 19,
    },
    [S5_CH4]: {
      min: 3,
      max: 19,
    },
    [S5_AER_AI]: {
      min: 3,
      max: 19,
    },
    [S5_CLOUD]: {
      min: 3,
      max: 19,
    },
    [S5_OTHER]: {
      min: 3,
      max: 19,
    },
  };

  willHandle(service, url, name, layers, preselected) {
    const s5pLayers = layers.filter((l) => l.dataset && l.dataset.id === DATASET_S5PL2.id);
    if (s5pLayers.length === 0) {
      return false;
    }

    s5pLayers.forEach((l) => {
      let dataset = this.S5PDATASETS.find((d) => this.isVisualizationLayerForDataset(d, l.layerId));
      if (!dataset) {
        // if the layer is a channel, do not warn about it:
        const channel = this.S5PDATASETS.find((d) => this.isChannelLayerForDataset(d, l.title));
        if (!channel) {
          if (l.title.startsWith('__')) {
            // It's a shadow layer
            console.warn(`Ignoring ${l.title} - not among supported S-5P datasets.`);
            return;
          }
          dataset = S5_OTHER;
          this.otherLayers.push(l);
        } else {
          return;
        }
      }
      this.datasets.push(dataset);
      if (preselected) {
        this.preselectedDatasets.add(dataset);
      }
    });

    this.urls.push(url);
    this.datasets = Array.from(new Set(this.datasets)); // make datasets unique
    this.saveFISLayers(url, layers);
    return true;
  }

  isVisualizationLayerForDataset(dataset, layerTitle) {
    return layerTitle.startsWith(this.datasetSearchIds[dataset]) && layerTitle.endsWith('_VISUALIZED');
  }

  isChannelLayerForDataset(dataset, layerTitle) {
    switch (dataset) {
      case S5_CLOUD:
        return [
          'CLOUD_BASE_HEIGHT',
          'CLOUD_BASE_PRESSURE',
          'CLOUD_FRACTION',
          'CLOUD_OPTICAL_THICKNESS',
          'CLOUD_TOP_HEIGHT',
          'CLOUD_TOP_PRESSURE',
        ].includes(layerTitle);
      case S5_AER_AI:
        return ['AER_AI_340_380', 'AER_AI_354_388'].includes(layerTitle);
      default:
        return layerTitle === this.datasetSearchIds[dataset];
    }
  }

  renderOptionsHelpTooltips = (option) => {
    switch (option) {
      case S5_O3:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5O3Tooltip />
          </HelpTooltip>
        );
      case S5_NO2:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5NO2Tooltip />
          </HelpTooltip>
        );
      case S5_SO2:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5SO2Tooltip />
          </HelpTooltip>
        );
      case S5_CO:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5COTooltip />
          </HelpTooltip>
        );
      case S5_HCHO:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5HCHOTooltip />
          </HelpTooltip>
        );
      case S5_CH4:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5CH4Tooltip />
          </HelpTooltip>
        );
      case S5_AER_AI:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5AERAITooltip />
          </HelpTooltip>
        );
      case S5_CLOUD:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S5CloudTooltip />
          </HelpTooltip>
        );
      default:
        return null;
    }
  };

  isHandlingAnyUrl() {
    return this.urls.length > 0;
  }

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
        dataSourceTooltip={<Sentinel5Tooltip />}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        optionsLabels={this.getDatasetSearchLabels()}
        preselectedOptions={Array.from(this.preselectedDatasets)}
        hasMaxCCFilter={false}
        renderOptionsHelpTooltips={this.renderOptionsHelpTooltips}
      />
    );
  }
  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    let fetchingFunctions = [];
    let datasets;

    const isOtherSelected = this.searchFilters.selectedOptions.includes(S5_OTHER);
    if (isOtherSelected) {
      datasets = this.S5PDATASETS;
    } else {
      datasets = this.searchFilters.selectedOptions;
    }

    datasets.forEach((datasetId) => {
      // instanceId and layerId are required parameters, although we don't need them for findTiles
      const searchLayer = new S5PL2Layer({
        instanceId: true,
        layerId: true,
        productType: this.datasetSearchIds[datasetId],
      });
      const ff = new FetchingFunction(
        isOtherSelected ? S5_OTHER : datasetId,
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
    const tiles = data.map((t) => ({
      sensingTime: t.sensingTime,
      geometry: t.geometry,
      datasource: this.datasource,
      datasetId,
      metadata: {
        creoDIASPath: this.getUrl(t.links, 'creodias'),
        isS5: true,
      },
    }));
    return tiles;
  };

  getUrlsForDataset = () => {
    return this.urls;
  };

  getLayers = (data, datasetId, url, layersExclude, layersInclude) => {
    let layers = data.filter(
      (layer) =>
        filterLayers(layer.layerId, layersExclude, layersInclude) &&
        this.filterLayersS5(layer.layerId, datasetId),
    );
    layers.forEach((l) => {
      l.url = url;
    });
    return layers;
  };

  filterLayersS5 = (layerId, datasetId) => {
    if (datasetId === S5_OTHER) {
      if (!this.S5PDATASETS.filter((d) => layerId.startsWith(this.datasetSearchIds[d])).length) {
        return true;
      }
      return false;
    }
    return layerId.startsWith(this.datasetSearchIds[datasetId]);
  };

  getBands = (datasetId) => {
    switch (datasetId) {
      case S5_CLOUD:
        return [
          { name: 'CLOUD_BASE_HEIGHT' },
          { name: 'CLOUD_BASE_PRESSURE' },
          { name: 'CLOUD_FRACTION' },
          { name: 'CLOUD_OPTICAL_THICKNESS' },
          { name: 'CLOUD_TOP_HEIGHT' },
          { name: 'CLOUD_TOP_PRESSURE' },
        ];
      case S5_AER_AI:
        return [{ name: 'AER_AI_340_380' }, { name: 'AER_AI_354_388' }];
      default:
        return [{ name: this.datasetSearchIds[datasetId] }];
    }
  };

  getSentinelHubDataset = () => DATASET_S5PL2;

  getS5ProductType = (datasetId) => {
    return getS5ProductType(datasetId);
  };

  getResolutionLimits() {
    return { resolution: 3500 };
  }

  supportsCustomLayer(datasetId) {
    switch (datasetId) {
      case S5_OTHER:
        return false;
      default:
        return true;
    }
  }

  supportsMinQa() {
    return true;
  }

  getDefaultMinQa(datasetId) {
    // values set as per documentation
    // https://docs.sentinel-hub.com/api/latest/#/data/Sentinel-5P-L2?id=processing-options
    switch (datasetId) {
      case S5_NO2:
        return 75;
      default:
        return 50;
    }
  }

  supportsInterpolation() {
    return true;
  }
}
