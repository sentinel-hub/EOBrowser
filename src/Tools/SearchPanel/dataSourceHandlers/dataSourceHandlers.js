import React from 'react';
import {
  CacheTarget,
  LayersFactory,
  BYOCLayer,
  S1GRDAWSEULayer,
  DEMLayer,
} from '@sentinel-hub/sentinelhub-js';

import store, { themesSlice } from '../../../store';

import CopernicusServicesDataSourceHandler from './CopernicusServicesDataSourceHandler';
import Sentinel1DataSourceHandler from './Sentinel1DataSourceHandler';
import Sentinel2AWSDataSourceHandler from './Sentinel2AWSDataSourceHandler';
import Sentinel3DataSourceHandler from './Sentinel3DataSourceHandler';
import Sentinel5PDataSourceHandler from './Sentinel5PDataSourceHandler';
import Landsat45AWSDataSourceHandler from './Landsat45AWSDataSourceHandler';
import Landsat8AWSDataSourceHandler from './Landsat8AWSDataSourceHandler';
import LandsatEOCloudDataSourceHandler from './LandsatEOCloudDataSourceHandler';

import EnvisatMerisDataSourceHandler from './EnvisatMerisDataSourceHandler';
import ModisDataSourceHandler from './ModisDataSourceHandler';
import ProbaVDataSourceHandler from './ProbaVDataSourceHandler';
import GibsDataSourceHandler from './GibsDataSourceHandler';
import BYOCDataSourceHandler from './BYOCDataSourceHandler';
import DEMDataSourceHandler from './DEMDataSourceHandler';

import { getCollectionInformation } from '../../../utils/collections';

export const S1_AWS_IW_VVVH = 'S1_AWS_IW_VVVH',
  S1_AWS_IW_VV = 'S1_AWS_IW_VV',
  S1_AWS_EW_HHHV = 'S1_AWS_EW_HHHV',
  S1_AWS_EW_HH = 'S1_AWS_EW_HH',
  S1_EW_SH = 'S1_EW_SH',
  S1_EW = 'S1_EW',
  S1 = 'S1',
  S2L1C = 'S2L1C',
  S2L2A = 'S2L2A',
  S3SLSTR = 'S3SLSTR',
  S3OLCI = 'S3OLCI',
  S5_O3 = 'S5_O3',
  S5_NO2 = 'S5_NO2',
  S5_SO2 = 'S5_SO2',
  S5_CO = 'S5_CO',
  S5_HCHO = 'S5_HCHO',
  S5_CH4 = 'S5_CH4',
  S5_AER_AI = 'S5_AER_AI',
  S5_CLOUD = 'S5_CLOUD',
  S5_OTHER = 'S5_OTHER',
  MODIS = 'MODIS',
  PROBAV_S1 = 'PROBAV_S1',
  PROBAV_S5 = 'PROBAV_S5',
  PROBAV_S10 = 'PROBAV_S10',
  ESA_L5 = 'ESA_L5',
  ESA_L7 = 'ESA_L7',
  ESA_L8 = 'ESA_L8',
  AWS_L8L1C = 'AWS_L8L1C',
  AWS_LOTL1 = 'AWS_LOTL1',
  AWS_LOTL2 = 'AWS_LOTL2',
  AWS_LTML1 = 'AWS_LTML1',
  AWS_LTML2 = 'AWS_LTML2',
  ENVISAT_MERIS = 'ENVISAT_MERIS',
  GIBS_MODIS_TERRA = 'GIBS_MODIS_TERRA',
  GIBS_MODIS_AQUA = 'GIBS_MODIS_AQUA',
  GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE = 'GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE',
  GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC = 'GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC',
  GIBS_VIIRS_NOAA20_CORRECTED_REFLECTANCE = 'GIBS_VIIRS_NOAA20_CORRECTED_REFLECTANCE',
  GIBS_CALIPSO_WWFC_V3_01 = 'GIBS_CALIPSO_WWFC_V3_01',
  GIBS_CALIPSO_WWFC_V3_02 = 'GIBS_CALIPSO_WWFC_V3_02',
  GIBS_BLUEMARBLE = 'GIBS_BLUEMARBLE',
  GIBS_LANDSAT_WELD = 'GIBS_LANDSAT_WELD',
  GIBS_MISR = 'GIBS_MISR',
  GIBS_ASTER_GDEM = 'GIBS_ASTER_GDEM',
  DEM_MAPZEN = 'DEM_MAPZEN',
  DEM_COPERNICUS_30 = 'DEM_COPERNICUS_30',
  DEM_COPERNICUS_90 = 'DEM_COPERNICUS_90',
  COPERNICUS_CORINE_LAND_COVER = 'COPERNICUS_CORINE_LAND_COVER',
  COPERNICUS_GLOBAL_LAND_COVER = 'COPERNICUS_GLOBAL_LAND_COVER',
  COPERNICUS_WATER_BODIES = 'COPERNICUS_WATER_BODIES',
  COPERNICUS_GLOBAL_SURFACE_WATER = 'COPERNICUS_GLOBAL_SURFACE_WATER',
  CUSTOM = 'CUSTOM';

