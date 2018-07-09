import request from 'axios';
import Store from '../store';
import moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { getCoordsFromBounds } from './coords';
import L from 'leaflet';
import get from 'dlv';
import bands from '../store/bands.json';
import { DATASOURCES } from '../store/config';

const DS_CACHE = {};
const ARBITRARY_SMALL_SEARCH_AREA = [
  [
    [13.463745117187502, 45.42905779197545],
    [13.834533691406252, 45.42905779197545],
    [13.834533691406252, 45.66348654108304],
    [13.463745117187502, 45.66348654108304],
    [13.463745117187502, 45.42905779197545],
  ],
];

export function loadGetCapabilities(instanceObj, getFull = false) {
  return new Promise((resolve, reject) => {
    let instanceName = instanceObj.name,
      wmsUrl = instanceObj.baseUrls.WMS;
    if (DS_CACHE[instanceName]) {
      resolve(getFull ? DS_CACHE[instanceName] : instanceName);
      return;
    }
    const isJsonResponse = wmsUrl.includes('ogc');
    request
      .get(
        `${wmsUrl}?SERVICE=WMS&REQUEST=GetCapabilities&time=${new Date().valueOf()}${
          isJsonResponse ? '&FORMAT=application/json' : ''
        }`,
        {
          responseType: isJsonResponse ? 'json' : 'text',
        },
      )
      .then(res => {
        if (isJsonResponse) {
          DS_CACHE[instanceName] = res.data;
          const { layers, datasets } = res.data;
          const channels = [];
          const presets = [];
          layers.forEach(l => {
            const standardRegexp = /^B[0-9][0-9A]/i;
            if (standardRegexp.test(l.id)) {
              // const { description } = l
              // const [desc, color] = description.split('|')
              // channels.push({ ...l, desc, color })
            } else {
              presets.push({
                ...l,
                image: `${wmsUrl}?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=${
                  l.id
                }&BBOX=-19482,6718451,-18718,6719216&MAXCC=100&WIDTH=40&HEIGHT=40&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/${moment().format(
                  'YYYY-MM-DD',
                )}`,
              });
            }
          });
          datasets[0] &&
            Store.setChannels(
              instanceName,
              channels.length === 0
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
            presets.filter(l => !l.id.startsWith('__') && !l.name.startsWith('__')),
          ); // any layer starting with double underscore is reserved
          resolve(getFull ? res.data : instanceName);
          return;
        }
        const parseString = require('xml2js').parseString;
        parseString(res.data, function(err, result) {
          if (!result) {
            reject(err || 'Result parsing failed');
            return;
          }
          DS_CACHE[instanceName] = result;

          let layers = result.WMS_Capabilities.Capability[0].Layer[0].Layer;
          const standardRegexp = /^B[0-9][0-9A]/i; //excluse "B01", "B8A" etc. layer names
          const s1Regexp = /^(VV|VH|HH|HV)$/i; //excluse "B01", "B8A" etc. layer names
          let channels = [],
            presets = [];
          const isS1 = instanceName.includes('Sentinel-1');
          for (let l in layers) {
            if (layers.hasOwnProperty(l)) {
              let layerName = layers[l].Name[0];
              const splitName = layerName.split('.')[1];
              if (layerName === 'FILL' || splitName === 'FILL') break;

              if (standardRegexp.test(layerName) || (isS1 && s1Regexp.test(layerName))) {
                //fill bands
                channels.push({
                  name: layerName,
                  description: layers[l].Abstract !== undefined ? layers[l].Abstract[0].split('|')[0] : '',
                  color:
                    layers[l].Abstract && layers[l].Abstract[0].split('|')[1] !== undefined
                      ? layers[l].Abstract[0].split('|')[1]
                      : 'red',
                });
              } else {
                const layer = {
                  name: layers[l].Title[0],
                  id: layerName,
                  description: layers[l].Abstract !== undefined ? layers[l].Abstract[0] : '',
                  image: `https://${wmsUrl}&SERVICE=WMS&REQUEST=GetMap&show&LAYERS=${layerName}&BBOX=-19482,6718451,-18718,6719216&MAXCC=20&WIDTH=40&HEIGHT=40&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/${moment().format(
                    'YYYY-MM-DD',
                  )}`,
                };
                if (!instanceObj.search.useLayer || instanceObj.search.useLayer(layer)) {
                  presets.push(layer);
                }
              }
            }
          }
          //set first active preset if none defined
          Store.setChannels(instanceName, channels);
          Store.setPresets(instanceName, presets);
          resolve(getFull ? result : instanceName);
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function getProbaVDates(from, to, datasourceId) {
  const datasource = DATASOURCES.find(ds => ds.id === datasourceId);
  return new Promise(async (resolve, reject) => {
    try {
      const capabilities = await loadGetCapabilities(datasource, true);
      const allLayers = capabilities.WMS_Capabilities.Capability[0].Layer[0].Layer;
      const applicableLayer = allLayers.find(l => l.Name[0].startsWith(`${datasourceId}_`));
      const allDates = applicableLayer.Dimension[0]['_'].split(',').map(d => moment(d));
      const timeFrom = moment(from).format('YYYY-MM-DD');
      const timeTo = moment(to).format('YYYY-MM-DD');
      const filteredDates = allDates.filter(d => d.isBetween(timeFrom, timeTo));
      filteredDates.sort((a, b) => b.diff(a));
      const stringDates = filteredDates.map(d => d.format('YYYY-MM-DD'));
      resolve(stringDates);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

export function loginAndLoadInstances() {
  return new Promise((resolve, reject) => {
    Store.doLogin().then(({ user, token }) => {
      Store.setUser(user);
      loadInstances(token)
        .then(instances => {
          const configuratorBaseUrl = Store.getConfig.baseUrl;
          const modifiedUserInstances = instances.map(inst => ({
            baseUrls: {
              WMS: `${configuratorBaseUrl}ogc/wms/${inst.id}`,
              FIS: `${configuratorBaseUrl}ogc/fis/${inst.id}`,
            },
            ...inst,
            datasource: inst.name,
          }));
          Store.setUserInstances(modifiedUserInstances);
          Store.setInstances([...Store.current.instances, ...modifiedUserInstances]);
          resolve(modifiedUserInstances);
        })
        .catch(({ error, msg }) => {
          reject({ error: msg });
        });
    });
  });
}

export function loadInstances(token) {
  return new Promise((resolve, reject) => {
    request
      .get(`${Store.getConfig.baseUrl}configuration/v1/wms/instances`, {
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
    getProbaVDates(queryParams.timeFrom, queryParams.timeTo, datasource.id)
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
      reject();
      return;
    }
    queryParams = cloneDeep(queryParams);
    let { mapBounds: bounds } = Store.current;

    // GetCapabilities:
    try {
      const capabilities = await loadGetCapabilities(activeInstance, true);
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

    Store.setSearchingIsOn(true);
    if (!get(queryParams, 'firstSearch') && get(queryParams, 'queryBounds') !== undefined) {
      bounds = queryParams.queryBounds;
    }
    const newService = activeInstance.indexService.includes('v3/collections');
    const searchCoords = activeInstance.search.searchableByArea
      ? [getCoordsFromBounds(bounds, false, newService)]
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
      payload = {
        clipping: clipping,
        maxcount: pageSize,
        offset,
        maxCloudCoverage: queryParams.cloudCoverPercentage ? queryParams.cloudCoverPercentage / 100 : 1,
        timeFrom: from,
        timeTo: maxDate,
      };
    } else {
      payload = clipping;
      indexService += `/search?expand=true&timefrom=${from}&timeto=${maxDate}&maxcc=${queryParams.cloudCoverPercentage /
        100}&maxcount=${pageSize}&offset=${offset}${indexSuffix}`;
    }

    request
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
              style: Store.current.defaultPolyStyle,
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
        Store.setSearchingIsOn(false);
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
      const capabilities = await loadGetCapabilities(activeInstance, true);
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
    let today = moment()
      .hour(23)
      .minute(59);
    let maxDate = today.format('YYYY-MM-DDTHH:mm:ss');
    let minDate = Store.current.minDate.format(Store.current.dateFormat);
    let { indexService, indexSuffix = '' } = activeInstance;

    if (queryParams) {
      const { from: dateFrom, to: dateTo } = queryParams;
      minDate = dateFrom;
      maxDate = dateTo + 'T23:59:59';
    } else {
      minDate = activeInstance.minDate;
      maxDate = activeInstance.maxDate || moment().format('YYYY-MM-DD');
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
      }?timefrom=${minDate}&timeto=${maxDate}&maxcc=${Store.current.maxcc / 100}${indexSuffix}`;
    }

    request
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
