import React from 'react';
import {
  DATASET_AWSEU_S1GRD,
  DATASET_EOCLOUD_S1GRD,
  S1GRDAWSEULayer,
  S1GRDEOCloudLayer,
  AcquisitionMode,
  Polarization,
  Resolution,
} from '@sentinel-hub/sentinelhub-js';

import DataSourceHandler from './DataSourceHandler';
import Sentinel1SearchGroup from './DatasourceRenderingComponents/searchGroups/Sentinel1SearchGroup';
import Sentinel1Tooltip from './DatasourceRenderingComponents/dataSourceTooltips/Sentinel1Tooltip';
import { FetchingFunction } from '../search';
import {
  S1_AWS_IW_VVVH,
  S1_AWS_IW_VV,
  S1_AWS_EW_HHHV,
  S1_AWS_EW_HH,
  S1_EW_SH,
  S1_EW,
  S1,
} from './dataSourceHandlers';
import { constructBasicEvalscript, constructV3Evalscript } from '../../../utils';
import { filterLayers } from './filter';

export default class Sentinel1DataSourceHandler extends DataSourceHandler {
  KNOWN_BANDS = [
    { name: 'VV', description: '', color: undefined },
    { name: 'VH', description: '', color: undefined },
    { name: 'HH', description: '', color: undefined },
    { name: 'HV', description: '', color: undefined },
  ];
  DATA_LOCATIONS = {
    EOC: 'EOCloud',
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
    EOC: [],
    AWS: [],
  };
  configs = {};
  capabilities = {};
  searchFilters = {};
  isChecked = false;
  datasource = 'Sentinel-1';

  leafletZoomConfig = {
    [S1_AWS_IW_VVVH]: {
      min: 1,
    },
    [S1_AWS_IW_VV]: {
      min: 1,
    },
    [S1_AWS_EW_HHHV]: {
      min: 1,
    },
    [S1_AWS_EW_HH]: {
      min: 1,
    },
    [S1_EW_SH]: {
      min: 5,
      max: 18,
    },
    [S1_EW]: {
      min: 5,
      max: 18,
    },
    [S1]: {
      min: 5,
      max: 18,
    },
  };

  dataLocations = {};
  acquisitionModes = {};
  polarizations = { IW: {}, EW: {} };

  willHandle(service, url, name, layers, preselected) {
    const hasAWSLayer = !!layers.find(l => l.dataset && l.dataset.id === DATASET_AWSEU_S1GRD.id);
    const hasEOCloudLayer = !!layers.find(l => l.dataset && l.dataset.id === DATASET_EOCLOUD_S1GRD.id);

    this.setFilteringOptions(layers, hasAWSLayer, hasEOCloudLayer);

    if (!hasAWSLayer && !hasEOCloudLayer) {
      return false;
    }
    if (hasAWSLayer) {
      this.urls.AWS.push(url);
    }
    if (hasEOCloudLayer) {
      this.urls.EOC.push(url);
    }
    this.capabilities[url] = layers;
    return true;
  }

