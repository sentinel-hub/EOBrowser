import axios from 'axios';
import L from 'leaflet';
import geo_area from '@mapbox/geojson-area';
import intersect from '@turf/intersect';
import moment from 'moment';
import inside from 'turf-inside';
import { t } from 'ttag';
import jwt_dec from 'jwt-decode';
import {
  TPDICollections,
  TPDProvider,
  TPDI,
  BYOCLayer,
  BYOCSubTypes,
  CRS_EPSG4326,
  AirbusConstellation,
  PlanetItemType,
  setTPDIServiceBaseURL,
  PlanetARPSType,
  PlanetARPSId,
  PlanetPVType,
  PlanetPVId,
} from '@sentinel-hub/sentinelhub-js';
import { constructBBoxFromBounds } from '../../Controls/ImgDownload/ImageDownload.utils.js';
import store, { mainMapSlice, visualizationSlice, tabsSlice, themesSlice, authSlice } from '../../store';
import {
  TRANSACTION_TYPE,
  USER_INSTANCES_THEMES_LIST,
  OrderType,
  PLANETARY_VARIABLES_TYPE_CONFIGURATION,
  PLANETARY_VARIABLES_ID_CONFIGURATION,
  PLANET_TEMPLATE_CONFIGURATION,
  AIRBUS_TEMPLATE_CONFIGURATION,
  MAXAR_TEMPLATE_CONFIGURATION,
  SH_ACCOUNT_TYPE,
  SH_TRIAL_ACCOUNT_TYPES,
} from '../../const';
import { getBoundsZoomLevel } from '../../utils/coords';
import { isRectangle, isPolygon } from '../../utils/geojson.utils.js';

import { TPDICollectionsWithLabels } from './const.js';

const SH_SERVICES_URL = import.meta.env.VITE_SH_SERVICES_URL;

setTPDIServiceBaseURL(SH_SERVICES_URL);

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

export const formatNumberAsRoundedUnit = (value, precision = 2, unit = '%', nullValueLabel = '') => {
  if (value === null || value === undefined) {
    return nullValueLabel;
  }

  return !isNaN(value) ? `${roundToNDigits(value, precision)}${!!unit ? unit : ''}` : '';
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
  const userAccount = {
    trialAccount: false,
    hasCommercialDataAccess: false,
    hasGoogleMapsAccess: false,
    quotas: [],
  };

  if (!user || !user.access_token || !user.userdata) {
    return userAccount;
  }

  const requestConfig = {
    headers: {
      Authorization: `Bearer ${user.access_token}`,
      'Content-Type': 'application/json',
    },
  };

  const accountId = jwt_dec(user.access_token)?.account;
  const shServicesAccountInfoEndpoint = `${SH_SERVICES_URL}/ims/accounts/${accountId}/account-info`;

  const accountInfo = await axios.get(shServicesAccountInfoEndpoint, requestConfig);
  if (!accountInfo || !accountInfo.data) {
    return userAccount;
  }

  const isRootAccount = accountInfo?.data?.type === SH_ACCOUNT_TYPE.ROOT;
  if (isRootAccount) {
    const impersonatedUserId = store.getState().auth.impersonatedUser.userId;
    if (impersonatedUserId) {
      const shServicesImpersonatedAccountInfoEndpoint = `${SH_SERVICES_URL}/ims/users/${impersonatedUserId}`;
      const impersonatedAccountInfo = await axios.get(
        shServicesImpersonatedAccountInfoEndpoint,
        requestConfig,
      );
      if (impersonatedAccountInfo?.data) {
        const { givenName, familyName } = impersonatedAccountInfo.data;
        store.dispatch(authSlice.actions.setImpersonatedName(`${givenName} ${familyName}`));
      }
    }
  }

  userAccount.trialAccount = SH_TRIAL_ACCOUNT_TYPES.includes(accountInfo.data.type);
  userAccount.hasCommercialDataAccess = !!accountInfo.data.roleAssignments.di;
  userAccount.hasGoogleMapsAccess = !!accountInfo.data.typeInfo.properties.hasGoogleMapsAccess;

  const quotas = await TPDI.getQuotas({
    authToken: user.access_token,
  });
  if (quotas) {
    userAccount.quotas = quotas;
  }

  return userAccount;
};

const getConfigurationForPVTypeAndId = (type, id) => {
  if (PLANETARY_VARIABLES_TYPE_CONFIGURATION[type]) {
    return PLANETARY_VARIABLES_TYPE_CONFIGURATION[type];
  }

  if (PLANETARY_VARIABLES_ID_CONFIGURATION[id]) {
    return PLANETARY_VARIABLES_ID_CONFIGURATION[id];
  }
};

const getConfigurationForARPSTypeAndId = (type, id) => {
  if (type !== PlanetARPSType.AnalysisReadyPlanetScope) {
    return {};
  }

  switch (id) {
    case PlanetARPSId.PS_ARD_SR_DAILY: {
      return {
        id: '958e82-YOUR-INSTANCEID-HERE',
        name: 'My Analysis-Ready PlanetScope - Daily',
      };
    }
    case PlanetARPSId.PS_ARD_SR_BIWEEKLY: {
      return {
        id: '958e82-YOUR-INSTANCEID-HERE',
        name: 'My Analysis-Ready PlanetScope - Biweekly',
      };
    }
    case PlanetARPSId.PS_ARD_SR_MONTHLY: {
      return {
        id: '958e82-YOUR-INSTANCEID-HERE',
        name: 'My Analysis-Ready PlanetScope - Monthly',
      };
    }
    default:
      return {};
  }
};

