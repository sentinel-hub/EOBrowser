import bbox from '@turf/bbox';
import area from '@turf/area';
import L from 'leaflet';

export const getBboxFromCoords = (coords) => {
  const actualCoords = coords[0];
  //bbox = min Longitude , min Latitude , max Longitude , max Latitude
  return [actualCoords[0][0], actualCoords[0][1], actualCoords[1][0], actualCoords[2][1]];
};

export const isPolygon = (geometry) => geometry?.type === 'Polygon' ?? false;

export const isRectangle = (geometry) => {
  if (!isPolygon(geometry)) {
    return false;
  }

  const geometryArea = area(geometry);
  const boundsArea = area(getGeoJSONFromLeafletBounds(getLeafletBoundsFromBBox(bbox(geometry))).geometry);

  return Math.round(geometryArea) === Math.round(boundsArea);
};

export const appendPolygon = (currentGeometry, newPolygon) => {
  if (isPolygon(currentGeometry)) {
    return {
      type: 'MultiPolygon',
      coordinates: [currentGeometry.coordinates, newPolygon.coordinates],
    };
  }
  // multiPolygon
  if (isPolygon(newPolygon)) {
    return {
      type: 'MultiPolygon',
      coordinates: currentGeometry.coordinates.concat([newPolygon.coordinates]),
    };
  }
  return {
    type: 'MultiPolygon',
    coordinates: currentGeometry.coordinates.concat(newPolygon.coordinates),
  };
};

const getLeafletBoundsFromBBox = (bbox) => {
  return L.latLngBounds(L.latLng(bbox[1], bbox[0]), L.latLng(bbox[3], bbox[2]));
};

export const getLeafletBoundsFromGeoJSON = (geometry) => {
  const bb = bbox(geometry);
  return getLeafletBoundsFromBBox(bb);
};

export const getGeoJSONFromLeafletBounds = (bounds) => {
  return {
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [bounds._southWest.lng, bounds._southWest.lat],
          [bounds._northEast.lng, bounds._southWest.lat],
          [bounds._northEast.lng, bounds._northEast.lat],
          [bounds._southWest.lng, bounds._northEast.lat],
          [bounds._southWest.lng, bounds._southWest.lat],
        ],
      ],
    },
  };
};
