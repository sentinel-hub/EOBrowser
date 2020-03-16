import Store from '../store';
import L from 'leaflet';
import get from 'dlv';
import geo_area from '@mapbox/geojson-area';

export function roundDegrees(deg, zoom) {
  if (!Number.isFinite(deg)) {
    return deg;
  }
  if (!Number.isFinite(zoom)) {
    return deg;
  }
  const zRnd = Math.min(31, Math.max(0, Math.ceil(zoom))); // [0..31] is needed for shifting
  const degPerPix = 360 / 256 / (1 << zRnd);
  return deg.toFixed(Math.max(0, -Math.floor(Math.log10(0.5 * degPerPix))));
}

export function wgs84ToMercator({ lat, lng }) {
  const projected = L.Projection.SphericalMercator.project({ lat, lng });
  return projected;
}

export function getNativeRes() {
  const { selectedResult } = Store.current;
  let specialRes = selectedResult
    ? selectedResult.preset.toLowerCase().includes('pansharp')
      ? 15
      : undefined
    : undefined;
  const layerRes = get(selectedResult, 'activeLayer.resolution');
  const maxRes = selectedResult ? specialRes || layerRes || 10 : 10;
  return maxRes;
}

export function getPixelSize() {
  const { mapBounds, aoiBounds } = Store.current;
  const nativeRes = getNativeRes();
  const bounds = aoiBounds ? aoiBounds.bounds : mapBounds;
  const NE = wgs84ToMercator(bounds['_northEast']);
  const SW = wgs84ToMercator(bounds['_southWest']);
  const polyW = NE.x - SW.x;
  const polyH = NE.y - SW.y;
  const maxWH = Math.max(polyW, polyH);
  const idealRes = maxWH / 5000;

  const logOutputRes = Math.max(0, Math.ceil(Math.log2(idealRes / nativeRes)));
  const outputRes = nativeRes * Math.pow(2, logOutputRes);

  const width = Math.round(polyW / outputRes);
  const height = Math.round(polyH / outputRes);
  return { width, height, res: outputRes };
}

export function calcBboxFromXY({ lat, lng, zoom, width, height, factor, wgs84 }) {
  const xy = wgs84ToMercator({ lat, lng });
  const useExactRes = factor !== undefined;
  const { res, width: boundW, height: boundH } = getPixelSize(); // res is max resolution available
  const scale = useExactRes ? res * parseInt(factor, 10) : 40075016 / (512 * Math.pow(2, Number(zoom) - 1));
  const mapDOMSize = getMapDOMSize();
  const imgH = Math.round(useExactRes ? boundH / factor : height || mapDOMSize.height);
  const imgW = Math.round(useExactRes ? boundW / factor : width || mapDOMSize.width);
  const minX = Math.round(Number(xy.x) - 0.5 * imgW * scale);
  const minY = Math.round(Number(xy.y) - 0.5 * imgH * scale);
  const maxX = minX + imgW * scale;
  const maxY = minY + imgH * scale;
  let coords;
  if (wgs84) {
    const southWest = convertToWgs84([minX, minY]);
    const northEast = convertToWgs84([maxX, maxY]);
    coords = [southWest[0], southWest[1], northEast[0], northEast[1]];
  } else {
    coords = [minX, minY, maxX, maxY];
  }
  return coords;
}
function convertToWgs84(xy) {
  const R2D = 180 / Math.PI;
  const A = 6378137.0;

  return [xy[0] * R2D / A, (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D];
}
export function getCoordsFromBounds(bounds, isLatLng, shouldWrap = true) {
  let coords = [];
  const sw = shouldWrap ? bounds.getSouthWest().wrap() : bounds.getSouthWest();
  const se = shouldWrap ? bounds.getSouthEast().wrap() : bounds.getSouthEast();
  const ne = shouldWrap ? bounds.getNorthEast().wrap() : bounds.getNorthEast();
  const nw = shouldWrap ? bounds.getNorthWest().wrap() : bounds.getNorthWest();
  if (!isLatLng) {
    coords.push([sw.lng, sw.lat]);
    coords.push([se.lng, se.lat]);
    coords.push([ne.lng, ne.lat]);
    coords.push([nw.lng, nw.lat]);
    coords.push([sw.lng, sw.lat]);
  } else {
    coords.push([sw.lat, sw.lng]);
    coords.push([se.lat, se.lng]);
    coords.push([ne.lat, ne.lng]);
    coords.push([nw.lat, nw.lng]);
    coords.push([sw.lat, sw.lng]);
  }

  return coords;
}
export function bboxToPolygon(bbox) {
  const west = Number(bbox[0]);
  const south = Number(bbox[1]);
  const east = Number(bbox[2]);
  const north = Number(bbox[3]);

  const lowLeft = [west, south];
  const topLeft = [west, north];
  const topRight = [east, north];
  const lowRight = [east, south];
  return {
    type: 'Polygon',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::4326',
      },
    },
    coordinates: [[lowLeft, lowRight, topRight, topLeft, lowLeft]],
  };
}

export function getRecommendedResolution(boundsGeojson) {
  const areaM2 = geo_area.geometry(boundsGeojson);
  const resolution = Math.max(
    Store.current.selectedResult.resolution || 10, // resolution of the layer is a minimal allowed value
    Math.min(Store.current.selectedResult.fisResolutionCeiling || 2000, Math.ceil(Math.sqrt(areaM2 / 1000))), // we would like to get a bit more than 1000 points
  );
  return resolution;
}

export function getMapDOMSize() {
  const mapDOMElement = document.getElementById('mapId');
  return {
    width: mapDOMElement ? mapDOMElement.clientWidth : window.innerWidth,
    height: mapDOMElement ? mapDOMElement.clientHeight : window.innerHeight,
  };
}
