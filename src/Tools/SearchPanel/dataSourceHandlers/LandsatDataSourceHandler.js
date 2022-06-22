import React from 'react';
import {
  DATASET_EOCLOUD_LANDSAT5,
  DATASET_EOCLOUD_LANDSAT7,
  DATASET_EOCLOUD_LANDSAT8,
  DATASET_AWS_L8L1C,
  DATASET_AWS_LOTL1,
  DATASET_AWS_LOTL2,
  DATASET_AWS_LTML1,
  DATASET_AWS_LTML2,
  DATASET_AWS_LMSSL1,
  DATASET_AWS_LETML1,
  DATASET_AWS_LETML2,
} from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import LandsatTooltip, {
  renderLandsatOptionsHelpTooltips,
} from './DatasourceRenderingComponents/dataSourceTooltips/LandsatTooltip';
import { FetchingFunction } from '../search';
import { constructBasicEvalscript, constructV3Evalscript } from '../../../utils';
import {
  ESA_L5,
  ESA_L7,
  ESA_L8,
  AWS_L8L1C,
  AWS_LOTL1,
  AWS_LOTL2,
  AWS_LTML1,
  AWS_LTML2,
  AWS_LMSSL1,
  AWS_LETML1,
  AWS_LETML2,
} from './dataSourceConstants';
import { getLandsatBandForDataset, getGroupedBands } from './datasourceAssets/landsatBands';
import { IMAGE_FORMATS } from '../../../Controls/ImgDownload/consts';

export const LANDSAT_COPYRIGHT_TEXT = (number) =>
  `Landsat ${number} image courtesy of the U.S. Geological Survey`;

export default class LandsatDataSourceHandler extends DataSourceHandler {
  urls = {
    ESA5: [],
    ESA7: [],
    ESA8: [],
    USGS8: [],
    LOTL1: [],
    LOTL2: [],
    LMSSL1: [],
    LETML1: [],
    LETML2: [],
  };
  datasetSearchLabels = {
    [ESA_L5]: t`Landsat 5 (ESA archive)`,
    [ESA_L7]: t`Landsat 7 (ESA archive)`,
    [ESA_L8]: t`Landsat 8 (ESA archive)`,
    [AWS_L8L1C]: t`Landsat 8 (USGS archive)`,
    [AWS_LOTL1]: t`Landsat 8-9 L1`,
    [AWS_LOTL2]: t`Landsat 8-9 L2`,
    [AWS_LMSSL1]: t`Landsat 1-5 MSS L1`,
    [AWS_LETML1]: t`Landsat 7 ETM+ L1`,
    [AWS_LETML2]: t`Landsat 7 ETM+ L2`,
  };
  allLayers = [];
  datasets = [];
  preselectedDatasets = new Set();
  searchFilters = {};
  isChecked = false;
  datasource = 'Landsat';
  searchGroupLabel = 'Landsat';
  searchGroupKey = 'landsat';

  leafletZoomConfig = {
    [ESA_L5]: {
      min: 10,
      max: 18,
    },
    [ESA_L7]: {
      min: 10,
      max: 18,
    },
    [ESA_L8]: {
      min: 10,
      max: 18,
    },
    [AWS_L8L1C]: {
      min: 9,
      max: 18,
    },
    [AWS_LOTL1]: {
      min: 9,
      max: 18,
    },
    [AWS_LOTL2]: {
      min: 9,
      max: 18,
    },
    [AWS_LMSSL1]: {
      min: 8,
      max: 18,
    },
    [AWS_LETML1]: {
      min: 8,
      max: 18,
    },
    [AWS_LETML2]: {
      min: 8,
      max: 18,
    },
  };

  knownDatasets = [
    { shDataset: DATASET_AWS_L8L1C, datasetId: AWS_L8L1C, urlId: 'USGS8' },
    { shDataset: DATASET_AWS_LOTL1, datasetId: AWS_LOTL1, urlId: 'LOTL1' },
    { shDataset: DATASET_AWS_LOTL2, datasetId: AWS_LOTL2, urlId: 'LOTL2' },
    { shDataset: DATASET_AWS_LMSSL1, datasetId: AWS_LMSSL1, urlId: 'LMSSL1' },
    { shDataset: DATASET_AWS_LETML1, datasetId: AWS_LETML1, urlId: 'LETML1' },
    { shDataset: DATASET_AWS_LETML2, datasetId: AWS_LETML2, urlId: 'LETML2' },
    { shDataset: DATASET_EOCLOUD_LANDSAT5, datasetId: ESA_L5, urlId: 'ESA5' },
    { shDataset: DATASET_EOCLOUD_LANDSAT7, datasetId: ESA_L7, urlId: 'ESA7' },
    { shDataset: DATASET_EOCLOUD_LANDSAT8, datasetId: ESA_L8, urlId: 'ESA8' },
  ];

