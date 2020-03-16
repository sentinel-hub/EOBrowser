import React from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import isEqual from 'lodash/isEqual';
import NProgress from 'nprogress';
import Rodal from 'rodal';

import { roundDegrees, calcBboxFromXY, bboxToPolygon, getMapDOMSize } from '../../utils/coords';
import { createMapLayer, evalscriptoverridesToString } from '../../utils/utils';
import { getAndSetNextPrev, queryDatesForActiveMonth, fetchAvailableDates } from '../../utils/datesHelper';
import { downloadFromShadow } from '../../utils/downloadMap';
import { userCanAccessLockedFunctionality } from '../../utils/utils';
import { extractLegendDataFromPreset, getLegendImageURL } from '../../utils/legendUtils';
import { getFisShadowLayer } from '../../utils/utils';
import { getTokenFromLocalStorage } from '../../utils/auth';
import { evalSourcesMap } from '../../store/config';
import '../ext/leaflet-clip-wms-layer';
import '../ext/leaflet-mapbox-gl';
import '../ext/leaflet-ruler';
import Store from '../../store';
import get from 'dlv';
import { connect } from 'react-redux';
import 'nprogress/nprogress.css';
import 'leaflet.pm';
import 'leaflet.pm/dist/leaflet.pm.css';
import gju from 'geojson-utils';
import UploadGeoFile from '../UploadGeoFile';
import '../ext/leaflet-ruler';
import '../ext/color-labels';

import {
  EOBMeasurePanelButton,
  EOBPOIPanelButton,
  EOBAOIPanelButton,
  EOBDownloadPanelButton,
  EOBTimelapsePanelButton,
  EOBTimelapsePanel,
  EOBFIS,
  EOBImageDownloadPanel,
} from '@sentinel-hub/eo-components';
import Tutorial from '../Tutorial/Tutorial';
import App from '../../App';
import './RootMap.scss';
import pin from './pin.png';
import { DEFAULT_POLY_STYLE, HIGHLIGHT_POLY_STYLE } from '../../store/config';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getUpdateParams } from '../../utils/utils';

let DefaultIcon = L.icon({
  iconUrl: pin,
  iconAnchor: [13, 40],
});

L.Marker.prototype.options.icon = DefaultIcon;

export const DEFAULT_RESULTS_GROUP = 'default';

const COMPARE_LAYER_PANE = 'compareLayer';
const ACTIVE_LAYER_PANE = 'activeLayer';
const EDIT_LAYER_PANE = 'editingLayerPane';
const LABEL_LAYER_PANE = 'labelLayer';
const MARKER_LAYER_PANE = 'markerPane';
const ROAD_LAYER_PANE = 'roadLayerPane';
const ADMIN_LAYER_PANE = 'adminLayerPane';

const timelapseBorders = (width, height, bbox) => ({
  sortIndex: 1,

  url: `https://api.maptiler.com/maps/6a4430-YOUR-INSTANCEID-HERE/static/${bbox[0]},${bbox[1]},${
    bbox[2]
  },${bbox[3]}/${width}x${height}.png?key=${process.env.REACT_APP_MAPTILER_API_KEY}&attribution=false`,
  params: {},
});

