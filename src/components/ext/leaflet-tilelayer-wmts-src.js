import L from 'leaflet';

//this is copied from https://raw.githubusercontent.com/mylen/leaflet.TileLayer.WMTS/master/leaflet-tilelayer-wmts-src.js where there was an issue with map zoom.
// See line 46
// issue with repeating tilerow number; see line 61

L.TileLayer.WMTS = L.TileLayer.extend({
  defaultWmtsParams: {
    service: 'WMTS',
    request: 'GetTile',
    version: '1.0.0',
    layer: '',
    style: '',
    tilematrixSet: '',
    format: 'image/jpeg',
  },

  initialize: function(url, options) {
    // (String, Object)
    this._url = url;
    var wmtsParams = L.extend({}, this.defaultWmtsParams),
      tileSize = options.tileSize || this.options.tileSize;
    if (options.detectRetina && L.Browser.retina) {
      wmtsParams.width = wmtsParams.height = tileSize * 2;
    } else {
      wmtsParams.width = wmtsParams.height = tileSize;
    }
    for (var i in options) {
      // all keys that are not TileLayer options go to WMTS params
      if (!this.options.hasOwnProperty(i) && i !== 'matrixIds') {
        wmtsParams[i] = options[i];
      }
    }
    this.wmtsParams = wmtsParams;
    this.matrixIds = options.matrixIds || this.getDefaultMatrix();
    L.setOptions(this, options);
  },

  onAdd: function(map) {
    L.TileLayer.prototype.onAdd.call(this, map);
  },

  getTileUrl: function(tilePoint, zoom) {
    // (Point, Number) -> String
    var map = this._map;
    //we get zoom from point, not from map since it's not correct
    zoom = tilePoint.z;
    let crs = map.options.crs;
    let tileSize = this.options.tileSize;
    let nwPoint = tilePoint.multiplyBy(tileSize);
    //+/-1 in order to be on the tile
    nwPoint.x += 1;
    nwPoint.y -= 1;
    let sePoint = nwPoint.add(new L.Point(tileSize, tileSize));
    let nw = crs.project(map.unproject(nwPoint, zoom));
    let se = crs.project(map.unproject(sePoint, zoom));
    let tilewidth = se.x - nw.x;
    let ident = this.matrixIds[zoom].identifier;
    let X0 = this.matrixIds[zoom].topLeftCorner.lng;
    let Y0 = this.matrixIds[zoom].topLeftCorner.lat;
    // fix repeating tilerow with using Math.round() instead of Math.floor()
    let tilecol = Math.round((nw.x - X0) / tilewidth);
    let tilerow = -Math.round((nw.y - Y0) / tilewidth);
    let url = L.Util.template(this._url, { s: this._getSubdomain(tilePoint) });
    return (
      url +
      L.Util.getParamString(this.wmtsParams, url) +
      '&tilematrix=' +
      ident +
      '&tilerow=' +
      tilerow +
      '&tilecol=' +
      tilecol
    );
  },

  setParams: function(params, noRedraw) {
    L.extend(this.wmtsParams, params);
    if (!noRedraw) {
      this.redraw();
    }
    return this;
  },

  getDefaultMatrix: function() {
    /**
     * the matrix3857 represents the projection
     * for in the IGN WMTS for the google coordinates.
     */
    var matrixIds3857 = new Array(22);
    for (var i = 0; i < 22; i++) {
      matrixIds3857[i] = {
        identifier: '' + i,
        topLeftCorner: new L.LatLng(20037508.3428, -20037508.3428),
      };
    }
    return matrixIds3857;
  },
});

L.tileLayer.wmts = function(url, options) {
  return new L.TileLayer.WMTS(url, options);
};