export let dataSourceHandlers;
initializeDataSourceHandlers();

export function initializeDataSourceHandlers() {
  dataSourceHandlers = [
    new Sentinel1DataSourceHandler(),
    new Sentinel2AWSDataSourceHandler(),
    new Sentinel3DataSourceHandler(),
    new Sentinel5PDataSourceHandler(),
    new Landsat45AWSDataSourceHandler(),
    new Landsat8AWSDataSourceHandler(),
    new LandsatEOCloudDataSourceHandler(),
    new EnvisatMerisDataSourceHandler(),
    new ModisDataSourceHandler(),
    new DEMDataSourceHandler(),
    new CopernicusServicesDataSourceHandler(),
    new ProbaVDataSourceHandler(),
    new GibsDataSourceHandler(),
    new BYOCDataSourceHandler(),
  ];
}

export function registerHandlers(service, url, name, configs, preselected) {
  const handledBy = dataSourceHandlers.filter(dsHandler =>
    dsHandler.willHandle(service, url, name, configs, preselected),
  );
  return handledBy.length !== 0;
}

export function renderDataSourcesInputs() {
  return dataSourceHandlers
    .filter(dsh => dsh.isHandlingAnyUrl())
    .map((dsh, dshIndex) => <div key={dshIndex}>{dsh.getSearchFormComponents()}</div>);
}

/*
BYOCLayer is an exception where lazy loading of service parameters is not sufficent. If we want to generate search form without
hardcoding collectionIds or without assuming there will always be only one different collection per instance, we need to have
collectionId and only way to get it is to query service.
*/
async function updateLayersFromServiceIfNeeded(layers) {
  const updateLayersFromService = layers.filter(
    l => l instanceof BYOCLayer || l instanceof S1GRDAWSEULayer || l instanceof DEMLayer,
  );
  const collectionTitles = {};

  await Promise.all(
    updateLayersFromService.map(async l => {
      try {
        await l.updateLayerFromServiceIfNeeded({
          timeout: 30000,
          cache: {
            expiresIn: Number.POSITIVE_INFINITY,
            targets: [CacheTarget.MEMORY],
          },
        });
        if (l instanceof BYOCLayer) {
          if (collectionTitles[l.collectionId]) {
            l.collectionTitle = collectionTitles[l.collectionId];
          } else {
            const collectionInfo = await getCollectionInformation(l.collectionId, l.locationId).then(
              r => r.data,
            );
            collectionTitles[l.collectionId] = collectionInfo.title;
            l.collectionTitle = collectionInfo.title;
          }

          const availableBands = await l.getAvailableBands({
            timeout: 30000,
            cache: {
              expiresIn: Number.POSITIVE_INFINITY,
              targets: [CacheTarget.MEMORY],
            },
          });
          l.availableBands = availableBands;
        }
      } catch (e) {
        console.error(`Error retrieving additional data for layer ${l.layerId} in instance ${l.instanceId}`);
        throw e;
      }
    }),
  );
}

