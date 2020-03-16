import moment from 'moment';
import axios from 'axios';
import { getCoordsFromBounds } from './coords';

export const ISO_8601_UTC = `YYYY-MM-DD[T]HH:mm:ss.SSS[Z]`;
export const STANDARD_STRING_DATE_FORMAT = 'YYYY-MM-DD';

export function getAndSetNextPrev(
  direction,
  maxDate,
  minDate,
  selectedResult,
  mapBounds,
  instances,
  userInstances,
) {
  let { time, datasource, indexService } = selectedResult;
  let activeLayer = [...instances, ...(userInstances || [])].find(inst => {
    return inst.name === datasource || inst.id === datasource;
  });
  const newService =
    activeLayer && activeLayer.indexService && activeLayer.indexService.includes('v3/collections');

  const clip = {
    type: 'Polygon',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::4326' } },
    coordinates: [getCoordsFromBounds(mapBounds, false, newService)],
  };
  const from =
    direction === 'prev'
      ? moment(minDate).format(STANDARD_STRING_DATE_FORMAT)
      : moment(time)
          .add(1, 'day')
          .format(STANDARD_STRING_DATE_FORMAT);
  const to =
    direction === 'prev'
      ? moment(time).format(STANDARD_STRING_DATE_FORMAT)
      : moment(maxDate).format(STANDARD_STRING_DATE_FORMAT);
  let payload = {
    clipping: clip,
    maxcount: 1,
    priority: direction === 'prev' ? 'mostRecent' : 'leastRecent',
    timeFrom: from,
    timeTo: to,
  };

  //use getDates to get previous or next date if layer doesn't use
  //indexService but it has getDates defined
  if (!indexService && activeLayer.getDates) {
    return new Promise((resolve, reject) => {
      activeLayer
        .getDates(moment(from), moment(to))
        .then(res => res.filter(date => date !== moment(time).format('YYYY-MM-DD')))
        .then(res => {
          if (res && res.length > 0) {
            resolve(res[direction === 'prev' ? 0 : res.length - 1]);
          } else {
            reject('no date found');
          }
        })
        .catch(err => {
          console.error(err);
          reject('no date found');
        });
    });
  }

  if (!indexService) {
    //it is not possible to search for available dates if indexService is not defined
    //sadly that also means prev/next will not work for user instances
    return Promise.resolve(time);
  }

  return new Promise((resolve, reject) => {
    if (!newService) {
      indexService += `/search?expand=true&timefrom=${from}&timeto=${to}&maxcount=1&priority=${
        direction === 'prev' ? 'mostRecent' : 'leastRecent'
      }&offset=0`;
    }
    axios
      .post(indexService, newService ? payload : clip, {
        headers: new Headers({
          'Accept-CRS': 'EPSG:4326',
          'Content-Type': 'application/json;charset=utf-8',
          Accept: 'application/json',
        }),
      })
      .then(response => response.data)
      .then(res => {
        if (res.tiles.length === 1) {
          resolve(res.tiles[0].sensingTime);
        }
        if (res.tiles.length === 0) reject('no date found');
      });
  });
}

export function queryDatesForActiveMonth(singleDate, datasourceName, selectedResult, instances, mapBounds) {
  const startOfMonth = moment(singleDate).startOf('month');
  const endOfMonth = moment(singleDate).endOf('month');
  return fetchAvailableDates(
    startOfMonth,
    endOfMonth,
    datasourceName,
    null,
    selectedResult,
    instances,
    mapBounds,
  );
}

export function fetchAvailableDates(
  from,
  to,
  selectedDataSource,
  queryArea,
  selectedResult,
  instances,
  mapBounds,
) {
  let result = selectedResult || instances.find(ds => ds.name === selectedDataSource);
  const newService = result.indexService && result.indexService.includes('v3/collections');
  if (!queryArea) {
    queryArea = {
      type: 'Polygon',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
        },
      },
      coordinates: [getCoordsFromBounds(mapBounds, false, newService)],
    };
  }
  const getDatesMethod = result.getDates || result.activeLayer.getDates;
  return getDatesMethod(from, to, queryArea);
}
