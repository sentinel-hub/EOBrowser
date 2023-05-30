import React from 'react';
import { DATASET_BYOC, CRS_EPSG4326, LocationIdSHv3, BYOCSubTypes } from '@sentinel-hub/sentinelhub-js';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import {
  CorineLandCoverTooltip,
  GlobalLandCoverTooltip,
  WaterBodiesTooltip,
  HRVPPSeasonalTrajectoriesTooltip,
  HRVPPVegetationIndicesTooltip,
  HRVPPVPPS1Tooltip,
  HRVPPVPPS2Tooltip,
  CLCAccountingTooltip,
  HRSIPSATooltip,
  HRSIWDSTooltip,
  HRSISWSTooltip,
  HRSIFSCTooltip,
  HRSIGFSCTooltip,
} from './DatasourceRenderingComponents/dataSourceTooltips/CopernicusServicesTooltips';
import HelpTooltip from './DatasourceRenderingComponents/HelpTooltip';

import { FetchingFunction } from '../search';
import {
  COPERNICUS_CORINE_LAND_COVER,
  COPERNICUS_GLOBAL_LAND_COVER,
  COPERNICUS_WATER_BODIES,
  COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES,
  COPERNICUS_HR_VPP_VEGETATION_INDICES,
  COPERNICUS_HR_VPP_VPP_S1,
  COPERNICUS_HR_VPP_VPP_S2,
  COPERNICUS_CLC_ACCOUNTING,
  COPERNICUS_HRSI_PSA,
  COPERNICUS_HRSI_WDS,
  COPERNICUS_HRSI_SWS,
  COPERNICUS_HRSI_FSC,
  COPERNICUS_HRSI_GFSC,
} from './dataSourceConstants';
import { CORINE_LAND_COVER_BANDS } from './datasourceAssets/copernicusCorineLandCoverBands';
import { GLOBAL_LAND_COVER_BANDS } from './datasourceAssets/copernicusGlobalLandCoverBands';
import { WATER_BODIES_BANDS } from './datasourceAssets/copernicusWaterBodiesBands';
import { HR_VPP_SEASONAL_TRAJECTORIES_BANDS } from './datasourceAssets/HRVPPSeasonalTrajectoriesBands';
import { HR_VPP_VEGETATION_INDICES_BANDS } from './datasourceAssets/HRVPPVegetationIndicesBands';
import { HR_VPP_VPP_BANDS } from './datasourceAssets/HRVPPVPPBands';
import { CLC_ACCOUNTING_BANDS } from './datasourceAssets/copernicusCLCAccountingBands';
import { HRSI_PSA_BANDS } from './datasourceAssets/HRSIPSABands';
import { HRSI_WDS_BANDS } from './datasourceAssets/HRSIWDSBands';
import { HRSI_SWS_BANDS } from './datasourceAssets/HRSISWSBands';
import { HRSI_FSC_BANDS } from './datasourceAssets/HRSIFSCBands';
import { HRSI_GFSC_BANDS } from './datasourceAssets/HRSIGFSCBands';
import { DATASOURCES } from '../../../const';
import { reprojectGeometry } from '../../../utils/reproject';

export default class CopernicusServicesDataSourceHandler extends DataSourceHandler {
  getDatasetSearchLabels = () => ({
    [COPERNICUS_CORINE_LAND_COVER]: 'CORINE Land Cover',
    [COPERNICUS_GLOBAL_LAND_COVER]: 'Global Land Cover',
    [COPERNICUS_WATER_BODIES]: 'Water Bodies',
    [COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES]: 'Seasonal Trajectories',
    [COPERNICUS_HR_VPP_VEGETATION_INDICES]: 'Vegetation Indices',
    [COPERNICUS_HR_VPP_VPP_S1]: 'Vegetation Phenology and Productivity Season 1',
    [COPERNICUS_HR_VPP_VPP_S2]: 'Vegetation Phenology and Productivity Season 2',
    [COPERNICUS_CLC_ACCOUNTING]: 'CORINE Land Cover Accounting Layers',
    [COPERNICUS_HRSI_PSA]: 'Persistent Snow Area',
    [COPERNICUS_HRSI_WDS]: 'Wet/Dry Snow',
    [COPERNICUS_HRSI_SWS]: 'SAR Wet Snow',
    [COPERNICUS_HRSI_FSC]: 'Fractional Snow Cover',
    [COPERNICUS_HRSI_GFSC]: 'Fractional Snow Cover (Gap-filled)',
  });