  initializeDatasets(layers, url, preselected) {
    this.knownDatasets.forEach((ds) => {
      if (layers.find((l) => l.dataset === ds.shDataset)) {
        this.datasets.push(ds.datasetId);
        this.urls[ds.urlId].push(url);
        if (preselected) {
          this.preselectedDatasets.add(ds.datasetId);
        }
      }
    });
  }

  willHandle(service, url, name, layers, preselected) {
    this.initializeDatasets(layers, url, preselected);

    if (this.datasets.length === 0) {
      return false;
    }

    this.datasets = Array.from(new Set(this.datasets)); // make datasets unique
    this.allLayers.push(
      ...layers.filter((l) =>
        [
          DATASET_AWS_L8L1C,
          DATASET_AWS_LOTL1,
          DATASET_AWS_LOTL2,
          DATASET_AWS_LTML1,
          DATASET_AWS_LTML2,
          DATASET_AWS_LMSSL1,
          DATASET_AWS_LETML1,
          DATASET_AWS_LETML2,
          DATASET_EOCLOUD_LANDSAT5,
          DATASET_EOCLOUD_LANDSAT7,
          DATASET_EOCLOUD_LANDSAT8,
        ].includes(l.dataset),
      ),
    );
    this.saveFISLayers(url, layers);
    return true;
  }

  isHandlingAnyUrl() {
    return Object.values(this.urls).flat().length > 0;
  }

  getDataSourceTooltip() {
    return <LandsatTooltip />;
  }

