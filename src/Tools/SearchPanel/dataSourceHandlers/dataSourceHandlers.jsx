import React from 'react';
import {
  CacheTarget,
  LayersFactory,
  BYOCLayer,
  S1GRDAWSEULayer,
  DEMLayer,
  BYOCSubTypes,
} from '@sentinel-hub/sentinelhub-js';
import { parseStringPromise } from 'xml2js';

import store, { notificationSlice, themesSlice } from '../../../store';

import CopernicusServicesDataSourceHandler from './CopernicusServicesDataSourceHandler';
import Sentinel1DataSourceHandler from './Sentinel1DataSourceHandler';
import Sentinel2AWSDataSourceHandler from './Sentinel2AWSDataSourceHandler';
import Sentinel3DataSourceHandler from './Sentinel3DataSourceHandler';
import Sentinel5PDataSourceHandler from './Sentinel5PDataSourceHandler';
import Landsat45AWSDataSourceHandler from './Landsat45AWSDataSourceHandler';
import Landsat15AWSDataSourceHandler from './Landsat15AWSDataSourceHandler';
import Landsat7AWSDataSourceHandler from './Landsat7AWSDataSourceHandler';
import Landsat8AWSDataSourceHandler from './Landsat8AWSDataSourceHandler';
import ModisDataSourceHandler from './ModisDataSourceHandler';
import ProbaVDataSourceHandler from './ProbaVDataSourceHandler';
import GibsDataSourceHandler from './GibsDataSourceHandler';
import BYOCDataSourceHandler from './BYOCDataSourceHandler';
import DEMDataSourceHandler from './DEMDataSourceHandler';
import PlanetBasemapDataSourceHandler from './PlanetBasemapDataSourceHandler';
import OthersDataSourceHandler from './OthersDataSourceHandler';

import { getCollectionInformation } from '../../../utils/collections';

import { DATASOURCES } from '../../../const';
import {
  S1_AWS_IW_VVVH,
  S1_AWS_IW_VV,
  S1_AWS_EW_HHHV,
  S1_AWS_EW_HH,
  S2L1C,
  S2L2A,
  S3SLSTR,
  S3OLCI,
  S5_O3,
  S5_NO2,
  S5_SO2,
  S5_CO,
  S5_HCHO,
  S5_CH4,
  S5_AER_AI,
  S5_CLOUD,
  S5_OTHER,
  MODIS,
  AWS_L8L1C,
  AWS_HLS,
  DEM_MAPZEN,
  DEM_COPERNICUS_30,
  DEM_COPERNICUS_90,
  COPERNICUS_CORINE_LAND_COVER,
  COPERNICUS_GLOBAL_LAND_COVER,
  COPERNICUS_WATER_BODIES,
  COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES,
  COPERNICUS_HR_VPP_VEGETATION_INDICES,
  COPERNICUS_HR_VPP_VPP_S1,
  COPERNICUS_HR_VPP_VPP_S2,
  COPERNICUS_HRSI_PSA,
  COPERNICUS_HRSI_WDS,
  COPERNICUS_HRSI_SWS,
  COPERNICUS_HRSI_FSC,
  COPERNICUS_HRSI_GFSC,
  COPERNICUS_HRSI_RLIE_S1,
  COPERNICUS_HRSI_RLIE_S2,
  COPERNICUS_HRSI_RLIE_S1_S2,
  COPERNICUS_CLC_ACCOUNTING,
  CNES_LAND_COVER,
  GLOBAL_HUMAN_SETTLEMENT,
  ESA_WORLD_COVER,
  COPERNICUS_GLOBAL_SURFACE_WATER,
  IO_LULC_10M_ANNUAL,
  AWS_LOTL1,
  AWS_LOTL2,
  AWS_LTML1,
  AWS_LTML2,
  AWS_LMSSL1,
  AWS_LETML1,
  AWS_LETML2,
  GIBS_MODIS_TERRA,
  GIBS_MODIS_AQUA,
  GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE,
  GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC,
  GIBS_CALIPSO_WWFC_V3_01,
  GIBS_CALIPSO_WWFC_V3_02,
  GIBS_BLUEMARBLE,
  GIBS_LANDSAT_WELD,
  GIBS_MISR,
  GIBS_ASTER_GDEM,
  GIBS_VIIRS_NOAA20_CORRECTED_REFLECTANCE,
  PROBAV_S1,
  PROBAV_S5,
  PROBAV_S10,
  CUSTOM,
  PLANET_NICFI,
  PLANET_SCOPE,
  SKY_SAT,
  FOREST_CARBON_DILIGENCE,
  LAND_SURFACE_TEMPERATURE,
  SOIL_WATER_CONTENT,
  ABOVEGROUND_CARBON_DENSITY,
  SWC_1000M,
  SWC_100M,
  LST_1000M,
  LST_100M,
  CANOPY_COVER,
  CANOPY_HEIGHT,
  ANALYSIS_READY_PLANETSCOPE,
  ROAD_AND_BUILDING_DETECTION,
} from './dataSourceConstants';
import HLSAWSDataSourceHandler from './HLSAWSDataSourceHandler';
import PlanetSandboxDatasourceHandler from './PlanetSandboxDatasourceHandler';
import { getThemeName } from '../../../utils';

