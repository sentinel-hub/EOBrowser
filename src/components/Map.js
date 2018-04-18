import React from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import NProgress from 'nprogress';
import { getCoordsFromBounds, roundDegrees } from '../utils/coords';
import { createMapLayer, evalSourcesMap, isCustomPreset } from '../utils/utils';
import './ext/leaflet-clip-wms-layer';
import Store from '../store';
import get from 'dlv';
import { connect } from 'react-redux';
import 'nprogress/nprogress.css';
import 'leaflet.pm';
import 'leaflet.pm/dist/leaflet.pm.css';
import gju from 'geojson-utils';
import styled from 'styled-components';
import geo_area from '@mapbox/geojson-area';
import UploadKML from './UploadKML';
import FIS, { getFisShadowLayer } from './FIS';

const Style = styled.div`
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;

  .mainMap {
    height: 100%;
    width: 100%;
  }

  .cursor-marker {
    z-index: 100000;
  }

  #uploadBtn {
    position: absolute;
    right: 10px;
    top: 60px;
    background: #333;
    padding: 13px;
    z-index: 100;
    box-shadow: 0 2px 4px #000;
  }
  .aoiPanel {
    position: absolute;
    right: 10px;
    top: 110px;
    font-size: 12px;
    background: #22232d;
    color: rgba(255, 255, 255, 0.7);
    z-index: 10;

    > * {
      display: inline-block;
      vertical-align: middle;
      font-size: 12px;
    }

    .drawGeometry {
      margin: 0 12px;
    }
    i {
      font-size: 20px;
      line-height: 42px;
    }
    a {
      color: #b6bf00;
      margin-left: 15px;
      background: none;
    }
    a.disabled {
      opacity: 0.5;
    }
  }

  #mapCoords {
    position: absolute;
    right: 240px;
    font-size: 10px;
    bottom: 0;
    background: #22232d;
    color: #eee;
    padding: 1px;
    min-width: 160px;
    text-align: center;
    z-index: 1;
  }
  .layers {
    position: absolute;
    right: 10px;
    top: 50px;
  }
`;

const COMPARE_LAYER_PANE = 'compareLayer';
const ACTIVE_LAYER_PANE = 'activeLayer';
const EDIT_LAYER_PANE = 'editingLayerPane';

