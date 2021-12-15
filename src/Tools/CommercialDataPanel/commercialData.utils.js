import axios from 'axios';
import L from 'leaflet';
import geo_area from '@mapbox/geojson-area';
import intersect from '@turf/intersect';
import moment from 'moment';
import inside from 'turf-inside';
import { TPDProvider, TPDI, BYOCLayer, BYOCSubTypes } from '@sentinel-hub/sentinelhub-js';
import { constructBBoxFromBounds } from '../../Controls/ImgDownload/ImageDownload.utils.js';
import store, { mainMapSlice, visualizationSlice, tabsSlice, themesSlice } from '../../store';
import { USER_INSTANCES_THEMES_LIST } from '../../const';
import { getBoundsZoomLevel } from '../../utils/coords';

const SH_ACCOUNT_TRIAL = 11000;
const SH_DOMAIN_SERVICE = 1;

export const extractErrorMessage = (error) => {
  const errors = [];

  if (error && error.message) {
    errors.push(error.message);
  }

  if (
    error &&
    error.response &&
    error.response.data &&
    error.response.data.error &&
    error.response.data.error.code
  ) {
    errors.push(error.response.data.error.code);
  }

  if (
    error &&
    error.response &&
    error.response.data &&
    error.response.data.error &&
    error.response.data.error.message
  ) {
    errors.push(error.response.data.error.message);
  }

  if (
    error &&
    error.response &&
    error.response.data &&
    error.response.data.error &&
    error.response.data.error.errors
  ) {
    errors.push(JSON.stringify(error.response.data.error.errors));
  }

  return errors.join('\n');
};

const extractDataFromFeature = (provider, feature) => {
  switch (provider) {
    case TPDProvider.AIRBUS:
      return {
        id: feature.properties.id,
        date: feature.properties.acquisitionDate,
        coverage: feature.coverage,
        cloudCover: feature.properties.cloudCover,
        constellation: feature.properties.constellation,
        processingLevel: feature.properties.processingLevel,
        snowCover: feature.properties.snowCover,
        incidenceAngle: feature.properties.incidenceAngle,
        geometry: feature.geometry,
      };
    case TPDProvider.PLANET:
      return {
        id: feature.id,
        date: feature.properties.acquired,
        coverage: feature.coverage,
        cloud_cover: feature.properties.cloud_cover,
        snow_ice_percent: feature.properties.snow_ice_percent,
        shadow_percent: feature.properties.shadow_percent,
        pixel_resolution: feature.properties.pixel_resolution,
        geometry: feature.geometry,
      };

    case TPDProvider.MAXAR:
      return {
        id: feature.catalogID,
        date: feature.acquisitionDateStart,
        coverage: feature.coverage,
        geometry: feature.geometry,
        ...feature,
      };
    default:
      return {};
  }
};

export const filterSearchResults = (results, provider, location) => {
  let searchResults = results
    .map((feature) => extractDataFromFeature(provider, feature))
    .sort((a, b) => moment.utc(b.date).diff(moment.utc(a.date)));

  if (!!location) {
    const clickedPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
    };
    searchResults = searchResults.filter((result) => inside(clickedPoint, result));
  }

  return searchResults;
};

export const createSelectOptions = (items) =>
  Object.keys(items).map((item) => ({ value: items[item], label: items[item] }));

export const formatNumberAsRoundedUnit = (value, precision = 2, unit = '%') => {
  return !isNaN(value)
    ? `${Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision)}${!!unit ? unit : ''}`
    : '';
};

export const calculateAOICoverage = (aoiGeometry, productGeometry) => {
  const aoiArea = geo_area.geometry(aoiGeometry);

  const intersection = intersect(aoiGeometry, productGeometry);

  if (!aoiArea || !(intersection && intersection.geometry)) {
    return 0;
  }
  //set max coverage to 1 (100%) to avoid intersection artefacts
  return Math.min(geo_area.geometry(intersection.geometry) / aoiArea, 1);
};

export const checkUserAccount = async (user) => {
  if (!user || !user.access_token || !user.userdata) {
    return {
      payingAccount: false,
      quotasEnabled: false,
    };
  }

  const headers = {
    Authorization: `Bearer ${user.access_token}`,
    'Content-Type': 'application/json',
  };
  const requestConfig = {
    headers: headers,
  };

  let hasPayingAccount = false;

  const res = await axios.get(
    `https://services.sentinel-hub.com/oauth/users/${user.userdata.sub}/accounts`,
    requestConfig,
  );

  if (res.data && res.data.member && Array.isArray(res.data.member)) {
    const domain = res.data.member.find((member) => member.domainId === SH_DOMAIN_SERVICE);
    if (domain) {
      hasPayingAccount = domain.type !== SH_ACCOUNT_TRIAL;
    }
  }

  const quotas = await TPDI.getQuotas({
    authToken: user.access_token,
  });

  return {
    payingAccount: hasPayingAccount,
    quotasEnabled: quotas && quotas.length > 0,
  };
};