  urls = {
    [COPERNICUS_CORINE_LAND_COVER]: [],
    [COPERNICUS_GLOBAL_LAND_COVER]: [],
    [COPERNICUS_WATER_BODIES]: [],
    [COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES]: [],
    [COPERNICUS_HR_VPP_VEGETATION_INDICES]: [],
    [COPERNICUS_HR_VPP_VPP_S1]: [],
    [COPERNICUS_HR_VPP_VPP_S2]: [],
    [COPERNICUS_CLC_ACCOUNTING]: [],
    [COPERNICUS_HRSI_PSA]: [],
    [COPERNICUS_HRSI_WDS]: [],
    [COPERNICUS_HRSI_SWS]: [],
    [COPERNICUS_HRSI_FSC]: [],
    [COPERNICUS_HRSI_GFSC]: [],
  };
  datasets = [];
  allLayers = [];
  datasource = DATASOURCES.COPERNICUS;

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
    [COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES]: {
      min: 0,
      max: 25,
    },
    [COPERNICUS_HR_VPP_VEGETATION_INDICES]: {
      min: 0,
      max: 25,
    },
    [COPERNICUS_HR_VPP_VPP_S1]: {
      min: 0,
      max: 25,
    },
    [COPERNICUS_HR_VPP_VPP_S2]: {
      min: 0,
      max: 25,
    },
    [COPERNICUS_CLC_ACCOUNTING]: {
      min: 0,
      max: 25,
    },
    [COPERNICUS_HRSI_PSA]: {
      min: 0,
      max: 25,
    },
    [COPERNICUS_HRSI_WDS]: {
      min: 0,
      max: 25,
    },
  };

  KNOWN_COLLECTIONS = {
    [COPERNICUS_CORINE_LAND_COVER]: ['cbdba8-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_GLOBAL_LAND_COVER]: ['f0a976-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_WATER_BODIES]: ['62bf6f-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES]: ['90f0ab-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HR_VPP_VEGETATION_INDICES]: ['472c03-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HR_VPP_VPP_S1]: ['67c731-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HR_VPP_VPP_S2]: ['8c2bc9-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_CLC_ACCOUNTING]: ['4c5441-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HRSI_PSA]: ['da7e00-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HRSI_WDS]: ['02680a-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HRSI_SWS]: ['c56d1d-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HRSI_FSC]: ['80db97-YOUR-INSTANCEID-HERE'],
    [COPERNICUS_HRSI_GFSC]: ['e0e660-YOUR-INSTANCEID-HERE'],
  };

  KNOWN_COLLECTIONS_LOCATIONS = {
    [COPERNICUS_CORINE_LAND_COVER]: LocationIdSHv3.creo,
    [COPERNICUS_GLOBAL_LAND_COVER]: LocationIdSHv3.creo,
    [COPERNICUS_WATER_BODIES]: LocationIdSHv3.creo,
    [COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES]: LocationIdSHv3.creo,
    [COPERNICUS_HR_VPP_VEGETATION_INDICES]: LocationIdSHv3.creo,
    [COPERNICUS_HR_VPP_VPP_S1]: LocationIdSHv3.creo,
    [COPERNICUS_HR_VPP_VPP_S2]: LocationIdSHv3.creo,
    [COPERNICUS_CLC_ACCOUNTING]: LocationIdSHv3.creo,
    [COPERNICUS_HRSI_PSA]: LocationIdSHv3.creo,
    [COPERNICUS_HRSI_WDS]: LocationIdSHv3.creo,
    [COPERNICUS_HRSI_SWS]: LocationIdSHv3.creo,
    [COPERNICUS_HRSI_FSC]: LocationIdSHv3.creo,
    [COPERNICUS_HRSI_GFSC]: LocationIdSHv3.creo,
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
    this.saveFISLayers(url, layers);
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

  renderOptionsHelpTooltips = (option) => {
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
      case COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRVPPSeasonalTrajectoriesTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HR_VPP_VEGETATION_INDICES:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRVPPVegetationIndicesTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HR_VPP_VPP_S1:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRVPPVPPS1Tooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HR_VPP_VPP_S2:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRVPPVPPS2Tooltip />
          </HelpTooltip>
        );
      case COPERNICUS_CLC_ACCOUNTING:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <CLCAccountingTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HRSI_PSA:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRSIPSATooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HRSI_WDS:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRSIWDSTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HRSI_SWS:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRSISWSTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HRSI_FSC:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRSIFSCTooltip />
          </HelpTooltip>
        );
      case COPERNICUS_HRSI_GFSC:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <HRSIGFSCTooltip />
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
        reprojectGeometry(t.geometry, { toCrs: CRS_EPSG4326.authId });
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
      case COPERNICUS_CORINE_LAND_COVER:
        return CORINE_LAND_COVER_BANDS;
      case COPERNICUS_GLOBAL_LAND_COVER:
        return GLOBAL_LAND_COVER_BANDS;
      case COPERNICUS_WATER_BODIES:
        return WATER_BODIES_BANDS;
      case COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES:
        return HR_VPP_SEASONAL_TRAJECTORIES_BANDS;
      case COPERNICUS_HR_VPP_VEGETATION_INDICES:
        return HR_VPP_VEGETATION_INDICES_BANDS;
      case COPERNICUS_HR_VPP_VPP_S1:
      case COPERNICUS_HR_VPP_VPP_S2:
        return HR_VPP_VPP_BANDS;
      case COPERNICUS_CLC_ACCOUNTING:
        return CLC_ACCOUNTING_BANDS;
      case COPERNICUS_HRSI_PSA:
        return HRSI_PSA_BANDS;
      case COPERNICUS_HRSI_WDS:
        return HRSI_WDS_BANDS;
      case COPERNICUS_HRSI_SWS:
        return HRSI_SWS_BANDS;
      case COPERNICUS_HRSI_FSC:
        return HRSI_FSC_BANDS;
      case COPERNICUS_HRSI_GFSC:
        return HRSI_GFSC_BANDS;
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
        Object.values(bands).map((b) => parseInt(b)),
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

  areBandsClasses = (datasetId) => {
    if (datasetId === COPERNICUS_CORINE_LAND_COVER) {
      return true;
    }
    return false;
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
