import React from 'react';
import {
  DATASET_AWSEU_S1GRD,
  S1GRDAWSEULayer,
  AcquisitionMode,
  Polarization,
  Resolution,
  SpeckleFilterType,
} from '@sentinel-hub/sentinelhub-js';

import DataSourceHandler from './DataSourceHandler';
import Sentinel1SearchGroup from './DatasourceRenderingComponents/searchGroups/Sentinel1SearchGroup';
import {
  S1ACQModeTooltip,
  S1OrbitDirectionTooltip,
  S1PolarizationTooltip,
  Sentinel1Tooltip,
} from './DatasourceRenderingComponents/dataSourceTooltips/Sentinel1Tooltip';
import { FetchingFunction } from '../search';
import { S1_AWS_IW_VVVH, S1_AWS_IW_VV, S1_AWS_EW_HHHV, S1_AWS_EW_HH } from './dataSourceConstants';
import { constructV3Evalscript } from '../../../utils';
import { filterLayers } from './filter';
import { IMAGE_FORMATS } from '../../../Controls/ImgDownload/consts';
import { DATASOURCES } from '../../../const';
import HelpTooltip from './DatasourceRenderingComponents/HelpTooltip';

export const S1_SUPPORTED_SPECKLE_FILTERS = [
  {
    label: SpeckleFilterType.NONE,
    params: {
      type: SpeckleFilterType.NONE,
    },
  },
  {
    label: SpeckleFilterType.LEE + ' 3x3',
    params: {
      type: SpeckleFilterType.LEE,
      windowSizeX: 3,
      windowSizeY: 3,
    },
  },
  {
    label: SpeckleFilterType.LEE + ' 5x5',
    params: {
      type: SpeckleFilterType.LEE,
      windowSizeX: 5,
      windowSizeY: 5,
    },
  },
  {
    label: SpeckleFilterType.LEE + ' 7x7',
    params: {
      type: SpeckleFilterType.LEE,
      windowSizeX: 7,
      windowSizeY: 7,
    },
  },
];

export const S1_ADVANCED_SEARCH_OPTIONS = {
  ACQUISITION_MODES: 'ACQUISITION_MODES',
  POLARIZATIONS: 'POLARIZATIONS',
  ORBIT_DIRECTIONS: 'ORBIT_DIRECTIONS',
};

export default class Sentinel1DataSourceHandler extends DataSourceHandler {
  KNOWN_BANDS = [
    { name: 'VV', description: '', color: undefined },
    { name: 'VH', description: '', color: undefined },
    { name: 'HH', description: '', color: undefined },
    { name: 'HV', description: '', color: undefined },
  ];
  DATA_LOCATIONS = {
    AWS: 'AWS',
  };
  ACQUISITION_MODES = {
    IW: 'IW - Interferometric Wide Swath 10m x 10m',
    EW: 'EW - Extra-Wide Swath 40m x 40m',
  };
  POLARIZATIONS = {
    IW: {
      VV: 'VV',
      VVVH: 'VV+VH',
    },
    EW: {
      HH: 'HH',
      HHHV: 'HH+HV',
    },
  };
  ORBIT_DIRECTIONS = {
    ASCENDING: 'Ascending',
    DESCENDING: 'Descending',
  };

  urls = {
    AWS: [],
  };
  configs = {};
  capabilities = {};
  searchFilters = {};
  isChecked = false;
  datasource = DATASOURCES.S1;

  leafletZoomConfig = {
    [S1_AWS_IW_VVVH]: {
      min: 7,
      max: 18,
    },
    [S1_AWS_IW_VV]: {
      min: 7,
      max: 18,
    },
    [S1_AWS_EW_HHHV]: {
      min: 6,
      max: 18,
    },
    [S1_AWS_EW_HH]: {
      min: 6,
      max: 18,
    },
  };

  dataLocations = {};
  acquisitionModes = {};
  polarizations = { IW: {}, EW: {} };

  willHandle(service, url, name, layers, preselected) {
    const hasAWSLayer = !!layers.find((l) => l.dataset && l.dataset.id === DATASET_AWSEU_S1GRD.id);

    this.setFilteringOptions(layers, hasAWSLayer);

    if (!hasAWSLayer) {
      return false;
    }
    if (hasAWSLayer) {
      this.urls.AWS.push(url);
    }

    this.capabilities[url] = layers;
    this.saveFISLayers(url, layers);
    return true;
  }