export async function prepareDataSourceHandlers(theme) {
  initializeDataSourceHandlers();

  const allLayers = await Promise.all(
    theme.content.map(async dataSource => {
      let dataSourceUrl = dataSource.url.replace(
        'https://services-uswest2.sentinel-hub.com/',
        'https://services.sentinel-hub.com/',
      );

      try {
        const layers = await LayersFactory.makeLayers(dataSourceUrl, null, null, {
          timeout: 30000,
          cache: {
            expiresIn: Number.POSITIVE_INFINITY,
            targets: [CacheTarget.MEMORY],
          },
        });
        await updateLayersFromServiceIfNeeded(layers);
        return layers;
      } catch (e) {
        console.warn(e);
        return null;
      }
    }),
  );
  let failedThemeParts = [];
  theme.content.forEach(({ service, url, name, preselected }, i) => {
    if (allLayers[i] === null) {
      console.error(
        `Error retrieving additional data for ${service} service at ${url} which is included in theme part ${name}, skipping.`,
      );
      failedThemeParts.push(name);
      return;
    }
    const isHandled = registerHandlers(service, url, name ? name : theme.name, allLayers[i], preselected);
    if (!isHandled) {
      console.error(
        `Ignoring entry, unsupported service: ${service} (only 'WMS' and 'WMTS' are currently supported) or url: ${url}`,
      );
    }
  });
  store.dispatch(themesSlice.actions.setDataSourcesInitialized(true));
  return failedThemeParts;
}

export function datasourceForDatasetId(datasetId) {
  switch (datasetId) {
    case S1_AWS_IW_VVVH:
    case S1_AWS_IW_VV:
    case S1_AWS_EW_HHHV:
    case S1_AWS_EW_HH:
    case S1_EW_SH:
    case S1_EW:
    case S1:
      return 'Sentinel-1';
    case S2L1C:
    case S2L2A:
      return 'Sentinel-2';
    case S3SLSTR:
    case S3OLCI:
      return 'Sentinel-3';
    case S5_O3:
    case S5_NO2:
    case S5_SO2:
    case S5_CO:
    case S5_HCHO:
    case S5_CH4:
    case S5_AER_AI:
    case S5_CLOUD:
    case S5_OTHER:
      return 'Sentinel-5';
    case MODIS:
      return 'MODIS';
    case PROBAV_S1:
    case PROBAV_S5:
    case PROBAV_S10:
      return 'Proba-V';
    case ESA_L5:
    case ESA_L7:
    case ESA_L8:
      return 'LandsatEOCloud';
    case AWS_L8L1C:
    case AWS_LOTL1:
    case AWS_LOTL2:
      return 'Landsat8AWS';
    case AWS_LTML1:
    case AWS_LTML2:
      return 'Landsat45AWS';
    case ENVISAT_MERIS:
      return 'Envisat Meris';
    case GIBS_MODIS_TERRA:
    case GIBS_MODIS_AQUA:
    case GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE:
    case GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC:
    case GIBS_CALIPSO_WWFC_V3_01:
    case GIBS_CALIPSO_WWFC_V3_02:
    case GIBS_BLUEMARBLE:
    case GIBS_LANDSAT_WELD:
    case GIBS_MISR:
    case GIBS_ASTER_GDEM:
    case GIBS_VIIRS_NOAA20_CORRECTED_REFLECTANCE:
      return 'GIBS';
    case DEM_MAPZEN:
    case DEM_COPERNICUS_30:
    case DEM_COPERNICUS_90:
      return 'DEM';
    case COPERNICUS_CORINE_LAND_COVER:
    case COPERNICUS_GLOBAL_LAND_COVER:
    case COPERNICUS_WATER_BODIES:
    case COPERNICUS_GLOBAL_SURFACE_WATER:
      return 'Copernicus Services';
    default:
      return null;
  }
}

export function getDataSourceHandler(datasetId) {
  const datasource = datasourceForDatasetId(datasetId);
  if (datasource) {
    return dataSourceHandlers.find(d => d.datasource === datasource);
  } else {
    return checkIfCustom(datasetId);
  }
}

