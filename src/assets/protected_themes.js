import { t } from 'ttag';
import { PLANET_SANDBOX_THEME_ID } from '../const';
import {
  PLANET_SCOPE,
  SKY_SAT,
  ABOVEGROUND_CARBON_DENSITY,
  CANOPY_HEIGHT,
  CANOPY_COVER,
  LST_100M,
  LST_1000M,
  SWC_100M,
  SWC_1000M,
  PLANET_BASEMAPS,
  ANALYSIS_READY_PLANETSCOPE,
  ROAD_AND_BUILDING_DETECTION,
} from '../Tools/SearchPanel/dataSourceHandlers/dataSourceConstants';

export const PLANET_SANDBOX_COLLECTIONS = {
  [ANALYSIS_READY_PLANETSCOPE]: '3f605f-YOUR-INSTANCEID-HERE',
  [PLANET_SCOPE]: 'ccb1f8-YOUR-INSTANCEID-HERE',
  [SKY_SAT]: 'fc7045-YOUR-INSTANCEID-HERE',
  [ABOVEGROUND_CARBON_DENSITY]: 'cc31ca-YOUR-INSTANCEID-HERE',
  [CANOPY_HEIGHT]: 'f3312c-YOUR-INSTANCEID-HERE',
  [CANOPY_COVER]: 'e3d2a2-YOUR-INSTANCEID-HERE',
  [LST_100M]: '8d9770-YOUR-INSTANCEID-HERE',
  [LST_1000M]: '6b613b-YOUR-INSTANCEID-HERE',
  [SWC_100M]: '65f7e4-YOUR-INSTANCEID-HERE',
  [SWC_1000M]: '858254-YOUR-INSTANCEID-HERE',
  [PLANET_BASEMAPS]: 'c48c01-YOUR-INSTANCEID-HERE',
  [ROAD_AND_BUILDING_DETECTION]: '9ff30a-YOUR-INSTANCEID-HERE',
};

