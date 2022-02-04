import React from 'react';
import { DATASET_BYOC, CRS_EPSG4326, LocationIdSHv3, BYOCSubTypes } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import { WorldCoverTooltip } from './DatasourceRenderingComponents/dataSourceTooltips/ESAWorldCoverTooltip';
import { GHSTooltip } from './DatasourceRenderingComponents/dataSourceTooltips/GlobalHumanSettlementTooltip';

import HelpTooltip from './DatasourceRenderingComponents/HelpTooltip';

import { FetchingFunction } from '../search';
import { ESA_WORLD_COVER, GLOBAL_HUMAN_SETTLEMENT } from './dataSourceConstants';
import { ESA_WORLD_COVER_BANDS } from './datasourceAssets/copernicusWorldCoverBands';
import { GHS_BANDS } from './datasourceAssets/GHSBands';
import { convertGeoJSONToEPSG4326 } from '../../../utils/coords';
import { DATASOURCES } from '../../../const';

export default class OthersDataSourceHandler extends DataSourceHandler {
  getDatasetSearchLabels = () => ({
    [ESA_WORLD_COVER]: 'ESA WorldCover',
    [GLOBAL_HUMAN_SETTLEMENT]: 'Global Human Settlement',
  });

  urls = {
    [ESA_WORLD_COVER]: [],
    [GLOBAL_HUMAN_SETTLEMENT]: [],
  };
  datasets = [];
  allLayers = [];
  datasource = DATASOURCES.OTHER;

  leafletZoomConfig = {
    [ESA_WORLD_COVER]: {
      min: 8,
      max: 20,
    },
    [GLOBAL_HUMAN_SETTLEMENT]: {
      min: 5,
      max: 18,
    },
  };

  KNOWN_COLLECTIONS = {
    [ESA_WORLD_COVER]: ['0b940c-YOUR-INSTANCEID-HERE'],
    [GLOBAL_HUMAN_SETTLEMENT]: ['3dbeea-YOUR-INSTANCEID-HERE'],
  };

  KNOWN_COLLECTIONS_LOCATIONS = {
    [ESA_WORLD_COVER]: LocationIdSHv3.awsEuCentral1,
    [GLOBAL_HUMAN_SETTLEMENT]: LocationIdSHv3.creo,
  };

  willHandle(service, url, name, layers, preselected) {
    let handlesAny = false;

    for (let datasetId of Object.keys(this.KNOWN_COLLECTIONS)) {
      const layersWithDataset = layers.filter((l) =>
        this.KNOWN_COLLECTIONS[datasetId].includes(l.collectionId),
      );
      if (layersWithDataset.length > 0) {
        this.urls[datasetId].push(url);
        this.datasets.push(datasetId);
        handlesAny = true;
        this.allLayers.push(...layersWithDataset);
      }
    }
    return handlesAny;
  }

  isHandlingAnyUrl() {
    return Object.values(this.urls).flat().length > 0;
  }

  getKnownCollectionsList() {
    return Object.values(this.KNOWN_COLLECTIONS).flat();
  }

  getSearchFormComponents() {
    if (!this.isHandlingAnyUrl()) {
      return null;
    }

    return (
      <GenericSearchGroup
        key={'otherCollections'}
        label={t`Other`}
        preselected={false}
        saveCheckedState={this.saveCheckedState}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        optionsLabels={this.getDatasetSearchLabels()}
        preselectedOptions={this.datasets.length <= 1 ? this.datasets : []}
        hasMaxCCFilter={false}
        renderOptionsHelpTooltips={this.renderOptionsHelpTooltips}
      />
    );
  }

  renderOptionsHelpTooltips = (option) => {
    switch (option) {
      case ESA_WORLD_COVER:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <WorldCoverTooltip />
          </HelpTooltip>
        );
      case GLOBAL_HUMAN_SETTLEMENT:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <GHSTooltip />
          </HelpTooltip>
        );
      default:
        return null;
    }
  };

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    let fetchingFunctions = [];

    const { selectedOptions } = this.searchFilters;
    selectedOptions.forEach((datasetId) => {
      const searchLayer = this.allLayers.find((l) =>
        this.KNOWN_COLLECTIONS[datasetId].includes(l.collectionId),
      );
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
      if (t.geometry && t.geometry.crs && t.geometry.crs.properties.name !== CRS_EPSG4326.urn) {
        convertGeoJSONToEPSG4326(t.geometry);
      }
      return {
        sensingTime: t.sensingTime,
        geometry: t.geometry,
        datasource: 'CUSTOM',
        datasetId: datasetId,
        metadata: {},
      };
    });
    return tiles;
  };

  getUrlsForDataset = (datasetId) => {
    const urls = this.urls[datasetId];
    if (!urls) {
      return [];
    }
    return urls;
  };

  getSentinelHubDataset = () => DATASET_BYOC;

  getBands = (datasetId) => {
    switch (datasetId) {
      case ESA_WORLD_COVER:
        return ESA_WORLD_COVER_BANDS;
      case GLOBAL_HUMAN_SETTLEMENT:
        return GHS_BANDS;
      default:
        return [];
    }
  };

  generateEvalscript = (bands, datasetId, config) => {
    return this.defaultEvalscript(bands, 1 / 1000);
  };

  defaultEvalscript = (bands, factor) => {
    return `//VERSION=3
function setup() {
  return {
    input: ["${[...new Set(Object.values(bands))].join('","')}", "dataMask"],
    output: { bands: 4 }
  };
}
let factor = ${factor};
function evaluatePixel(sample) {
  return [${Object.values(bands)
    .map((e) => 'factor * sample.' + e)
    .join(',')}, sample.dataMask ];
}`;
  };

  supportsIndex = () => {
    return false;
  };

  getDatasetParams = (datasetId) => {
    const collectionIds = this.KNOWN_COLLECTIONS[datasetId];
    if (collectionIds) {
      return {
        collectionId: collectionIds[0],
        locationId: this.KNOWN_COLLECTIONS_LOCATIONS[datasetId],
        subType: BYOCSubTypes.BYOC,
      };
    }
    return {};
  };
}