const timelapseOverlayLayers = [{ name: 'Borders', layer: timelapseBorders }];

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
      hasMeasurement: false,
      measureDistance: null,
      measureArea: null,
    };
    this.aoiLayer = null;
    this.mainMap = null;
    this.activeLayer = L.tileLayer('');
    this.allResults = [];
    this.compareLayers = [];
    this.progress = null;
  }

  componentDidMount() {
    const { mapId, lat, lng, zoom, mapMaxBounds } = this.props;
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
        print: false,
      },
    );
    const cartoVoyagerNoLabels = L.tileLayer(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
        print: false,
      },
    );

    const cartoLabels = L.tileLayer.makeLabelsReadable(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
        print: true,
      },
    );

    const satelliteStreets = L.mapboxGL({
      attribution:
        '<a href="https://www.maptiler.com/license/maps/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
      accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
      style: `https://api.maptiler.com/maps/bc1baf-YOUR-INSTANCEID-HERE/style.json?key=${
        process.env.REACT_APP_MAPTILER_API_KEY
      }`,
      print: false,
      preserveDrawingBuffer: true,
    });

    const satelliteAdmin = L.mapboxGL({
      attribution:
        '<a href="https://www.maptiler.com/license/maps/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
      accessToken: process.env.REACT_APP_MAPBOX_TOKEN,
      style: `https://api.maptiler.com/maps/6a4430-YOUR-INSTANCEID-HERE/style.json?key=${
        process.env.REACT_APP_MAPTILER_API_KEY
      }`,
      print: false,
      preserveDrawingBuffer: true,
    });

    this.mainMap = L.map(mapId, {
      center: [lat, lng],
      zoom: zoom,
      minZoom: 3,
      layers: [cartoVoyagerNoLabels],
      maxBounds: L.latLngBounds(mapMaxBounds),
      maxBoundsViscosity: 0.9, //bounce back effect
      attributionControl: false,
    });
    this.mainMap.createPane(COMPARE_LAYER_PANE);
    this.mainMap.createPane(ACTIVE_LAYER_PANE);
    this.mainMap.createPane(EDIT_LAYER_PANE);
    this.mainMap.createPane(LABEL_LAYER_PANE);
    this.mainMap.createPane(ADMIN_LAYER_PANE);
    this.mainMap.createPane(ROAD_LAYER_PANE);
    this.mainMap.getPane(MARKER_LAYER_PANE).style.zIndex = 63;
    this.mainMap.getPane(EDIT_LAYER_PANE).style.zIndex = 62;
    this.mainMap.getPane(LABEL_LAYER_PANE).style.zIndex = 61;
    this.mainMap.getPane(ROAD_LAYER_PANE).style.zIndex = 60;
    this.mainMap.getPane(ADMIN_LAYER_PANE).style.zIndex = 60;
    this.mainMap.getPane(COMPARE_LAYER_PANE).style.zIndex = 50;
    this.mainMap.getPane(ACTIVE_LAYER_PANE).style.zIndex = 40;
    this.mainMap.getPane(ACTIVE_LAYER_PANE).style.pointerEvents = 'none';
    this.mainMap.getPane(COMPARE_LAYER_PANE).style.pointerEvents = 'none';

    cartoLabels.options.pane = LABEL_LAYER_PANE;
    cartoLabels.addTo(this.mainMap);
    satelliteStreets.options.pane = ROAD_LAYER_PANE;
    satelliteAdmin.options.pane = ADMIN_LAYER_PANE;

    const baseMaps = {
      'Carto Voyager': cartoVoyagerNoLabels,
      'Carto Light': cartoLightNoLabels,
    };
    const overlays = {
      Roads: satelliteStreets,
      Borders: satelliteAdmin,
      Labels: cartoLabels,
    };
    this.ruler = L.ruler().addTo(this.mainMap);
    L.control.scale({ imperial: false, position: 'bottomright' }).addTo(this.mainMap);
    L.control.attribution({ position: 'bottomleft' }).addTo(this.mainMap);
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

    this.mainMap.zoomControl.setPosition('bottomright');

    this.mainMap.on('layeradd', addedLayer => {
      if (addedLayer.layer instanceof L.MapboxGL) {
        addedLayer.layer._update();
      }
    });

    this.mainMap.on('moveend', () => {
      Store.setMapView({
        lat: this.mainMap.getCenter().lat,
        lng: this.mainMap.getCenter().wrap().lng,
        zoom: this.mainMap.getZoom(),
      });
      Store.setMapBounds(this.mainMap.getBounds(), this.mainMap.getPixelBounds());
    });
    this.mainMap.on('mousemove', e => {
      const coords = e.latlng.wrap();
      const zoom = this.mainMap.getZoom();
      const lng = roundDegrees(coords.lng, zoom);
      const lat = roundDegrees(coords.lat, zoom);
      const value = `Lat: ${lat}, Lng: ${lng}`;
      document.getElementById('mapCoords').innerHTML = value;
    });
    this.mainMap.attributionControl.setPrefix(''); //<a href="https://leafletjs.com" target="_blank" title="A JS library for interactive maps">Leaflet</a>')
    this.mainMap.on('resize', () => {
      this.resetAllLayers();
      if (Store.current.compareModeType === 'split') {
        this.props.pins.forEach((pin, index) => {
          this.setOverlayParams(pin.opacity, index);
        });
      }
    });

    this.mainMap.on('measure:startMeasure', e => {
      this.setState({ hasMeasurement: true, measureDistance: null, measureArea: null });
    });
    //measure events
    this.mainMap.on('measure:move', e => {
      this.setState({ measureDistance: e.distance, measureArea: e.area });
    });
    this.mainMap.on('measure:pointAdded', e => {
      this.setState({ measureDistance: e.distance, measureArea: e.area });
    });
    this.mainMap.on('measure:finish', e => {
      this.setState({ measureDistance: e.distance, measureArea: e.area });
    });
    this.mainMap.on('measure:removed', e => {
      this.setState({ hasMeasurement: false, measureDistance: null, measureArea: null });
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
    this.mainMap.trackResize = true;
    Store.setMapBounds(this.mainMap.getBounds(), this.mainMap.getPixelBounds());
    this.setState({ isLoaded: true });
    this.visualizeLayer();
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

  toggleMeasure = () => {
    this.ruler.toggle();
  };

  removeMeasurement = () => {
    this.ruler.removeMeasurement();
  };

  handleErrorMessage = msg => {
    App.displayErrorMessage(msg);
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
      width: 2,
      height: 2,
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
      this.addPinLayers();
    }
    if (Store.current.compareMode && compareModeType !== Store.current.compareModeType) {
      this.compareLayers.forEach(this.resetLayerParams);
    }
    if (this.props.mapMaxBounds !== prevProps.mapMaxBounds) {
      this.mainMap.setMaxBounds(L.latLngBounds(this.props.mapMaxBounds));
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
    this.allResults = [...Store.current.searchResults[DEFAULT_RESULTS_GROUP]];
    // see https://leafletjs.com/examples/geojson/ for GeoJSON format
    const geoJsonList = this.allResults.filter(r => r.tileData.dataGeometry).map((r, resultIndex) => ({
      type: 'Feature',
      properties: {
        sensingTime: r.tileData.sensingTime,
        resultIndex: r.resultIndex,
      },
      geometry: r.tileData.dataGeometry,
    }));

    this.polyHighlight = L.geoJSON(geoJsonList, {
      style: DEFAULT_POLY_STYLE,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: this.setHighlight,
          mouseout: this.resetHighlight,
          click: this.selectFeature,
        });
      },
    });
    this.polyHighlight.addTo(this.mainMap);
  }

  resetHighlight = () => {
    this.polyHighlight.setStyle(DEFAULT_POLY_STYLE);
  };

  setHighlight = e => {
    const layer = e.target;
    layer.setStyle(HIGHLIGHT_POLY_STYLE);
  };

  selectFeature = e => {
    const clickCoords = {
      type: 'Point',
      coordinates: [e.latlng.lng, e.latlng.lat],
    };
    const intersectingResults = this.allResults.filter(
      r => r.tileData.dataGeometry && gju.pointInPolygon(clickCoords, r.tileData.dataGeometry),
    );

    if (intersectingResults.length > 0) {
      Store.setFilterResults({ DEFAULT_RESULTS_GROUP: intersectingResults });
    }
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

  highlightTile = resultIndex => {
    // There is sometimes a problem with highlights (there aren't any)
    // when Object.values(this.polyHighlight._layers).length is 0 (zero).
    // Some of our datasources apparently don't have this feature (Envisat Meris),
    // or there is a problem with getting data from backend.
    // So checking [if length of (object converted to array) is zero] is added.
    if (
      !this.polyHighlight ||
      !this.polyHighlight._layers ||
      Object.values(this.polyHighlight._layers).length === 0
    ) {
      return;
    }
    this.resetHighlight();

    const layerFeature = Object.values(this.polyHighlight._layers).find(
      l => l.feature.properties.resultIndex === resultIndex,
    );
    layerFeature.setStyle(HIGHLIGHT_POLY_STYLE);
  };

  onZoomToPin(item) {
    if (item && item.map)
      this.mainMap.setView(L.latLng(item.map.latitude, item.map.longitude), item.map.zoom, {
        animation: true,
      });
  }

  visualizeLayer() {
    this.addPinLayers(false);
    const {
      selectedResult,
      instances,
      mainTabIndex,
      recaptchaAuthToken,
      setTokenShouldBeUpdated,
    } = this.props;
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
    const layerParams = getUpdateParams(this.props.selectedResult);
    let layer = createMapLayer(
      layerFromInstance,
      layerParams,
      ACTIVE_LAYER_PANE,
      this.progress,
      recaptchaAuthToken,
      setTokenShouldBeUpdated,
    );
    this.activeLayer = layer;
    if (mainTabIndex === 2) {
      this.activeLayer.setParams(layerParams);
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
    let pins = [...this.props.pins];
    let { instances, compareMode: isCompare } = Store.current;
    const { recaptchaAuthToken, setTokenShouldBeUpdated } = this.props;
    if (!isCompare) {
      return;
    }
    pins.reverse().forEach(item => {
      const layerParams = getUpdateParams(item);
      let layer = createMapLayer(
        instances.find(inst => inst.name === item.datasource),
        layerParams,
        COMPARE_LAYER_PANE,
        this.progress,
        recaptchaAuthToken,
        setTokenShouldBeUpdated,
      );

      if (layer === undefined) return;
      layer.setParams(layerParams);
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

  addPinLayers = () => {
    const { mainTabIndex: tabIndex, compareMode: isCompare } = Store.current;
    const { recaptchaAuthToken, setTokenShouldBeUpdated } = this.props;
    if (isCompare) {
      if (this.activeLayer !== null) {
        this.mainMap.removeLayer(this.activeLayer);
      }
      let pins = [...this.props.pins];
      pins.reverse().forEach(item => {
        let { instances } = Store.current;
        const layerParams = getUpdateParams(item);
        let layer = createMapLayer(
          instances.find(inst => inst.name === item.datasource),
          layerParams,
          COMPARE_LAYER_PANE,
          this.progress,
          recaptchaAuthToken,
          setTokenShouldBeUpdated,
        );
        if (layer === undefined) return;
        layer.setParams(layerParams);
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
    let mapIndex = this.props.pins.length - (index + 1);
    if (Store.current.compareModeType === 'opacity') {
      this.compareLayers[mapIndex].setOpacity(arr[1]);
    } else {
      const mapSize = this.mainMap.getSize();
      this.compareLayers[mapIndex].setClip(
        L.bounds([mapSize.x * arr[0], 0], [mapSize.x * arr[1], mapSize.y]),
      );
    }
  };

  onDrawPolygon = () => {
    Store.setIsClipping(true);
  };

  resetAoi = () => {
    Store.setAOIBounds(null);
    Store.setIsClipping(false);
  };

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
  openUploadGeoFileDialog = () => {
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

  drawMapOverlays = async (canvasWidth, canvasHeight) => {
    const { mapBounds } = this.props;
    const overlayCanvas = await downloadFromShadow(this.mainMap, mapBounds, canvasWidth, canvasHeight);
    return overlayCanvas;
  };

  getLegendImageURL = async legendData => {
    const legendUrl = await getLegendImageURL(legendData);
    return legendUrl;
  };

  openImageDownloadPanel = () => {
    const modalDialogId = 'analytical-download';

    const {
      instances,
      isEvalUrl,
      aoiBounds,
      channels,
      presets,
      selectedResult: {
        name,
        datasource,
        preset,
        evalscript,
        evalscripturl,
        atmFilter,
        layers,
        time,
        gainOverride,
        gammaOverride,
        redRangeOverride,
        greenRangeOverride,
        blueRangeOverride,
        valueRangeOverride,
      },
      mapBounds,
      lat,
      lng,
      zoom,
      selectedTheme,
      user,
    } = this.props;

    const evalscriptoverridesObj = {
      gainOverride,
      gammaOverride,
      redRangeOverride,
      greenRangeOverride,
      blueRangeOverride,
      valueRangeOverride,
    };
    const evalscriptoverrides = evalscriptoverridesToString(evalscriptoverridesObj);
    const evalSource = evalSourcesMap[datasource];
    const activeInstance = instances.find(ins => ins.name === datasource);
    const legendDataFromPreset = extractLegendDataFromPreset(activeInstance.id, datasource, preset);

    const scaleBarEl = document.querySelector('.leaflet-control-scale-line');
    const scaleBar = scaleBarEl
      ? {
          text: scaleBarEl.innerHTML,
          width: scaleBarEl.offsetWidth,
        }
      : null;

    Store.addModalDialog(
      modalDialogId,
      <Rodal
        animation="slideUp"
        customStyles={{
          height: 'auto',
          maxHeight: '80vh',
          bottom: 'auto',
          width: '750px',
          top: '5vh',
          overflow: 'auto',
        }}
        visible
        onClose={() => Store.removeModalDialog(modalDialogId)}
        closeOnEsc={true}
      >
        <EOBImageDownloadPanel
          channels={channels}
          presets={presets}
          evalscriptoverrides={evalscriptoverrides}
          evalSource={evalSource}
          instances={instances}
          isEvalUrl={isEvalUrl}
          aoiBounds={aoiBounds}
          mapBounds={mapBounds}
          name={name}
          datasource={datasource}
          preset={preset}
          evalscript={evalscript}
          evalscripturl={evalscripturl}
          atmFilter={atmFilter}
          layers={layers}
          time={time}
          lat={lat}
          lng={lng}
          zoom={zoom}
          isLoggedIn={userCanAccessLockedFunctionality(user, selectedTheme)}
          legendDataFromPreset={legendDataFromPreset}
          drawMapOverlays={this.drawMapOverlays}
          getLegendImageURL={this.getLegendImageURL}
          scaleBar={scaleBar}
          onErrorMessage={this.handleErrorMessage}
        />
      </Rodal>,
    );
  };

  onGetAndSetNextPrev = direction => {
    const { maxDate, minDate, selectedResult, mapBounds, instances, userInstances } = this.props;
    return getAndSetNextPrev(
      direction,
      maxDate,
      minDate,
      selectedResult,
      mapBounds,
      instances,
      userInstances,
    );
  };

  onQueryDatesForActiveMonth = date => {
    const {
      selectedResult,
      selectedResult: { datasource },
      instances,
      mapBounds,
    } = this.props;
    return queryDatesForActiveMonth(date, datasource || null, selectedResult, instances, mapBounds);
  };

  onFetchAvailableDates = (fromDate, toDate, boundsGeojson) => {
    const { selectedResult, instances, mapBounds } = this.props;
    return fetchAvailableDates(fromDate, toDate, null, boundsGeojson, selectedResult, instances, mapBounds);
  };

  openTimelapsePanel = () => {
    const modalDialogId = 'timelapse';
    const {
      minDate,
      maxDate,
      isEvalUrl,
      lat,
      lng,
      zoom,
      mapBounds,
      aoiBounds,
      cloudCoverageLayers,
      presets,
      instances,
      selectedResult,
      selectedResult: {
        gainOverride,
        gammaOverride,
        redRangeOverride,
        greenRangeOverride,
        blueRangeOverride,
        valueRangeOverride,
      },
    } = this.props;

    const authToken = getTokenFromLocalStorage().access_token;

    const evalscriptoverridesObj = {
      gainOverride,
      gammaOverride,
      redRangeOverride,
      greenRangeOverride,
      blueRangeOverride,
      valueRangeOverride,
    };
    const evalscriptoverrides = evalscriptoverridesToString(evalscriptoverridesObj);

    const minDateRange = selectedResult.minDate ? new Date(selectedResult.minDate) : new Date(minDate);
    const maxDateRange = selectedResult.maxDate ? new Date(selectedResult.maxDate) : new Date(maxDate);

    Store.addModalDialog(
      modalDialogId,
      <EOBTimelapsePanel
        onClose={() => Store.removeModalDialog(modalDialogId)}
        selectedResult={selectedResult}
        canWeFilterByClouds={cloudCoverageLayers[selectedResult.name] !== undefined}
        minDate={minDateRange}
        maxDate={maxDateRange}
        evalscriptoverrides={evalscriptoverrides}
        isEvalUrl={isEvalUrl}
        lat={lat}
        lng={lng}
        zoom={zoom}
        mapBounds={mapBounds}
        aoiBounds={aoiBounds}
        cloudCoverageLayers={cloudCoverageLayers}
        presets={presets}
        instances={instances}
        onFetchAvailableDates={this.onFetchAvailableDates}
        onGetAndSetNextPrev={this.onGetAndSetNextPrev}
        onQueryDatesForActiveMonth={this.onQueryDatesForActiveMonth}
        overlayLayers={timelapseOverlayLayers}
        authToken={authToken}
      />,
    );
  };

  render() {
    const {
      uploadDialog,
      fisDialog,
      fisDialogAoiOrPoi,
      hasMeasurement,
      measureDistance,
      measureArea,
    } = this.state;

    const {
      aoiBounds,
      compareMode,
      isAoiClip,
      isEvalUrl,
      mapGeometry,
      poi,
      presets,
      selectedResult,
      selectedTheme,
      user,
    } = this.props;

    let presetLayerName = null;
    let fisShadowLayer = null;
    let evalscriptoverrides = null;
    if (selectedResult) {
      fisShadowLayer = getFisShadowLayer(selectedResult.name, selectedResult.preset);
      const preset = presets[selectedResult.name].find(l => l.id === selectedResult.preset);
      presetLayerName = preset ? preset.name : null;

      const evalscriptoverridesObj = {
        gainOverride: selectedResult.gainOverride,
        gammaOverride: selectedResult.gammaOverride,
        redRangeOverride: selectedResult.redRangeOverride,
        greenRangeOverride: selectedResult.greenRangeOverride,
        blueRangeOverride: selectedResult.blueRangeOverride,
        valueRangeOverride: selectedResult.valueRangeOverride,
      };
      evalscriptoverrides = evalscriptoverridesToString(evalscriptoverridesObj);
    }

    return (
      <div className="map-wrapper">
        <div className="mainMap" id={this.props.mapId} />
        {uploadDialog && (
          <UploadGeoFile onUpload={this.onUpload} onClose={() => this.setState({ uploadDialog: false })} />
        )}
        <div id="aboutSentinel">
          <a href="https://www.sentinel-hub.com/apps/eo_browser" target="_blank" rel="noopener noreferrer">
            About EO Browser
          </a>
          <a href="https://forum.sentinel-hub.com/" target="_blank" rel="noopener noreferrer">
            Contact us
          </a>
          <a href="https://www.sentinel-hub.com/apps/wms" target="_blank" rel="noopener noreferrer">
            Get data
          </a>
        </div>
        <div id="mapCoords" />
        <div>
          <Tutorial />
          <EOBAOIPanelButton
            aoiBounds={aoiBounds}
            onDrawPolygon={this.onDrawPolygon}
            isAoiClip={isAoiClip}
            mapGeometry={mapGeometry}
            selectedResult={selectedResult}
            openFisPopup={this.openFisPopup}
            resetAoi={this.resetAoi}
            openUploadGeoFileDialog={this.openUploadGeoFileDialog}
            centerOnFeature={this.centerOnFeature}
            disabled={false}
            presetLayerName={presetLayerName}
            fisShadowLayer={fisShadowLayer}
            onErrorMessage={this.handleErrorMessage}
          />
          <EOBPOIPanelButton
            openFisPopup={this.openFisPopup}
            drawMarker={this.drawMarker}
            poi={poi}
            deleteMarker={this.deleteMarker}
            selectedResult={selectedResult}
            centerOnFeature={this.centerOnFeature}
            disabled={false}
            presetLayerName={presetLayerName}
            fisShadowLayer={fisShadowLayer}
            onErrorMessage={this.handleErrorMessage}
          />
          <EOBDownloadPanelButton
            selectedResult={selectedResult}
            isCompareMode={compareMode}
            openImageDownloadPanel={this.openImageDownloadPanel}
            onErrorMessage={this.handleErrorMessage}
          />
          <EOBTimelapsePanelButton
            selectedResult={selectedResult}
            isCompareMode={compareMode}
            isLoggedIn={userCanAccessLockedFunctionality(user, selectedTheme)}
            openTimelapsePanel={this.openTimelapsePanel}
            onErrorMessage={this.handleErrorMessage}
          />

          {fisDialog && (
            <EOBFIS
              aoiOrPoi={fisDialogAoiOrPoi}
              onClose={() => this.setState({ fisDialog: false })}
              evalscriptoverrides={evalscriptoverrides}
              isEvalUrl={isEvalUrl}
              selectedResult={selectedResult}
              presets={presets}
              poi={poi}
              aoiBounds={aoiBounds}
              fisShadowLayer={fisShadowLayer}
            />
          )}
          <EOBMeasurePanelButton
            toggleMeasure={this.toggleMeasure}
            hasMeasurement={hasMeasurement}
            distance={measureDistance}
            area={measureArea}
            removeMeasurement={this.removeMeasurement}
            isLoggedIn={userCanAccessLockedFunctionality(user, selectedTheme)}
            onErrorMessage={this.handleErrorMessage}
          />
        </div>
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  action: store.action,
  aoiBounds: store.aoiBounds,
  cloudCoverageLayers: store.cloudCoverageLayers,
  compareMode: store.compareMode,
  compareModeType: store.compareModeType,
  formQuery: store.formQuery,
  instances: store.instances,
  isAoiClip: store.isAoiClip,
  isEvalUrl: store.isEvalUrl,
  lat: store.lat,
  lng: store.lng,
  location: store.location,
  mainTabIndex: store.mainTabIndex,
  mapBounds: store.mapBounds,
  mapGeometry: store.mapGeometry,
  mapMaxBounds: store.mapMaxBounds,
  maxDate: store.maxDate,
  minDate: store.minDate,
  pins: store.themePins || store.userPins,
  poi: store.poi,
  presets: store.presets,
  recaptchaAuthToken: store.recaptchaAuthToken,
  selectedResult: store.selectedResult,
  selectedTheme: store.selectedTheme,
  updatePosition: store.updatePosition,
  user: store.user,
  userInstances: store.userInstances,
  zoom: store.zoom,
  channels: store.channels,
});

export default connect(mapStoreToProps, null, null, { withRef: true })(RootMap);