export let dataSourceHandlers;
initializeDataSourceHandlers();

export function initializeDataSourceHandlers() {
  dataSourceHandlers = [
    new Sentinel1DataSourceHandler(),
    new Sentinel2AWSDataSourceHandler(),
    new Sentinel3DataSourceHandler(),
    new Sentinel5PDataSourceHandler(),
    new Landsat15AWSDataSourceHandler(),
    new Landsat45AWSDataSourceHandler(),
    new Landsat7AWSDataSourceHandler(),
    new Landsat8AWSDataSourceHandler(),
    new HLSAWSDataSourceHandler(),
    new ModisDataSourceHandler(),
    new DEMDataSourceHandler(),
    new CopernicusServicesDataSourceHandler(),
    new ProbaVDataSourceHandler(),
    new GibsDataSourceHandler(),
    new BYOCDataSourceHandler(),
    new PlanetBasemapDataSourceHandler(),
    new OthersDataSourceHandler(),
    new PlanetSandboxDatasourceHandler(),
  ];
}

function registerHandlers(service, url, name, configs, preselected) {
  const handledBy = dataSourceHandlers.filter((dsHandler) =>
    dsHandler.willHandle(service, url, name, configs, preselected),
  );
  return handledBy.length !== 0;
}

export function renderDataSourcesInputs() {
  return dataSourceHandlers
    .filter((dsh) => dsh.isHandlingAnyUrl())
    .map((dsh, dshIndex) => <div key={dshIndex}>{dsh.getSearchFormComponents()}</div>);
}

/*
BYOCLayer is an exception where lazy loading of service parameters is not sufficent. If we want to generate search form without
hardcoding collectionIds or without assuming there will always be only one different collection per instance, we need to have
collectionId and only way to get it is to query service.
*/
const collectionTitles = {};

async function updateLayersFromServiceIfNeeded(layers, authToken) {
  const updateLayersFromService = layers.filter(
    (l) => l instanceof BYOCLayer || l instanceof S1GRDAWSEULayer || l instanceof DEMLayer,
  );

  await Promise.all(
    updateLayersFromService.map(async (l) => {
      try {
        await l.updateLayerFromServiceIfNeeded({
          timeout: 30000,
          authToken,
          cache: {
            expiresIn: Number.POSITIVE_INFINITY,
            targets: [CacheTarget.MEMORY],
          },
        });
        if (l instanceof BYOCLayer) {
          let availableBands = [];
          try {
            availableBands = await l.getAvailableBands({
              timeout: 30000,
              cache: {
                expiresIn: Number.POSITIVE_INFINITY,
                targets: [CacheTarget.MEMORY],
              },
            });
          } catch (err) {
            console.error(err);
          }
          l.availableBands = availableBands;
        }
      } catch (e) {
        console.error(`Error retrieving additional data for layer ${l.layerId} in instance ${l.instanceId}`);
        throw e;
      }
    }),
  );
  // update collection titles
  await updateCollectionsFromServiceIfNeeded(updateLayersFromService);
}

const updateLayersWithCollectionTitle = (layers, collectionId, collectionTitle) =>
  layers.filter((l) => l.collectionId === collectionId).forEach((l) => (l.collectionTitle = collectionTitle));