const getPlanetTemplates = (transaction) => {
  if (isPlanetaryVariableTypeAndId(transaction.input.data[0].type, transaction.input.data[0].id)) {
    return getConfigurationForPVTypeAndId(transaction.input?.data[0]?.type, transaction.input?.data[0]?.id);
  }

  if (isARPSTypeAndId(transaction.input.data[0].type, transaction.input.data[0].id)) {
    return getConfigurationForARPSTypeAndId(transaction.input?.data[0]?.type, transaction.input?.data[0]?.id);
  }

  return PLANET_TEMPLATE_CONFIGURATION[transaction.input.data[0].itemType][
    transaction.input.data[0].productBundle
  ];
};

export const getConfigurationTemplate = (transaction) => {
  switch (transaction.provider) {
    case TPDProvider.PLANET:
      return getPlanetTemplates(transaction);
    case TPDProvider.AIRBUS:
      return AIRBUS_TEMPLATE_CONFIGURATION[transaction.input.data[0].constellation];
    case TPDProvider.MAXAR:
      return MAXAR_TEMPLATE_CONFIGURATION;
    default:
      console.error(`${transaction.provider} not supported`);
      return;
  }
};

export const cloneConfiguration = async (user, transaction) => {
  try {
    const configTemplate = getConfigurationTemplate(transaction);
    if (configTemplate === undefined) {
      return;
    }

    const shServicesCloneEndpoint = `${SH_SERVICES_URL}/configuration/v1/wms/instances/${configTemplate.id}/clone`;
    const config = {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const cloneResponse = await axios.post(shServicesCloneEndpoint, { name: configTemplate.name }, config);
    cloneResponse?.data?.layers.forEach((layer) => {
      layer.datasourceDefaults.collectionId = transaction.collectionId;
      axios.put(layer['@id'], layer, config);
    });
  } catch (error) {
    console.error(error);
  }
};

export const getBoundsAndLatLng = (geometry) => {
  const layer = L.geoJSON(geometry);
  const bounds = layer.getBounds();
  const { lat, lng } = bounds.getCenter();
  const zoom = getBoundsZoomLevel(bounds);
  return { bounds: bounds, lat: lat, lng: lng, zoom: zoom };
};

// fetch tpdi transactions
// based on transactionType, transactions can be an order or a subscribtion
export const fetchTransactions = async (transactionType, user) => {
  let allTransactions = [];
  const fetchingFunction =
    transactionType === TRANSACTION_TYPE.ORDER ? TPDI.getOrders : TPDI.getSubscriptions;
  if (user && !!user.access_token) {
    const requestsConfig = {
      authToken: user.access_token,
    };

    const accountId = store.getState().auth.impersonatedUser.accountId;
    let params = accountId ? { accountId } : null;

    let results = await fetchingFunction(params, requestsConfig, 100, null);
    if (results && results.data) {
      allTransactions = [...results.data];
    }
    while (results && results.links && results.links.nextToken) {
      results = await fetchingFunction(params, requestsConfig, 100, results.links.nextToken);
      if (results && results.data) {
        allTransactions = [...allTransactions, ...results.data];
      }
    }
  }
  return allTransactions;
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
      const url = `${SH_SERVICES_URL}/configuration/v1/wms/instances/${instance.id}/layers`;
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

export const getProvider = (dataProvider) => {
  switch (dataProvider) {
    case TPDICollections.AIRBUS_SPOT:
    case TPDICollections.AIRBUS_PLEIADES:
      return TPDProvider.AIRBUS;
    case TPDICollections.MAXAR_WORLDVIEW:
      return TPDProvider.MAXAR;
    case TPDICollections.PLANET_SCOPE:
    case TPDICollections.PLANET_SKYSAT:
      return TPDProvider.PLANET;
    case TPDICollections.PLANET_ARPS:
    case TPDICollections.PLANETARY_VARIABLES:
      return TPDProvider.PLANETARY_VARIABLES;
    default:
  }
};

function isPlanetaryVariableTypeAndId(type, id) {
  return Object.values(PlanetPVType).includes(type) && Object.values(PlanetPVId).includes(id);
}

function isARPSTypeAndId(type, id) {
  return Object.values(PlanetARPSType).includes(type) && Object.values(PlanetARPSId).includes(id);
}

export const getTpdiCollectionFromTransaction = (transaction) => {
  const provider = transaction.provider;
  if (provider === TPDProvider.AIRBUS) {
    const constellation = AirbusConstellation[transaction.input.data[0].constellation];
    return TPDICollections[`${TPDProvider.AIRBUS}_${constellation}`];
  }
  if (provider === TPDProvider.PLANET) {
    if (transaction.input.data[0].itemType) {
      const itemType = PlanetItemType[transaction.input.data[0].itemType];
      switch (itemType) {
        case PlanetItemType.PSScene:
        case PlanetItemType.PSScene4Band:
          return TPDICollections.PLANET_SCOPE;
        case PlanetItemType.SkySatCollect:
          return TPDICollections.PLANET_SKYSAT;
        default:
          throw new Error(`${itemType} not found in PlanetItemType`);
      }
    }
    if (transaction.input.data[0].type && transaction.input.data[0].id) {
      const type = transaction.input.data[0].type;
      const id = transaction.input.data[0].id;
      if (isPlanetaryVariableTypeAndId(type, id)) {
        return TPDICollections.PLANETARY_VARIABLES;
      } else if (isARPSTypeAndId(type, id)) {
        return TPDICollections.PLANET_ARPS;
      } else {
        throw new Error(`${type} and ${id} not found in PlanetPVType and PlanetPVId`);
      }
    }
  }
  if (provider === TPDProvider.MAXAR) {
    return TPDICollections.MAXAR_WORLDVIEW;
  } else {
    throw new Error(`Couldn't find collection`);
  }
};

export function createSearchParams(searchParams, aoiGeometry) {
  const params = { ...searchParams };
  if (aoiGeometry) {
    // only CRS_EPSG4326 is supported atm
    params.geometry = aoiGeometry;
    params.crs = CRS_EPSG4326;
  }

  if (params.dataProvider === TPDICollections.AIRBUS_SPOT) {
    params.constellation = AirbusConstellation.SPOT;
  }

  if (params.dataProvider === TPDICollections.AIRBUS_PLEIADES) {
    params.constellation = AirbusConstellation.PHR;
  }

  return params;
}

function getProductOrderArea(aoiGeometry, productId, allProducts = []) {
  const product = allProducts.find((p) => p.id === productId);
  let productArea = 0;
  if (product) {
    const intersection = intersect(aoiGeometry, product.geometry);
    if (intersection) {
      productArea = geo_area.geometry(intersection.geometry);
    }
  }
  return productArea;
}

//when ordering products, size is sum of intersections between products and aoi
export function getProductsOrderSize(provider, aoiGeometry, selectedProducts = [], searchResults = []) {
  if (!provider) {
    return 0;
  }

  if (!selectedProducts || selectedProducts.length === 0) {
    return 0;
  }

  if (!searchResults || searchResults.length === 0) {
    return 0;
  }

  const allProducts = searchResults.map((feature) => extractDataFromFeature(provider, feature));
  const orderSize = selectedProducts.reduce(
    (acc, productId) => acc + getProductOrderArea(aoiGeometry, productId, allProducts),
    0,
  );

  return roundToNDigits(orderSize / 1000000, 2);
}

export function getTransactionSize(
  provider,
  aoiGeometry,
  options,
  selectedProducts = [],
  searchResults = [],
) {
  if (!aoiGeometry) {
    return 0;
  }

  if (!options) {
    return roundToNDigits(geo_area.geometry(aoiGeometry) / 1000000, 2);
  }

  switch (options.type) {
    case OrderType.PRODUCTS:
      return getProductsOrderSize(provider, aoiGeometry, selectedProducts, searchResults);

    case OrderType.QUERY:
      //approx order size equals area of interest * number of results
      return searchResults.length * roundToNDigits(geo_area.geometry(aoiGeometry) / 1000000, 2);

    default:
      return 0;
  }
}

export function openGeocentoLink(searchParams, geometry) {
  const GEOCENTO_URL = 'https://imagery.geocento.com/';

  const fromTime = searchParams.fromTime.format('YYYY-MM-DD');
  const toTime = searchParams.toTime.format('YYYY-MM-DD');
  const timeParam = `time=${fromTime}/${toTime}`;

  const aoiParam = ((geometry) => {
    if (isRectangle(geometry)) {
      const coordinates = [...geometry.coordinates[0][0], ...geometry.coordinates[0][2]].join(',');
      return `bbox=${coordinates}`;
    } else if (isPolygon(geometry)) {
      const coordinates = geometry.coordinates[0].map((edge) => edge.join(' ')).join(',');
      return `polygon=POLYGON((${coordinates}))`;
    } else {
      throw new Error(t`MultiPolygons not supported by Geocento`);
    }
  })(geometry);

  const params = [...(aoiParam ? [aoiParam] : []), ...(timeParam ? [timeParam] : [])];

  window.open(`${GEOCENTO_URL}#mapviewer:${params.join('&')}`);
}

export function roundToNDigits(num, nFrac = 2) {
  return Math.round(num * Math.pow(10, nFrac)) / Math.pow(10, nFrac);
}

export const getTPDICollectionsWithLabels = (userAccountInfo) =>
  TPDICollectionsWithLabels.filter((collection) => {
    if (!collection.requiresQuotas) {
      return !collection.requiresQuotas;
    }

    const quotaForCollection = userAccountInfo.quotas.find((q) => q.collectionId === collection.value);
    if (!quotaForCollection) {
      return false;
    }

    return quotaForCollection.quotaSqkm > 0;
  });
