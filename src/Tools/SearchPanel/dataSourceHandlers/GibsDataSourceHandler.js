import React from 'react';
import axios from 'axios';
import moment from 'moment';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import GibsTooltip from './DatasourceRenderingComponents/dataSourceTooltips/GibsTooltip';
import { FetchingFunction } from '../search';
import {
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
} from './dataSourceHandlers';
import { filterLayers } from './filter';

function parseISO8601TimeIntervalFormat(ISO8601string) {
  const [startStr, endStr, periodStr] = ISO8601string.split('/');
  const start = moment.utc(startStr);
  const end = moment.utc(endStr);
  const period = moment.duration(periodStr);
  return { start, end, period };
}

export default class GibsDataSourceHandler extends DataSourceHandler {
  urls = [];
  datasets = [
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
  ];

  getCapabilitiesDatasetIds = {
    [GIBS_MODIS_TERRA]: 'MODIS_Terra_SurfaceReflectance',
    [GIBS_MODIS_AQUA]: 'MODIS_Aqua_SurfaceReflectance',
    [GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE]: 'VIIRS_SNPP_CorrectedReflectance',
    [GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC]: 'VIIRS_SNPP_DayNightBand_ENCC',
    [GIBS_CALIPSO_WWFC_V3_01]: 'CALIPSO_Wide_Field_Camera_Radiance_v3-01',
    [GIBS_CALIPSO_WWFC_V3_02]: 'CALIPSO_Wide_Field_Camera_Radiance_v3-02',
    [GIBS_BLUEMARBLE]: 'BlueMarble',
    [GIBS_LANDSAT_WELD]: 'Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual',
    [GIBS_MISR]: 'MISR_AM1_Ellipsoid_Radiance_RGB_AA',
    [GIBS_ASTER_GDEM]: 'ASTER_GDEM',
  };

  leafletZoomConfig = {
    [GIBS_MODIS_TERRA]: {
      min: 0,
      max: 8,
      allowOverZoomBy: 2,
    },
    [GIBS_MODIS_AQUA]: {
      min: 0,
      max: 8,
      allowOverZoomBy: 2,
    },
    [GIBS_VIIRS_SNPP_CORRECTED_REFLECTANCE]: {
      min: 0,
      max: 9,
      allowOverZoomBy: 2,
    },
    [GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC]: {
      min: 0,
      max: 8,
      allowOverZoomBy: 2,
    },
    [GIBS_CALIPSO_WWFC_V3_01]: {
      min: 0,
      max: 7,
      allowOverZoomBy: 2,
    },
    [GIBS_CALIPSO_WWFC_V3_02]: {
      min: 0,
      max: 7,
      allowOverZoomBy: 2,
    },
    [GIBS_BLUEMARBLE]: {
      min: 0,
      max: 8,
      allowOverZoomBy: 2,
    },
    [GIBS_LANDSAT_WELD]: {
      min: 0,
      max: 12,
      allowOverZoomBy: 2,
    },
    [GIBS_MISR]: {
      min: 0,
      max: 9,
      allowOverZoomBy: 2,
    },
    [GIBS_ASTER_GDEM]: {
      min: 0,
      max: 12,
      allowOverZoomBy: 2,
    },
  };

  datasetSearchLabels = {
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
  };

  preselectedDatasets = new Set([GIBS_MODIS_TERRA]);
  searchFilters = {};
  isChecked = false;
  KNOWN_URL = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi';
  allResults = null;
  datasource = 'GIBS';

  willHandle(service, url, name, configs, preselected) {
    if (url !== this.KNOWN_URL) {
      return false;
    }
    this.urls.push(url);
    this.allLayers = configs;
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
    const preselected = false;
    return (
      <GenericSearchGroup
        key={`gibs`}
        label="GIBS"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={<GibsTooltip />}
        saveFiltersValues={this.saveSearchFilters}
        options={this.datasets}
        optionsLabels={this.datasetSearchLabels}
        preselectedOptions={Array.from(this.preselectedDatasets)}
        hasMaxCCFilter={false}
      />
    );
  }

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    let fetchingFunctions = [];

    const selectedDatasets = this.searchFilters.selectedOptions;