const FisChartLink = (props) => {
  const { selectedResult } = Store.current;
  const isShadowLayerAvailable = !!(getFisShadowLayer(selectedResult.name, selectedResult.preset));

  const isFisAvailableOnBaseUrl = props.selectedResult && /^http(s)?:[/][/](services|test)[^.]*[.]sentinel-hub[.]com.*/.test(props.selectedResult.baseUrl);
  if ( (!isCustomPreset(props.selectedResult.preset)) && isFisAvailableOnBaseUrl && isShadowLayerAvailable) {
    return (
      <a
        onClick={props.openFisPopup}
        title="Statistical Info / Feature Info Service chart"
      >
        <i className={`fa fa-bar-chart`} />
      </a>
    );
  } else {
    return (
      <a
        onClick={(e) => { e.preventDefault(); }}
        title={`Statistical Info / Feature Info Service chart - ${
                (!isFisAvailableOnBaseUrl) ?
                  ('not available for ' + props.selectedResult.name) :
                  (
                    (!isShadowLayerAvailable) ?
                    ('shadow layer (with value) is not set up') :
                    ('not available for custom layers')
                  )
              }`}
        className="disabled"
      >
        <i className={`fa fa-bar-chart`} />
      </a>
    );
  }
};

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
      uploadDialog: false
    };

    this.editableLayers = null;
    this.mainMap = null;
    this.activeLayer = null;
    this.allResults = [];
    this.compareLayers = [];
    this.progress = null;
  }

  componentDidMount() {
    const { mapId, lat, lng, zoom } = this.props;

    this.progress = NProgress.configure({
      showSpinner: false,
      parent: `#${mapId}`
    });

    //construct baselayers object for control
    //	http://a.tile.openstreetmap.org/${z}/${x}/${y}.png
    let osm = L.tileLayer(
      'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
      {
        // http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: 'Carto © CC BY 3.0, OpenStreetMap © ODbL',
        name: 'Carto Light'
      }
    );
    var baseMaps = {
      'Carto Light': osm
    };

    this.mainMap = L.map(mapId, {
      center: [lat, lng],
      zoom: zoom,
      minZoom: 3,
      layers: [osm]
    });
    this.mainMap.createPane(COMPARE_LAYER_PANE);
    this.mainMap.createPane(ACTIVE_LAYER_PANE);
    this.mainMap.createPane(EDIT_LAYER_PANE);
    this.mainMap.getPane('markerPane').style.zIndex = 61;
    this.mainMap.getPane(EDIT_LAYER_PANE).style.zIndex = 60;
    this.mainMap.getPane('overlayPane').style.zIndex = 60;
    this.mainMap.getPane(COMPARE_LAYER_PANE).style.zIndex = 50;
    this.mainMap.getPane(ACTIVE_LAYER_PANE).style.zIndex = 40;
    this.mainMap.getPane(ACTIVE_LAYER_PANE).style.pointerEvents = 'none';
    this.mainMap.getPane(COMPARE_LAYER_PANE).style.pointerEvents = 'none';

    L.control.layers(null, baseMaps).addTo(this.mainMap);
    L.control.scale({ imperial: false }).addTo(this.mainMap);

    this.mainMap.zoomControl.setPosition('bottomright');
    this.mainMap.on(
      'moveend',
      debounce(() => {
        Store.setMapBounds(
          this.mainMap.getBounds(),
          this.mainMap.getPixelBounds()
        );
      }),
      4000
    );
    this.mainMap.on('move', () => {
      Store.setMapView({
        lat: this.mainMap.getCenter().lat,
        lng: this.mainMap.getCenter().wrap().lng,
        zoom: this.mainMap.getZoom()
      });
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
      this.updateLayers(e.layer);
      Store.setIsClipping(false);
      e.layer.pm.toggleEdit();
      e.layer.on('pm:edit', f => {
        this.updateGeometry(f.target);
      });
    });
    this.mainMap.on('pm:drawstart', f => {
      this.removeAOILayers();
    });
    this.mainMap.on('pm:remove', e => {
      this.updateLayers(e.layer, true);
    });

    this.editableLayers = L.geoJSON();
    this.editableLayers.options.pane = EDIT_LAYER_PANE;
    this.editableLayers.addTo(this.mainMap);

    this.mainMap.setView(
      [Store.current.lat, Store.current.lng],
      Store.current.zoom
    );
    Store.setMapBounds(this.mainMap.getBounds(), this.mainMap.getPixelBounds());
    this.setState({ isLoaded: true });

    this.visualizeLayer();
  }

  toggleMapEdit = () => {
    const { isAoiClip } = Store.current;
    isAoiClip
      ? this.mainMap.pm.enableDraw('Poly', {
          finishOn: 'contextmenu',
          allowSelfIntersection: true
        })
      : this.mainMap.pm.disableDraw('Poly');
  };

  removeAOILayers = () => {
    this.editableLayers.eachLayer(layer => {
      this.mainMap.removeLayer(layer);
    });
  };

  updateGeometry = () => {
    if (this.editableLayers.getLayers().length === 0) {
      Store.setAOIBounds(null);
    } else {
      Store.setAOIBounds({
        geometry: this.editableLayers.toGeoJSON().features[0].geometry,
        bounds: this.editableLayers.getBounds()
      });
    }
  };

  updateLayers = (layer, isDelete = false) => {
    if (isDelete) {
      this.editableLayers.removeLayer(layer);
    } else {
      this.editableLayers.addLayer(layer);
    }
    this.updateGeometry();
  };

  addRemoveActiveLayer(show) {
    this.activeLayer &&
      (!show
        ? this.mainMap.removeLayer(this.activeLayer)
        : this.activeLayer.addTo(this.mainMap));
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      mainTabIndex,
      isAoiClip: sIsAoiClip,
      aoiBounds: sAoiBounds,
      compareMode: sCompareMode,
      proba: sProba
    } = Store.current;
    const { proba, compareModeType, isAoiClip } = prevProps;
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
      this.updateProba();
    }
    if (get(this, 'props.action.type') === 'TOGGLE_ACTIVE_LAYER') {
      this.addRemoveActiveLayer(Store.current.isActiveLayerVisible);
    }
    if (sIsAoiClip !== isAoiClip) {
      this.toggleMapEdit();
    }
    if (
      this.props.action.type === 'SET_MAP_VIEW' &&
      this.props.updatePosition === true
    ) {
      this.updatePosition();
    }
    if (!isEqual(sProba, proba)) {
      this.updateProba();
    }
    if (sAoiBounds === null && !sIsAoiClip) {
      this.removeAOILayers();
    }
    if (sCompareMode !== prevProps.compareMode) {
      this.addPinLayers(Store.current.compareMode);
    }
    if (
      Store.current.compareMode &&
      compareModeType !== Store.current.compareModeType
    ) {
      this.compareLayers.forEach(this.resetLayerParams);
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      isEqual(this.state.location, nextProps.location) &&
      this.mainMap &&
      nextProps.location
    ) {
      this.setState({ location: nextProps.location }, () =>
        this.mainMap.panTo(nextProps.location)
      );
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
    this.mainMap.eachLayer(layer => {
      if (layer.options.clip && !Store.current.compareMode) {
        this.resetLayerParams(layer);
      }
    });
  }

  updatePosition() {
    this.mainMap.setView(
      [Store.current.lat, Store.current.lng],
      Store.current.zoom
    );
  }

  showPolygons(data) {
    this.clearPolygons();
    Object.keys(Store.current.searchResults).map(
      ds =>
        (this.allResults = [
          ...this.allResults,
          ...Store.current.searchResults[ds]
        ])
    );
    this.polyHighlight = L.geoJSON(this.allResults, {
      style: Store.current.defaultPolyStyle,
      onEachFeature: this.onEachPolygon
    });
    this.polyHighlight.addTo(this.mainMap);
    if (Store.current.searchParams.queryBounds !== undefined) {
      this.boundPoly = L.polyline(
        getCoordsFromBounds(Store.current.searchParams.queryBounds, true),
        {
          color: '#c1d82d',
          dasharray: '5,5',
          weight: 3,
          fillColor: 'none'
        }
      ).addTo(this.mainMap);
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
              coordinates: p
            },
            layer.geometry
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
      click: this.highlightFeature
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
        this.activeLayer &&
          !this.state.showClip &&
          this.mainMap.removeLayer(this.activeLayer);
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
    let { selectedResult: { lat, lng }, zoom } = Store.current;
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
      this.polyHighlight._layers[layersArray[index]].setStyle(
        Store.current.highlightPolyStyle
      );
    }
  };

  onZoomToPin(item) {
    if (item && item.map)
      this.mainMap.setView(
        L.latLng(item.map.latitude, item.map.longitude),
        item.map.zoom,
        { animation: true }
      );
  }

  updateProba() {
    let proba = Store.current.probaLayer;
    let { show } = this.props.proba;
    const { mainTabIndex } = this.props;
    if (show && mainTabIndex < 2) {
      delete proba.wmtsParams.additionalParams;
      let params = {
        time: this.props.proba.date,
        layer: this.props.proba.activeLayer
      };
      proba.setParams(params);
      if (!this.mainMap.hasLayer(proba)) {
        this.mainMap.addLayer(proba);
        proba.bringToFront();
      }
    } else {
      this.mainMap.removeLayer(proba);
    }
  }

  visualizeLayer() {
    this.addPinLayers(false);
    const { selectedResult, instances, mainTabIndex } = this.props;
    if (!selectedResult) {
      return;
    }
    if (this.activeLayer !== null) {
      this.mainMap.removeLayer(this.activeLayer);
    }
    const layerFromInstance = instances.find(
      inst => inst.name === selectedResult.datasource
    );
    if (!layerFromInstance) {
      Store.setSelectedResult(null);
      Store.setSearchResults({});
      this.clearPolygons();
      return; // selected layer was not found in user instances
    }
    let layer = createMapLayer(
      layerFromInstance,
      ACTIVE_LAYER_PANE,
      this.progress
    );
    this.activeLayer = layer;
    if (mainTabIndex === 2) {
      this.activeLayer.setParams(
        this.getUpdateParams(this.props.selectedResult)
      );
      if (!this.mainMap.hasLayer(this.activeLayer)) {
        this.activeLayer.options.pane = ACTIVE_LAYER_PANE;
        this.activeLayer.addTo(this.mainMap);
        Store.toggleActiveLayer(true);
        this.resetAllLayers();
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
        this.progress
      );

      if (layer === undefined) return;
      layer.setParams(this.getUpdateParams(item));
      if (Store.current.compareModeType === 'opacity') {
        layer.setOpacity(item.opacity[1]);
      } else {
        layer.setClip(
          L.bounds(
            [window.innerWidth * item.opacity[0], 0],
            [window.innerWidth * item.opacity[1], window.innerHeight]
          )
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
          this.progress
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
      this.compareLayers[mapIndex].setClip(
        L.bounds(
          [window.innerWidth * arr[0], 0],
          [window.innerWidth * arr[1], window.innerHeight]
        )
      );
    }
  };

  resetAoi = () => {
    Store.setAOIBounds(null);
    Store.setIsClipping(false);
  };

  getUpdateParams(item) {
    let { selectedResult, presets, compareMode, isEvalUrl } = Store.current;
    let {
      datasource,
      gain,
      gamma,
      time,
      evalscript,
      evalscripturl,
      atmFilter,
      preset,
    } =
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
    this.editableLayers.clearLayers();
    Store.setIsClipping(false);
    this.editableLayers.addData(area);
    Store.setAOIBounds({
      geometry: this.editableLayers.toGeoJSON().features[0].geometry,
      bounds: this.editableLayers.getBounds()
    });
    this.mainMap.fitBounds(this.editableLayers.getBounds());
    this.setState({ uploadDialog: false });
  };

  render() {
    const { uploadDialog, fisDialog } = this.state;
    const {
      aoiBounds,
      mainTabIndex,
      mapGeometry,
      isAoiClip,
      user,
      selectedResult,
    } = Store.current;
    return (
      <Style>
        {user && (
          <a
            id="uploadBtn"
            title="Upload KML/KMZ file"
            onClick={() => this.setState({ uploadDialog: true })}
          >
            <i className="fa fa-upload" />
          </a>
        )}
        <div className="mainMap" id={this.props.mapId} />
        {uploadDialog && (
          <UploadKML
            onUpload={this.onUpload}
            onClose={() => this.setState({ uploadDialog: false })}
          />
        )}
        <div id="aboutSentinel">
          <a
            href="https://www.sentinel-hub.com/apps/eo_browser"
            target="_blank"
            rel="noopener noreferrer"
          >
            About EO Browser
          </a>
          <a href="mailto:info@sentinel-hub.com?Subject=EO%20Browser%20Feedback">
            Contact us
          </a>
          <a
            href="https://www.sentinel-hub.com/apps/wms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get data
          </a>
        </div>
        <div id="mapCoords" />
        {mapGeometry &&
          user &&
          mainTabIndex === 2 && (
            <div>
              <div className="aoiPanel floatItem" title="Area of interest">
                {(aoiBounds || isAoiClip) && (
                  <i>
                    <svg
                      height="16px"
                      version="1.1"
                      viewBox="0 0 16 16"
                      width="16px"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs id="defs4" />
                      <g id="layer1" transform="translate(0,-1036.3622)">
                        <path
                          d="M 8,0.75 0.75,6.5 4,15.25 l 8,0 3.25,-8.75 z"
                          id="path2985"
                          fill="#fff"
                          transform="translate(0,1036.3622)"
                        />
                      </g>
                    </svg>
                  </i>
                )}
                {aoiBounds || isAoiClip ? (
                  <span className="aoiCords">
                    {(
                      parseFloat(
                        geo_area.geometry(
                          aoiBounds ? aoiBounds.geometry : mapGeometry.geometry
                        )
                      ) / 1000000
                    ).toFixed(2)}{' '}
                    km<sup>2</sup>
                    {(isAoiClip || aoiBounds) && (
                      <span>
                        {(aoiBounds) && (
                          <FisChartLink
                            selectedResult={selectedResult}
                            openFisPopup={() => this.setState({ fisDialog: true })}
                          />
                        )}
                        <a
                          onClick={this.resetAoi}
                          title={isAoiClip ? 'Cancel edit.' : 'Remove geometry'}
                        >
                          <i className={`fa fa-close`} />
                        </a>
                      </span>
                    )}
                  </span>
                ) : (
                  <a
                    className="drawGeometry"
                    onClick={() => Store.setIsClipping(true)}
                    title="Draw area of interest for image downloads"
                  >
                    <i className={`fa fa-pencil`} />
                  </a>
                )}
              </div>
              {fisDialog && (
                <FIS
                  onClose={() => this.setState({ fisDialog: false })}
                />
              )}
            </div>
          )}
      </Style>
    );
  }
}

export default connect(store => store, null, null, { withRef: true })(RootMap);
