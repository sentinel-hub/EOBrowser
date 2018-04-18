import moment from 'moment';
import { getProba } from './mapLayers';
import { getPinsFromLocalStorage, getCrsLabel } from '../utils/utils';

const views = {
  PRESETS: '1',
  BANDS: '2',
  SCRIPT: '3'
};
const imageFormats = [
  { text: 'JPG (no georeference)', value: 'image/jpeg', ext: 'jpg' },
  { text: 'PNG (no georeference)', value: 'image/png', ext: 'png' },
  {
    text: 'KMZ/JPG',
    value: 'application/vnd.google-earth.kmz+xml;image_type=image/jpeg',
    ext: 'kmz'
  },
  {
    text: 'KMZ/PNG',
    value: 'application/vnd.google-earth.kmz+xml;image_type=image/png',
    ext: 'kmz'
  },
  { text: 'TIFF (8-bit)', value: 'image/tiff;depth=8', ext: 'tiff' },
  { text: 'TIFF (16-bit)', value: 'image/tiff;depth=16', ext: 'tiff' },
  { text: 'TIFF (32-bit float)', value: 'image/tiff;depth=32f', ext: 'tiff' }
  // { text: 'JPEG 2000 (JP2)', value: 'image/jp2', ext: 'jp2' } //jp2 removed till supported
];
const CRS_MAP = {
  'Popular Web Mercator (EPSG:3857)': 'EPSG:3857',
  'WGS 84 (EPSG:4326)': 'EPSG:4326'
};
const RESOLUTIONS = {
  LOW: 4,
  MEDIUM: 2,
  HIGH: 1
};
const availableCrs = Object.keys(CRS_MAP).map(key => ({
  text: key,
  value: CRS_MAP[key]
}));
const resolutions = Object.keys(RESOLUTIONS).map(key => ({
  text: key,
  value: RESOLUTIONS[key]
}));

