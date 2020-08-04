import { coordEach } from '@turf/meta';
import { featureCollection } from '@turf/helpers';
import geo_area from '@mapbox/geojson-area';
import proj4 from 'proj4';

export function isCoordsEmpty(geojsonFeature) {
  let coordsEmpty = false;
  coordEach(geojsonFeature, (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) => {
    if (!currentCoord) {
      coordsEmpty = true;
    }
  });

  return coordsEmpty;
}

// Accepts a geojson, where we look if one of the features has any coordinate that is undefined.
// If the feature has a non valid coordinate, we remove that feature, or we return null when the FeatureCollection has no valid feature(coordinates)
export function removeAoiWithEmptyCoords(geojson) {
  switch (geojson.type) {
    case 'Feature':
      if (isCoordsEmpty(geojson)) {
        return null;
      }
      return geojson;
    case 'FeatureCollection':
      const features = geojson.features.filter(feature => !isCoordsEmpty(feature));
      return features.length > 0
        ? featureCollection(
            geojson.features.filter(feature => {
              return !isCoordsEmpty(feature);
            }),
          )
        : null;
    default:
      return geojson;
  }
}

export function getRecommendedResolution(boundsGeojson, resolution, fisResolutionCeiling) {
  const areaM2 = geo_area.geometry(boundsGeojson);
  const recommendedResolution = Math.max(
    resolution || 10, // resolution of the layer is a minimal allowed value
    Math.min(fisResolutionCeiling || 2000, Math.ceil(Math.sqrt(areaM2 / 1000))), // we would like to get a bit more than 1000 points
  );
  return recommendedResolution;
}

export function convertGeoJSONToEPSG4326(geoJSON) {
  const projFrom = getProj(geoJSON.crs.properties.name);
  if (!projFrom) {
    return;
  }
  const coords = geoJSON.coordinates;
  for (var i = coords[0][0].length - 1; i >= 0; i--) {
    coords[0][0][i] = proj4(projFrom, 'EPSG:4326', coords[0][0][i]);
  }
  return geoJSON;
}

function getProj(crs) {
  // Can only do WGS84 UTM for now
  const split = crs.split(':');
  const name = split[split.length - 3] + ':' + split[split.length - 1];
  const [projType, projNum] = name.split(':');
  const isWGS84UTM = projType === 'EPSG' && projNum.startsWith('326') && projNum.length === 5;
  if (!isWGS84UTM) {
    return;
  }
  const projZone = projNum.slice(3, 5);
  const proj = `+proj=utm +zone=${projZone} +datum=WGS84 +units=m +no_defs`;
  proj4.defs(name, proj);
  return name;
}
