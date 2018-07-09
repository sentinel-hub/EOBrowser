import L from 'leaflet';
import { getMapDOMSize } from '../../utils/coords';

const mapDOMSize = getMapDOMSize();
L.TileLayer.Clip = L.TileLayer.WMS.extend({
  options: {
    clip: L.bounds([0, 0], [mapDOMSize.width, mapDOMSize.height]),
  },

  update: function() {
    if (!this._map) return this;
    var e = this.getContainer();
    var p = this._map.containerPointToLayerPoint(this.options.clip.min);
    var q = this._map.containerPointToLayerPoint(this.options.clip.max);
    e.style['overflow'] = 'hidden';
    e.style['left'] = p.x + 'px';
    e.style['top'] = p.y + 'px';
    e.style['width'] = q.x - p.x + 'px';
    e.style['height'] = q.y - p.y + 'px';
    for (var f = e.firstChild; f; f = f.nextSibling) {
      if (f.style) {
        f.style['margin-top'] = -p.y + 'px';
        f.style['margin-left'] = -p.x + 'px';
      }
    }
    return this;
  },
  initialize: function(url, options) {
    this._url = url;

    var wmsParams = L.extend({}, this.defaultWmsParams);

    // all keys that are not TileLayer options go to WMS params
    for (var i in options) {
      if (!(i in this.options)) {
        wmsParams[i] = options[i];
      }
    }

    options = L.setOptions(this, options);

    wmsParams.width = wmsParams.height =
      options.tileSize * (options.detectRetina && L.Browser.retina ? 2 : 1);

    this.wmsParams = wmsParams;
  },
  onRemove: function(map) {
    this._map = null;
    L.TileLayer.prototype.onRemove.call(this, map);
    map.off('move', this.update, this);
  },
  onAdd: function(map) {
    this._crs = this.options.crs || map.options.crs;
    this._wmsVersion = parseFloat(this.wmsParams.version);

    var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
    this.wmsParams[projectionKey] = this._crs.code;
    L.TileLayer.prototype.onAdd.call(this, map);
    map.on('move', this.update, this);
    this.update();
  },
  setClip: function(a) {
    this.options.clip = a;
    this.update();
    return this;
  },
});
L.tileLayer.clip = function(url, options) {
  return new L.TileLayer.Clip(url, options);
};