export const PLANET_SANDBOX_THEME = [
  {
    name: () => t`Planet Sandbox Data [NEW]`,
    id: PLANET_SANDBOX_THEME_ID,
    fromTime: '2013-01-01T00:00:00.000Z',
    toTime: '2023-04-30T00:00:00.000Z',
    content: [
      {
        name: 'Analysis-Ready PlanetScope (Nebraska Sample)',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/23b244-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
      {
        name: 'PlanetScope',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/11ce5d-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
      {
        name: 'SkySat',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/c0d9df-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
      {
        name: 'SoilWater',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/2e4a87-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
      {
        name: 'LandSurfaceTemperature',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/e5216a-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
      {
        name: 'ForestCarbonDiligence',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/f006c0-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
      {
        name: 'PlanetBasemaps',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/64e817-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
      {
        name: 'RoadAndBuildingDetection',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/655dfa-YOUR-INSTANCEID-HERE',
        preselected: true,
        fetchLayersFromAnonymousAccount: true,
      },
    ],
    pins: [
      {
        lat: 41.3,
        lng: -93.9558,
        zoom: 12,
        title: 'Des Moines, United States (Analysis-Ready PlanetScope)',
        toTime: '2023-04-19T00:00:00.000Z',
        layerId: '0_TRUE-COLOR-CLOUDMASKED',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '3f605f-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/23b244-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 44.7348,
        lng: -0.6757,
        zoom: 12,
        title: 'Bordeaux, France (Analysis-Ready PlanetScope)',
        toTime: '2023-04-18T00:00:00.000Z',
        layerId: '0_TRUE-COLOR-CLOUDMASKED',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '3f605f-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/23b244-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -31.9137,
        lng: 116.1481,
        zoom: 12,
        title: 'Perth, Australia (Analysis-Ready PlanetScope)',
        toTime: '2023-04-29T00:00:00.000Z',
        layerId: '0_TRUE-COLOR-CLOUDMASKED',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '3f605f-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/23b244-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -16.59673,
        lng: -48.78251,
        zoom: 14,
        title: 'Planalmira, Brazil (PlanetScope)',
        toTime: '2022-11-17T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'ccb1f8-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/11ce5d-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 30.05862,
        lng: 31.47,
        zoom: 14,
        title: 'Cairo, Egypt (PlanetScope)',
        toTime: '2022-11-20T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'ccb1f8-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/11ce5d-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -32.1112,
        lng: 116.0231,
        zoom: 14,
        title: 'Perth, Australia (PlanetScope)',
        toTime: '2023-04-19T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'ccb1f8-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/11ce5d-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -9.46769,
        lng: -40.83146,
        zoom: 14,
        title: 'Bahia, Brazil (SkySat)',
        toTime: '2022-05-07T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'fc7045-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/c0d9df-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 30.05862,
        lng: 31.47,
        zoom: 14,
        title: 'Cairo, Egypt (SkySat)',
        toTime: '2022-08-19T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'fc7045-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/c0d9df-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -32.1112,
        lng: 116.0231,
        zoom: 14,
        title: 'Perth, Australia (SkySat)',
        toTime: '2022-10-19T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'fc7045-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/c0d9df-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 44.84,
        lng: -0.5234,
        zoom: 11,
        title: 'Bordeaux, France (Soil Water Content)',
        toTime: '2023-04-29T00:00:00.000Z',
        layerId: 'SWC-100',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '65f7e4-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/2e4a87-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 41.191,
        lng: -93.818,
        zoom: 11,
        title: 'Des Moines, United States (Soil Water Content)',
        toTime: '2022-12-31T00:00:00.000Z',
        layerId: 'SWC-100',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '65f7e4-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/2e4a87-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -34.5218,
        lng: 146.1202,
        zoom: 12,
        title: 'Griffith, Australia (Soil Water Content)',
        toTime: '2022-12-27T00:00:00.000Z',
        layerId: 'SWC-100',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '65f7e4-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/2e4a87-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 44.84,
        lng: -0.5234,
        zoom: 11,
        title: 'Bordeaux, France (Land Surface Temperature)',
        toTime: '2023-04-30T00:00:00.000Z',
        layerId: 'LST-100',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '8d9770-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/e5216a-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 41.191,
        lng: -93.818,
        zoom: 11,
        title: 'Des Moines, United States (Land Surface Temperature)',
        toTime: '2022-12-31T00:00:00.000Z',
        layerId: 'LST-100',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '8d9770-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/e5216a-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -34.5218,
        lng: 146.1202,
        zoom: 12,
        title: 'Griffith, Australia (Land Surface Temperature)',
        toTime: '2022-12-27T00:00:00.000Z',
        layerId: 'LST-100',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: '8d9770-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/e5216a-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 44.7345,
        lng: -0.676,
        zoom: 12,
        title: 'Bordeaux, France (Forest Carbon Dilligence)',
        toTime: '2017-01-01T00:00:00.000Z',
        layerId: 'ABOVEGROUND-CARBON-DENSITY',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'cc31ca-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/f006c0-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 41.2969,
        lng: -93.959,
        zoom: 12,
        title: 'Des Moines, United States (Forest Carbon Dilligence)',
        toTime: '2016-01-01T00:00:00.000Z',
        layerId: 'CANOPY-HEIGHT',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'f3312c-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/f006c0-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -6.7652,
        lng: -52.3763,
        zoom: 12,
        title: 'São Félix do Xingu, Brazil (Forest Carbon Dilligence)',
        toTime: '2017-01-01T00:00:00.000Z',
        layerId: 'CANOPY-COVER',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'e3d2a2-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/f006c0-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 44.7345,
        lng: -0.676,
        zoom: 9,
        title: 'Bordeaux, France (Basemaps)',
        toTime: '2023-04-01T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'c48c01-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/64e817-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -31.702,
        lng: 116.524,
        zoom: 9,
        title: 'Perth, Australia (Basemaps)',
        toTime: '2023-04-01T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'c48c01-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/64e817-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -6.7652,
        lng: -52.3763,
        zoom: 9,
        title: 'São Félix do Xingu, Brazil (Basemaps)',
        toTime: '2023-04-01T00:00:00.000Z',
        layerId: 'TRUE-COLOR',
        themeId: PLANET_SANDBOX_THEME_ID,
        datasetId: 'c48c01-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/64e817-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: 29.9469,
        lng: 31.632,
        zoom: 14,
        title: 'Cairo, Egypt (Road and Building Detection)',
        toTime: '2023-03-01T00:00:00.000Z',
        layerId: '0-ROADS-AND-BUILDINGS',
        themeId: 'PLANET_SANDBOX',
        datasetId: '9ff30a-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/655dfa-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -31.94761,
        lng: 115.86455,
        zoom: 14,
        title: 'Perth, Australia (Road and Building Detection)',
        toTime: '2023-03-01T00:00:00.000Z',
        layerId: '0-ROADS-AND-BUILDINGS',
        themeId: 'PLANET_SANDBOX',
        datasetId: '9ff30a-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/655dfa-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
      {
        lat: -6.64342,
        lng: -51.97589,
        zoom: 14,
        title: 'São Félix do Xingu, Brazil (Road and Building Detection)',
        toTime: '2023-03-01T00:00:00.000Z',
        layerId: '0-ROADS-AND-BUILDINGS',
        themeId: 'PLANET_SANDBOX',
        datasetId: '9ff30a-YOUR-INSTANCEID-HERE',
        evalscripturl: '',
        visualizationUrl: 'https://services.sentinel-hub.com/ogc/wms/655dfa-YOUR-INSTANCEID-HERE',
        description: 'License: [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)',
      },
    ],
    highlights: true,
  },
];
