import L from 'leaflet';
import length from '@turf/length';
import area from '@turf/area';

L.Ruler = L.LayerGroup.extend({
  options: {
    position: 'topright',
    circleMarker: {
      color: 'grey',
      radius: 4,
      weight: 1,
      fillColor: 'white',
      fillOpacity: 1,
      pane: 'measurePoint',
    },
    tempLineStyle: {
      color: '#5e9645',
      dashArray: '1,6',
      pane: 'measureLineString',
    },
    lineStyle: {
      color: '#5e9645',
      weigth: 1,
      pane: 'measureLineString',
    },
    polygonStyle: {
      opacity: 0.9,
      fillColor: '#c9c9c9',
      color: 'green',
      fillOpacity: 0.4,
      weight: 1,
      dashArray: '2,2',
      pane: 'measurePolygon',
    },
    lengthUnit: {
      display: 'm',
      decimal: 2,
      factor: 1000,
    },
  },

  initialize: function(options) {
    this.initLayers();
    this.active = false;
    this.points = [];
  },

  onAdd: function() {
    this._defaultCursor = this._map._container.style.cursor;
    this._map.createPane('measurePolygon');
    this._map.getPane('measurePolygon').style.zIndex = 61;
    this._map.createPane('measureLineString');
    this._map.getPane('measureLineString').style.zIndex = 62;
    this._map.createPane('measurePoint');
    this._map.getPane('measurePoint').style.zIndex = 63;
  },

  toggle: function() {
    this.active = !this.active;
    this.clearData();
    if (this.active) {
      this._map.doubleClickZoom.disable();
      this.clearLayers();
      this.initLayers();
      L.DomEvent.on(this._map._container, 'keydown', this.escape, this);
      L.DomEvent.on(this._map._container, 'dblclick', this.closePath, this);
      this._map._container.style.cursor = 'crosshair';
      this._map.on('click', this.handleMouseClick, this);
      this._map.on('mousemove', this.handleMouseMove, this);
      this.allLayers.addTo(this._map);
      this.tempLineLayer.addTo(this.allLayers);
      this.lineStringLayer.addTo(this.allLayers);
      this.polygonLayer.addTo(this.allLayers);
      this.pointLayer.addTo(this.allLayers);
      this._map.fire('measure:startMeasure');
    } else {
      this._map.doubleClickZoom.enable();
      L.DomEvent.off(this._map._container, 'keydown', this.escape, this);
      L.DomEvent.off(this._map._container, 'dblclick', this.closePath, this);
      this._map._container.style.cursor = this._defaultCursor;
      this._map.off('click', this.handleMouseClick, this);
      this._map.off('mousemove', this.handleMouseMove, this);
    }
  },

  handleMouseClick: function(e) {
    this.clickedLatLng = [e.latlng.lat, e.latlng.lng];
    this.points.push(this.clickedLatLng);
    this.tempLineLayer.setLatLngs([]);
    if (this.points.length > 0) {
      this.updateLineString();
      const distance = this.calculateDistance();
      const area = this.calculateArea();
      this._map.fire('measure:pointAdded', {
        distance,
        area,
      });
    }
    this.createMarker(this.clickedLatLng);
  },

  handleMouseMove: function(e) {
    this.movingLatLng = [e.latlng.lat, e.latlng.lng];
    if (this.points.length > 0) {
      this.createTempLine(this.movingLatLng);
      const polygonCoords = [this.points.concat([this.movingLatLng]).concat([this.points[0]])];
      this.updatePolygonLayer(polygonCoords);
      const distance = this.calculateDistance();
      const area = this.calculateArea();
      this._map.fire('measure:move', {
        distance,
        area,
      });
    }
  },

  createMarker: function(latLng) {
    L.circleMarker(latLng, this.options.circleMarker)
      .addTo(this.pointLayer)
      .bringToFront();
  },

  updateLineString: function() {
    const lineCoords = [this.points];
    this.lineStringLayer.setLatLngs(lineCoords);
  },

  createTempLine: function(movingLatLng) {
    const lineCoords = [this.clickedLatLng, movingLatLng];
    this.tempLineLayer.setLatLngs(lineCoords);
  },

  updatePolygonLayer: function(coords) {
    this.polygonLayer.setLatLngs(coords);
  },

  closePath: function() {
    this.allLayers.removeLayer(this.tempLineLayer);
    this.tempLineLayer.setLatLngs([]);
    const distance = this.calculateDistance();
    const area = this.calculateArea();
    this._map.fire('measure:finish', {
      shape: 'LineString',
      distance,
      area,
    });
    this.toggle();
  },

  initLayers: function() {
    this.allLayers = L.layerGroup();
    this.polygonLayer = L.polygon([], this.options.polygonStyle);
    this.tempLineLayer = L.polyline([], this.options.tempLineStyle);
    this.lineStringLayer = L.polyline([], this.options.lineStyle);
    this.pointLayer = L.featureGroup();
  },

  removeMeasurement: function() {
    this.active = false;
    this._result = null;
    this._clickedLatLong = null;
    this._clickedPoints = [];
    this._totalLength = 0;
    this.clearLayers();
    this._map.fire('measure:removed', {});
    this._map.doubleClickZoom.enable();
    L.DomEvent.off(this._map._container, 'keydown', this.escape, this);
    L.DomEvent.off(this._map._container, 'dblclick', this.closePath, this);
    this._map._container.style.cursor = this._defaultCursor;
    this._map.off('click', this.handleMouseClick, this);
    this._map.off('mousemove', this.handleMouseMove, this);
  },

  clearLayers: function() {
    this.allLayers.clearLayers(); //Removes all the layers from the group.
  },

  escape: function(e) {
    const polygonCoords = [this.points.concat([this.points[0]])];
    if (e.keyCode === 27) {
      if (this.points.length > 1) {
        this.updateLineString();
        this.updatePolygonLayer(polygonCoords);
        this.closePath();
      } else {
        this.removeMeasurement();
      }
    }
  },

  clearData: function() {
    this.points = [];
    this.clickedLatLng = null;
    this.movingLatLng = null;
  },

  calculateDistance: function() {
    const templineJson = this.tempLineLayer.toGeoJSON();
    const lineStringJson = this.lineStringLayer.toGeoJSON();
    const tempLineDistance = length(templineJson, { units: 'meters' });
    const lineStringDistance = length(lineStringJson, { units: 'meters' });
    return tempLineDistance + lineStringDistance;
  },

  calculateArea: function() {
    if (this.points.length < 2) {
      return null;
    }
    const polygonJson = this.polygonLayer.toGeoJSON();
    return area(polygonJson); //returns in sqaure meters
  },
});
L.ruler = function(options) {
  return new L.Ruler(options);
};