export function checkIfCustom(datasetId) {
  const dsh = dataSourceHandlers.find(d => d.datasource === 'CUSTOM');
  if (dsh && dsh.datasets) {
    const isCustomDataset = dsh.datasets.includes(datasetId);
    if (isCustomDataset) {
      return dsh;
    }
  }
  return null;
}

export const datasetLabels = {
  [S1_AWS_IW_VVVH]: 'Sentinel-1 AWS-IW-VVVH',
  [S1_AWS_IW_VV]: 'Sentinel-1 AWS-IW-VV',
  [S1_AWS_EW_HHHV]: 'Sentinel-1 AWS-EW-HHHV',
  [S1_AWS_EW_HH]: 'Sentinel-1 AWS-EW-HH',
  [S1_EW_SH]: 'Sentinel-1 EW-HH',
  [S1_EW]: 'Sentinel-1 EW-DH',
  [S1]: 'Sentinel-1 IW-DV',
  [S2L1C]: 'Sentinel-2 L1C',
  [S2L2A]: 'Sentinel-2 L2A',
  [S3SLSTR]: 'Sentinel-3 SLSTR',
  [S3OLCI]: 'Sentinel-3 OLCI',
  [S5_O3]: 'Sentinel-5 O3',
  [S5_NO2]: 'Sentinel-5 NO2',
  [S5_SO2]: 'Sentinel-5 SO2',
  [S5_CO]: 'Sentinel-5 CO',
  [S5_HCHO]: 'Sentinel-5 HCHO',
  [S5_CH4]: 'Sentinel-5 CH4',
  [S5_AER_AI]: 'Sentinel-5 AER_AI',
  [S5_CLOUD]: 'Sentinel-5 CLOUD',
  [S5_OTHER]: 'Sentinel-5 Other',
  [MODIS]: 'MODIS',
  [PROBAV_S1]: 'Proba-V 1 day (S1)',
  [PROBAV_S5]: 'Proba-V 5 day (S5)',
  [PROBAV_S10]: 'Proba-V 10 day (S10)',
  [ESA_L5]: 'Landsat 5 (ESA archive)',
  [ESA_L7]: 'Landsat 7 (ESA archive)',
  [ESA_L8]: 'Landsat 8 (ESA archive)',
  [AWS_L8L1C]: 'Landsat 8 (USGS archive)',
  [AWS_LOTL1]: 'Landsat 8 L1',
  [AWS_LOTL2]: 'Landsat 8 L2',
  [AWS_LTML1]: 'Landsat 4-5 TM L1',
  [AWS_LTML2]: 'Landsat 4-5 TM L2',
  [ENVISAT_MERIS]: 'Envisat Meris',
  [GIBS_MODIS_TERRA]: 'MODIS Terra',
  [GIBS_MODIS_AQUA]: 'MODIS Aqua',
  [GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE]: 'VIIRS SNPP Corrected Reflectance',
  [GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC]: 'VIIRS SNPP DayNightBand ENCC',
  [GIBS_CALIPSO_WWFC_V3_01]: 'CALIPSO Wide Field Camera Radiance v3-01',
  [GIBS_CALIPSO_WWFC_V3_02]: 'CALIPSO Wide Field Camera Radiance v3-02',
  [GIBS_BLUEMARBLE]: 'BlueMarble',
  [GIBS_LANDSAT_WELD]: 'Landsat WELD',
  [GIBS_MISR]: 'MISR',
  [GIBS_ASTER_GDEM]: 'ASTER GDEM',
  [GIBS_VIIRS_NOAA20_CORRECTED_REFLECTANCE]: 'VIIRS NOAA-20 Corrected Reflectance',
  [CUSTOM]: 'CUSTOM',
  [DEM_MAPZEN]: 'DEM MAPZEN',
  [DEM_COPERNICUS_30]: 'DEM COPERNICUS 30',
  [DEM_COPERNICUS_90]: 'DEM COPERNICUS 90',
  [COPERNICUS_CORINE_LAND_COVER]: 'CORINE Land Cover',
  [COPERNICUS_GLOBAL_LAND_COVER]: 'Global Land Cover',
  [COPERNICUS_GLOBAL_SURFACE_WATER]: 'Global Surface Water',
  [COPERNICUS_WATER_BODIES]: 'Water Bodies',
};

