import { t } from 'ttag';

export const LAYER_ACCESS = {
  PUBLIC: 'public',
  PAID: 'paid',
};

export const baseLayers = [
  {
    name: 'Voyager',
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_VOYAGER}/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
    attribution:
      '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
    urlType: 'VECTOR', // Indicates that this will be drawn on the map with Mapbox-gl
    checked: true,
    access: LAYER_ACCESS.PUBLIC,
  },
  {
    name: 'Light',
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_LIGHT}/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
    attribution:
      '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
    urlType: 'VECTOR', // Indicates that this will be drawn on the map with Mapbox-gl
    access: LAYER_ACCESS.PUBLIC,
  },
  {
    name: 'Google Satellite',
    url: `https://1.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/512/png8?apiKey=7zZjn-HKgDIEjDpbD9hGavCHjAnrTwYckBc1AX0mwwc`,
    urlType: 'GOOGLE_MAPS',
    access: LAYER_ACCESS.PAID,
  },
];

// The overlays from maptiler are vector tiles which makes fewer requests than image tiles
export const overlayTileLayers = () => [
  {
    id: 'labels',
    name: t`Labels`,
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_LABELS}/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
    attribution:
      '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
    urlType: 'VECTOR', // Indicates that this will be drawn on the map with Mapbox-gl
    zIndex: 22,
    pane: 'labels',
    preserveDrawingBuffer: true,
  },
  {
    id: 'borders',
    name: t`Borders`,
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_BORDERS}/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
    attribution:
      '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
    urlType: 'VECTOR', // Indicates that this will be drawn on the map with Mapbox-gl
    zIndex: 21,
    pane: 'borders',
    preserveDrawingBuffer: true,
  },
  {
    id: 'roads',
    name: t`Roads`,
    url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_ROADS}/style.json?key=${process.env.REACT_APP_MAPTILER_KEY}`,
    attribution:
      '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
    urlType: 'VECTOR', // Indicates that this will be drawn on the map with Mapbox-gl
    zIndex: 20,
    pane: 'roads',
    preserveDrawingBuffer: true,
  },
];
