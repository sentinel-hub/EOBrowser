import { t } from 'ttag';

export const baseLayers = [
  {
    name: 'Carto Voyager',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
    attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
    checked: true,
  },
  {
    name: 'Carto Light',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
    attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
    checked: false,
  },
];

// The overlays from maptiler are vector tiles which makes fewer requests than image tiles
export const overlayTileLayers = () => [
  {
    id: 'labels',
    name: t`Labels`,
    url: 'https://cartodb-basemaps-b.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}.png',
    urlType: 'PNG', // Indicates that will drawn be drawn on the map with leaflet's default TileLayer behaviour
    zIndex: 22,
    pane: 'labels',
    makeReadable: true,
    tileSize: 256,
  },
  {
    id: 'borders',
    name: t`Borders`,
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_BORDERS}/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
    urlType: 'VECTOR', // Indicates that this will be drawn on the map with Mapbox-gl
    zIndex: 21,
    pane: 'borders',
    preserveDrawingBuffer: true,
  },
  {
    id: 'roads',
    name: t`Roads`,
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_ROADS}/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
    urlType: 'VECTOR', // Indicates that this will be drawn on the map with Mapbox-gl
    zIndex: 20,
    pane: 'roads',
    preserveDrawingBuffer: true,
  },
];