async function updateCollectionsFromServiceIfNeeded(layers) {
  const uniqueCollections = {};

  const byocLayers = layers.filter((l) => l instanceof BYOCLayer);

  // create dict of collections to avoid repeating request
  byocLayers.forEach((l) => {
    uniqueCollections[l.collectionId] = {
      collectionId: l.collectionId,
      locationId: l.locationId,
      subType: l.subType,
    };
  });

  await Promise.all(
    Object.keys(uniqueCollections).map(async (collectionId) => {
      const collection = uniqueCollections[collectionId];
      try {
        //check "cache"
        if (collectionTitles[collection.collectionId]) {
          updateLayersWithCollectionTitle(
            byocLayers,
            collectionId,
            collectionTitles[collection.collectionId],
          );
        } else {
          //check known collections
          const knownCollectionTitle = checkKnownCollections(collectionId);
          if (knownCollectionTitle) {
            updateLayersWithCollectionTitle(byocLayers, collectionId, knownCollectionTitle);
          } else {
            //get collection title from catalog
            if (collection.subType !== BYOCSubTypes.ZARR) {
              const collectionInfo = await getCollectionInformation(
                collection.collectionId,
                collection.locationId,
                collection.subType,
              ).then((r) => r.data);
              collectionTitles[collection.collectionId] = collectionInfo.title;
              updateLayersWithCollectionTitle(byocLayers, collectionId, collectionInfo.title);
            }
          }
        }
      } catch (e) {
        console.error(`Error retrieving additional data for collection ${collection.collectionId} `);
        throw e;
      }
    }),
  );
}

// try to get collection name from datasource handler for known collections (Copernicus&friends)
const checkKnownCollections = (collectionId) => {
  const datasourceHandlers = [new CopernicusServicesDataSourceHandler(), new OthersDataSourceHandler()];

  let collectionTitle;

  for (let dsh of datasourceHandlers) {
    const knownCollections = dsh.KNOWN_COLLECTIONS;
    const datasetId = Object.keys(knownCollections).find(
      (c) => knownCollections[c] && knownCollections[c].indexOf(collectionId) > -1,
    );
    if (datasetId && dsh.getDatasetSearchLabels) {
      collectionTitle = dsh.getDatasetSearchLabels()[datasetId];
      break;
    }
  }

  return collectionTitle;
};