  isHandlingAnyUrl() {
    return Object.values(this.urls).flat().length > 0;
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
      />
    );
  }

  setFilteringOptions = (layers, hasAWSLayer, hasEOCloudLayer) => {
    if (hasAWSLayer) {
      this.dataLocations.AWS = this.DATA_LOCATIONS.AWS;
    }
    if (hasEOCloudLayer) {
      this.dataLocations.EOC = this.DATA_LOCATIONS.EOC;
    }
    const IWLayers = layers.filter(l => l.acquisitionMode === 'IW');
    const EWLayers = layers.filter(l => l.acquisitionMode === 'EW');

    if (IWLayers.length > 0) {
      this.acquisitionModes.IW = this.ACQUISITION_MODES.IW;

      const hasVV = IWLayers.some(l => l.polarization === Polarization.SV);
      const hasVVVH = IWLayers.some(l => l.polarization === Polarization.DV);

      if (hasVV) {
        this.polarizations.IW.VV = this.POLARIZATIONS.IW.VV;
      }
      if (hasVVVH) {
        this.polarizations.IW.VVVH = this.POLARIZATIONS.IW.VVVH;
      }
    }

    if (EWLayers.length > 0) {
      this.acquisitionModes.EW = this.ACQUISITION_MODES.EW;

      const hasHH = EWLayers.some(l => l.polarization === Polarization.SH);
      const hasHHHV = EWLayers.some(l => l.polarization === Polarization.DH);

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

    const isEOC = this.searchFilters['dataLocations'].includes('EOC');
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

    if (isEOC) {
      let selectedDatasets = [];
      // note that on EO Cloud, for IW acquisition mode only DV is available (SV is not available)
      // https://www.sentinel-hub.com/develop/documentation/eo_products/Sentinel1EOproducts
      if (isIW) {
        if (isIW_VV || isIW_VVVH) {
          selectedDatasets.push(S1);
        }
      }
      if (isEW_HH) {
        selectedDatasets.push(S1_EW_SH);
      }
      if (isEW_HHHV) {
        selectedDatasets.push(S1_EW);
      }

      selectedDatasets.forEach(datasetId => {
        // instanceId and layerId are required parameters, although we don't need them for findTiles
        let searchLayer = new S1GRDEOCloudLayer({
          instanceId: true,
          layerId: true,
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
      selectedDatasets.forEach(datasetId => {
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
    const tiles = data.map(t => ({
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
      layer =>
        filterLayers(layer.layerId, layersExclude, layersInclude) &&
        this.filterLayersS1(layer, datasetParams),
    );
    layers.forEach(l => {
      l.url = url;
    });
    return layers;
  };

  getBands = datasetId => {
    switch (datasetId) {
      case S1_AWS_IW_VV:
        return this.KNOWN_BANDS.filter(b => ['VV'].includes(b.name));
      case S1_AWS_EW_HHHV:
        return this.KNOWN_BANDS.filter(b => ['HH', 'HV'].includes(b.name));
      case S1_AWS_EW_HH:
        return this.KNOWN_BANDS.filter(b => ['HH'].includes(b.name));
      case S1:
      case S1_EW:
      case S1_EW_SH:
      case S1_AWS_IW_VVVH:
        return this.KNOWN_BANDS.filter(b => ['VV', 'VH'].includes(b.name));
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

  static getDatasetParams = datasetId => {
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
      case S1_EW_SH:
        return {
          polarization: Polarization.SH,
          acquisitionMode: AcquisitionMode.EW,
          resolution: Resolution.MEDIUM,
        };
      case S1_EW:
        return {
          polarization: Polarization.DH,
          acquisitionMode: AcquisitionMode.EW,
          resolution: Resolution.MEDIUM,
        };
      case S1:
        // note that on EO Cloud, for IW acquisition mode only DV is available (SV is not available)
        // https://www.sentinel-hub.com/develop/documentation/eo_products/Sentinel1EOproducts
        return { polarization: Polarization.DV, acquisitionMode: AcquisitionMode.IW };
      default:
        return { polarization: null, acquisitionMode: null };
    }
  };

  getUrlsForDataset = datasetId => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return this.urls.AWS;
      case S1:
      case S1_EW:
      case S1_EW_SH:
        return this.urls.EOC;
      default:
        return [];
    }
  };

  getSentinelHubDataset = datasetId => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return DATASET_AWSEU_S1GRD;
      case S1:
      case S1_EW:
      case S1_EW_SH:
        return DATASET_EOCLOUD_S1GRD;
      default:
        return null;
    }
  };

  generateEvalscript = (bands, datasetId, config) => {
    switch (datasetId) {
      case S1:
      case S1_EW:
      case S1_EW_SH:
        return constructBasicEvalscript(bands, config);
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return constructV3Evalscript(bands, config);
      default:
        return '';
    }
  };

  getResolutionLimits(datasetId) {
    switch (datasetId) {
      case S1:
        return { resolution: 10 };
      case S1_EW:
      case S1_EW_SH:
        return { resolution: 40 };
      default:
        return {};
    }
  }

  supportsInterpolation() {
    return true;
  }

  supportsV3Evalscript = datasetId => {
    switch (datasetId) {
      case S1:
      case S1_EW:
      case S1_EW_SH:
        return false;
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        return true;
      default:
        return false;
    }
  };
}
