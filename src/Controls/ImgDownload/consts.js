import { MimeTypes, CRS_EPSG4326, CRS_EPSG3857 } from '@sentinel-hub/sentinelhub-js';

export const IMAGE_FORMATS = {
  JPG: 'jpg',
  PNG: 'png',
  KMZ_JPG: 'kmz-jpg',
  KMZ_PNG: 'kmz-png',
  TIFF_UINT8: 'tiff-8-bit-int',
  TIFF_UINT16: 'tiff-16-bit-int',
  TIFF_FLOAT32: 'tiff-32-bit-float',
};

export const IMAGE_FORMATS_INFO = {
  [IMAGE_FORMATS.JPG]: {
    text: 'JPG (no georeference)',
    mimeType: MimeTypes.JPEG,
    mimeTypeProcessing: MimeTypes.JPEG,
    ext: 'jpg',
    sampleType: 'AUTO',
  },
  [IMAGE_FORMATS.PNG]: {
    text: 'PNG (no georeference)',
    mimeType: MimeTypes.PNG,
    mimeTypeProcessing: MimeTypes.PNG,
    ext: 'png',
    sampleType: 'AUTO',
  },
  [IMAGE_FORMATS.KMZ_JPG]: {
    text: 'KMZ/JPG',
    mimeType: 'application/vnd.google-earth.kmz+xml;image_type=image/jpeg',
    mimeTypeProcessing: null,
    ext: 'kmz',
    sampleType: 'AUTO',
  },
  [IMAGE_FORMATS.KMZ_PNG]: {
    text: 'KMZ/PNG',
    mimeType: 'application/vnd.google-earth.kmz+xml;image_type=image/png',
    mimeTypeProcessing: null,
    ext: 'kmz',
    sampleType: 'AUTO',
  },
  [IMAGE_FORMATS.TIFF_UINT8]: {
    text: 'TIFF (8-bit)',
    mimeType: 'image/tiff;depth=8',
    mimeTypeProcessing: 'image/tiff',
    ext: 'tiff',
    sampleType: 'UINT8',
  },
  [IMAGE_FORMATS.TIFF_UINT16]: {
    text: 'TIFF (16-bit)',
    mimeType: 'image/tiff;depth=16',
    mimeTypeProcessing: 'image/tiff',
    ext: 'tiff',
    sampleType: 'UINT16',
  },
  [IMAGE_FORMATS.TIFF_FLOAT32]: {
    text: 'TIFF (32-bit float)',
    mimeType: 'image/tiff;depth=32f',
    mimeTypeProcessing: 'image/tiff',
    ext: 'tiff',
    sampleType: 'FLOAT32',
  },
};

export const RESOLUTION_DIVISORS = [
  { text: 'LOW', value: 4 },
  { text: 'MEDIUM', value: 2 },
  { text: 'HIGH', value: 1 },
];

export const AVAILABLE_CRS = [
  { id: CRS_EPSG3857.authId, text: 'Popular Web Mercator (EPSG:3857)', value: CRS_EPSG3857 },
  { id: CRS_EPSG4326.authId, text: 'WGS 84 (EPSG:4326)', value: CRS_EPSG4326 },
];
