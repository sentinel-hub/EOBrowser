import React from 'react';
import { DATASET_BYOC, CRS_EPSG4326 } from '@sentinel-hub/sentinelhub-js';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import {
  CorineLandCoverTooltip,
  GlobalLandCoverTooltip,
  WaterBodiesTooltip,
} from './DatasourceRenderingComponents/dataSourceTooltips/CopernicusServicesTooltips';
import HelpTooltip from './DatasourceRenderingComponents/HelpTooltip';

import { FetchingFunction } from '../search';
import {
  COPERNICUS_CORINE_LAND_COVER,
  COPERNICUS_GLOBAL_LAND_COVER,
  COPERNICUS_WATER_BODIES,
} from './dataSourceHandlers';
import { CORINE_LAND_COVER_BANDS } from './datasourceAssets/copernicusCorineLandCoverBands';
import { GLOBAL_LAND_COVER_BANDS } from './datasourceAssets/copernicusGlobalLandCoverBands';
import { WATER_BODIES_BANDS } from './datasourceAssets/copernicusWaterBodiesBands';
import { convertGeoJSONToEPSG4326 } from '../../../utils/coords';

export default class CopernicusServicesDataSourceHandler extends DataSourceHandler {
  getDatasetSearchLabels = () => ({
    [COPERNICUS_CORINE_LAND_COVER]: 'CORINE Land Cover',
    [COPERNICUS_GLOBAL_LAND_COVER]: 'Global Land Cover',
    [COPERNICUS_WATER_BODIES]: 'Water Bodies',
  });

  urls = {
    [COPERNICUS_CORINE_LAND_COVER]: [],
    [COPERNICUS_GLOBAL_LAND_COVER]: [],
    [COPERNICUS_WATER_BODIES]: [],
  };
  datasets = [];
  allLayers = [];
  datasource = 'Copernicus Services';

  leafletZoomConfig = {
    [COPERNICUS_CORINE_LAND_COVER]: {
      min: 8,
      max: 16,
    },
    [COPERNICUS_GLOBAL_LAND_COVER]: {
      min: 7,
      max: 16,
    },
    [COPERNICUS_WATER_BODIES]: {
      min: 3,
      max: 16,
    },
  };

  KNOWN_COLLECTIONS = {
    [COPERNICUS_CORINE_LAND_COVER]: ['cbdba8-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_GLOBAL_LAND_COVER]: ['f0a976-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_WATER_BODIES]: ['62bf6f-YOUR-INSTANCEID-HERE'],
  };

  willHandle(service, url, name, layers, preselected) {
    const layersWithCorineCollection = layers.filter(l =>
      this.KNOWN_COLLECTIONS[COPERNICUS_CORINE_LAND_COVER].includes(l.collectionId),
    );
    const layersWithGlobalCollection = layers.filter(l =>
      this.KNOWN_COLLECTIONS[COPERNICUS_GLOBAL_LAND_COVER].includes(l.collectionId),
    );
    const layersWithWaterBodiesCollection = layers.filter(l =>
      this.KNOWN_COLLECTIONS[COPERNICUS_WATER_BODIES].includes(l.collectionId),
    );

    if (layersWithCorineCollection.length > 0) {
      this.urls.COPERNICUS_CORINE_LAND_COVER.push(url);
      this.datasets.push(COPERNICUS_CORINE_LAND_COVER);
    } else if (layersWithGlobalCollection.length > 0) {
      this.urls.COPERNICUS_GLOBAL_LAND_COVER.push(url);
      this.datasets.push(COPERNICUS_GLOBAL_LAND_COVER);
    } else if (layersWithWaterBodiesCollection.length > 0) {
      this.urls.COPERNICUS_WATER_BODIES.push(url);
      this.datasets.push(COPERNICUS_WATER_BODIES);
    } else {
      return false;
    }

    this.allLayers.push(
      ...layersWithCorineCollection,
      ...layersWithGlobalCollection,
      ...layersWithWaterBodiesCollection,
    );
    return true;
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
        key={'copernicusServices'}
        label="Copernicus Services"
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

  renderOptionsHelpTooltips = option => {
    switch (option) {
      case COPERNICUS_CORINE_LAND_COVER:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <CorineLandCoverTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_GLOBAL_LAND_COVER:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <GlobalLandCoverTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_WATER_BODIES:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <WaterBodiesTooltip />
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
    selectedOptions.forEach(datasetId => {
      const searchLayer = this.allLayers.find(l =>
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
    const tiles = data.map(t => {
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

  getUrlsForDataset = datasetId => {
    switch (datasetId) {
      case COPERNICUS_CORINE_LAND_COVER:
        return this.urls.COPERNICUS_CORINE_LAND_COVER;
      case COPERNICUS_GLOBAL_LAND_COVER:
        return this.urls.COPERNICUS_GLOBAL_LAND_COVER;
      case COPERNICUS_WATER_BODIES:
        return this.urls.COPERNICUS_WATER_BODIES;
      default:
        return [];
    }
  };

  getSentinelHubDataset = () => DATASET_BYOC;

  getBands = datasetId => {
    switch (datasetId) {
      case COPERNICUS_CORINE_LAND_COVER:
        return CORINE_LAND_COVER_BANDS;
      case COPERNICUS_GLOBAL_LAND_COVER:
        return GLOBAL_LAND_COVER_BANDS;
      case COPERNICUS_WATER_BODIES:
        return WATER_BODIES_BANDS;
      default:
        return [];
    }
  };

  generateEvalscript = (bands, datasetId, config) => {
    // NOTE: changing the format will likely break parseEvalscriptBands method.
    if (datasetId === COPERNICUS_CORINE_LAND_COVER) {
      return `//VERSION=3
function setup() {
  return {
    input: ["CLC", "dataMask"],
    output: { bands: 4 }
  };
}

function evaluatePixel(sample) {
  return [${Object.values(bands)
    .map((e, i) => `sample.CLC === ${e}`)
    .join(',')}, ${JSON.stringify(
        Object.values(bands).map(b => parseInt(b)),
      )}.includes(sample.CLC) ? sample.dataMask : 0];
}
`;
    }
    if (datasetId === COPERNICUS_GLOBAL_LAND_COVER) {
      return this.defaultEvalscript(bands, 1 / 100);
    }

    if (datasetId === COPERNICUS_WATER_BODIES) {
      return this.defaultEvalscript(bands, 1 / 255);
    }
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
    .map(e => 'factor * sample.' + e)
    .join(',')}, sample.dataMask ];
}`;
  };

  areBandsClasses = datasetId => {
    if (datasetId === COPERNICUS_CORINE_LAND_COVER) {
      return true;
    }
    return false;
  };

  supportsIndex = () => {
    return false;
  };
}