export async function prepareDataSourceHandlers(theme) {
  initializeDataSourceHandlers();

  const allLayers = await Promise.all(
    theme.content.map(async (dataSource) => {
      let dataSourceUrl = dataSource.url.replace(
        'https://services-uswest2.sentinel-hub.com/',
        'https://services.sentinel-hub.com/',
      );
      let authToken = dataSource.fetchLayersFromAnonymousAccount
        ? store.getState().auth.anonToken
        : undefined;
      try {
        const layers = await LayersFactory.makeLayers(dataSourceUrl, null, null, {
          timeout: 30000,
          authToken,
          responseType: 'text',
          cache: {
            expiresIn: Number.POSITIVE_INFINITY,
            targets: [CacheTarget.MEMORY],
          },
        });
        await updateLayersFromServiceIfNeeded(layers, authToken);
        return layers;
      } catch (e) {
        if (e?.response?.status === 403 && e?.response?.headers['content-type'] === 'application/xml') {
          const responseData = await parseStringPromise(e.response.data);
          const responseText = responseData?.ServiceExceptionReport?.ServiceException[0].trim();
          store.dispatch(notificationSlice.actions.displayPanelError({ message: responseText }));
        }
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
    const isHandled = registerHandlers(
      service,
      url,
      name ? name : getThemeName(theme),
      allLayers[i],
      preselected,
    );
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
      return DATASOURCES.S1;
    case S2L1C:
    case S2L2A:
      return DATASOURCES.S2;
    case S3SLSTR:
    case S3OLCI:
      return DATASOURCES.S3;
    case S5_O3:
    case S5_NO2:
    case S5_SO2:
    case S5_CO:
    case S5_HCHO:
    case S5_CH4:
    case S5_AER_AI:
    case S5_CLOUD:
    case S5_OTHER:
      return DATASOURCES.S5;
    case MODIS:
      return DATASOURCES.MODIS;
    case PROBAV_S1:
    case PROBAV_S5:
    case PROBAV_S10:
      return DATASOURCES.PROBAV;
    case AWS_L8L1C:
    case AWS_LOTL1:
    case AWS_LOTL2:
      return DATASOURCES.AWS_LANDSAT8;
    case AWS_LTML1:
    case AWS_LTML2:
      return DATASOURCES.AWS_LANDSAT45;
    case AWS_LMSSL1:
      return DATASOURCES.AWS_LANDSAT15;
    case AWS_HLS:
      return DATASOURCES.AWS_HLS;
    case AWS_LETML1:
    case AWS_LETML2:
      return DATASOURCES.AWS_LANDSAT7_ETM;
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
      return DATASOURCES.GIBS;
    case DEM_MAPZEN:
    case DEM_COPERNICUS_30:
    case DEM_COPERNICUS_90:
      return DATASOURCES.DEM;
    case COPERNICUS_CORINE_LAND_COVER:
    case COPERNICUS_GLOBAL_LAND_COVER:
    case COPERNICUS_WATER_BODIES:
    case COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES:
    case COPERNICUS_HR_VPP_VEGETATION_INDICES:
    case COPERNICUS_HR_VPP_VPP_S1:
    case COPERNICUS_HR_VPP_VPP_S2:
    case COPERNICUS_HRSI_PSA:
    case COPERNICUS_HRSI_WDS:
    case COPERNICUS_HRSI_SWS:
    case COPERNICUS_HRSI_FSC:
    case COPERNICUS_HRSI_GFSC:
    case COPERNICUS_HRSI_RLIE_S1:
    case COPERNICUS_HRSI_RLIE_S2:
    case COPERNICUS_HRSI_RLIE_S1_S2:
    case COPERNICUS_CLC_ACCOUNTING:
      return DATASOURCES.COPERNICUS;
    case PLANET_NICFI:
      return DATASOURCES.PLANET_NICFI;
    case CNES_LAND_COVER:
    case ESA_WORLD_COVER:
    case COPERNICUS_GLOBAL_SURFACE_WATER:
    case IO_LULC_10M_ANNUAL:
    case GLOBAL_HUMAN_SETTLEMENT:
      return DATASOURCES.OTHER;
    case SKY_SAT:
    case PLANET_SCOPE:
    case FOREST_CARBON_DILIGENCE:
    case LAND_SURFACE_TEMPERATURE:
    case SOIL_WATER_CONTENT:
    case ABOVEGROUND_CARBON_DENSITY:
    case CANOPY_HEIGHT:
    case CANOPY_COVER:
    case LST_100M:
    case LST_1000M:
    case SWC_100M:
    case SWC_1000M:
    case ANALYSIS_READY_PLANETSCOPE:
    case ROAD_AND_BUILDING_DETECTION:
      return DATASOURCES.PLANET_SANDBOX_DATA;
    default:
      return null;
  }
}

export function getDataSourceHandler(datasetId) {
  const datasource = datasourceForDatasetId(datasetId);
  if (datasource) {
    return dataSourceHandlers.find((d) => d.datasource === datasource);
  } else {
    return checkIfCustom(datasetId);
  }
}

const checkBYOCDatasourceHandler = (datasetId, datasource) => {
  let dsh = dataSourceHandlers.find((d) => d.datasource === datasource);
  if (dsh && dsh.datasets) {
    const isCustomDataset = dsh.datasets.includes(datasetId);
    if (isCustomDataset) {
      return dsh;
    }
  }
};

export function checkIfCustom(datasetId) {
  for (let datasource of [DATASOURCES.CUSTOM, DATASOURCES.PLANET_SANDBOX_DATA]) {
    const dsh = checkBYOCDatasourceHandler(datasetId, datasource);
    if (dsh) {
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
  [S2L1C]: 'Sentinel-2 L1C',
  [S2L2A]: 'Sentinel-2 L2A',
  [S3SLSTR]: 'Sentinel-3 SLSTR',
  [S3OLCI]: 'Sentinel-3 OLCI',
  [S5_O3]: 'Sentinel-5P O3',
  [S5_NO2]: 'Sentinel-5P NO2',
  [S5_SO2]: 'Sentinel-5P SO2',
  [S5_CO]: 'Sentinel-5P CO',
  [S5_HCHO]: 'Sentinel-5P HCHO',
  [S5_CH4]: 'Sentinel-5P CH4',
  [S5_AER_AI]: 'Sentinel-5P AER_AI',
  [S5_CLOUD]: 'Sentinel-5P CLOUD',
  [S5_OTHER]: 'Sentinel-5P Other',
  [MODIS]: 'MODIS',
  [PROBAV_S1]: 'Proba-V 1 day (S1)',
  [PROBAV_S5]: 'Proba-V 5 day (S5)',
  [PROBAV_S10]: 'Proba-V 10 day (S10)',
  [AWS_L8L1C]: 'Landsat 8 (USGS archive)',
  [AWS_LOTL1]: 'Landsat 8-9 L1',
  [AWS_LOTL2]: 'Landsat 8-9 L2',
  [AWS_LTML1]: 'Landsat 4-5 TM L1',
  [AWS_LTML2]: 'Landsat 4-5 TM L2',
  [AWS_LMSSL1]: 'Landsat 1-5 MSS L1',
  [AWS_LETML1]: 'Landsat 7 ETM+ L1',
  [AWS_LETML2]: 'Landsat 7 ETM+ L2',
  [AWS_HLS]: 'Harmonized Landsat Sentinel (HLS)',
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
  [CNES_LAND_COVER]: 'CNES Land Cover',
  [ESA_WORLD_COVER]: 'ESA WorldCover',
  [COPERNICUS_GLOBAL_SURFACE_WATER]: 'Global Surface Water',
  [IO_LULC_10M_ANNUAL]: 'IO Land Use Land Cover Map',
  [COPERNICUS_WATER_BODIES]: 'Water Bodies',
  [COPERNICUS_HR_VPP_SEASONAL_TRAJECTORIES]: 'Seasonal Trajectories',
  [COPERNICUS_HR_VPP_VEGETATION_INDICES]: 'Vegetation Indices',
  [COPERNICUS_HR_VPP_VPP_S1]: 'Vegetation Phenology and Productivity Season 1',
  [COPERNICUS_HR_VPP_VPP_S2]: 'Vegetation Phenology and Productivity Season 2',
  [COPERNICUS_HRSI_PSA]: 'Persistent Snow Area',
  [COPERNICUS_HRSI_WDS]: 'Wet/Dry Snow',
  [COPERNICUS_HRSI_SWS]: 'SAR Wet Snow',
  [COPERNICUS_HRSI_FSC]: 'Fractional Snow Cover',
  [COPERNICUS_HRSI_GFSC]: 'Fractional Snow Cover (Gap-filled)',
  [COPERNICUS_HRSI_RLIE_S1]: 'River and Lake Ice Extent - Sentinel-1',
  [COPERNICUS_HRSI_RLIE_S2]: 'River and Lake Ice Extent - Sentinel-2',
  [COPERNICUS_HRSI_RLIE_S1_S2]: 'River and Lake Ice Extent S1+S2',
  [COPERNICUS_CLC_ACCOUNTING]: 'CORINE Land Cover Accounting Layers',
  [GLOBAL_HUMAN_SETTLEMENT]: 'Global Human Settlement',
  [PLANET_NICFI]: 'Planet NICFI Basemaps',
};

export function getDatasetLabel(datasetId) {
  let datasetLabel;
  const dataSourceHandler = getDataSourceHandler(datasetId);
  if (dataSourceHandler) {
    datasetLabel = dataSourceHandler.getDatasetLabel(datasetId);
  }
  return datasetLabel;
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
      return 'Sentinel-5P,Copernicus';
    case MODIS:
      return 'MODIS,NASA';
    case PROBAV_S1:
    case PROBAV_S5:
    case PROBAV_S10:
      return 'Proba-V,ESA';
    case AWS_L8L1C:
    case AWS_LOTL1:
    case AWS_LOTL2:
    case AWS_LMSSL1:
    case AWS_LETML1:
    case AWS_LETML2:
      return 'Landsat,NASA';
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
