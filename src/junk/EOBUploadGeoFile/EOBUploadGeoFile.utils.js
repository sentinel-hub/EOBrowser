import toGeoJSON from '@mapbox/togeojson';
import { parse as parseWKT } from 'wellknown';
import bboxPolygon from '@turf/bbox-polygon';
import { t } from 'ttag';
import union from '@turf/union';
import { coordEach } from '@turf/meta';
import JSZip from 'jszip';

const uploadGeoFileErrorMessages = {
  UNSUPORTED_FILE_TYPE: () => t`File type not supported`,
  UNSUPORTED_GEOJSON: () =>
    t`Unsupported GeoJSON geometry type! Only Polygon and MultiPolygon are supported.`,
  ERROR_PARSING_FILE: () => t`There was a problem parsing the file`,
  ERROR_PARSING_GEOMETRY: () => t`There was a problem parsing input geometry`,
};

const isValidBbox = (inputArr) => inputArr && inputArr.length === 4 && !inputArr.some((e) => isNaN(e));

const isValidGeoJson = (json) =>
  json &&
  json.type &&
  [
    'Point',
    'MultiPoint',
    'LineString',
    'MultiLineString',
    'Polygon',
    'MultiPolygon',
    'GeometryCollection',
    'Feature',
    'FeatureCollection',
  ].includes(json.type);

const ensurePolygonOrMultiPolygon = (geoJson) => {
  // We will use only save Polygon/Multipolygon geometry types to the store. So here we will convert them to appropriate types
  if (geoJson.type === 'Feature') {
    geoJson = geoJson.geometry;
  } else if (geoJson.type === 'FeatureCollection') {
    geoJson = convertFeaturesToMultiPolygon(geoJson.features);
  } else if (geoJson.type === 'GeometryCollection') {
    geoJson = convertGeometriesToMultiPolygon(geoJson.geometries);
  }

  if (geoJson.type !== 'Polygon' && geoJson.type !== 'MultiPolygon') {
    throw new Error(uploadGeoFileErrorMessages.UNSUPORTED_GEOJSON());
  }
  geoJson = removeExtraCoordDimensions(geoJson);
  return geoJson;
};

const convertFeaturesToMultiPolygon = (features) => {
  const geometries = features.map((feature) => {
    ensurePolygonOrMultiPolygon(feature.geometry);
    return feature.geometry;
  });
  return convertGeometriesToMultiPolygon(geometries);
};

const convertGeometriesToMultiPolygon = (geometries) => {
  let multipolygon = geometries[0];
  for (let i = 1; i < geometries.length; i++) {
    multipolygon = union(multipolygon, geometries[i]).geometry;
  }
  return multipolygon;
};

const removeExtraCoordDimensions = (geometry) => {
  coordEach(geometry, (coord, index) => {
    if (coord.length > 2) {
      geometry.coordinates[0][index] = [coord[0], coord[1]];
    }
  });
  return geometry;
};

const getFileExtension = (filename) => filename.toLowerCase().split('.').pop();

const convertKmlToGeoJson = (input) => {
  const xml = new DOMParser().parseFromString(input, 'text/xml');
  const kml = toGeoJSON.kml(xml);
  return kml && kml.features && kml.features.length ? kml : null;
};

const conversionFunctions = {
  wkt: (input) => {
    if (!input) {
      return null;
    }
    return parseWKT(input);
  },
  bbox: (input) => {
    if (!input) {
      return null;
    }
    const arr = JSON.parse(input);
    if (!isValidBbox(arr)) {
      return null;
    }
    return bboxPolygon(arr);
  },
  geojson: (input) => {
    let geoJson = JSON.parse(input);
    if (!isValidGeoJson(geoJson)) {
      return null;
    }
    return geoJson;
  },
  json: (input) => {
    let geoJson = JSON.parse(input);
    if (!isValidGeoJson(geoJson)) {
      return null;
    }
    return geoJson;
  },
  kml: (input) => convertKmlToGeoJson(input),
  gpx: (input) => {
    const xml = new DOMParser().parseFromString(input, 'text/xml');
    const gpx = toGeoJSON.gpx(xml);
    return gpx && gpx.features && gpx.features.length ? gpx : null;
  },

  // kmz is an archive, we only take kml file from it and try to convert it to geoJson
  kmz: (input) => convertKmlToGeoJson(input),
};

const isFileTypeSupported = (format) => !!conversionFunctions[format];

const convertToGeoJson = (data, format = null) => {
  let area;
  if (format) {
    // use appropriate convert function when format is provided
    area = conversionFunctions[format](data);
  } else {
    // iterate over all supported formats and use first one that returns something
    for (let format of Object.keys(conversionFunctions)) {
      try {
        area = conversionFunctions[format](data);
        if (!!area) {
          break;
        }
      } catch (err) {
        // ignore parsing errors and try with next format
      }
    }
  }

  if (!area) {
    throw new Error(
      !!format
        ? uploadGeoFileErrorMessages.ERROR_PARSING_FILE()
        : uploadGeoFileErrorMessages.ERROR_PARSING_GEOMETRY(),
    );
  }

  return area;
};

const parseContent = (data, format = null) => {
  let geoJson = convertToGeoJson(data, format);
  geoJson = ensurePolygonOrMultiPolygon(geoJson);
  return geoJson;
};

const loadFileContent = async (file, format) => {
  if (!isFileTypeSupported(format)) {
    throw new Error(uploadGeoFileErrorMessages.UNSUPORTED_FILE_TYPE());
  }

  return new Promise((resolve) => {
    if (format === 'kmz') {
      // kmz is an archive, we only take kml file from it and try to convert it to geoJson
      JSZip.loadAsync(file).then((zip) => {
        zip
          .file(Object.keys(zip.files).find((f) => f.includes('.kml')))
          .async('string')
          .then((data) => resolve(data));
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsText(file);
    }
  });
};

export { uploadGeoFileErrorMessages, getFileExtension, isFileTypeSupported, parseContent, loadFileContent };