  saveFISLayers(url, layers) {
    this.FISLayers[url] = {};
    const fisLayers = layers.filter((l) => l.layerId.startsWith('__FIS_'));
    for (let l of fisLayers) {
      this.FISLayers[url][l.dataset.id] = [...(this.FISLayers[url][l.dataset.id] || []), l.layerId];
    }
  }

  isHandlingAnyUrl() {
    return Object.values(this.urls).flat().length > 0;
  }

  renderOptionsHelpTooltips = (option) => {
    switch (option) {
      case S1_ADVANCED_SEARCH_OPTIONS.ACQUISITION_MODES:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S1ACQModeTooltip />
          </HelpTooltip>
        );
      case S1_ADVANCED_SEARCH_OPTIONS.POLARIZATIONS:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S1PolarizationTooltip />
          </HelpTooltip>
        );
      case S1_ADVANCED_SEARCH_OPTIONS.ORBIT_DIRECTIONS:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <S1OrbitDirectionTooltip />
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
      <Sentinel1SearchGroup
        key={`sentinel-1`}
        label="Sentinel-1"
        preselected={false}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={<Sentinel1Tooltip />}
        saveFiltersValues={this.saveSearchFilters}
        dataLocations={this.dataLocations}
        acquisitionModes={this.acquisitionModes}
        polarizations={this.polarizations}
        orbitDirections={this.ORBIT_DIRECTIONS}
        renderOptionsHelpTooltips={this.renderOptionsHelpTooltips}
      />
    );
  }

  setFilteringOptions = (layers, hasAWSLayer) => {
    if (hasAWSLayer) {
      this.dataLocations.AWS = this.DATA_LOCATIONS.AWS;
    }
    const IWLayers = layers.filter((l) => l.acquisitionMode === 'IW');
    const EWLayers = layers.filter((l) => l.acquisitionMode === 'EW');

    if (IWLayers.length > 0) {
      this.acquisitionModes.IW = this.ACQUISITION_MODES.IW;

      const hasVV = IWLayers.some((l) => l.polarization === Polarization.SV);
      const hasVVVH = IWLayers.some((l) => l.polarization === Polarization.DV);

      if (hasVV) {
        this.polarizations.IW.VV = this.POLARIZATIONS.IW.VV;
      }
      if (hasVVVH) {
        this.polarizations.IW.VVVH = this.POLARIZATIONS.IW.VVVH;
      }
    }

    if (EWLayers.length > 0) {
      this.acquisitionModes.EW = this.ACQUISITION_MODES.EW;

      const hasHH = EWLayers.some((l) => l.polarization === Polarization.SH);
      const hasHHHV = EWLayers.some((l) => l.polarization === Polarization.DH);

      if (hasHH) {
        this.polarizations.EW.HH = this.POLARIZATIONS.EW.HH;
      }
      if (hasHHHV) {
        this.polarizations.EW.HHHV = this.POLARIZATIONS.EW.HHHV;
      }
    }
  };

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    const isAWS = this.searchFilters['dataLocations'].includes('AWS');
    const isIW = this.searchFilters['acquisitionModes'].includes('IW');
    const isEW = this.searchFilters['acquisitionModes'].includes('EW');
    const isIW_VV = isIW && this.searchFilters['polarizations'].includes('VV');
    const isIW_VVVH = isIW && this.searchFilters['polarizations'].includes('VVVH');
    const isEW_HH = isEW && this.searchFilters['polarizations'].includes('HH');
    const isEW_HHHV = isEW && this.searchFilters['polarizations'].includes('HHHV');
    const orbitDirection =
      this.searchFilters['orbitDirections'].length === 1 ? this.searchFilters['orbitDirections'][0] : null;

    let fetchingFunctions = [];

    if (isAWS) {
      let selectedDatasets = [];
      if (isIW_VV) {
        selectedDatasets.push(S1_AWS_IW_VV);
      }
      if (isIW_VVVH) {
        selectedDatasets.push(S1_AWS_IW_VVVH);
      }
      if (isEW_HH) {
        selectedDatasets.push(S1_AWS_EW_HH);
      }
      if (isEW_HHHV) {
        selectedDatasets.push(S1_AWS_EW_HHHV);
      }
      selectedDatasets.forEach((datasetId) => {
        // Evalscript (or instanceId + layerId) is a required parameter, although we don't need it for findTiles
        let searchLayer = new S1GRDAWSEULayer({
          evalscript: true,
          orbitDirection: orbitDirection,
          ...Sentinel1DataSourceHandler.getDatasetParams(datasetId),
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
    }

    return fetchingFunctions;
  }

  convertToStandardTiles = (data, datasetId) => {
    const tiles = data.map((t) => ({
      sensingTime: t.sensingTime,
      geometry: t.geometry,
      datasource: this.datasource,
      datasetId,
      metadata: {
        AWSPath: this.getUrl(t.links, 'aws'),
        previewUrl: this.getUrl(t.links, 'preview'),
        EOCloudPath: this.getUrl(t.links, 'eocloud'),
      },
    }));
    return tiles;
  };

  getLayers = (data, datasetId, url, layersExclude, layersInclude) => {
    const datasetParams = Sentinel1DataSourceHandler.getDatasetParams(datasetId);
    let layers = data.filter(
      (layer) =>
        filterLayers(layer.layerId, layersExclude, layersInclude) &&
        this.filterLayersS1(layer, datasetParams),
    );
    layers.forEach((l) => {
      l.url = url;
    });
    return layers;
  };

  getBands = (datasetId) => {
    switch (datasetId) {
      case S1_AWS_IW_VV:
        return this.KNOWN_BANDS.filter((b) => ['VV'].includes(b.name));
      case S1_AWS_EW_HHHV:
        return this.KNOWN_BANDS.filter((b) => ['HH', 'HV'].includes(b.name));
      case S1_AWS_EW_HH:
        return this.KNOWN_BANDS.filter((b) => ['HH'].includes(b.name));
      case S1_AWS_IW_VVVH:
        return this.KNOWN_BANDS.filter((b) => ['VV', 'VH'].includes(b.name));
      default:
        return this.KNOWN_BANDS;
    }
  };

  filterLayersS1 = (layer, datasetParams) => {
    if (
      layer.acquisitionMode === datasetParams.acquisitionMode &&
      (layer.polarization === datasetParams.polarization || !layer.polarization)
    ) {
      return true;
    }
    return false;
  };

  static getDatasetParams = (datasetId) => {
    // Note: the usual combinations are IW + DV/SV + HIGH and EW + DH/SH + MEDIUM.
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
        return {
          polarization: Polarization.DV,
          acquisitionMode: AcquisitionMode.IW,
          resolution: Resolution.HIGH,
        };
      case S1_AWS_IW_VV:
        return {
          polarization: Polarization.SV,
          acquisitionMode: AcquisitionMode.IW,
          resolution: Resolution.HIGH,
        };
      case S1_AWS_EW_HHHV:
        return {
          polarization: Polarization.DH,
          acquisitionMode: AcquisitionMode.EW,
          resolution: Resolution.MEDIUM,
        };
      case S1_AWS_EW_HH:
        return {
          polarization: Polarization.SH,
          acquisitionMode: AcquisitionMode.EW,
          resolution: Resolution.MEDIUM,
        };
      default:
        return { polarization: null, acquisitionMode: null };
    }
  };

  getDatasetParams = (datasetId) => {
    return Sentinel1DataSourceHandler.getDatasetParams(datasetId);
  };

  getUrlsForDataset = (datasetId) => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return this.urls.AWS;
      default:
        return [];
    }
  };

  getSentinelHubDataset = (datasetId) => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return DATASET_AWSEU_S1GRD;
      default:
        return null;
    }
  };

  generateEvalscript = (bands, datasetId, config) => {
    return constructV3Evalscript(bands, config);
  };

  getFISLayer(url, datasetId, layerId, isCustom) {
    const shDataset = this.getSentinelHubDataset(datasetId);
    return super.getFISLayer(url, shDataset.id, layerId, isCustom);
  }

  supportsInterpolation() {
    return true;
  }

  supportsSpeckleFilter(datasetId) {
    return !!this.getSupportedSpeckleFilters(datasetId).length;
  }

  getSupportedSpeckleFilters(datasetId) {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return S1_SUPPORTED_SPECKLE_FILTERS;
      default:
        return [];
    }
  }

  canApplySpeckleFilter = (datasetId, currentZoom) => {
    const ZoomThresholdIW = 12;
    const ZoomThresholdEW = 8;

    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
        return currentZoom >= ZoomThresholdIW;
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return currentZoom >= ZoomThresholdEW;
      default:
        return false;
    }
  };

  supportsOrthorectification = (datasetId) => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return true;
      default:
        return false;
    }
  };

  supportsBackscatterCoeff = (datasetId) => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return true;
      default:
        return false;
    }
  };

  supportsV3Evalscript = (datasetId) => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return true;
      default:
        return false;
    }
  };

  getSupportedImageFormats() {
    return Object.values(IMAGE_FORMATS);
  }
}
