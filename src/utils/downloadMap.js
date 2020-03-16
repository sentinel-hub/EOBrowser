import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import leafletImage from './leaflet-image';
import '../components/ext/color-labels';
import cloneDeep from 'lodash/cloneDeep';

export function downloadFromShadow(originalMap, bounds, width, height) {
  return new Promise((resolve, reject) => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const mapDomElement = document.createElement('div');
    mapDomElement.id = 'shadowMap';
    mapDomElement.style.height = `${height}px`;
    mapDomElement.style.width = `${width}px`;
    mapDomElement.style.visibility = 'hidden';
    el.appendChild(mapDomElement);

    const map = L.map(mapDomElement, {
      zoomDelta: 0.25,
      zoomSnap: 0.5,
    }).fitBounds(bounds);
    map.invalidateSize();
    map.createPane('labels');
    map.getPane('labels').style.zIndex = 650;

    const layers = cloneDeep(originalMap._layers); // cloning is probably not needed, but used here to not change properties in the map's object
    for (let key in layers) {
      if (originalMap.hasLayer(layers[key])) {
        if (layers[key].options.print && layers[key] instanceof L.TileLayer.MakeLabelsReadable) {
          layers[key].options.pane = 'labels';
          L.tileLayer.makeLabelsReadable(layers[key]._url, layers[key].options).addTo(map);
        }
      }
    }

    function drawGlOverlays(ctx) {
      const roadCanvas = document
        .getElementsByClassName('leaflet-pane leaflet-roadLayer-pane')[0]
        .querySelector('canvas');
      if (roadCanvas) {
        ctx.drawImage(roadCanvas, 0, 0);
      }
      const adminCanvas = document
        .getElementsByClassName('leaflet-pane leaflet-adminLayer-pane')[0]
        .querySelector('canvas');
      if (adminCanvas) {
        ctx.drawImage(adminCanvas, 0, 0);
      }
    }
    leafletImage(map, function(err, labelCanvas) {
      if (err) {
        reject(err);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        drawGlOverlays(ctx);
        ctx.drawImage(labelCanvas, 0, 0);
        resolve(canvas);
      }
      map.remove();
      el.remove();
    });
  });
}