const DATASOURCES = [
  {
    baseUrl: `https://eocloud.sentinel-hub.com/v1/wms/e3e5e6c2-d1eb-419a-841c-5167a1de5441`,
    tooltip: 'Europe and North Africa from 1984 to 2013',
    name: 'Landsat 5 ESA',
    minDate: '1984-01-01',
    maxDate: '2013-05-01',
    id: 'L5',
    typename: '',
    getEOPath: function(tile) {
      const { pathFragment } = tile;
      return pathFragment.substring(0, pathFragment.lastIndexOf('/') + 1);
    },
    getPreviewImage: function(tile) {
      return `${tile.previewUrl}.JPG`;
    },
    minZoom: 10,
    indexService: `https://eocloud.sentinel-hub.com/index/landsat5/v2`,
    previewPrefix: 'https://finder.eocloud.eu/files',
    resolution: 30
  },
  {
    baseUrl: `https://eocloud.sentinel-hub.com/v1/wms/65e58cf7-96c2-429e-89b5-5dcb15983c47`,
    id: 'L7',
    tooltip: 'Europe and North Africa from 1999 to 2003',
    indexService: `https://eocloud.sentinel-hub.com/index/landsat7/v2`,
    minZoom: 10,
    typename: '',
    getEOPath: function(tile) {
      const { pathFragment } = tile;
      return pathFragment.substring(0, pathFragment.lastIndexOf('/') + 1);
    },
    getPreviewImage: function(tile) {
      return `${tile.previewUrl}.JPG`;
    },
    minDate: '1999-01-01',
    maxDate: '2003-12-01',
    previewPrefix: 'https://finder.eocloud.eu/files',
    name: 'Landsat 7 ESA',
    resolution: 30
  },
  {
    baseUrl: `https://eocloud.sentinel-hub.com/v1/wms/2d8dbfcb-5fa0-4198-ba57-8ad594c3757e`,
    tooltip: 'Europe and North Africa from 2013/02 onward',
    name: 'Landsat 8 ESA',
    id: 'L8',
    typename: 'L8.TILE',
    minDate: '2013-01-01',
    minZoom: 10,
    getEOPath: function(tile) {
      const { pathFragment } = tile;
      return pathFragment.substring(0, pathFragment.lastIndexOf('/') + 1);
    },
    getPreviewImage: function(tile) {
      return `${this.previewPrefix}${tile.pathFragment.replace(
        '/eodata',
        ''
      )}.png`;
    },
    indexService: `https://eocloud.sentinel-hub.com/index/landsat8/v2`,
    previewPrefix: 'https://finder.eocloud.eu/files',
    resolution: 30
  },
  {
    baseUrl: `https://eocloud.sentinel-hub.com/v1/wms/6a6b787f-0dda-4153-8ae9-a1729dd0c890`,
    tooltip: 'Worldwide from 2014/04/03 onward',
    name: 'Sentinel-1 GRD IW',
    typename: 'DSS3.TILE',
    minDate: '2014-04-03',
    id: 'S1',
    getEOPath: function(tile) {
      const { pathFragment } = tile;
      return pathFragment.replace('.SAFE');
    },
    previewPrefix: 'https://finder.eocloud.eu/files',
    getPreviewImage: function(tile) {
      return `${this.previewPrefix}/${
        tile.pathFragment.split('eodata')[1]
      }/preview/quick-look.png`;
    },
    indexService: 'https://eocloud.sentinel-hub.com/index/s1/v1',
    dateService: `https://services.sentinel-hub.com/index/v3/collections/S1GRD/findAvailableData`,
    resolution: 10
  },
  {
    baseUrl: `https://eocloud.sentinel-hub.com/v1/wms/52803c64-23ae-4c61-88e1-1859aa98a8c8`,
    tooltip: 'Worldwide (near the poles) from 2014/04/03 onward',
    indexService: 'https://eocloud.sentinel-hub.com/index/s1/v1',
    name: 'Sentinel-1 GRD EW',
    typename: 'DSS3.TILE',
    minDate: '2014-04-03',
    getEOPath: function(tile) {
      const { pathFragment } = tile;
      return pathFragment.replace('.SAFE');
    },
    previewPrefix: 'https://finder.eocloud.eu/files',
    getPreviewImage: function(tile) {
      return `${this.previewPrefix}/${
        tile.pathFragment.split('eodata')[1]
      }/preview/quick-look.png`;
    },
    id: 'S1_EW',
    indexSuffix: `&acquisitionMode=EW&polarization=DH&productType=GRD&resolution=MEDIUM`,
    resolution: 40
  },
  {
    baseUrl: `https://eocloud.sentinel-hub.com/v1/wms/3f532158-bdf9-461a-8bb0-dbdd3a810b3f`,
    tooltip: 'Worldwide (near the poles) from 2014/04/03 onward',
    indexService: 'https://eocloud.sentinel-hub.com/index/s1/v1',
    name: 'Sentinel-1 GRD EW SH',
    typename: 'DSS3.TILE',
    minDate: '2014-04-03',
    getEOPath: function(tile) {
      const { pathFragment } = tile;
      return pathFragment.replace('.SAFE');
    },
    previewPrefix: 'https://finder.eocloud.eu/files',
    getPreviewImage: function(tile) {
      return `${this.previewPrefix}/${
        tile.pathFragment.split('eodata')[1]
      }/preview/quick-look.png`;
    },
    indexSuffix: `&acquisitionMode=EW&polarization=SH&productType=GRD&resolution=MEDIUM`,
    id: 'S1_EW_SH',
    resolution: 40
  },
  {
    baseUrl: `https://services.sentinel-hub.com/ogc/wms/cd280189-7c51-45a6-ab05-f96a76067710`,
    tooltip: 'Global archive from 2016/07 onward',
    name: 'Sentinel-2 L1C',
    id: 'S2L1C',
    typename: 'S2.TILE',
    minDate: '2015-01-01',
    getPreviewImage: function(tile) {
      return `${this.previewPrefix}/tiles${
        tile.dataUri.split('tiles')[1]
      }/preview.jpg`;
    },
    getAwsPath: function(tile) {
      const newPath = `tiles${tile.dataUri.split('tiles')[1]}`;
      return `http://sentinel-s2-l1c.s3-website.eu-central-1.amazonaws.com/#${newPath}/`;
    },
    getTileUrl: function(tile) {
      return `https://services.sentinel-hub.com/index/s2/v3/tiles/${tile.id}`;
    },
    getSciHubLink: function(product) {
      return `https://scihub.copernicus.eu/dhus/odata/v1/Products('${
        product.split('/').splice(-1)[0]
      }')/$value`;
    },
    getCrsLabel: function(tile) {
      return getCrsLabel(tile);
    },
    previewPrefix: 'https://sentinel-s2-l1c.s3.amazonaws.com',
    awsLink: 'http://sentinel-s2-l1c.s3-website.eu-central-1.amazonaws.com/',
    indexService: `https://services.sentinel-hub.com/index/v3/collections/S2L1C/searchIndex`,
    dateService: `https://services.sentinel-hub.com/index/v3/collections/S2L1C/findAvailableData`,
    resolution: 10
  },
  {
    baseUrl: `https://services.sentinel-hub.com/ogc/wms/ed64bf38-72da-4723-9c06-568b76b8add0`,
    tooltip: 'Wider Europe from 2017/03/28 onward',
    name: 'Sentinel-2 L2A',
    typename: 'DSS2',
    id: 'S2L2A',
    minZoom: 7,
    minDate: '2017-03-28',
    getTileUrl: function(tile) {
      return `https://services.sentinel-hub.com/index/s2/v3/tiles/${tile.id}`;
    },
    getSciHubLink: function(product) {
      return `https://scihub.copernicus.eu/dhus/odata/v1/Products('${
        product.split('/').splice(-1)[0]
      }')/$value`;
    },
    // getPreviewImage: function(tile) {
    //   return `${this.previewPrefix}/tiles${tile.dataUri.split('tiles')[1]}/preview.jpg`
    // },
    getAwsPath: function(tile) {
      const newPath = `tiles${tile.dataUri.split('tiles')[1]}`;
      return `http://sentinel-s2-l1c.s3-website.eu-central-1.amazonaws.com/#${newPath}/`;
    },
    getCrsLabel: function(tile) {
      return getCrsLabel(tile);
    },
    awsLink: 'http://sentinel-s2-l1c.s3-website.eu-central-1.amazonaws.com/',
    indexService: `https://services.sentinel-hub.com/index/v3/collections/S2L2A/searchIndex`,
    dateService: `https://services.sentinel-hub.com/index/v3/collections/S2L2A/findAvailableData`,

    resolution: 10
  },
  {
    baseUrl: `https://eocloud.sentinel-hub.com/v1/wms/1180d546-51af-442e-9a06-d490007ab3a5`,
    tooltip: 'Global archive from 2016 onward',
    name: 'Sentinel-3 OLCI',
    typename: 'DSS3.TILE',
    id: 'S3',
    resolution: 300,
    minDate: '2016-02-01',
    minZoom: 6,
    previewPrefix: 'https://finder.eocloud.eu/files',
    getEOPath: function(tile) {
      const { pathFragment } = tile;
      return pathFragment.substring(0, pathFragment.lastIndexOf('/') + 1);
    },
    getPreviewImage: function(tile) {
      const { pathFragment } = tile;
      let pattern = /^.*Sentinel-3\/(.*)\/(.*)\.SEN3$/i;
      let matches = pattern.exec(pathFragment);

      if (matches !== null) {
        return `${this.previewPrefix}/Sentinel-3/${matches[1]}/${
          matches[2]
        }.SEN3/${matches[2]}-ql.jpg`;
      }
      return '';
    },
    indexService: 'https://eocloud.sentinel-hub.com/index/s3/v1'
  },
  {
    baseUrl: `https://services-uswest2.sentinel-hub.com/ogc/wms/f268e8d2-4f6e-4641-b45a-9f6d493321f2`,
    tooltip: 'Global archive from 2013 onward (daily 16 day NBAR)',
    name: 'MODIS',
    typename: 'MODIS',
    id: 'MODIS',
    minZoom: 6,
    minDate: '2013-01-01',
    indexService: `https://services-uswest2.sentinel-hub.com/index/v3/collections/MODIS/searchIndex`,
    dateService: `https://services-uswest2.sentinel-hub.com/index/v3/collections/MODIS/findAvailableData`,
    resolution: 500
  },
  {
    baseUrl:
      'https://services-uswest2.sentinel-hub.com/ogc/wms/5a32b8f5-a7fd-4dfd-9b76-f9b1b9d650b2',
    tooltip: 'Global archive from 2013/02 onward',
    name: 'Landsat 8 USGS',
    typename: 'L8.TILE',
    id: 'L8',
    minDate: '2013-02-01',
    getPreviewImage: function(tile) {
      return `${tile.dataUri}_thumb_small.jpg`;
    },
    getAwsPath: function(tile) {
      const { dataUri } = tile;
      const splittedUri = dataUri.substring(0, [dataUri.lastIndexOf('/')]);
      return `${splittedUri}/index.html`;
    },
    minZoom: 9,
    previewPrefix: 'https://landsat-pds.s3.amazonaws.com',
    indexService: `https://services-uswest2.sentinel-hub.com/index/v3/collections/L8L1C/searchIndex`,
    dateService: `https://services-uswest2.sentinel-hub.com/index/v3/collections/L8L1C/findAvailableData`,
    resolution: 30
  },
  {
    baseUrl:
      'https://eocloud.sentinel-hub.com/v1/wms/65a188c4-b50b-4e4c-9059-b208389e51ff',
    tooltip: 'Global archive from 2002 to 2012',
    name: 'Envisat Meris',
    typename: 'ENV',
    id: 'ENV',
    minZoom: 6,
    minDate: '2002-01-01',
    maxDate: '2012-05-01',
    getEOPath: function(tile) {
      return tile.pathFragment;
    },
    indexService: 'https://eocloud.sentinel-hub.com/index/envisat/v1',
    resolution: 300
  },
];

