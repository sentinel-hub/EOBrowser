import React from 'react';
import DataSourceHandler from './DataSourceHandler';

import { getTilesFromSHServiceV3, getTilesFromSHServiceV1Or2 } from '../utils/ajax';
import Sentinel1SearchGroup from '../components/search/searchGroups/Sentinel1SearchGroup';
import { MISSION_DESCRIPTIONS } from '../store/config';

export default class Sentinel1DataSourceHandler extends DataSourceHandler {
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

  urls = [];
  configs = {};
  capabilities = {};
  searchFilters = {};
  isChecked = false;

  willHandle(service, url, name, configs, preselected) {
    const { capabilities, instanceConfig } = configs;
    if (service !== 'WMS') {
      return false;
    }
    if (url.includes('.sentinel-hub.com/ogc/')) {
      const usesS1Dataset = !!capabilities.datasets.find(d => d.name === 'S1GRD');
      if (!usesS1Dataset) {
        return false;
      }
    } else if (url.includes('.sentinel-hub.com/v1/')) {
      const hasS1Layer = !!instanceConfig.layers.find(l => l.settings.datasourceName.startsWith('S1'));
      if (!hasS1Layer) {
        return false;
      }
    } else {
      return false;
    }

    this.urls.push(url);
    this.configs[url] = configs;
    this.capabilities[url] = capabilities;
    return true;
  }

  isHandlingAnyUrl() {
    return this.urls.length > 0;
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
        dataSourceTooltip={MISSION_DESCRIPTIONS['SENTINEL-1']}
        saveFiltersValues={this.saveSearchFilters}
        dataLocations={this.DATA_LOCATIONS}
        acquisitionModes={this.ACQUISITION_MODES}
        polarizations={this.POLARIZATIONS}
        orbitDirections={this.ORBIT_DIRECTIONS}
      />
    );
  }

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    /*
      IMPORTANT: S-1 uses only known instances (3 at EOC and 4 at AWS) as defined in config.js.
      If we wanted to support generic instances things would get even more... interesting.
    */

    const isEOC = this.searchFilters['dataLocations'].includes('EOC');
    const isAWS = this.searchFilters['dataLocations'].includes('AWS');
    const isIW = this.searchFilters['acquisitionModes'].includes('IW');
    const isEW = this.searchFilters['acquisitionModes'].includes('EW');
    const isIW_VV = isIW && this.searchFilters['polarizations'].includes('VV');
    const isIW_VVVH = isIW && this.searchFilters['polarizations'].includes('VVVH');
    const isEW_HH = isEW && this.searchFilters['polarizations'].includes('HH');
    const isEW_HHHV = isEW && this.searchFilters['polarizations'].includes('HHHV');

    let fetchingFunctions = [];

    if (isEOC) {
      const eocParams = {};
      // IW is handled by a single instance, we just specify different parameters for polarization:
      if (isIW) {
        if (isIW_VV && isIW_VVVH) {
          eocParams['S1'] = '&acquisitionMode=IW';
        } else if (isIW_VV) {
          eocParams['S1'] = '&acquisitionMode=IW&polarization=SV';
        } else if (isIW_VVVH) {
          eocParams['S1'] = '&acquisitionMode=IW&polarization=DV';
        }
      }
      if (isEW_HH) {
        eocParams['S1_EW_SH'] = '&acquisitionMode=EW&polarization=SH';
      }
      if (isEW_HHHV) {
        eocParams['S1_EW'] = '&acquisitionMode=EW&polarization=DH';
      }
      const eocOrditDirectionParam =
        this.searchFilters['orbitDirections'].length === 1
          ? '&orbitDirection=' + this.searchFilters['orbitDirections'][0]
          : '';
      Object.keys(eocParams).forEach(datasourceId => {
        fetchingFunctions.push((offset, nResults) =>
          getTilesFromSHServiceV1Or2(
            'https://eocloud.sentinel-hub.com/index/s1/v1/search',
            `&productType=GRD${eocParams[datasourceId]}${eocOrditDirectionParam}`,
            queryArea,
            fromMoment,
            toMoment,
            nResults,
            1,
            offset,
          )
            .then(({ tiles }) => this._enrichTilesWithLegacyStuffUsingDatasources(tiles, datasourceId))
            .then(tiles => tiles.map(t => ({ ...t, dataGeometry: t.tileDrawRegionGeometry }))),
        );
      });
    }

    if (isAWS) {
      const awsParams = {};
      if (isIW_VV) {
        awsParams['S1-AWS-IW-VV'] = { acquisitionMode: 'IW', polarization: 'SV' };
      }
      if (isIW_VVVH) {
        awsParams['S1-AWS-IW-VVVH'] = { acquisitionMode: 'IW', polarization: 'DV' };
      }
      if (isEW_HH) {
        awsParams['S1-AWS-EW-HH'] = { acquisitionMode: 'EW', polarization: 'SH' };
      }
      if (isEW_HHHV) {
        awsParams['S1-AWS-EW-HHHV'] = { acquisitionMode: 'EW', polarization: 'DH' };
      }
      const awsOrbitDirectionParam =
        this.searchFilters['orbitDirections'].length === 1
          ? { orbitDirection: this.searchFilters['orbitDirections'][0] }
          : {};
      Object.keys(awsParams).forEach(datasourceId => {
        fetchingFunctions.push((offset, nResults) =>
          getTilesFromSHServiceV3(
            'https://services.sentinel-hub.com/index/v3/collections/S1GRD/searchIndex',
            queryArea,
            fromMoment,
            toMoment,
            nResults,
            1,
            offset,
            {
              type: 'S1GRD',
              ...awsParams[datasourceId],
              ...awsOrbitDirectionParam,
            },
          ).then(({ tiles }) => this._enrichTilesWithLegacyStuffUsingDatasources(tiles, datasourceId)),
        );
      });
    }

    return fetchingFunctions;
  }
}
