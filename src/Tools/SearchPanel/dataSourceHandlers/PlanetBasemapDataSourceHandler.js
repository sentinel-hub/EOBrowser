import React from 'react';
import moment from 'moment';
import { t } from 'ttag';
import bboxPolygon from '@turf/bbox-polygon';
import intersect from '@turf/intersect';

import DataSourceHandler from './DataSourceHandler';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import PlanetBasemapTooltip from './DatasourceRenderingComponents/dataSourceTooltips/PlanetBasemapTooltip';
import { PLANET_NICFI_BIANNUAL, PLANET_NICFI_MONTHLY } from './dataSourceConstants';
import { FetchingFunction } from '../search';
import { DATASOURCES } from '../../../const';
import { filterLayers } from './filter';

export const YYYY_MM_REGEX = /\d{4}-\d{2}/g;
const DATA_BOUNDS = [-179.9, -30.009514, 179.9, 30.102505];

export default class PlanetBasemapDataSourceHandler extends DataSourceHandler {
  urls = [];
  datasets = [PLANET_NICFI_BIANNUAL, PLANET_NICFI_MONTHLY];
  preselectedDatasets = new Set([PLANET_NICFI_BIANNUAL]);
  datasetSearchLabels = {
    [PLANET_NICFI_BIANNUAL]: t`Biannual`,
    [PLANET_NICFI_MONTHLY]: t`Monthly`,
  };
  datasetSearchIds = {
    [PLANET_NICFI_BIANNUAL]: 'PLANET_NICFI_BIANNUAL',
    [PLANET_NICFI_MONTHLY]: 'PLANET_NICFI_MONTHLY',
  };
  searchFilters = {};
  isChecked = false;
  KNOWN_URL = 'https://api.planet.com/basemaps/v1/mosaics/wmts?api_key=8fe044edc78c46ba904bb62e550493a3';
  allResults = null;
  datasource = DATASOURCES.PLANET_NICFI;
  availableLayersFromSearch = [];

  leafletZoomConfig = {
    [PLANET_NICFI_BIANNUAL]: {
      min: 1,
      max: 18,
    },
    [PLANET_NICFI_MONTHLY]: {
      min: 1,
      max: 18,
    },
  };
  leafletTileSizeConfig = {
    [PLANET_NICFI_BIANNUAL]: 256,
    [PLANET_NICFI_MONTHLY]: 256,
  };
  mosaicDateRanges = {
    [PLANET_NICFI_BIANNUAL]: {},
    [PLANET_NICFI_MONTHLY]: {},
  };

  willHandle(service, url, name, configs, preselected) {
    if (url !== this.KNOWN_URL) {
      return false;
    }
    this.urls.push(url);
    this.allLayers = configs;
    this.initMosaicDateRanges();
    return true;
  }

  isHandlingAnyUrl() {
    return this.urls.length > 0;
  }

