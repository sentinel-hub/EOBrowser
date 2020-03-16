import axios from 'axios';
import Store from '../store';
import moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { getCoordsFromBounds, bboxToPolygon } from './coords';
import L from 'leaflet';
import get from 'dlv';
import { DATASOURCES, DEFAULT_POLY_STYLE } from '../store/config';
import bands from '../store/bands.json';
import { STANDARD_STRING_DATE_FORMAT, ISO_8601_UTC } from './datesHelper';

const GETCAPABILITIES_PROMISES_CACHE = {};
const ARBITRARY_SMALL_SEARCH_AREA = [
  [
    [13.463745117187502, 45.42905779197545],
    [13.834533691406252, 45.42905779197545],
    [13.834533691406252, 45.66348654108304],
    [13.463745117187502, 45.66348654108304],
    [13.463745117187502, 45.42905779197545],
  ],
];

function loadGetCapabilitiesForInstance(instanceObj) {
  const wmsWmtsUrl = instanceObj.baseUrls.WMTS ? instanceObj.baseUrls.WMTS : instanceObj.baseUrls.WMS;
  const service = instanceObj.baseUrls.WMTS ? 'WMTS' : 'WMS';
  const isJsonResponse = wmsWmtsUrl.includes('ogc');
  return loadGetCapabilities(service, wmsWmtsUrl, isJsonResponse);
}

export const REQUEST_TYPE_GET_CAPABILITIES = 1;
export const REQUEST_TYPE_EOCLOUD_INSTANCE_CONFIG = 2;
export function loadGetCapabilities(
  service,
  wmsWmtsUrl,
  isJsonResponse = false,
  requestType = REQUEST_TYPE_GET_CAPABILITIES,
) {
  const cacheIdentifier = `${service}:${wmsWmtsUrl}:${isJsonResponse ? 'json' : 'xml'}:${requestType}`;
  if (GETCAPABILITIES_PROMISES_CACHE[cacheIdentifier]) {
    return GETCAPABILITIES_PROMISES_CACHE[cacheIdentifier];
  }

  const newPromise = new Promise((resolve, reject) => {
    // this is a hack, which makes services-uswest2 GetCapabilities requests *much* faster:
    wmsWmtsUrl = wmsWmtsUrl.replace(
      'https://services-uswest2.sentinel-hub.com/',
      'https://services.sentinel-hub.com/',
    );

    const url =
      requestType === REQUEST_TYPE_GET_CAPABILITIES
        ? `${wmsWmtsUrl}?SERVICE=${service}&REQUEST=GetCapabilities&time=${new Date().valueOf()}${
            isJsonResponse ? '&FORMAT=application/json' : ''
          }`
        : `${wmsWmtsUrl.replace('/v1/wms/', '/v1/config/instance/instance.')}?scope=ALL`;
    const axiosInstance = axios.create({ timeout: 30000 });
    axiosInstance
      .get(url, {
        responseType: isJsonResponse ? 'json' : 'text',
      })
      .then(res => {
        if (isJsonResponse) {
          resolve(res.data);
        } else {
          // XML:
          const parseString = require('xml2js').parseString;
          parseString(res.data, function(err, result) {
            if (!result) {
              reject(err || 'Result parsing failed');
              return;
            }
            resolve(result);
          });
        }
      })
      .catch(e => {
        reject(e);
      });
  });

  GETCAPABILITIES_PROMISES_CACHE[cacheIdentifier] = newPromise;
  return newPromise;
}

