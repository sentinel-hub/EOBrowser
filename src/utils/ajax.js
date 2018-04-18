import request from 'axios';
import Store from '../store';
import moment from 'moment';
import cloneDeep from 'lodash/cloneDeep';
import { getCoordsFromBounds } from './coords';
import L from 'leaflet';
import get from 'dlv';
import bands from '../store/bands.json';

const DS_CACHE = {};

export function loadGetCapabilities(instanceObj, getFull = false) {
  return new Promise((resolve, reject) => {
    let instanceName = instanceObj.name,
      wmsUrl = instanceObj.baseUrl;
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
          responseType: isJsonResponse ? 'json' : 'text'
        }
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
                  'YYYY-MM-DD'
                )}`
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
                : channels
            );
          // we are using layer naming so that we can grab FIS shadow layers for this instance
          // (fake layers that we use for displaying nicer Feature Info charts)
          Store.setFISShadowLayers(instanceName, presets.filter(l => l.id.startsWith('__FIS_')));
          Store.setPresets(instanceName, presets.filter(l => !l.id.startsWith('__')));  // anything layer starting with double underscore is reserved
          resolve(getFull ? res.data : instanceName);
          return;
        }
        const parseString = require('xml2js').parseString;
        parseString(res.data, function(err, result) {
          if (result) {
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

                if (
                  standardRegexp.test(layerName) ||
                  (isS1 && s1Regexp.test(layerName))
                ) {
                  //fill bands
                  channels.push({
                    name: layerName,
                    description:
                      layers[l].Abstract !== undefined
                        ? layers[l].Abstract[0].split('|')[0]
                        : '',
                    color:
                      layers[l].Abstract &&
                      layers[l].Abstract[0].split('|')[1] !== undefined
                        ? layers[l].Abstract[0].split('|')[1]
                        : 'red'
                  });
                } else {
                  presets.push({
                    name: layers[l].Title[0],
                    id: layerName,
                    description:
                      layers[l].Abstract !== undefined
                        ? layers[l].Abstract[0]
                        : '',
                    image: `https://${wmsUrl}&SERVICE=WMS&REQUEST=GetMap&show&LAYERS=${layerName}&BBOX=-19482,6718451,-18718,6719216&MAXCC=20&WIDTH=40&HEIGHT=40&gain=1&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/${moment().format(
                      'YYYY-MM-DD'
                    )}`
                  });
                }
              }
            }
            //set first active preset if none defined
            Store.setChannels(
              instanceName,
              channels.length > 0 ? channels : bands.S2L1C
            );
            Store.setPresets(instanceName, presets);
            resolve(getFull ? result : instanceName);
          } else if (err) {
            reject(err);
          }
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function queryActiveMonth({ from, to, singleDate, datasource }) {
  return new Promise((resolve, reject) => {
    Store.setAvailableDates([]);
    if (from && to) {
      queryIndex(true, datasource, { from, to }).then(data => {
        const dates = data.tiles
          ? data.tiles.map(t =>
              moment(t.sensingTime)
                .utc()
                .format('YYYY-MM-DD')
            )
          : data.map(d =>
              moment(d)
                .utc()
                .format('YYYY-MM-DD')
            );

        const noDuplicatedDates = [...new Set(dates)];
        Store.setAvailableDates(noDuplicatedDates);
        resolve(noDuplicatedDates);
      });
    } else if (singleDate) {
      const start = moment(singleDate)
        .startOf('month')
        .format('YYYY-MM-DD');
      const end = moment(singleDate)
        .endOf('month')
        .format('YYYY-MM-DD');

      queryIndex(true, datasource, { from: start, to: end })
        .then(data => {
          const dates = data.tiles
            ? data.tiles.map(t =>
                moment(t.sensingTime)
                  .utc()
                  .format('YYYY-MM-DD')
              )
            : data.map(d =>
                moment(d)
                  .utc()
                  .format('YYYY-MM-DD')
              );
          const noDuplicatedDates = [...new Set(dates)];
          Store.setAvailableDates(noDuplicatedDates);
          resolve(noDuplicatedDates);
        })
        .catch(err => {
          reject(err);
        });
    }
  });
}

export function loginAndLoadInstances() {
  return new Promise((resolve, reject) => {
    Store.doLogin().then(({ user, token }) => {
      Store.setUser(user);
      loadInstances(token)
        .then(instances => {
          const modifiedUserInstances = instances.map(inst => ({
            baseUrl: `https://services.sentinel-hub.com/ogc/wms/${inst.id}`,
            ...inst,
            datasource: inst.name
          }));
          Store.setUserInstances(modifiedUserInstances);
          Store.setInstances([
            ...Store.current.instances,
            ...modifiedUserInstances
          ]);
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
          Authorization: `Bearer ${token.access_token}`
        }
      })
      .then(res => {
        resolve(res.data);
      })
      .catch(e => {
        reject({ error: e, msg: 'Failed to load instances.' });
      });
  });
}

export function loadProbaCapabilities() {
  return new Promise((resolve, reject) => {
    let parseString = require('xml2js').parseString;
    request
      .get(
        'https://proba-v-mep.esa.int/applications/geo-viewer/app/mapcache/wmts?service=WMTS&request=GetCapabilities',
        {
          responseType: 'text'
        }
      )
      .then(res => {
        parseString(res.data, function(err, result) {
          if (result) {
            let probaLayers = {};
            result.Capabilities.Contents[0].Layer.forEach(layer => {
              const { 'ows:Title': title, Dimension: dates } = layer;
              probaLayers[title] = { dates: dates[0].Value };
            });
            Store.setProbaLayers(probaLayers);
          } else if (err) {
            reject(err);
          }
        });
      })
      .catch(e => {
        reject(e);
      });
  });
}

