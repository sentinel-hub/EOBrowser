import moment from 'moment';
import axios from 'axios';
import Store from '../store';
import { getCoordsFromBounds } from './coords';

export const ISO_8601_UTC = `YYYY-MM-DD[T]HH:mm:ss.SSS[Z]`;

export function getAndSetNextPrev(direction) {
  const { maxDate, minDate, selectedResult, dateFormat } = Store.current;
  let { time, datasource, indexService } = selectedResult;
  let { mapBounds: bounds } = Store.current;
  let activeLayer = [...Store.current.instances, ...(Store.current.userInstances || {})].find(inst => {
    return inst.name === datasource || inst.id === datasource;
  });
  const newService = activeLayer.indexService.includes('v3/collections');
  const clip = {
    type: 'Polygon',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::4326' } },
    coordinates: [getCoordsFromBounds(bounds, false, newService)],
  };
  const from =
    direction === 'prev'
      ? moment(minDate).format(dateFormat)
      : moment(time)
          .add(1, 'day')
          .format(dateFormat);
  const to = direction === 'prev' ? moment(time).format(dateFormat) : moment(maxDate).format(dateFormat);
  let payload = {
    clipping: clip,
    maxcount: 1,
    priority: direction === 'prev' ? 'mostRecent' : 'leastRecent',
    timeFrom: from,
    timeTo: to,
  };

  return new Promise((resolve, reject) => {
    if (!newService) {
      indexService += `/search?expand=true&from=${from}&to=${to}&maxcount=1&priority=${
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

export function queryDatesForActiveMonth(singleDate, datasourceName) {
  const startOfMonth = moment(singleDate)
    .startOf('month')
    .format(ISO_8601_UTC);
  const endOfMonth = moment(singleDate)
    .endOf('month')
    .format(ISO_8601_UTC);
  return fetchAvailableDates(startOfMonth, endOfMonth, datasourceName);
}

export function fetchAvailableDates(from, to, selectedDataSource, queryArea) {
  let selectedResult =
    Store.current.selectedResult || Store.current.instances.find(ds => ds.name === selectedDataSource);

  const newService = selectedResult.indexService && selectedResult.indexService.includes('v3/collections');

  if (!queryArea) {
    queryArea = {
      type: 'Polygon',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::4326',
        },
      },
      coordinates: [getCoordsFromBounds(Store.current.mapBounds, false, newService)],
    };
  }

  if (selectedResult.getDates) {
    return selectedResult.getDates(from, to, queryArea);
  }

  let url;
  let payload;
  if (newService) {
    payload = {
      queryArea: queryArea,
      from: from,
      to: to,
      maxCloudCoverage: 1,
    };
    url = selectedResult.dateService;
  } else {
    payload = queryArea;
    url = `${selectedResult.dateService}?timefrom=${from}&timeto=${to}'`;
  }

  return fetchDatesFromDatesService(url, payload);
}

function fetchDatesFromDatesService(url, payload) {
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
      });
  });
}
