import Store from '../store';
import L from 'leaflet';
import get from 'dlv';

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
    ? selectedResult.preset.toLowerCase().includes('pansharp') ? 15 : undefined
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

export function calcBboxFromXY({ lat, lng, zoom, width, height, factor }) {
  const xy = wgs84ToMercator({ lat, lng });
  const useExactRes = factor !== undefined;
  const { res, width: boundW, height: boundH } = getPixelSize(); // res is max resolution available
  const scale = useExactRes
    ? res * parseInt(factor, 10)
    : 40075016 / (512 * Math.pow(2, Number(zoom) - 1));
  const imgH = Math.round(
    useExactRes ? boundH / factor : height || window.innerHeight
  );
  const imgW = Math.round(
    useExactRes ? boundW / factor : width || window.innerWidth
  );
  const minX = Math.round(Number(xy.x) - 0.5 * imgW * scale);
  const minY = Math.round(Number(xy.y) - 0.5 * imgH * scale);
  const maxX = minX + imgW * scale;
  const maxY = minY + imgH * scale;
  return [minX, minY, maxX, maxY];
}

export function getCoordsFromBounds(bounds, isLatLng, newService = false) {
  let coords = [];
  let sw = newService ? bounds.getSouthWest() : bounds.getSouthWest().wrap(),
    se = newService ? bounds.getSouthEast() : bounds.getSouthEast().wrap(),
    ne = newService ? bounds.getNorthEast() : bounds.getNorthEast().wrap(),
    nw = newService ? bounds.getNorthWest() : bounds.getNorthWest().wrap();
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