function parseLayersFromGetCapabilitiesWMS(data) {
  let result = {};
  for (let l in data.WMS_Capabilities.Capability[0].Layer[0].Layer) {
    let currLayer = data.WMS_Capabilities.Capability[0].Layer[0].Layer[l];

    let dimension = {};
    for (let d in currLayer.Dimension) {
      dimension[d] = {
        name: currLayer.Dimension[d]['$'].name,
        default: currLayer.Dimension[d]['$'].default,
        unitSymbol: currLayer.Dimension[d]['$'].unitSymbol ? currLayer.Dimension[d]['$'].unitSymbol : '',
        units: currLayer.Dimension[d]['$'].units ? currLayer.Dimension[d]['$'].units : '',
        values: currLayer.Dimension[d]['_'].split(','),
      };
    }

    let styles = [];
    if (currLayer.Style) {
      currLayer.Style.map(style =>
        styles.push({
          name: style.Name[0],
          url: style.LegendURL ? style.LegendURL[0].OnlineResource[0]['$']['xlink:href'] : null,
        }),
      );
    }

    result[l] = {
      name: currLayer.Name[0],
      title: currLayer.Title[0],
      abstract: currLayer.Abstract ? currLayer.Abstract[0] : '',
      dimension: dimension,
      styles: styles,
    };
  }
  return result;
}

function parseLayersFromGetCapabilitiesWMTS(data) {
  let allTileMatrixSets = {};
  for (let k in data.Capabilities.Contents[0].TileMatrixSet) {
    let tms = data.Capabilities.Contents[0].TileMatrixSet[k];
    let len = tms.TileMatrix.length;

    allTileMatrixSets[tms['ows:Identifier'][0]] = {
      name: tms['ows:Identifier'][0],
      minZoom: tms.TileMatrix[0]['ows:Identifier'][0],
      maxZoom: tms.TileMatrix[len - 1]['ows:Identifier'][0],
      tileSize: tms.TileMatrix[0].TileWidth[0],
    };
  }

  let result = {};
  for (let l in data.Capabilities.Contents[0].Layer) {
    let currLayer = data.Capabilities.Contents[0].Layer[l];

    let dimension = {};
    for (let d in currLayer.Dimension) {
      let dim = currLayer.Dimension[d];

      dimension[d] = {
        name: dim['ows:Identifier'][0],
        default: dim.Default[0],
        unitSymbol: dim.unitSymbol ? dim.unitSymbol[0] : '',
        units: dim['ows:UOM'] ? dim['ows:UOM'][0] : '',
        values: dim.Value,
      };
    }

    let tilematrixSets = {};
    for (let ts in currLayer.TileMatrixSetLink) {
      tilematrixSets[ts] = allTileMatrixSets[currLayer.TileMatrixSetLink[ts].TileMatrixSet[0]];
    }

    let legendDefinitionUrl = currLayer['ows:Metadata']
      ? currLayer['ows:Metadata'][0]['$']['xlink:href']
      : undefined;
    let title = currLayer['ows:Title'][0]['_'] ? currLayer['ows:Title'][0]['_'] : currLayer['ows:Title'][0];
    result[l] = {
      name: currLayer['ows:Identifier'][0],
      title: title,
      abstract: currLayer['ows:Abstract'] ? currLayer['ows:Abstract'][0] : '',
      format: currLayer.Format[0],
      dimension: dimension,
      tilematrixSets: tilematrixSets,
      order: title.includes('True Color') ? 0 : 1,
      legendDefinitionUrl: legendDefinitionUrl,
    };
  }
  return result;
}