export const getBoundsAndLatLng = (geometry) => {
  const layer = L.geoJSON(geometry);
  const bounds = layer.getBounds();
  const { lat, lng } = bounds.getCenter();
  const zoom = getBoundsZoomLevel(bounds);
  return { bounds: bounds, lat: lat, lng: lng, zoom: zoom };
};

//fetch user orders
export const fetchOrders = async (user) => {
  let allOrders = [];
  if (user && !!user.access_token) {
    const requestsConfig = {
      authToken: user.access_token,
    };
    let results = await TPDI.getOrders(null, requestsConfig, 100, null);
    if (results && results.data) {
      allOrders = [...results.data];
    }
    while (results && results.links && results.links.nextToken) {
      results = await TPDI.getOrders(null, requestsConfig, 100, results.links.nextToken);
      if (results && results.data) {
        allOrders = [...allOrders, ...results.data];
      }
    }
  }
  return allOrders;
};

//fetch all user BYOC layers
export const fetchUserBYOCLayers = async (user, instances = []) => {
  const layersForInstancePromise = instances.map((instance, index) => {
    try {
      const headers = {
        Authorization: `Bearer ${user.access_token}`,
      };
      const requestConfig = {
        responseType: 'json',
        headers: headers,
      };
      const url = `https://services.sentinel-hub.com/configuration/v1/wms/instances/${instance.id}/layers`;
      return axios.get(url, requestConfig);
    } catch (err) {
      console.error('Error fetching layers for instance', instance.id, err);
      return null;
    }
  });
  let allLayers;

  try {
    allLayers = await Promise.all(layersForInstancePromise);
  } catch (err) {
    console.error(err);
    return null;
  }

  const byocLayers = allLayers
    .map((response) => response.data)
    .flat()
    .filter((layer) => layer && layer.datasourceDefaults && layer.datasourceDefaults.collectionId);
  return byocLayers;
};

//
export const getBestMatchingLayer = (layers, collectionId, layerName) => {
  if (!layers || !layers.length || !collectionId) {
    return null;
  }
  const layersForCollection = layers.filter(
    (l) => l.datasourceDefaults && l.datasourceDefaults.collectionId === collectionId,
  );

  if (!layersForCollection.length) {
    return null;
  }

  let layer = layersForCollection.find((l) => l.id.match(new RegExp(layerName, 'i')));
  if (!layer) {
    layer = layersForCollection[0];
  }
  return layer;
};

// try to display purchased data on map
export async function showDataOnMap(order, layer) {
  const instanceId = layer.instance['@id'].substr(layer.instance['@id'].lastIndexOf('/') + 1);

  // It is not possible to get dates from order as order contains only list of products and geometry
  // Instead we try to find last date by querying collection

  const orderGeometry = L.geoJSON(order.input.bounds.geometry);
  const bounds = orderGeometry.getBounds();
  const bbox = constructBBoxFromBounds(bounds);

  let fromTime = moment.utc().subtract(3, 'months').startOf('day');

  let toTime = moment().utc().endOf('day');

  const searchLayer = new BYOCLayer({
    instanceId: true,
    layerId: true,
    evalscript: '//',
    collectionId: layer.datasourceDefaults.collectionId,
    subType: BYOCSubTypes.BYOC,
  });

  let tiles = null;

  //try to find last date for collection
  try {
    const result = await searchLayer.findTiles(
      bbox,
      new Date(moment.utc().subtract(5, 'years').startOf('day')),
      new Date(moment().utc().endOf('day')),
      1,
      0,
    );
    if (result) {
      tiles = result.tiles;
    }
  } catch (err) {
    console.error('Error searching collection', layer.datasourceDefaults.collectionId, err);
  }

  if (tiles && tiles.length > 0) {
    fromTime = moment.utc(tiles[0].sensingTime).startOf('day');
    toTime = moment.utc(tiles[0].sensingTime).endOf('day');
  }

  //switch to user theme
  store.dispatch(
    themesSlice.actions.setSelectedThemeId({
      selectedThemeId: instanceId,
      selectedThemesListId: USER_INSTANCES_THEMES_LIST,
    }),
  );

  //set dataset visualization params
  store.dispatch(
    visualizationSlice.actions.setVisualizationParams({
      datasetId: layer.datasourceDefaults.collectionId,
      layerId: layer.id,
      fromTime: fromTime,
      toTime: toTime,
    }),
  );

  //switch to visualize tab
  store.dispatch(tabsSlice.actions.setTabIndex(2));
  if (order && order.input && order.input.bounds && order.input.bounds.geometry) {
    //move to order's position
    const { lat, lng, zoom } = getBoundsAndLatLng(order.input.bounds.geometry);
    store.dispatch(mainMapSlice.actions.setPosition({ lat: lat, lng: lng, zoom: zoom }));
  }
}