  getSearchFormComponents() {
    if (!this.isHandlingAnyUrl()) {
      return null;
    }
    const preselected = false;
    return (
      <GenericSearchGroup
        key={this.searchGroupKey}
        label={this.searchGroupLabel}
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={this.getDataSourceTooltip()}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        optionsLabels={this.datasetSearchLabels}
        preselectedOptions={Array.from(this.preselectedDatasets)}
        hasMaxCCFilter={true}
        renderOptionsHelpTooltips={renderLandsatOptionsHelpTooltips}
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

    datasets.forEach((datasetId) => {
      let searchLayer = this.allLayers.find((l) => l.dataset === this.getSentinelHubDataset(datasetId));
      searchLayer.maxCloudCoverPercent = maxCC;

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
    const tiles = data
      .filter((t) => (t.meta.projEpsg ? t.meta.projEpsg !== 3031 : true))
      .map((t) => ({
        sensingTime: t.sensingTime,
        geometry: t.geometry,
        datasource: this.datasource,
        datasetId,
        metadata: {
          previewUrl: this.getUrl(t.links, 'preview'),
          AWSPath: this.getUrl(t.links, 'aws'),
          EOCloudPath: this.getUrl(t.links, 'eocloud'),
          sunElevation: t.meta.sunElevation,
          cloudCoverage: t.meta.cloudCoverPercent,
        },
      }));
    return tiles;
  };

  getUrlsForDataset = (datasetId) => {
    switch (datasetId) {
      case ESA_L5:
        return this.urls.ESA5;
      case ESA_L7:
        return this.urls.ESA7;
      case ESA_L8:
        return this.urls.ESA8;
      case AWS_L8L1C:
        return this.urls.USGS8;
      case AWS_LOTL1:
        return this.urls.LOTL1;
      case AWS_LOTL2:
        return this.urls.LOTL2;
      case AWS_LTML1:
        return this.urls.LTML1;
      case AWS_LTML2:
        return this.urls.LTML2;
      case AWS_LMSSL1:
        return this.urls.LMSSL1;
      case AWS_LETML1:
        return this.urls.LETML1;
      case AWS_LETML2:
        return this.urls.LETML2;
      default:
        return [];
    }
  };

  getBands = (datasetId) => getLandsatBandForDataset(datasetId);

  getSentinelHubDataset = (datasetId) => {
    switch (datasetId) {
      case ESA_L5:
        return DATASET_EOCLOUD_LANDSAT5;
      case ESA_L7:
        return DATASET_EOCLOUD_LANDSAT7;
      case ESA_L8:
        return DATASET_EOCLOUD_LANDSAT8;
      case AWS_L8L1C:
        return DATASET_AWS_L8L1C;
      case AWS_LOTL1:
        return DATASET_AWS_LOTL1;
      case AWS_LOTL2:
        return DATASET_AWS_LOTL2;
      case AWS_LTML1:
        return DATASET_AWS_LTML1;
      case AWS_LTML2:
        return DATASET_AWS_LTML2;
      case AWS_LMSSL1:
        return DATASET_AWS_LMSSL1;
      case AWS_LETML1:
        return DATASET_AWS_LETML1;
      case AWS_LETML2:
        return DATASET_AWS_LETML2;
      default:
        return null;
    }
  };

  generateEvalscript = (bands, datasetId, config) => {
    switch (datasetId) {
      case ESA_L5:
      case ESA_L7:
      case ESA_L8:
        return constructBasicEvalscript(bands, config, this.getBands(datasetId));
      case AWS_L8L1C:
      case AWS_LOTL1:
      case AWS_LOTL2:
      case AWS_LTML1:
      case AWS_LTML2:
      case AWS_LMSSL1:
      case AWS_LETML1:
      case AWS_LETML2:
        return constructV3Evalscript(bands, config, this.getBands(datasetId));
      default:
        return '';
    }
  };

  tilesHaveCloudCoverage() {
    return true;
  }

  getResolutionLimits(datasetId) {
    switch (datasetId) {
      case ESA_L5:
      case ESA_L7:
      case ESA_L8:
        return { resolution: 1 };
      case AWS_L8L1C:
      case AWS_LOTL2:
      case AWS_LETML1:
      case AWS_LETML2:
        return { resolution: 30, fisResolutionCeiling: 1490 };
      case AWS_LOTL1:
        return { resolution: 15, fisResolutionCeiling: 1490 };
      case AWS_LMSSL1:
        return { resolution: 60, fisResolutionCeiling: 1490 };
      default:
        return {};
    }
  }

  supportsInterpolation() {
    return true;
  }

  supportsV3Evalscript(datasetId) {
    if (
      datasetId === AWS_L8L1C ||
      datasetId === AWS_LOTL1 ||
      datasetId === AWS_LOTL2 ||
      datasetId === AWS_LMSSL1 ||
      datasetId === AWS_LETML1 ||
      datasetId === AWS_LETML2
    ) {
      return true;
    }
    return false;
  }

  getSupportedImageFormats(datasetId) {
    switch (datasetId) {
      case ESA_L5:
      case ESA_L7:
      case ESA_L8:
        return Object.values(IMAGE_FORMATS).filter(
          (f) => f !== IMAGE_FORMATS.KMZ_JPG && f !== IMAGE_FORMATS.KMZ_PNG,
        );
      default:
        return Object.values(IMAGE_FORMATS);
    }
  }

  groupChannels = (datasetId) => getGroupedBands(datasetId);

  getSibling = (datasetId) => {
    switch (datasetId) {
      case AWS_LOTL1:
        return { siblingId: AWS_LOTL2, siblingShortName: 'L2' };
      case AWS_LOTL2:
        return { siblingId: AWS_LOTL1, siblingShortName: 'L1' };
      default:
        return {};
    }
  };

  getCopyrightText = (datasetId) => {
    switch (datasetId) {
      case ESA_L5:
        return LANDSAT_COPYRIGHT_TEXT('5');
      case ESA_L7:
        return LANDSAT_COPYRIGHT_TEXT('7');
      case ESA_L8:
      case AWS_L8L1C:
      case AWS_LOTL1:
      case AWS_LOTL2:
        return LANDSAT_COPYRIGHT_TEXT('8');
      case AWS_LTML1:
      case AWS_LTML2:
        return LANDSAT_COPYRIGHT_TEXT('4-5');
      case AWS_LMSSL1:
        return LANDSAT_COPYRIGHT_TEXT('1-5');
      case AWS_LETML1:
      case AWS_LETML2:
        return LANDSAT_COPYRIGHT_TEXT('7 ETM+');
      default:
        return '';
    }
  };

  isCopernicus = () => false;

  isSentinelHub = () => true;
}
