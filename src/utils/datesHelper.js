import moment from 'moment';
import request from 'axios';
import Store from '../store';
import { getCoordsFromBounds } from './coords';

export function getAndSetNextPrev(direction) {
  const { maxDate, minDate, selectedResult, dateFormat } = Store.current;
  let { time, datasource, indexService } = selectedResult;
  let { mapBounds: bounds } = Store.current;
  let activeLayer = [
    ...Store.current.instances,
    ...(Store.current.userInstances || {})
  ].find(inst => {
    return inst.name === datasource || inst.id === datasource;
  });
  const newService = activeLayer.indexService.includes('v3/collections');
  const clip = {
    type: 'Polygon',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::4326' } },
    coordinates: [getCoordsFromBounds(bounds, false, newService)]
  };
  const timefrom =
    direction === 'prev'
      ? moment(minDate).format(dateFormat)
      : moment(time)
          .add(1, 'day')
          .format(dateFormat);
  const timeTo =
    direction === 'prev'
      ? moment(time)
          .subtract(1, 'day')
          .format(dateFormat)
      : moment(maxDate).format(dateFormat);
  let payload = {
    clipping: clip,
    maxcount: 1,
    priority: direction === 'prev' ? 'mostRecent' : 'leastRecent',
    timeFrom: timefrom,
    timeTo: timeTo
  };
  console.log(indexService);
  return new Promise((resolve, reject) => {
    if (!newService) {
      indexService += `/search?expand=true&timefrom=${timefrom}&timeto=${timeTo}&maxcount=1&priority=${
        direction === 'prev' ? 'mostRecent' : 'leastRecent'
      }&offset=0`;
    }
    request
      .post(indexService, newService ? payload : clip, {
        headers: new Headers({
          'Accept-CRS': 'EPSG:4326',
          'Content-Type': 'application/json;charset=utf-8',
          Accept: 'application/json'
        })
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
