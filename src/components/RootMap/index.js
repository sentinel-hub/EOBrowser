import React from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import NProgress from 'nprogress';
import {
  getCoordsFromBounds,
  roundDegrees,
  calcBboxFromXY,
  bboxToPolygon,
  getMapDOMSize,
} from '../../utils/coords';
import { createMapLayer, evalSourcesMap, isCustomPreset } from '../../utils/utils';
import '../ext/leaflet-clip-wms-layer';
import Store from '../../store';
import get from 'dlv';
import { connect } from 'react-redux';
import 'nprogress/nprogress.css';
import 'leaflet.pm';
import 'leaflet.pm/dist/leaflet.pm.css';
import gju from 'geojson-utils';
import UploadKML from '../UploadKML';
import FIS from '../FIS';
import { DrawArea, DrawMarker } from './DrawVectors';
import './RootMap.scss';
import pin from './pin.png';
let DefaultIcon = L.icon({
  iconUrl: pin,
  iconAnchor: [13, 40],
});

L.Marker.prototype.options.icon = DefaultIcon;

const COMPARE_LAYER_PANE = 'compareLayer';
const ACTIVE_LAYER_PANE = 'activeLayer';
const EDIT_LAYER_PANE = 'editingLayerPane';
const LABEL_LAYER_PANE = 'labelLayer';
const MARKER_LAYER_PANE = 'markerPane';
const OVERLAY_LAYER_PANE = 'overlayPane';

class RootMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeLayers: [],
      isLoaded: false,
      query: this.props.formQuery,
      showClip: false,
      location: [],
      instances: {},
      uploadDialog: false,
    };
    this.aoiLayer = null;
    this.mainMap = null;
    this.activeLayer = L.tileLayer('');
    this.allResults = [];
    this.compareLayers = [];
    this.progress = null;
  }

  componentDidMount() {
    const { mapId, lat, lng, zoom } = this.props;

    this.progress = NProgress.configure({
      showSpinner: false,
      parent: `#${mapId}`,
    });

    //construct baselayers object for control
    //	http://a.tile.openstreetmap.org/${z}/${x}/${y}.png
    const cartoLightNoLabels = L.tileLayer(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
      {
        // http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
        name: 'Carto Light',
      },
    );
    const cartoVoyagerNoLabels = L.tileLayer(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
      },
    );

    const cartoLabels = L.tileLayer(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
      },
    );
    // creates layers with contrast and brightness filters applied
    cartoLabels.createTile = function(coords, done) {
      const tile = L.DomUtil.create('canvas', 'leaflet-tile');
      tile.width = tile.height = this.options.tileSize;

      const imageObj = new Image();
      imageObj.crossOrigin = '';
      imageObj.onload = function() {
        const ctx = tile.getContext('2d');
        ctx.filter = 'contrast(180%)';
        ctx.filter = 'brightness(1.6)';
        ctx.drawImage(imageObj, 0, 0);
        done(null, tile); // Syntax is 'done(error, tile)'
      };
      imageObj.onerror = function(error) {
        done(error, null);
      };
      imageObj.src = this.getTileUrl(coords);
      return tile;
    };
    this.mainMap = L.map(mapId, {
      center: [lat, lng],
      zoom: zoom,
      minZoom: 3,
      layers: [cartoVoyagerNoLabels],
    });
    this.mainMap.createPane(COMPARE_LAYER_PANE);
    this.mainMap.createPane(ACTIVE_LAYER_PANE);
    this.mainMap.createPane(EDIT_LAYER_PANE);
    this.mainMap.createPane(LABEL_LAYER_PANE);
    this.mainMap.getPane(MARKER_LAYER_PANE).style.zIndex = 63;
    this.mainMap.getPane(OVERLAY_LAYER_PANE).style.zIndex = 62;
    this.mainMap.getPane(EDIT_LAYER_PANE).style.zIndex = 62;
    this.mainMap.getPane(LABEL_LAYER_PANE).style.zIndex = 61;
    this.mainMap.getPane(COMPARE_LAYER_PANE).style.zIndex = 50;
    this.mainMap.getPane(ACTIVE_LAYER_PANE).style.zIndex = 40;
    this.mainMap.getPane(ACTIVE_LAYER_PANE).style.pointerEvents = 'none';
    this.mainMap.getPane(COMPARE_LAYER_PANE).style.pointerEvents = 'none';

    cartoLabels.options.pane = LABEL_LAYER_PANE;
    cartoLabels.addTo(this.mainMap);

    const baseMaps = {
      'Carto Voyager': cartoVoyagerNoLabels,
      'Carto Light': cartoLightNoLabels,
    };
    const overlays = {
      Labels: cartoLabels,
    };

    this.poiLayer = L.geoJson().addTo(this.mainMap);
    this.poiLayer.pm.enable();

    this.layerControl = L.control
      .layers(baseMaps, overlays, {
        sortLayers: true,
        autoZIndex: false,
        sortFunction: (a, b) => {
          return (
            this.mainMap.getPane(a.options.pane).style.zIndex -
            this.mainMap.getPane(b.options.pane).style.zIndex
          );
        },
      })
      .addTo(this.mainMap);
    L.control.scale({ imperial: false }).addTo(this.mainMap);

    this.mainMap.zoomControl.setPosition('bottomright');
    this.mainMap.on('moveend', () => {
      Store.setMapView({
        lat: this.mainMap.getCenter().lat,
        lng: this.mainMap.getCenter().wrap().lng,
        zoom: this.mainMap.getZoom(),
      });
      Store.setMapBounds(this.mainMap.getBounds(), this.mainMap.getPixelBounds());
    });
    this.mainMap.on('mousemove', e => {
      const zoom = this.mainMap.getZoom();
      const lng = roundDegrees(e.latlng.lng, zoom);
      const lat = roundDegrees(e.latlng.lat, zoom);
      const value = `Lat: ${lat}, Lng: ${lng}`;
      document.getElementById('mapCoords').innerHTML = value;
    });
    this.mainMap.attributionControl.setPrefix(''); //<a href="https://leafletjs.com" target="_blank" title="A JS library for interactive maps">Leaflet</a>')
    this.mainMap.on('resize', () => {
      this.resetAllLayers();
      if (Store.current.compareModeType === 'split') {
        Store.current.pinResults.forEach((pin, index) => {
          this.setOverlayParams(pin.opacity, index);
        });
      }
    });

    // add leaflet.pm controls to the map
    // this.mainMap.pm.addControls(options)

    this.mainMap.on('pm:create', e => {
      const layer = e.layer;
      if (layer instanceof L.Polygon) {
        this.addAoiLayer(layer);
        Store.setIsClipping(false);
        e.layer.pm.toggleEdit();
        e.layer.on('pm:edit', f => {
          this.updateAOIGeometryInStore(f.target);
        });
      }
      if (layer instanceof L.Marker) {
        this.mainMap.pm.disableDraw('Marker');
        this.updateMarkers(layer);
        this.poiLayer.pm.toggleEdit();
        e.layer.on('pm:edit', f => {
          this.updateMarkers(f.target);
        });
      }
    });

    this.mainMap.on('pm:remove', e => {
      this.removeAoiLayer(e.layer, true);
    });

    this.mainMap.on('overlayadd', addedLayer => {
      if (addedLayer.layer.options.pane === 'activeLayer') {
        Store.toggleActiveLayer(true);
      }
    });
    this.mainMap.on('overlayremove', removedLayer => {
      if (removedLayer.layer.options.pane === 'activeLayer') {
        Store.toggleActiveLayer(false);
      }
    });

    this.aoiLayer = L.geoJSON();
    this.aoiLayer.options.pane = EDIT_LAYER_PANE;
    this.aoiLayer.addTo(this.mainMap);

    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom);
    Store.setMapBounds(this.mainMap.getBounds(), this.mainMap.getPixelBounds());
    this.setState({ isLoaded: true });
    this.visualizeLayer();
    window.addEventListener('resize', () => {
      this.invalidateMapSize({ pan: false });
    });
  }

  toggleMapEdit = () => {
    const { isAoiClip } = Store.current;
    isAoiClip
      ? this.mainMap.pm.enableDraw('Poly', {
          finishOn: 'contextmenu',
          allowSelfIntersection: true,
        })
      : this.mainMap.pm.disableDraw('Poly');
  };

  removeAOILayers = () => {
    this.aoiLayer.eachLayer(layer => {
      this.mainMap.removeLayer(layer);
    });
  };

  updateAOIGeometryInStore = () => {
    if (this.aoiLayer.getLayers().length === 0) {
      Store.setAOIBounds(null);
    } else {
      Store.setAOIBounds({
        geometry: this.aoiLayer.toGeoJSON().features[0].geometry,
        bounds: this.aoiLayer.getBounds(),
      });
    }
  };

  addAoiLayer = childLayer => {
    this.aoiLayer.addLayer(childLayer);
    this.updateAOIGeometryInStore();
  };

  removeAoiLayer = childLayer => {
    this.aoiLayer.removeLayer(childLayer);
    this.updateAOIGeometryInStore();
  };

  addRemoveActiveLayer(show) {
    this.activeLayer &&
      (!show ? this.mainMap.removeLayer(this.activeLayer) : this.activeLayer.addTo(this.mainMap));
  }
  updateMarkers = childLayer => {
    const layerToGeojson = childLayer.toGeoJSON();
    const markerToBBox = calcBboxFromXY({
      lat: layerToGeojson.geometry.coordinates[1],
      lng: layerToGeojson.geometry.coordinates[0],
      zoom: 12,
      width: 1,
      height: 1,
      wgs84: true,
    });

    Store.setPOI({
      geometry: layerToGeojson.geometry,
      polygon: { geometry: bboxToPolygon(markerToBBox) },
    });
    this.poiLayer.addLayer(childLayer);
  };
  deleteMarker = () => {
    this.poiLayer.clearLayers();
    Store.setPOI(null);
  };
  componentDidUpdate(prevProps, prevState) {
    const {
      mainTabIndex,
      isAoiClip: sIsAoiClip,
      aoiBounds: sAoiBounds,
      compareMode: sCompareMode,
    } = Store.current;
    const { compareModeType, isAoiClip } = prevProps;
    if (get(this, 'props.action.type') === 'CHANGE_PIN_ORDER') {
      this.changeCompareOrder();
    }
    if (get(this, 'props.action.type') === 'REFRESH') {
      this.visualizeLayer();
    }
    // check tab switching
    if (prevProps.mainTabIndex !== mainTabIndex) {
      this.addRemoveActiveLayer(mainTabIndex === 2);
      this.togglePolygons(mainTabIndex === 1);
      this.addPinLayers();
    }
    if (get(this, 'props.action.type') === 'TOGGLE_ACTIVE_LAYER') {
      this.addRemoveActiveLayer(Store.current.isActiveLayerVisible);
    }
    if (sIsAoiClip !== isAoiClip) {
      this.toggleMapEdit();
    }
    if (this.props.action.type === 'SET_MAP_VIEW' && this.props.updatePosition === true) {
      this.updatePosition();
    }
    if (sAoiBounds === null && !sIsAoiClip) {
      this.removeAOILayers();
    }
    if (sCompareMode !== prevProps.compareMode) {
      this.addPinLayers(Store.current.compareMode);
    }
    if (Store.current.compareMode && compareModeType !== Store.current.compareModeType) {
      this.compareLayers.forEach(this.resetLayerParams);
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (isEqual(this.state.location, nextProps.location) && this.mainMap && nextProps.location) {
      this.setState({ location: nextProps.location }, () => this.mainMap.panTo(nextProps.location));
    }
  }

  componentWillUnmount() {
    if (this.mainMap) {
      this.mainMap.remove();
    }
  }

  resetLayerParams(layer) {
    layer.setClip(L.bounds([0, 0], [window.innerWidth, window.innerHeight]));
    layer.setOpacity(1);
  }

  resetAllLayers() {
    if (!this.mainMap.hasLayer(this.activeLayer)) {
      this.layerControl.removeLayer(this.activeLayer);
    }

    this.mainMap.eachLayer(layer => {
      if (layer.options.clip && !Store.current.compareMode) {
        this.resetLayerParams(layer);
      }
    });
  }

  updatePosition() {
    this.mainMap.setView([Store.current.lat, Store.current.lng], Store.current.zoom);
  }

  showPolygons(data) {
    this.clearPolygons();
    Object.keys(Store.current.searchResults).map(
      ds => (this.allResults = [...this.allResults, ...Store.current.searchResults[ds]]),
    );
    this.polyHighlight = L.geoJSON(this.allResults, {
      style: Store.current.defaultPolyStyle,
      onEachFeature: this.onEachPolygon,
    });
    this.polyHighlight.addTo(this.mainMap);
    if (Store.current.searchParams.queryBounds !== undefined) {
      this.boundPoly = L.polyline(getCoordsFromBounds(Store.current.searchParams.queryBounds, true), {
        color: '#c1d82d',
        dasharray: '5,5',
        weight: 3,
        fillColor: 'none',
      }).addTo(this.mainMap);
    }
  }

  resetHighlight = () => {
    this.polyHighlight.setStyle(Store.current.defaultPolyStyle);
  };

  highlightFeature = e => {
    this.resetHighlight(e);
    let layer = e.target;
    layer.setStyle(Store.current.highlightPolyStyle);
    if (e.originalEvent.type === 'click') {
      let obj = {};
      let allResults = [];
      Store.current.datasources.forEach(ds => (obj[ds] = [])); //we prepare object with all searched datasources
      let p = [e.latlng.lng, e.latlng.lat];
      this.allResults.forEach(layer => {
        if (
          gju.pointInPolygon(
            {
              type: 'Point',
              coordinates: p,
            },
            layer.geometry,
          )
        ) {
          obj[layer.tileData.datasource].push(layer);
          allResults.push(layer);
        }
      });
      if (allResults.length >= 1) {
        layer.closePopup();
        Store.setFilterResults(obj);
      }
    }
  };

  onEachPolygon = (feature, layer) => {
    layer.on({
      mouseover: this.highlightFeature,
      mouseout: this.resetHighlight,
      click: this.highlightFeature,
    });
  };

  clearPolygons = () => {
    if (this.polyHighlight !== undefined)
      try {
        this.polyHighlight.clearLayers();
      } catch (e) {
        console.warn('failed clearing polygons');
      }
    this.boundPoly && this.mainMap.removeLayer(this.boundPoly);
    this.allResults = [];
  };

  togglePolygons = isVisible => {
    let showClip = !isVisible;
    if (this.state.showClip !== showClip) {
      this.setState({ showClip: showClip }, () => {
        this.activeLayer && !this.state.showClip && this.mainMap.removeLayer(this.activeLayer);
      });
    }
    if (this.polyHighlight !== undefined) {
      if (!isVisible) {
        this.mainMap.removeLayer(this.polyHighlight);
        if (this.mainMap.hasLayer(this.activeLayer)) {
          this.mainMap.removeLayer(this.activeLayer);
        }
      } else {
        this.mainMap.addLayer(this.polyHighlight);
      }
    }
    this.boundPoly && this.mainMap.removeLayer(this.boundPoly);
  };

  zoomToActivePolygon = () => {
    let {
      selectedResult: { lat, lng },
      zoom,
    } = Store.current;
    let activeLayerZoom = this.activeLayer.options.minZoom;
    if (Number(zoom) < Number(activeLayerZoom)) {
      Store.setZoom(activeLayerZoom);
    }
    // let center = new L.LatLngBounds(result.geometry.coordinates[0]).getCenter()
    this.mainMap.setView([lat, lng]);
  };

  highlightTile = index => {
    if (this.polyHighlight) this.resetHighlight();

    let layersArray = [];
    if (this.polyHighlight && this.polyHighlight._layers !== undefined)
      layersArray = Object.keys(this.polyHighlight._layers);

    if (this.polyHighlight && this.polyHighlight._layers !== undefined) {
      this.polyHighlight._layers[layersArray[index]].setStyle(Store.current.highlightPolyStyle);
    }
  };

  onZoomToPin(item) {
    if (item && item.map)
      this.mainMap.setView(L.latLng(item.map.latitude, item.map.longitude), item.map.zoom, {
        animation: true,
      });
  }

  visualizeLayer() {
    this.addPinLayers(false);
    const { selectedResult, instances, mainTabIndex } = this.props;
    if (!selectedResult) {
      return;
    }
    if (this.activeLayer !== null) {
      this.layerControl.removeLayer(this.activeLayer);
      this.mainMap.removeLayer(this.activeLayer);
    }
    const layerFromInstance = instances.find(inst => inst.name === selectedResult.datasource);
    if (!layerFromInstance) {
      Store.setSelectedResult(null);
      Store.setSearchResults({});
      this.clearPolygons();
      return; // selected layer was not found in user instances
    }
    let layer = createMapLayer(layerFromInstance, ACTIVE_LAYER_PANE, this.progress);
    this.activeLayer = layer;
    if (mainTabIndex === 2) {
      this.activeLayer.setParams(this.getUpdateParams(this.props.selectedResult));
      if (!this.mainMap.hasLayer(this.activeLayer)) {
        this.activeLayer.options.pane = ACTIVE_LAYER_PANE;
        this.activeLayer.addTo(this.mainMap);
        this.resetAllLayers();
        this.layerControl.addOverlay(this.activeLayer, layerFromInstance.name);
      }
    }
  }
  removeCompareLayers = () => {
    this.compareLayers.forEach(l => this.mainMap.removeLayer(l));
    this.compareLayers = [];
  };
  drawCompareLayers = () => {
    let pins = [...Store.current.pinResults];
    pins.reverse().forEach(item => {
      let { instances } = Store.current;
      let layer = createMapLayer(
        instances.find(inst => inst.name === item.datasource),
        COMPARE_LAYER_PANE,
        this.progress,
      );

      if (layer === undefined) return;
      layer.setParams(this.getUpdateParams(item));
      if (Store.current.compareModeType === 'opacity') {
        layer.setOpacity(item.opacity[1]);
      } else {
        const mapDOMSize = getMapDOMSize();
        layer.setClip(
          L.bounds(
            [mapDOMSize.width * item.opacity[0], 0],
            [mapDOMSize.width * item.opacity[1], mapDOMSize.height],
          ),
        );
      }
      layer.options.pane = COMPARE_LAYER_PANE;
      layer.addTo(this.mainMap);
      this.compareLayers.push(layer);
    });
  };
  changeCompareOrder = (oldIndex, newIndex) => {
    this.removeCompareLayers();
    this.drawCompareLayers();
  };

  invalidateMapSize = options => {
    this.mainMap.invalidateSize(options);
  };
  // App.js handles in onCompareChange
  addPinLayers = () => {
    const { mainTabIndex: tabIndex, compareMode: isCompare } = Store.current;

    if (isCompare) {
      if (this.activeLayer !== null) {
        this.mainMap.removeLayer(this.activeLayer);
      }
      let pins = [...Store.current.pinResults];
      pins.reverse().forEach(item => {
        let { instances } = Store.current;
        let layer = createMapLayer(
          instances.find(inst => inst.name === item.datasource),
          COMPARE_LAYER_PANE,
          this.progress,
        );
        if (layer === undefined) return;
        layer.setParams(this.getUpdateParams(item));
        layer.options.pane = COMPARE_LAYER_PANE;
        layer.addTo(this.mainMap);
        this.compareLayers.push(layer);
      });
    } else {
      this.compareLayers.forEach(l => this.mainMap.removeLayer(l));
      this.compareLayers = [];
      if (this.activeLayer && tabIndex === 2) {
        this.activeLayer.options.pane = ACTIVE_LAYER_PANE;
        this.activeLayer.addTo(this.mainMap);
        this.resetAllLayers();
      }
      Store.setCompareMode(false);
    }
  };

  setOverlayParams = (arr, index) => {
    //if not in compare mode, don't do anything
    if (!Store.current.compareMode) return;
    let mapIndex = Store.current.pinResults.length - (index + 1);
    if (Store.current.compareModeType === 'opacity') {
      this.compareLayers[mapIndex].setOpacity(arr[1]);
    } else {
      const mapSize = this.mainMap.getSize();
      this.compareLayers[mapIndex].setClip(
        L.bounds([mapSize.x * arr[0], 0], [mapSize.x * arr[1], mapSize.y]),
      );
    }
  };

  resetAoi = () => {
    Store.setAOIBounds(null);
    Store.setIsClipping(false);
  };

  getUpdateParams(item) {
    let { selectedResult, presets, compareMode, isEvalUrl } = Store.current;
    let { datasource, gain, gamma, time, evalscript, evalscripturl, atmFilter, preset } =
      item || selectedResult || {};
    if (!datasource) return;
    let obj = {};
    obj.format = 'image/png';
    obj.pane = compareMode ? COMPARE_LAYER_PANE : ACTIVE_LAYER_PANE;
    obj.transparent = true;
    obj.maxcc = 100;
    if (datasource.includes('EW') && preset.includes('NON_ORTHO')) {
      obj.orthorectify = false;
    }
    if (isCustomPreset(preset)) {
      obj.layers = presets[datasource][0].id;
      evalscripturl && isEvalUrl && (obj.evalscripturl = evalscripturl);
      !isEvalUrl && (obj.evalscript = evalscript);
      obj.evalsource = evalSourcesMap[datasource];
      obj.PREVIEW = 3;
    } else {
      obj.layers = preset;
    }
    gain && (obj.gain = gain);
    gamma && (obj.gamma = gamma);
    atmFilter && (obj.ATMFILTER = atmFilter === 'null' ? null : atmFilter);
    obj.time = `${time}/${time}`;
    return cloneDeep(obj);
  }

  onUpload = area => {
    this.aoiLayer.clearLayers();
    Store.setIsClipping(false);
    this.aoiLayer.addData(area);
    Store.setAOIBounds({
      geometry: this.aoiLayer.toGeoJSON().features[0].geometry,
      bounds: this.aoiLayer.getBounds(),
    });
    this.mainMap.fitBounds(this.aoiLayer.getBounds());
    this.setState({ uploadDialog: false });
  };
  openUploadKMLDialog = () => {
    this.setState({ uploadDialog: true });
  };
  drawMarker = () => {
    if (Store.current.poi) {
      return;
    }
    this.mainMap.pm.enableDraw('Marker', {
      markerStyle: {
        draggable: true,
      },
    });
  };

  centerOnFeature = layerName => {
    if (layerName === 'poiLayer') {
      const featureBounds = this[layerName].getBounds();
      this.mainMap.fitBounds(featureBounds, { maxZoom: Store.current.zoom });
    } else {
      const featureBounds = this[layerName].getBounds();
      this.mainMap.fitBounds(featureBounds, { maxZoom: 15 });
    }
  };
  openFisPopup = aoiOrPoi => {
    this.setState({ fisDialog: true, fisDialogAoiOrPoi: aoiOrPoi });
  };
  render() {
    const { uploadDialog, fisDialog, fisDialogAoiOrPoi } = this.state;
    const { aoiBounds, poi, mapGeometry, isAoiClip, user, selectedResult } = Store.current;
    return (
      <div className="map-wrapper" style={{ width: this.props.width }}>
        <div className="mainMap" id={this.props.mapId} />
        {uploadDialog && (
          <UploadKML onUpload={this.onUpload} onClose={() => this.setState({ uploadDialog: false })} />
        )}
        <div id="aboutSentinel">
          <a href="https://www.sentinel-hub.com/apps/eo_browser" target="_blank" rel="noopener noreferrer">
            About EO Browser
          </a>
          <a href="mailto:info@sentinel-hub.com?Subject=EO%20Browser%20Feedback">Contact us</a>
          <a href="https://www.sentinel-hub.com/apps/wms" target="_blank" rel="noopener noreferrer">
            Get data
          </a>
        </div>
        <div id="mapCoords" />
        <div>
          <DrawArea
            fisDialog={fisDialog}
            aoiBounds={aoiBounds}
            isAoiClip={isAoiClip}
            mapGeometry={mapGeometry}
            selectedResult={selectedResult}
            openFisPopup={this.openFisPopup}
            resetAoi={this.resetAoi}
            openUploadKMLDialog={this.openUploadKMLDialog}
            centerOnFeature={this.centerOnFeature}
            disabled={!user}
          />
          <DrawMarker
            openFisPopup={this.openFisPopup}
            drawMarker={this.drawMarker}
            poi={poi}
            deleteMarker={this.deleteMarker}
            selectedResult={selectedResult}
            fisDialog={fisDialog}
            centerOnFeature={this.centerOnFeature}
            disabled={!user}
          />

          {fisDialog && (
            <FIS
              aoiOrPoi={fisDialogAoiOrPoi}
              drawDistribution={fisDialogAoiOrPoi === 'aoi'}
              onClose={() => this.setState({ fisDialog: false })}
            />
          )}
        </div>
      </div>
    );
  }
}

export default connect(store => store, null, null, { withRef: true })(RootMap);