export function getDatasetLabel(datasetId) {
  let datasetLabel;
  const dataSourceHandler = getDataSourceHandler(datasetId);
  if (dataSourceHandler) {
    datasetLabel = dataSourceHandler.getDatasetLabel(datasetId);
  }
  return datasetLabel;
}

export function getEvalsource(datasetId) {
  switch (datasetId) {
    case S1_AWS_IW_VVVH:
    case S1_AWS_IW_VV:
    case S1_AWS_EW_HHHV:
    case S1_AWS_EW_HH:
      return 'S1GRD';
    case S1_EW_SH:
      return 'S1_EW_SH';
    case S1_EW:
      return 'S1_EW';
    case S1:
      return 'S1';
    case S2L1C:
      return 'S2';
    case S2L2A:
      return 'S2L2A';
    case S3SLSTR:
      return 'S3SLSTR';
    case S3OLCI:
      return 'S3OLCI';
    case S5_O3:
    case S5_NO2:
    case S5_SO2:
    case S5_CO:
    case S5_HCHO:
    case S5_CH4:
    case S5_AER_AI:
    case S5_CLOUD:
    case S5_OTHER:
      return 'S5P_L2';
    case ESA_L5:
      return 'L5';
    case ESA_L7:
      return 'L7';
    case ESA_L8:
    case AWS_L8L1C:
    case AWS_LOTL1:
    case AWS_LOTL2:
      return 'L8';
    case MODIS:
      return 'Modis';
    case ENVISAT_MERIS:
      return 'ENV';
    default:
      return null;
  }
}

export function supportsFIS(visualizationUrl, datasetId, layerId, isCustom) {
  const dsh = getDataSourceHandler(datasetId);
  if (!dsh) {
    return false;
  }
  const hasFISLayer = !!dsh.getFISLayer(visualizationUrl, datasetId, layerId, isCustom);
  return hasFISLayer;
}

export function datasetHasAnyFISLayer(datasetId) {
  const dsh = getDataSourceHandler(datasetId);
  return dsh && !!Object.keys(dsh.FISLayers).length;
}

export function getDataSourceHashtags(datasetId) {
  switch (datasetId) {
    case S1_AWS_IW_VVVH:
    case S1_AWS_IW_VV:
    case S1_AWS_EW_HHHV:
    case S1_AWS_EW_HH:
    case S1_EW_SH:
    case S1_EW:
    case S1:
      return 'Sentinel-1,Copernicus';
    case S2L1C:
    case S2L2A:
      return 'Sentinel-2,Copernicus';
    case S3SLSTR:
    case S3OLCI:
      return 'Sentinel-3,Copernicus';
    case S5_O3:
    case S5_NO2:
    case S5_SO2:
    case S5_CO:
    case S5_HCHO:
    case S5_CH4:
    case S5_AER_AI:
    case S5_CLOUD:
    case S5_OTHER:
      return 'Sentinel-5,Copernicus';
    case MODIS:
      return 'MODIS,NASA';
    case PROBAV_S1:
    case PROBAV_S5:
    case PROBAV_S10:
      return 'Proba-V,ESA';
    case ESA_L5:
    case ESA_L7:
    case ESA_L8:
    case AWS_L8L1C:
    case AWS_LOTL1:
    case AWS_LOTL2:
      return 'Landsat,NASA';
    case ENVISAT_MERIS:
      return 'Envisat Meris,ESA';
    case GIBS_MODIS_TERRA:
    case GIBS_MODIS_AQUA:
    case GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE:
    case GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC:
    case GIBS_CALIPSO_WWFC_V3_01:
    case GIBS_CALIPSO_WWFC_V3_02:
    case GIBS_BLUEMARBLE:
    case GIBS_LANDSAT_WELD:
    case GIBS_MISR:
    case GIBS_ASTER_GDEM:
    case GIBS_VIIRS_NOAA20_CORRECTED_REFLECTANCE:
      return 'GIBS,NASA';
    default:
      if (checkIfCustom(datasetId)) {
        return 'BYOC';
      } else {
        return '';
      }
  }
}