    selectedDatasets.forEach(dataset => {
      const url = `${this.KNOWN_URL}?SERVICE=WMS&REQUEST=GetCapabilities`;
      const func = this.getResultsFromGIBS;
      const ff = new FetchingFunction(
        dataset,
        null,
        fromMoment,
        toMoment,
        queryArea,
        this.convertToStandardTiles,
        {
          url: url,
          searchFunction: func,
          searchParams: { datasetId: this.getCapabilitiesDatasetIds[dataset] },
        },
      );
      fetchingFunctions.push(ff);
    });

    return fetchingFunctions;
  }

  getResultsFromGIBS = async (
    url,
    mapBounds,
    fromMoment,
    toMoment,
    datasetId,
    convertToStandardTiles,
    maxCount = 50,
    offset = 0,
    params = {},
  ) => {
    const datasourceId = params.datasetId;
    if (!this.allResults) {
      const capabilities = await axios.get(url).then(r => {
        return r.data;
      });
      const parseString = require('xml2js').parseString;
      const data = await new Promise((resolve, reject) =>
        parseString(capabilities, function(err, result) {
          if (err) reject(err);
          else resolve(result);
        }),
      );
      const allLayers = data.WMS_Capabilities.Capability[0].Layer[0].Layer.map(layer => {
        const dimension = layer.Dimension
          ? {
              name: layer.Dimension[0].$.name,
              default: layer.Dimension[0].$.default,
              units: layer.Dimension[0].$.units ? layer.Dimension[0].$.units : '',
              values: layer.Dimension[0]._,
            }
          : null;
        return {
          name: layer.Name ? layer.Name[0] : null,
          title: layer.Title ? layer.Title[0] : null,
          dimension: dimension,
        };
      });
      this.allResults = allLayers;
    }
    // We are mocking dataset and tiles here, by finding the first layer that's name starts with a "datasourceId" ie GIBS_MODIS_TERRA
    // and then creating tiles depending on the start, end date and the period/frequency
    const applicableLayer = this.allResults.find(l => l.name.startsWith(datasourceId));
    let allDates = [];

    if (!applicableLayer.dimension) {
      allDates.push(moment.utc().toISOString());
    } else {
      const intervals = applicableLayer.dimension.values.split(',');
      for (let interval of intervals) {
        let partialDates = [];
        // Moment supports ISO 8601 durations (moment.duration(ISO8601_duration_string))
        // which can be directly used in date.subtract()
        // http://momentjs.com/docs/#/durations/
        const {
          start: intervalStart,
          end: intervalEnd,
          period: intervalPeriod,
        } = parseISO8601TimeIntervalFormat(interval);

        let safeStart = intervalStart.isAfter(fromMoment) ? intervalStart : fromMoment;
        let safeEnd = intervalEnd.isBefore(toMoment) ? intervalEnd : toMoment;

        if (!(fromMoment.isAfter(intervalEnd) || toMoment.isBefore(intervalStart))) {
          let currDate = safeEnd.startOf('day');
          let firstDate = safeStart.startOf('day');

          while (currDate.diff(firstDate) >= 0) {
            partialDates.push(
              currDate
                .clone()
                .utc()
                .toISOString(),
            );
            currDate.subtract(intervalPeriod);
          }
          allDates = partialDates.concat(allDates);
        }
      }
    }

    const datesForOffset = allDates.slice(offset, allDates.length);
    const tiles = convertToStandardTiles(datesForOffset, datasetId);
    const hasMore = allDates.length > offset + datesForOffset.length ? true : false;
    return { tiles, hasMore };
  };

  convertToStandardTiles = (tiles, datasetId) => {
    return tiles.map(d => ({
      datasource: this.datasource,
      datasetId,
      sensingTime: d,
      metadata: {},
    }));
  };

  getUrlsForDataset = () => {
    return this.urls;
  };

  getSentinelHubDataset = () => {
    return null;
  };

  supportsCustomLayer() {
    return false;
  }

  getLayers = (data, datasetId, url, layersExclude, layersInclude) => {
    let layers = data.filter(
      layer =>
        filterLayers(layer.layerId, layersExclude, layersInclude) &&
        this.filterLayersGIBS(layer.layerId, datasetId),
    );
    layers.forEach(l => {
      l.url = url;
    });
    return layers;
  };

  filterLayersGIBS = (layerId, datasetId) => {
    return layerId.startsWith(this.getCapabilitiesDatasetIds[datasetId]);
  };

  supportsTimeRange() {
    return false;
  }

  supportsTimelapse() {
    return false;
  }

  updateLayersOnVisualization() {
    return false;
  }
}