export const loadGetCapabilitiesAndSaveLayers = instanceObj => {
  const instanceName = instanceObj.name;
  let wmsWmtsUrl = instanceObj.baseUrls.WMTS ? instanceObj.baseUrls.WMTS : instanceObj.baseUrls.WMS;
  let service = instanceObj.baseUrls.WMTS ? 'WMTS' : 'WMS';

  const isJsonResponse = wmsWmtsUrl.includes('ogc');
  const bandsRegex = /^B[0-9][0-9A]/i;

  return new Promise((resolve, reject) => {
    loadGetCapabilities(service, wmsWmtsUrl, isJsonResponse)
      .then(res => {
        if (isJsonResponse) {
          const { layers, datasets } = res;
          const channels = [];
          const presets = [];
          layers.forEach(l => {
            if (
              bandsRegex.test(l.id) ||
              (instanceObj.useLayerAsChannel && instanceObj.useLayerAsChannel(l.id))
            ) {
              const { description } = l;
              const [desc, color] = description.split('|');
              channels.push({
                name: l.name,
                description: desc,
                color: color || '#aaaaaa',
              });
            } else {
              const encodedGainOverride = btoa('gainOverride=1;');

              let defaultLegendUrl;
              if (typeof instanceObj.defaultLegendUrl === 'function') {
                defaultLegendUrl = instanceObj.defaultLegendUrl(l.id);
              }

              let legendDefinitionJsonUrl = null;
              if (l.legendUrl) {
                legendDefinitionJsonUrl = `${l.legendUrl}&format=application/json`;
              }

              let legendUrl = l.legendUrl ? l.legendUrl : defaultLegendUrl;

              const layer = {
                ...l,
                image: `${wmsWmtsUrl}?showLogo=false&SERVICE=${service}&REQUEST=GetMap&LAYERS=${
                  l.id
                }&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&evalscriptoverrides=${encodedGainOverride}&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/${moment
                  .utc()
                  .format('YYYY-MM-DD')}`,
                legendUrl,
                legendDefinitionJsonUrl,
              };
              // from config.js the datasource objects should have a search property, where the useLayer function might be declared.
              // the useLayer function is used to identify if a layer should be used as a layer or as band.
              // In the case of s5p, we have to identify what layer belongs to which datasource in the s5p dataset
              //  IE the datasource SENTINEL-5P CH4 should only display the CH4/MEthane layer.
              if (!instanceObj.search || !instanceObj.search.useLayer || instanceObj.search.useLayer(layer)) {
                presets.push(layer);
              }
            }
          });

          Store.setChannels(
            instanceName,
            channels.length === 0 && datasets[0]
              ? datasets[0].name.includes('S2')
                ? bands[datasets[0].name]
                : datasets[0].bands.map(b => ({ name: b }))
              : channels,
          );
          // we are using layer naming so that we can grab FIS shadow layers for this instance
          // (fake layers that we use for displaying nicer Feature Info charts)
          Store.setFISShadowLayers(
            instanceName,
            presets.filter(l => l.id.startsWith('__FIS_') || l.name.startsWith('__FIS_')),
          );
          Store.setCloudCoverageLayer(
            instanceName,
            presets.find(l => l.id === '__CLOUD_COVERAGE' || l.name === '__CLOUD_COVERAGE'),
          );
          Store.setPresets(
            instanceName,
            presets
              .filter(l => !l.id.startsWith('__') && !l.name.startsWith('__'))
              .sort((a, b) => (a.id > b.id ? 1 : -1)),
          ); // any layer starting with double underscore is reserved
        } else {
          // response came from XML:

          let layers = instanceObj.baseUrls.WMTS
            ? parseLayersFromGetCapabilitiesWMTS(res)
            : parseLayersFromGetCapabilitiesWMS(res);

          let channels = [],
            presets = [];
          for (let l in layers) {
            if (layers.hasOwnProperty(l)) {
              const layerId = layers[l].name;
              const layerName = layers[l].title;

              const splitName = layerId.split('.')[1];
              if (layerId === 'FILL' || splitName === 'FILL') break;

              if (
                bandsRegex.test(layerId) ||
                (instanceObj.useLayerAsChannel && instanceObj.useLayerAsChannel(layerId))
              ) {
                //fill bands
                channels.push({
                  name: layerId,
                  description: layers[l].abstract.split('|')[0],
                  color:
                    layers[l].abstract.split('|')[1] !== undefined ? layers[l].abstract.split('|')[1] : 'red',
                });
              }

              let tilematrixSet = instanceObj.baseUrls.WMTS ? layers[l].tilematrixSets[0] : undefined;
              const encodedGainOverride = btoa('gainOverride=1;');

              //check if default legend is defined in config.js for selected datasource (defaultLegendUrl function)
              let defaultLegendUrl;
              if (typeof instanceObj.defaultLegendUrl === 'function') {
                defaultLegendUrl = instanceObj.defaultLegendUrl(layerId);
              }

              //default style is named 'default' or defined in config.js for selected datasource (defaultStyle function)
              let defaultStyle = 'default';
              if (typeof instanceObj.defaultStyle === 'function') {
                defaultStyle = instanceObj.defaultStyle(layerId);
              }

              //try to find legendUrl for default style
              let legendUrlFromStyles;
              if (layers[l].styles) {
                let style = layers[l].styles.find(style => style.name === defaultStyle);
                legendUrlFromStyles = style && style.url ? style.url : undefined;
              }

              //if legend for default style doesn't exists and there is only one style for layer, use that one
              if (!legendUrlFromStyles && layers[l].styles) {
                legendUrlFromStyles =
                  layers[l].styles && layers[l].styles.length === 1 && layers[l].styles[0].url
                    ? layers[l].styles[0].url
                    : undefined;
              }

              /*
              Use legend url as defined in getCapabilities for default style.
              If legend url is not defined in getCapabilities, try to get it from datasource by calling function defaultLegendUrl(layerId)
              */
              let legendUrl = legendUrlFromStyles ? legendUrlFromStyles : defaultLegendUrl;

              const layer = {
                name: layerName,
                id: layerId,
                description: layers[l].abstract,
                image: `${wmsWmtsUrl}&SERVICE=${service}&REQUEST=GetMap&show&LAYERS=${layerId}&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&evalscriptoverrides=${encodedGainOverride}1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/${moment
                  .utc()
                  .format('YYYY-MM-DD')}`,

                tilematrixSetName: tilematrixSet ? tilematrixSet.name : undefined,
                minZoom: tilematrixSet ? parseInt(tilematrixSet.minZoom, 10) : undefined,
                maxZoom: tilematrixSet ? parseInt(tilematrixSet.maxZoom, 10) : undefined,
                tileSize: tilematrixSet ? parseInt(tilematrixSet.tileSize, 10) : undefined,
                format: instanceObj.baseUrls.WMTS ? layers[l].format : undefined,
                order: layers[l].order,
                legendUrl: legendUrl,
                legendDefinitionUrl: layers[l].legendDefinitionUrl
                  ? layers[l].legendDefinitionUrl
                  : undefined,
              };
              if (!instanceObj.search.useLayer || instanceObj.search.useLayer(layer)) {
                presets.push(layer);
              }
            }
          }

          if (presets.every(l => l.order !== undefined)) {
            presets.sort((a, b) => a.order - b.order);
          } else {
            presets.sort((a, b) => (a.id > b.id ? 1 : -1));
          }

          //set first active preset if none defined
          Store.setChannels(instanceName, channels);
          // we are using layer naming so that we can grab FIS shadow layers for this instance
          // (fake layers that we use for displaying nicer Feature Info charts)
          Store.setFISShadowLayers(
            instanceName,
            presets.filter(l => l.id.startsWith('__FIS_') || l.name.startsWith('__FIS_')),
          );
          Store.setPresets(
            instanceName,
            presets.filter(l => !l.id.startsWith('__') && !l.name.startsWith('__')),
          ); // any layer starting with double underscore is reserved
        }
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
};

export function fetchThemes(url) {
  return axios.get(url, { responseType: 'json' });
}

export function getDatesFromProbaV(fromMoment, toMoment, datasourceId) {
  const datasource = DATASOURCES.find(ds => ds.id === datasourceId);
  return new Promise(async (resolve, reject) => {
    try {
      const capabilities = await loadGetCapabilitiesForInstance(datasource);
      const allLayers = datasource.baseUrls.WMTS
        ? parseLayersFromGetCapabilitiesWMTS(capabilities)
        : parseLayersFromGetCapabilitiesWMS(capabilities);
      const applicableLayer = Object.values(allLayers).find(l => l.name.startsWith(`${datasourceId}_`));

      const allDates = applicableLayer.dimension[0].values.map(d => moment(d));
      const filteredDates = allDates.filter(d => d.isBetween(fromMoment, toMoment));
      filteredDates.sort((a, b) => b.diff(a));
      const stringDates = filteredDates.map(d => d.format('YYYY-MM-DD'));
      resolve(stringDates);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

export function getDatesFromGIBS(fromMoment, toMoment, datasourceId) {
  const datasource = DATASOURCES.find(ds => ds.id === datasourceId);
  return new Promise(async (resolve, reject) => {
    try {
      const capabilities = await loadGetCapabilitiesForInstance(datasource);

      const allLayers = datasource.baseUrls.WMTS
        ? parseLayersFromGetCapabilitiesWMTS(capabilities)
        : parseLayersFromGetCapabilitiesWMS(capabilities);

      const applicableLayer = Object.values(allLayers).find(l =>
        l.name.startsWith(`${datasourceId.substring(5)}`),
      );

      let allDates = [];

      if (!applicableLayer.dimension[0]) {
        allDates.push(moment.utc().format('YYYY-MM-DD'));
      } else {
        for (let val in applicableLayer.dimension[0].values) {
          let partialDates = [];

          // Moment supports ISO 8601 durations (moment.duration(ISO8601_duration_string))
          // which can be directly used in date.subtract()
          // http://momentjs.com/docs/#/durations/
          const {
            start: intervalStart,
            end: intervalEnd,
            period: intervalPeriod,
          } = parseISO8601TimeIntervalFormat(applicableLayer.dimension[0].values[val]);

          let safeStart = intervalStart.isAfter(fromMoment) ? intervalStart : fromMoment;
          let safeEnd = intervalEnd.isBefore(toMoment) ? intervalEnd : toMoment;

          if (!(fromMoment.isAfter(intervalEnd) || toMoment.isBefore(intervalStart))) {
            let currDate = safeEnd.startOf('day');
            let firstDate = safeStart.startOf('day');

            while (currDate.diff(firstDate) >= 0) {
              partialDates.push(currDate.clone().format('YYYY-MM-DD'));
              currDate.subtract(intervalPeriod);
            }
            allDates = partialDates.concat(allDates);
          }
        }
      }

      resolve(allDates);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

function parseISO8601TimeIntervalFormat(ISO8601string) {
  const [startStr, endStr, periodStr] = ISO8601string.split('/');
  const start = moment(startStr);
  const end = moment(endStr);
  const period = moment.duration(periodStr);
  return { start, end, period };
}

function fetchFromDatesService(url, payload) {
  return new Promise((resolve, reject) => {
    axios
      .post(url, payload, {
        headers: new Headers({
          'Accept-CRS': 'EPSG:4326',
          'Content-Type': 'application/json;charset=utf-8',
          Accept: 'application/json',
        }),
      })
      .then(response => response.data)
      .then(res => {
        if (res.length > 0) {
          resolve(res);
        }
        if (res.length === 0) {
          reject('no date found');
        }
      })
      .catch(err => reject(err));
  });
}
export function getDatesFromSHServiceV1Or2(url, fromMoment, toMoment, queryArea = null, suffix) {
  const timeFrom = fromMoment.format(ISO_8601_UTC);
  const timeTo = toMoment.format(ISO_8601_UTC);
  if (!queryArea) {
    const mapBoundsBBox = Store.current.mapBounds.toBBoxString().split(',');
    queryArea = bboxToPolygon(mapBoundsBBox);
  }
  const payload = queryArea;
  const requestUrl = `${url}?timefrom=${timeFrom}&timeto=${timeTo}${suffix || ''}`;
  return fetchFromDatesService(requestUrl, payload);
}
export function getDatesFromSHServiceV3(url, fromMoment, toMoment, queryArea = null, additionalParams = {}) {
  if (!queryArea) {
    const mapBoundsBBox = Store.current.mapBounds.toBBoxString().split(',');
    queryArea = bboxToPolygon(mapBoundsBBox);
  }
  const payload = {
    ...additionalParams,
    queryArea: queryArea,
    from: fromMoment.format(ISO_8601_UTC),
    to: toMoment.format(ISO_8601_UTC),
    maxCloudCoverage: 1,
  };
  return fetchFromDatesService(url, payload);
}
export function loadInstances(token) {
  return new Promise((resolve, reject) => {
    fetchInstances(token)
      .then(instances => {
        const modifiedUserInstances = instances.map(inst => ({
          baseUrls: {
            WMS: `${process.env.REACT_APP_BASEURL}ogc/wms/${inst.id}`,
            FIS: `${process.env.REACT_APP_BASEURL}ogc/fis/${inst.id}`,
          },
          ...inst,
          datasource: inst.name,
        }));
        Store.setUserInstances(modifiedUserInstances);
        Store.setInstances([...Store.current.instances, ...modifiedUserInstances]);

        // also use those istances to get layers from them!
        Store.current.instances.forEach(instance => {
          loadGetCapabilitiesAndSaveLayers(instance);
        });

        resolve(modifiedUserInstances);
      })
      .catch(({ error, msg }) => {
        reject({ error: msg });
      });
  });
}

function fetchInstances(token) {
  return new Promise((resolve, reject) => {
    axios
      .get(`${process.env.REACT_APP_BASEURL}configuration/v1/wms/instances`, {
        responseType: 'text',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      })
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject({ error: e, msg: 'Failed to load instances.' });
      });
  });
}

export function fetchProbaVSearchResults(datasource, queryParams) {
  return new Promise((resolve, reject) => {
    getDatesFromProbaV(queryParams.timeFrom, queryParams.timeTo, datasource.id)
      .then(foundDates => {
        const searchResults = foundDates.map(d => ({
          tileData: {
            datasource: datasource.name,
            time: d,
            sensingTime: d,
            cloudCoverage: -1,
            activeLayer: datasource,
            lat: Store.current.lat,
            lng: Store.current.lng,
          },
          properties: {
            index: 0,
            queryParams: queryParams,
          },
        }));
        resolve({
          results: searchResults,
          params: { ...queryParams },
          datasource: datasource.name,
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function fetchGIBSSearchResults(datasource, queryParams) {
  return new Promise((resolve, reject) => {
    getDatesFromGIBS(queryParams.timeFrom, queryParams.timeTo, datasource.id)
      .then(foundDates => {
        const searchResults = foundDates.map(d => ({
          tileData: {
            datasource: datasource.name,
            time: d,
            sensingTime: d,
            cloudCoverage: -1,
            activeLayer: datasource,
            lat: Store.current.lat,
            lng: Store.current.lng,
          },
          properties: {
            index: 0,
            queryParams: queryParams,
          },
        }));
        resolve({
          results: searchResults,
          params: { ...queryParams },
          datasource: datasource.name,
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

// This function is a copy of 'queryIndex()' function with first parameter
// (onlyDates) set to false. TODO: cleanup.
export function fetchSearchResultsFromIndexService(instanceName, datasourceName, queryParams) {
  // with Proba-V for example we don't really ask index service - we use data
  // from GetCapabilities to get the search results:
  const datasource = DATASOURCES.find(ds => ds.name === datasourceName);
  if (datasource.search.customGetResults) {
    return datasource.search.customGetResults(datasource, queryParams);
  }

  return new Promise(async (resolve, reject) => {
    let activeInstance = [...Store.current.instances, ...(Store.current.userInstances || {})].find(inst => {
      if (instanceName) {
        return inst.name === instanceName;
      } else {
        return inst.name === datasourceName || inst.id === datasourceName;
      }
    });
    if (activeInstance === undefined) {
      reject('no instance selected');
      return;
    }
    queryParams = cloneDeep(queryParams);
    let { mapBounds: bounds } = Store.current;

    // GetCapabilities:
    try {
      const capabilities = await loadGetCapabilitiesForInstance(activeInstance);
      if (capabilities.datasets) {
        const type = capabilities.datasets[0].name;
        const actualInstance = Store.current.instances.find(inst => inst.id === type);
        activeInstance = { ...actualInstance, ...activeInstance, type };
      }
    } catch (e) {
      console.error(e);
      reject(e.message || 'Could not read instance products.');
      return;
    }

    if (!get(queryParams, 'firstSearch') && get(queryParams, 'queryBounds') !== undefined) {
      bounds = queryParams.queryBounds;
    }
    const newService = activeInstance.indexService.includes('v3/collections');
    const searchCoords = activeInstance.search.searchableByArea
      ? [getCoordsFromBounds(bounds, false, !newService || activeInstance.wrapCrs)]
      : ARBITRARY_SMALL_SEARCH_AREA;
    let clipping = {
      type: 'Polygon',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
        },
      },
      coordinates: searchCoords,
    };
    let { indexService, indexSuffix = '', awsLink } = activeInstance;
    let pageSize = 50;
    var offset = 0;
    if (!queryParams.firstSearch) {
      offset += queryParams.multiplyOffset * pageSize;
    }
    let from = queryParams.timeFrom.format('YYYY-MM-DDTHH:mm:ss');
    let maxDate = queryParams.timeTo
      .hour(23)
      .minute(59)
      .format('YYYY-MM-DDTHH:mm:ss');

    let payload;
    if (newService) {
      let additionalParams = activeInstance.indexServiceAdditionalParams
        ? activeInstance.indexServiceAdditionalParams
        : {};
      payload = {
        clipping: clipping,
        maxcount: pageSize,
        offset,
        maxCloudCoverage: queryParams.cloudCoverPercentage ? queryParams.cloudCoverPercentage / 100 : 1,
        timeFrom: from,
        timeTo: maxDate,
        ...additionalParams,
      };
    } else {
      payload = clipping;
      indexService += `/search?expand=true&timefrom=${from}&timeto=${maxDate}&maxcc=${queryParams.cloudCoverPercentage /
        100}&maxcount=${pageSize}&offset=${offset}${indexSuffix}`;
    }

    axios
      .post(indexService, payload, {
        headers: { 'Accept-CRS': 'EPSG:4326' },
      })
      .then(res => {
        const response = res.data;
        // this is for querying geometries
        let searchReturned = {
          hasMore: response.hasMore,
          maxOrderKey: response.maxOrderKey,
          queryBounds: bounds,
        };
        if (response.tiles.length === 0) {
          resolve({
            results: [],
            params: { [datasourceName]: queryParams },
            datasource: datasourceName,
          });
          return;
        }
        let results = response.tiles.map((tile, i) => {
          const {
            tileDrawRegionGeometry,
            dataGeometry,
            sensingTime,
            area,
            id,
            cloudCoverPercentage,
            sunElevation,
          } = tile;

          const { lat, lng } = new L.geoJSON(dataGeometry || tileDrawRegionGeometry).getBounds().getCenter();
          let tileData = {
            ...tile,
            time: moment(sensingTime)
              .utc()
              .format('YYYY-MM-DD'),
            sensingTime: moment(sensingTime)
              .utc()
              .format('h:mm:ss A'),
            cloudCoverage: cloudCoverPercentage,
            datasource: activeInstance.name,
            awsLink,
            activeLayer: activeInstance,
            id,
            lat,
            lng,
            area: area ? Number(area / 1000000).toFixed(2) : null,
            sunElevation,
          };

          return {
            type: 'Feature',
            tileData,
            properties: {
              index: i + offset,
              style: DEFAULT_POLY_STYLE,
              queryParams: queryParams,
            },
            geometry: activeInstance.search.searchableByArea ? dataGeometry || tileDrawRegionGeometry : null,
          };
        });
        if (!queryParams.firstSearch) {
          results = [...Store.current.searchResults[datasourceName], ...results];
        }
        resolve({
          results,
          params: { ...queryParams, ...searchReturned },
          datasource: datasourceName,
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function getTilesFromSHServiceV3(
  indexService,
  mapBounds,
  fromMoment,
  toMoment,
  maxCount = 1,
  maxCloudCoverage = 1,
  offset = 0,
  datasetParameters = null,
) {
  return new Promise(async (resolve, reject) => {
    const shouldWrap = true;
    const islatLng = false;
    const searchCoords = [getCoordsFromBounds(mapBounds, islatLng, shouldWrap)];

    const timeFrom = fromMoment.format(ISO_8601_UTC);

    const timeTo = toMoment.format(ISO_8601_UTC);

    const clipping = {
      type: 'Polygon',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
        },
      },
      coordinates: searchCoords,
    };
    const payload = {
      clipping,
      maxcount: maxCount,
      maxCloudCoverage,
      timeFrom,
      timeTo,
      offset,
    };
    if (datasetParameters !== null) {
      payload['datasetParameters'] = datasetParameters;
    }

    axios
      .post(indexService, payload, {
        headers: { 'Accept-CRS': 'EPSG:4326' },
      })
      .then(response => {
        resolve({
          tiles: response.data.tiles,
          hasMore: response.hasMore,
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function getTilesFromSHServiceV1Or2(
  indexService,
  suffix = '',
  mapBounds,
  fromMoment,
  toMoment,
  maxCount = 50,
  maxCc = 1,
  offset = 0,
) {
  return new Promise(async (resolve, reject) => {
    const shouldWrap = false;
    const islatLng = false;
    const searchCoords = [getCoordsFromBounds(mapBounds, islatLng, shouldWrap)];
    const clipping = {
      type: 'Polygon',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
        },
      },
      coordinates: searchCoords,
    };
    const payload = clipping;
    const timeFrom = fromMoment.format(ISO_8601_UTC);
    const timeTo = toMoment.format(ISO_8601_UTC);
    const requestUrl = `${indexService}?expand=true&timefrom=${timeFrom}&timeto=${timeTo}&maxcc=${maxCc}&maxcount=${maxCount}&offset=${offset}${suffix}`;
    axios
      .post(requestUrl, payload, {
        headers: { 'Accept-CRS': 'EPSG:4326' },
      })
      .then(response => {
        resolve({
          tiles: response.data.tiles,
          hasMore: response.hasMore,
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

// This function is a copy of 'queryIndex()' function with first parameter
// (onlyDates) set to true. TODO: cleanup.
export function fetchDatesFromServiceIndex(datasourceName, queryParams) {
  return new Promise(async (resolve, reject) => {
    let activeInstance = [...Store.current.instances, ...(Store.current.userInstances || {})].find(inst => {
      return inst.name === datasourceName || inst.id === datasourceName;
    });
    if (activeInstance === undefined || activeInstance.name.includes('Sentinel-3')) {
      reject();
      return;
    }
    queryParams = cloneDeep(queryParams);
    let { mapBounds: bounds } = Store.current;

    // GetCapabilities:
    try {
      const capabilities = await loadGetCapabilitiesForInstance(activeInstance);
      if (capabilities.datasets) {
        const type = capabilities.datasets[0].name;
        const actualInstance = Store.current.instances.find(inst => inst.id === type);
        activeInstance = { ...actualInstance, ...activeInstance, type };
      }
    } catch (e) {
      console.error(e);
      reject(e.message || 'Could not read instance products.');
      return;
    }

    if (!get(queryParams, 'firstSearch') && get(queryParams, 'queryBounds') !== undefined) {
      bounds = queryParams.queryBounds;
    }
    const newService = activeInstance.indexService.includes('v3/collections');
    let clipping = {
      type: 'Polygon',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
        },
      },
      coordinates: [getCoordsFromBounds(bounds, false, newService)],
    };
    let today = moment
      .utc()
      .hour(23)
      .minute(59);
    let maxDate = today.format('YYYY-MM-DDTHH:mm:ss');
    let minDate = Store.current.minDate.format(STANDARD_STRING_DATE_FORMAT);
    let { indexService, indexSuffix = '' } = activeInstance;

    if (queryParams) {
      const { from: dateFrom, to: dateTo } = queryParams;
      minDate = dateFrom + 'T00:00:00';
      maxDate = dateTo + 'T23:59:59';
    } else {
      minDate = activeInstance.minDate;
      maxDate = activeInstance.maxDate || moment.utc().format('YYYY-MM-DD');
    }
    let payload;
    if (newService) {
      payload = {
        clipping: clipping,
        maxcount: 500,
        maxCloudCoverage: Store.current.maxcc / 100,
        timeFrom: minDate,
        timeTo: maxDate,
      };
    } else {
      payload = clipping;
      //isFromAWS || isSentinel || isEnvisat || !isSentinel1
      indexService += `/${
        newService ? '' : indexService.includes('eocloud') ? 'search' : 'finddates'
      }?timefrom=${minDate}&timeto=${maxDate}&maxcc=${Store.current.maxcc /
        100}${indexSuffix}&maxcount=50&offset=0&expand=true`;
    }

    axios
      .post(indexService, payload, {
        headers: { 'Accept-CRS': 'EPSG:4326' },
      })
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function reflect(promise) {
  return promise.then(v => ({ data: v, success: true }), e => ({ data: e, success: false }));
}
