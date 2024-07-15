import L from 'leaflet';

export function wgs84ToMercator({ lat, lng }) {
  const projected = L.Projection.SphericalMercator.project({ lat, lng });
  return projected;
}

export function convertToWgs84(xy) {
  const R2D = 180 / Math.PI;
  const A = 6378137.0;

  return [(xy[0] * R2D) / A, (Math.PI * 0.5 - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D];
}

export function getMapDOMSize() {
  const mapDOMElement = document.getElementById('map');
  return {
    width: mapDOMElement ? mapDOMElement.clientWidth : window.innerWidth,
    height: mapDOMElement ? mapDOMElement.clientHeight : window.innerHeight,
  };
}
