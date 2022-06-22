import { uploadGeoFileErrorMessages, parseContent } from './EOBUploadGeoFile.utils';

describe('parse wkt string', () => {
  test.each([
    [null, undefined, uploadGeoFileErrorMessages.ERROR_PARSING_FILE()],
    [undefined, undefined, uploadGeoFileErrorMessages.ERROR_PARSING_FILE()],
    ['', undefined, uploadGeoFileErrorMessages.ERROR_PARSING_FILE()],
    ['string', undefined, uploadGeoFileErrorMessages.ERROR_PARSING_FILE()],
    ['[1,2,3,4]', undefined, uploadGeoFileErrorMessages.ERROR_PARSING_FILE()],
    ['POINT (30 10)', undefined, uploadGeoFileErrorMessages.UNSUPORTED_GEOJSON()],
    ['LINESTRING (30 10, 10 30, 40 40)', undefined, uploadGeoFileErrorMessages.UNSUPORTED_GEOJSON()],
    [
      'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))',
      {
        type: 'Polygon',
        coordinates: [
          [
            [30, 10],
            [40, 40],
            [20, 40],
            [10, 20],
            [30, 10],
          ],
        ],
      },
      false,
    ],
    [
      'POLYGON ((35 10, 45 45, 15 40, 10 20, 35 10),(20 30, 35 35, 30 20, 20 30))',
      {
        type: 'Polygon',
        coordinates: [
          [
            [35, 10],
            [45, 45],
            [15, 40],
            [10, 20],
            [35, 10],
          ],
          [
            [20, 30],
            [35, 35],
            [30, 20],
            [20, 30],
          ],
        ],
      },
      false,
    ],
    [
      'MULTIPOINT ((10 40), (40 30), (20 20), (30 10))',
      undefined,
      uploadGeoFileErrorMessages.UNSUPORTED_GEOJSON(),
    ],
    ['MULTIPOINT (10 40, 40 30, 20 20, 30 10)', undefined, uploadGeoFileErrorMessages.UNSUPORTED_GEOJSON()],
    [
      'MULTILINESTRING ((10 10, 20 20, 10 40),(40 40, 30 30, 40 20, 30 10))',
      undefined,
      uploadGeoFileErrorMessages.UNSUPORTED_GEOJSON(),
    ],
    [
      'MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)),((15 5, 40 10, 10 20, 5 10, 15 5)))',
      {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [30, 20],
              [45, 40],
              [10, 40],
              [30, 20],
            ],
          ],
          [
            [
              [15, 5],
              [40, 10],
              [10, 20],
              [5, 10],
              [15, 5],
            ],
          ],
        ],
      },
      false,
    ],
    [
      'MULTIPOLYGON (((40 40, 20 45, 45 30, 40 40)),((20 35, 10 30, 10 10, 30 5, 45 20, 20 35),(30 20, 20 15, 20 25, 30 20)))',
      {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [40, 40],
              [20, 45],
              [45, 30],
              [40, 40],
            ],
          ],
          [
            [
              [20, 35],
              [10, 30],
              [10, 10],
              [30, 5],
              [45, 20],
              [20, 35],
            ],
            [
              [30, 20],
              [20, 15],
              [20, 25],
              [30, 20],
            ],
          ],
        ],
      },
      false,
    ],
    ['POLYGON EMPTY', { type: 'Polygon', coordinates: [] }, false],
    ['POLYGON 123,', { type: 'Polygon', coordinates: [] }, false],
    ['POLYGON [1,2,3,4],', { type: 'Polygon', coordinates: [] }, false],
    ['POLYGON (),', { type: 'Polygon', coordinates: [] }, uploadGeoFileErrorMessages.ERROR_PARSING_FILE()],
  ])('Test parseContent for wkt ', (inputString, expectedResult, errorMessage) => {
    if (errorMessage) {
      expect(() => parseContent(inputString, 'wkt')).toThrowError(errorMessage);
    } else {
      expect(parseContent(inputString, 'wkt')).toStrictEqual(expectedResult);
    }
  });
});

describe('parse bbox string', () => {
  test.each([
    [
      '[1,2,3,4]',
      {
        type: 'Polygon',
        coordinates: [
          [
            [1, 2],
            [3, 2],
            [3, 4],
            [1, 4],
            [1, 2],
          ],
        ],
      },
      false,
    ],
    [null, undefined, true],
    [undefined, undefined, true],
    ['', undefined, true],
    ['not array', undefined, true],
    ['[]', undefined, true],
    ['[1]', undefined, true],
    ['[1,2]', undefined, true],
    ['[1,2,3]', undefined, true],
    ['[1,2,3,4,5]', undefined, true],
    ['[a,b,3,4]', undefined, true],
    ['[1 2 3 4]', undefined, true],
  ])('Test parseContent for bbox ', (inputString, expectedResult, shouldThrowError) => {
    if (shouldThrowError) {
      expect(() => parseContent(inputString, 'bbox')).toThrow();
    } else {
      expect(parseContent(inputString, 'bbox')).toStrictEqual(expectedResult);
    }
  });
});