const DATASET_MAP = {
  S2L1C: 'Sentinel-2 L1C',
  S2L2A: 'Sentinel-2 L2A'
};

const config = {
  datasetMap: DATASET_MAP,
  layers: {},
  startLocation: '',
  imageFormats,
  resolutions,
  availableCrs,
  resolution: RESOLUTIONS.MEDIUM,
  selectedCrs: availableCrs[0].value,
  imageFormat: imageFormats[0].value,
  imageExt: imageFormats[0].ext,
  doRefresh: true,
  datasources: [DATASOURCES.find(inst => inst.id === 'S2L1C').name],
  instances: DATASOURCES,
  isLoaded: true,
  isSearching: false,
  searchResults: {},
  searchFilterResults: {},
  searchParams: {},
  lat: 41.9,
  lng: 12.5,
  zoom: 10,
  size: [0, 0],
  opacity: 100,
  maxcc: 100,
  imgWmsUrl: '',
  mapBounds: null,
  showLogo: true,
  proba: {
    show: false
  },
  minDate: moment('1984-03-01'),
  maxDate: moment(),
  dateFrom: moment().subtract(1, 'months'),
  dateTo: moment(),
  dateFormat: 'YYYY-MM-DD',
  availableDays: [],
  preset: {},
  currView: views.PRESETS,
  channels: {},
  mainTabIndex: 0,
  path: '',
  presets: {},
  colCor: '',
  isActiveLayerVisible: true,
  compareMode: false,
  isAnalytical: false,
  evalscript: {},
  evalscripturl: {},
  isEvalUrl: false,
  user: null,
  selectedResult: null,
  compareModeType: 'opacity',
  pinResults: getPinsFromLocalStorage(),
  probaLayer: getProba(),
  probaLayers: {},
  defaultPolyStyle: {
    weight: 1,
    color: '#398ade',
    opacity: 0.8,
    fillColor: '#398ade',
    fillOpacity: 0.15
  },
  highlightPolyStyle: {
    weight: 2,
    color: '#57de71',
    opacity: 1,
    fillColor: '#57de71',
    fillOpacity: 0.3
  },
  views
};

export default config;