  getSearchFormComponents() {
    if (!this.isHandlingAnyUrl()) {
      return null;
    }
    const preselected = false;
    return (
      <GenericSearchGroup
        key={`planet-nicfi`}
        label="Planet-NICFI"
        preselected={preselected}
        saveCheckedState={this.saveCheckedState}
        dataSourceTooltip={<PlanetBasemapTooltip />}
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

    selectedDatasets.forEach((selectedDataset) => {
      const func = this.getResultsFromPlanet;
      const ff = new FetchingFunction(
        selectedDataset,
        null,
        fromMoment,
        toMoment,
        queryArea,
        this.convertToStandardTiles,
        {
          url: this.KNOWN_URL,
          searchFunction: func,
          searchParams: { datasetId: this.datasetSearchIds[selectedDataset] },
        },
      );
      fetchingFunctions.push(ff);
    });

    return fetchingFunctions;
  }

  getResultsFromPlanet = async (
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
    const mapBoundsIntersectsData = intersect(
      bboxPolygon(DATA_BOUNDS),
      bboxPolygon([
        mapBounds.getSouthWest().lng,
        mapBounds.getSouthWest().lat,
        mapBounds.getNorthEast().lng,
        mapBounds.getNorthEast().lat,
      ]),
    );
    if (!mapBoundsIntersectsData) {
      return { tiles: [], hasMore: false };
    }
    const sensingTimeRanges = [];
    // Get biannual or monthly mosaics
    // monthly mosaics only have 1 YYYY-MM date, and Biannual have a from and to datestamp
    Object.keys(this.mosaicDateRanges[datasetId]).forEach((key) => {
      if (
        this.mosaicDateRanges[datasetId][key].fromTime.isBetween(fromMoment, toMoment) ||
        this.mosaicDateRanges[datasetId][key].toTime.isBetween(fromMoment, toMoment)
      ) {
        sensingTimeRanges.push(this.mosaicDateRanges[datasetId][key]);
      }
    });

    sensingTimeRanges.sort((a, b) => b.fromTime.diff(a));
    const foundIsoDates = sensingTimeRanges.map((d) => ({
      ...d,
      fromTime: d.fromTime.toISOString(),
      toTime: d.toTime.toISOString(),
    }));
    const datesForOffset = foundIsoDates.slice(offset, foundIsoDates.length);
    const tiles = convertToStandardTiles([...new Set(datesForOffset)], datasetId);
    const hasMore = foundIsoDates.length > offset + datesForOffset.length ? true : false;
    return { tiles, hasMore };
  };

  initMosaicDateRanges = () => {
    this.allLayers.forEach((l) => {
      const timeRangeArray = l.layerId.match(YYYY_MM_REGEX);
      if (timeRangeArray) {
        const datasetId = timeRangeArray.length === 1 ? PLANET_NICFI_MONTHLY : PLANET_NICFI_BIANNUAL;
        const fromToTimeObj = {
          fromTime: moment(timeRangeArray[0]).startOf('month'),
          toTime: timeRangeArray[1]
            ? moment(timeRangeArray[1]).endOf('month')
            : moment(timeRangeArray[0]).endOf('month'),
          layerIds: [l.layerId],
        };

        const foundMosiacsKey = `${fromToTimeObj.fromTime.format('YYYY-MM')}-${fromToTimeObj.toTime.format(
          'YYYY-MM',
        )}`;
        if (!this.mosaicDateRanges[datasetId][foundMosiacsKey]) {
          this.mosaicDateRanges[datasetId][foundMosiacsKey] = fromToTimeObj;
        } else {
          this.mosaicDateRanges[datasetId][foundMosiacsKey].layerIds.push(l.layerId);
        }
      }
    });
  };

  getLayers = (data, datasetId, url, layersExclude, layersInclude, selectedDate) => {
    const foundMosiacKey = Object.keys(this.mosaicDateRanges[datasetId]).find((key) => {
      const mosaic = this.mosaicDateRanges[datasetId][key];
      return selectedDate.isBetween(mosaic.fromTime, mosaic.toTime);
    });
    let layers = data.filter(
      (layer) =>
        filterLayers(layer.layerId, layersExclude, layersInclude) &&
        foundMosiacKey &&
        this.mosaicDateRanges[datasetId][foundMosiacKey].layerIds.includes(layer.layerId),
    );
    layers.forEach((l) => {
      l.url = url;
    });
    return layers;
  };

  convertToStandardTiles = (data, datasetId) => {
    return data.map((d) => ({
      datasetId,
      datasource: this.datasource,
      sensingTime: d.toTime,
      metadata: {
        ...d.metadata,
        mosaicTimeRange: {
          fromTime: d.fromTime,
          toTime: d.toTime,
        },
      },
    }));
  };

  getMinMaxDates(datasetId) {
    const datsetIdDateRangeObj = this.mosaicDateRanges[datasetId];
    const datsetIdDateRangeKeys = Object.keys(datsetIdDateRangeObj);

    if (datsetIdDateRangeKeys.length === 0) {
      return { minDate: null, maxDate: null };
    }

    const minDate = moment(datsetIdDateRangeObj[datsetIdDateRangeKeys[0]].toTime).endOf('month');
    const maxDate = moment(
      datsetIdDateRangeObj[datsetIdDateRangeKeys[datsetIdDateRangeKeys.length - 1]].toTime,
    ).endOf('month');

    return { minDate, maxDate };
  }

  getUrlsForDataset = () => {
    return this.urls;
  };

  getSentinelHubDataset = () => {
    return null;
  };

  supportsCustomLayer() {
    return false;
  }

  updateLayersOnVisualization() {
    return false;
  }

  supportsV3Evalscript() {
    return false;
  }

  supportsIndex = () => {
    return false;
  };

  getCopyrightText = () => '';

  isCopernicus = () => false;

  isSentinelHub = () => false;
  supportsTimelapse = () => false;
  supportsImgExport = () => false;
}