export function queryIndex(onlyDates, datasource, queryParams) {
  return new Promise(async (resolve, reject) => {
    let activeLayer = [
      ...Store.current.instances,
      ...(Store.current.userInstances || {})
    ].find(inst => {
      return inst.name === datasource || inst.id === datasource;
    });
    if (
      activeLayer === undefined ||
      (activeLayer.name.includes('Sentinel-3') && onlyDates)
    ) {
      reject();
      return;
    }
    queryParams = cloneDeep(queryParams);
    let { mapBounds: bounds } = Store.current;
    try {
      const capabilities = await loadGetCapabilities(activeLayer, true);
      if (capabilities.datasets) {
        const type = capabilities.datasets[0].name;
        const actualInstance = Store.current.instances.find(
          inst => inst.id === type
        );
        activeLayer = { ...actualInstance, ...activeLayer, type };
      }
    } catch (e) {
      console.error(e);
      reject(
        'Could not read instance products. Please check your instance ID.'
      );
      return;
    }

    if (!onlyDates) {
      Store.setSearchingIsOn(true);
    }
    if (
      !get(queryParams, 'firstSearch') &&
      get(queryParams, 'queryBounds') !== undefined
    ) {
      bounds = queryParams.queryBounds;
    }
    const newService = activeLayer.indexService.includes('v3/collections');
    let payload = {
      type: 'Polygon',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326'
        }
      },
      coordinates: [getCoordsFromBounds(bounds, false, newService)]
    };
    let today = moment()
      .hour(23)
      .minute(59);
    let maxDate = today.format('YYYY-MM-DDTHH:mm:ss');
    let minDate = onlyDates
      ? Store.current.minDate.format(Store.current.dateFormat)
      : moment(Store.current.dateFrom).format('YYYY-MM-DDTHH:mm:ss');
    let { indexService, indexSuffix = '', awsLink } = activeLayer;
    let pageSize = 50;
    if (onlyDates) {
      if (queryParams) {
        const { from: dateFrom, to: dateTo } = queryParams;
        minDate = dateFrom;
        maxDate = dateTo + 'T23:59:59';
      } else {
        minDate = activeLayer.minDate;
        maxDate = activeLayer.maxDate || moment().format('YYYY-MM-DD');
      }
      if (newService) {
        payload = {
          clipping: payload,
          maxcount: onlyDates ? 500 : pageSize,
          maxCloudCoverage: Store.current.maxcc / 100,
          timeFrom: minDate,
          timeTo: maxDate
        };
      } else {
        //isFromAWS || isSentinel || isEnvisat || !isSentinel1
        indexService += `/${
          newService
            ? ''
            : indexService.includes('eocloud') ? 'search' : 'finddates'
        }?timefrom=${minDate}&timeto=${maxDate}&maxcc=${Store.current.maxcc /
          100}${indexSuffix}`;
      }
    } else {
      var offset = 0;
      if (!queryParams.firstSearch) {
        offset += queryParams.multiplyOffset * pageSize;
      }
      let from = queryParams.timeFrom.format('YYYY-MM-DDTHH:mm:ss');
      maxDate = queryParams.timeTo
        .hour(23)
        .minute(59)
        .format('YYYY-MM-DDTHH:mm:ss');

      if (newService) {
        payload = {
          clipping: payload,
          maxcount: pageSize,
          offset,
          maxCloudCoverage: queryParams.cloudCoverPercentage / 100,
          timeFrom: from,
          timeTo: maxDate
        };
      } else {
        indexService += `/search?expand=true&timefrom=${from}&timeto=${maxDate}&maxcc=${queryParams.cloudCoverPercentage /
          100}&maxcount=${pageSize}&offset=${offset}${indexSuffix}`;
      }
    }
    request
      .post(indexService, payload, {
        headers: { 'Accept-CRS': 'EPSG:4326' }
      })
      .then(res => {
        if (onlyDates) {
          resolve(res.data);
        } else {
          const response = res.data;
          // this is for querying geometries
          let searchReturned = {
            hasMore: response.hasMore,
            maxOrderKey: response.maxOrderKey,
            queryBounds: bounds
          };
          if (response.tiles.length === 0) {
            resolve({
              results: [],
              params: { [datasource]: queryParams },
              datasource
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
              sunElevation
            } = tile;

            const { lat, lng } = new L.geoJSON(
              dataGeometry || tileDrawRegionGeometry
            )
              .getBounds()
              .getCenter();
            let tileData = {
              ...tile,
              time: moment(sensingTime)
                .utc()
                .format('YYYY-MM-DD'),
              sensingTime: moment(sensingTime)
                .utc()
                .format('h:mm:ss A'),
              cloudCoverage: cloudCoverPercentage,
              datasource: activeLayer.name,
              awsLink,
              activeLayer,
              id,
              lat,
              lng,
              area: area ? Number(area / 1000000).toFixed(2) : null,
              sunElevation
            };

            return {
              type: 'Feature',
              tileData,
              properties: {
                index: i + offset,
                style: Store.current.defaultPolyStyle
              },
              geometry: dataGeometry || tileDrawRegionGeometry
            };
          });
          if (!queryParams.firstSearch) {
            results = [...Store.current.searchResults[datasource], ...results];
          }
          resolve({
            results,
            params: { ...queryParams, ...searchReturned },
            datasource
          });
        }
      })
      .catch(e => {
        if (!onlyDates) {
          Store.setSearchingIsOn(false);
        }
        reject(e);
      });
  });
}

export function reflect(promise) {
  return promise.then(
    v => ({ data: v, success: true }),
    e => ({ data: e, success: false })
  );
}
