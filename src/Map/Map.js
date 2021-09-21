import React from 'react';
import {
  Map as LeafletMap,
  Pane,
  LayersControl,
  GeoJSON,
  Rectangle,
  Marker,
  FeatureGroup,
} from 'react-leaflet';
import inside from 'turf-inside';
import { connect } from 'react-redux';
import NProgress from 'nprogress';
import ReactLeafletGoogleLayer from './plugins/ReactLeafletGoogleLayer';
import 'nprogress/nprogress.css';

import store, { commercialDataSlice, mainMapSlice, visualizationSlice } from '../store';
import 'leaflet/dist/leaflet.css';
import './Map.scss';
import L from 'leaflet';
import moment from 'moment';
import { AOI_SHAPE, SEARCH_PANEL_TABS } from '../const';
import Controls from '../Controls/Controls';
import SearchBox from '../SearchBox/SearchBox';
import Tutorial from '../Tutorial/Tutorial';
import PreviewLayer from '../Tools/Results/PreviewLayer';
import LeafletControls from './LeafletControls/LeafletControls';
import AboutSHLinks from './AboutSHLinks/AboutSHLinks';
import SentinelHubLayerComponent from './plugins/sentinelhubLeafletLayer';
import GlTileLayer from './plugins/GlTileLayer';
import { baseLayers, overlayTileLayers, LAYER_ACCESS } from './Layers';
import {
  getDatasetLabel,
  getDataSourceHandler,
} from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { getAppropriateAuthToken, getGetMapAuthToken } from '../App';
import { constructErrorMessage, validateEvalScript } from '../utils';
import TimelapseAreaPreview from '../Controls/Timelapse/TimelapseAreaPreview';

import { DEFAULT_ZOOM_CONFIGURATION } from '../Tools/SearchPanel/dataSourceHandlers/DataSourceHandler';
import { checkUserAccount } from '../Tools/CommercialDataPanel/commercialData.utils';
import MaptilerLogo from './maptiler-logo-adaptive.svg';
import { SpeckleFilterType } from '@sentinel-hub/sentinelhub-js';

const BASE_PANE_ID = 'baseMapPane';
const BASE_PANE_ZINDEX = 5;
const SENTINELHUB_LAYER_PANE_ID = 'sentinelhubPane';
const SENTINELHUB_LAYER_PANE_ZINDEX = 6;
const highlightedTileStyle = {
  weight: 2,
  color: '#57de71',
  opacity: 1,
  fillColor: '#57de71',
  fillOpacity: 0.3,
};
const DEFAULT_COMPARED_LAYERS_MAX_ZOOM = 25;
const DEFAULT_COMPARED_LAYERS_OVERZOOM = 0;

const { BaseLayer, Overlay } = LayersControl;
class Map extends React.Component {
  mapRef = undefined;
  progress = NProgress.configure({
    showSpinner: false,
    parent: `#map`,
  });
  state = {
    accountInfo: {
      payingAccount: false,
      quotasEnabled: false,
    },
  };

  async componentDidMount() {
    const accountInfo = await checkUserAccount(this.props.auth.user);
    this.setState({ accountInfo: accountInfo });
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.auth !== this.props.auth) {
      const accountInfo = await checkUserAccount(this.props.auth.user);
      this.setState({ accountInfo: accountInfo });
    }
  }

  updateViewport = (viewport) => {
    viewport.center = Object.values(L.latLng(...viewport.center).wrap());
    store.dispatch(mainMapSlice.actions.setViewport(viewport));
  };

  setBounds = (ev) => {
    store.dispatch(
      mainMapSlice.actions.setBounds({
        bounds: ev.target.getBounds(),
        pixelBounds: ev.target.getPixelBounds(),
      }),
    );
  };

  onPreviewClick = (e) => {
    const clickedPoint = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [e.latlng.lng, e.latlng.lat],
      },
    };
    const selectedTiles = this.props.query.allResults.filter((tile) => inside(clickedPoint, tile));
    this.props.setSelectedTiles(selectedTiles);
  };

  getZoomConfiguration = (datasetId) => {
    try {
      const dataSourceHandler = getDataSourceHandler(datasetId);
      const zoomConfiguration = dataSourceHandler.getLeafletZoomConfig(datasetId);
      return zoomConfiguration ? zoomConfiguration : DEFAULT_ZOOM_CONFIGURATION;
    } catch (e) {
      // this catches a race condition where datasetId is not defined when rendering the component
      return DEFAULT_ZOOM_CONFIGURATION;
    }
  };

  onTileError = async (error) => {
    let message = await constructErrorMessage(error);

    if (message.split('\n').length <= 1 && !validateEvalScript(this.props.evalscript)) {
      message += '\nEvalscript V3 needs to include `setup()` and `evaluatePixel()` functions.';
    }
    store.dispatch(visualizationSlice.actions.setError(message));
  };

  onTileLoad = () => {
    const { error } = this.props;
    if (error) {
      store.dispatch(visualizationSlice.actions.setError(null));
    }
  };

  render() {
    const {
      lat,
      lng,
      zoom,
      mapBounds,
      datasetId,
      enabledOverlaysId,
      visibleOnMap,
      visualizationLayerId,
      visualizationUrl,
      authenticated,
      fromTime,
      toTime,
      customSelected,
      evalscript,
      evalscripturl,
      dataFusion,
      dataSourcesInitialized,
      selectedTabIndex,
      selectedTabSearchPanelIndex,
      displayingTileGeometries,
      comparedLayers,
      comparedOpacity,
      comparedClipping,
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      redCurveEffect,
      greenCurveEffect,
      blueCurveEffect,
      minQa,
      upsampling,
      downsampling,
      speckleFilter,
      orthorectification,
      selectedLanguage,
      auth,
      displayTimelapseAreaPreview,
      googleAPI,
    } = this.props;

    const zoomConfig = this.getZoomConfiguration(datasetId);

    const shownBaseLayers =
      this.state.accountInfo.payingAccount && googleAPI
        ? baseLayers
        : baseLayers.filter((baseLayer) => baseLayer.access === LAYER_ACCESS.PUBLIC);

    let speckleFilterProp = speckleFilter;
    const dsh = getDataSourceHandler(datasetId);
    if (dsh && !dsh.canApplySpeckleFilter(datasetId, this.props.zoom)) {
      speckleFilterProp = { type: SpeckleFilterType.NONE };
    }

    return (
      <LeafletMap
        ref={(el) => (this.mapRef = el)}
        minZoom={0}
        onViewportChanged={this.updateViewport}
        center={[this.props.lat, this.props.lng]}
        zoom={this.props.zoom}
        onMoveEnd={this.setBounds}
        whenReady={this.setBounds}
        zoomControl={false}
        attributionControl={false}
        scaleControl={false}
        fadeAnimation={false}
        tap={false}
        id="map"
        onOverlayAdd={(ev) => {
          store.dispatch(mainMapSlice.actions.addOverlay(ev.layer.options.overlayTileLayerId));
          if (ev.layer.options.pane === SENTINELHUB_LAYER_PANE_ID) {
            store.dispatch(visualizationSlice.actions.setVisibleOnMap(true));
          }
        }}
        onOverlayRemove={(ev) => {
          store.dispatch(mainMapSlice.actions.removeOverlay(ev.layer.options.overlayTileLayerId));
          if (ev.layer.options.pane === SENTINELHUB_LAYER_PANE_ID) {
            store.dispatch(visualizationSlice.actions.setVisibleOnMap(false));
          }
        }}
      >
        <Pane name={BASE_PANE_ID} style={{ zIndex: BASE_PANE_ZINDEX }} />

        <LayersControl
          key={shownBaseLayers.length} // force rerender of layers-control to reset the selected layer if google maps was selected and user logs out.
          position="topright"
          sortLayers={true}
          sortFunction={(a, b) => {
            if (!this.mapRef) {
              return;
            }
            return (
              this.mapRef.leafletElement.getPane(a.options.pane).style.zIndex -
              this.mapRef.leafletElement.getPane(b.options.pane).style.zIndex
            );
          }}
        >
          {shownBaseLayers.map((baseLayer) => (
            <BaseLayer checked={baseLayer.checked} name={baseLayer.name} key={baseLayer.name}>
              {baseLayer.urlType === 'VECTOR' ? (
                <GlTileLayer
                  style={baseLayer.url}
                  attribution={baseLayer.attribution}
                  pane={BASE_PANE_ID}
                  preserveDrawingBuffer={baseLayer.preserveDrawingBuffer}
                />
              ) : baseLayer.urlType === 'GOOGLE_MAPS' ? (
                <ReactLeafletGoogleLayer
                  apiKey={process.env.REACT_APP_GOOGLE_MAP_KEY}
                  type={'satellite'}
                  pane={BASE_PANE_ID}
                />
              ) : null}
              )
            </BaseLayer>
          ))}

          <Pane name={SENTINELHUB_LAYER_PANE_ID} style={{ zIndex: SENTINELHUB_LAYER_PANE_ZINDEX }} />
          {authenticated &&
            dataSourcesInitialized &&
            selectedTabIndex === 2 &&
            (visualizationLayerId || customSelected) &&
            datasetId &&
            visualizationUrl && (
              <Overlay name={`${getDatasetLabel(datasetId)}`} checked={visibleOnMap}>
                <SentinelHubLayerComponent
                  datasetId={datasetId}
                  url={visualizationUrl}
                  layers={visualizationLayerId}
                  format="PNG"
                  fromTime={fromTime ? fromTime.toDate() : null}
                  toTime={toTime.toDate()}
                  customSelected={customSelected}
                  evalscript={evalscript}
                  evalscripturl={evalscripturl}
                  dataFusion={dataFusion}
                  pane={SENTINELHUB_LAYER_PANE_ID}
                  progress={this.progress}
                  minZoom={zoomConfig.min}
                  maxZoom={zoomConfig.max}
                  allowOverZoomBy={zoomConfig.allowOverZoomBy}
                  gainEffect={gainEffect}
                  gammaEffect={gammaEffect}
                  redRangeEffect={redRangeEffect}
                  greenRangeEffect={greenRangeEffect}
                  blueRangeEffect={blueRangeEffect}
                  redCurveEffect={redCurveEffect}
                  greenCurveEffect={greenCurveEffect}
                  blueCurveEffect={blueCurveEffect}
                  minQa={minQa}
                  upsampling={upsampling}
                  downsampling={downsampling}
                  speckleFilter={speckleFilterProp}
                  orthorectification={orthorectification}
                  getMapAuthToken={getGetMapAuthToken(auth)}
                  onTileImageError={this.onTileError}
                  onTileImageLoad={this.onTileLoad}
                />
              </Overlay>
            )}

          {comparedLayers.length &&
            selectedTabIndex === 4 &&
            comparedLayers
              .slice()
              .reverse()
              .map((p, i) => {
                const {
                  fromTime,
                  toTime,
                  datasetId,
                  evalscript,
                  evalscripturl,
                  dataFusion,
                  visualizationUrl,
                  layerId,
                  gainEffect,
                  gammaEffect,
                  redRangeEffect,
                  greenRangeEffect,
                  blueRangeEffect,
                  redCurveEffect,
                  greenCurveEffect,
                  blueCurveEffect,
                  minQa,
                  upsampling,
                  downsampling,
                  speckleFilterProp,
                  orthorectification,
                  themeId,
                } = p;
                const dsh = getDataSourceHandler(datasetId);
                const supportsTimeRange = dsh ? dsh.supportsTimeRange() : true; //We can only check if a datasetId is BYOC when the datasource handler for it is instantiated (thus, we are on the user instance which includes that BYOC collection), so we set default to `true` to cover other cases.
                let {
                  min: minZoom,
                  max: maxZoom = DEFAULT_COMPARED_LAYERS_MAX_ZOOM,
                  allowOverZoomBy = DEFAULT_COMPARED_LAYERS_OVERZOOM,
                } = this.getZoomConfiguration(datasetId);

                let pinTimeFrom, pinTimeTo;
                if (supportsTimeRange) {
                  if (fromTime) {
                    pinTimeFrom = moment.utc(fromTime).toDate();
                    pinTimeTo = moment.utc(toTime).toDate();
                  } else {
                    pinTimeFrom = moment.utc(toTime).startOf('day').toDate();
                    pinTimeTo = moment.utc(toTime).endOf('day').toDate();
                  }
                } else {
                  pinTimeTo = moment.utc(toTime).endOf('day').toDate();
                }
                const index = comparedLayers.length - 1 - i;
                return (
                  <SentinelHubLayerComponent
                    key={i}
                    datasetId={datasetId}
                    url={evalscript || evalscripturl ? null : visualizationUrl}
                    layers={layerId}
                    format="PNG"
                    fromTime={pinTimeFrom}
                    toTime={pinTimeTo}
                    customSelected={!!(evalscript || evalscripturl)}
                    evalscript={evalscript}
                    evalscripturl={evalscripturl}
                    dataFusion={dataFusion}
                    minZoom={minZoom}
                    maxZoom={maxZoom}
                    allowOverZoomBy={allowOverZoomBy}
                    opacity={comparedOpacity[index]}
                    clipping={comparedClipping[index]}
                    gainEffect={gainEffect}
                    gammaEffect={gammaEffect}
                    redRangeEffect={redRangeEffect}
                    greenRangeEffect={greenRangeEffect}
                    blueRangeEffect={blueRangeEffect}
                    redCurveEffect={redCurveEffect}
                    greenCurveEffect={greenCurveEffect}
                    blueCurveEffect={blueCurveEffect}
                    minQa={minQa}
                    upsampling={upsampling}
                    downsampling={downsampling}
                    speckleFilter={speckleFilterProp}
                    orthorectification={orthorectification}
                    pane={SENTINELHUB_LAYER_PANE_ID}
                    progress={this.progress}
                    accessToken={getAppropriateAuthToken(auth, themeId)}
                    getMapAuthToken={getGetMapAuthToken(auth)}
                    onTileImageError={this.onTileError}
                    onTileImageLoad={this.onTileLoad}
                  />
                );
              })}

          {overlayTileLayers().map((overlayTileLayer) => (
            <Overlay
              name={overlayTileLayer.name}
              key={`${overlayTileLayer.id}-${this.props.selectedLanguage}`}
              checked={enabledOverlaysId.includes(overlayTileLayer.id)}
            >
              <Pane name={overlayTileLayer.pane} style={{ zIndex: overlayTileLayer.zIndex }}>
                <GlTileLayer
                  style={overlayTileLayer.url}
                  attribution={overlayTileLayer.attribution}
                  overlayTileLayerId={overlayTileLayer.id}
                  pane={overlayTileLayer.pane}
                  preserveDrawingBuffer={overlayTileLayer.preserveDrawingBuffer}
                />
              </Pane>
            </Overlay>
          ))}
        </LayersControl>

        {(this.props.aoiShape === AOI_SHAPE.polygon || !this.props.aoiShape) && this.props.aoiGeometry && (
          <GeoJSON id="aoi-layer" data={this.props.aoiGeometry} key={this.props.aoiLastEdited} />
        )}
        {this.props.aoiShape === AOI_SHAPE.rectangle && this.props.aoiBounds && (
          <Rectangle id="aoi-layer" bounds={this.props.aoiBounds} key={this.props.aoiLastEdited} />
        )}
        {!this.props.poiPosition ? null : <Marker id="poi-layer" position={this.props.poiPosition} />}

        {this.props.query && selectedTabIndex === 0 && displayingTileGeometries ? (
          <FeatureGroup onClick={this.onPreviewClick}>
            {this.props.query.allResults.map((tile, i) => (
              <PreviewLayer tile={tile} key={`preview-layer-${this.props.query.queryId}-${i}`} />
            ))}
          </FeatureGroup>
        ) : null}

        {this.props.highlightedTile ? (
          <GeoJSON data={this.props.highlightedTile.geometry} style={() => highlightedTileStyle} />
        ) : null}
        {displayTimelapseAreaPreview && selectedTabIndex === 2 && (
          <TimelapseAreaPreview lat={lat} lng={lng} zoom={zoom} mapBounds={mapBounds} />
        )}

        {this.props.commercialDataDisplaySearchResults &&
          !!this.props.commercialDataHighlightedResult &&
          selectedTabIndex === 0 && (
            <GeoJSON
              id="commercialDataResult"
              data={this.props.commercialDataHighlightedResult.geometry}
              key={this.props.commercialDataHighlightedResult.id}
              style={() => highlightedTileStyle}
            />
          )}

        {this.props.commercialDataDisplaySearchResults &&
        selectedTabIndex === 0 &&
        this.props.commercialDataSearchResults &&
        this.props.commercialDataSearchResults.length > 0 ? (
          <FeatureGroup
            onClick={(e) => {
              store.dispatch(
                commercialDataSlice.actions.setLocation({ lat: e.latlng.lat, lng: e.latlng.lng }),
              );
            }}
          >
            {this.props.commercialDataSearchResults.map((result, i) => (
              <PreviewLayer tile={result} key={`preview-layer-${i}`} />
            ))}
          </FeatureGroup>
        ) : null}

        {!!this.props.commercialDataSelectedOrder &&
          !!this.props.commercialDataSelectedOrder.input &&
          !!this.props.commercialDataSelectedOrder.input.bounds &&
          !!this.props.commercialDataSelectedOrder.input.bounds.geometry &&
          selectedTabIndex === 0 &&
          selectedTabSearchPanelIndex === SEARCH_PANEL_TABS.COMMERCIAL_DATA_TAB && (
            <GeoJSON
              id="commercialDataSelectedOrder"
              data={this.props.commercialDataSelectedOrder.input.bounds.geometry}
              key={this.props.commercialDataSelectedOrder.id}
              style={() => ({
                weight: 2,
                color: 'green',
                opacity: 1,
                fillColor: 'green',
                fillOpacity: 0.3,
              })}
            />
          )}

        <LeafletControls key={selectedLanguage} />
        <SearchBox googleAPI={googleAPI} />
        <Tutorial selectedLanguage={this.props.selectedLanguage} />
        <Controls
          selectedLanguage={this.props.selectedLanguage}
          histogramContainer={this.props.histogramContainer}
        />

        <AboutSHLinks />
        <a href="https://www.maptiler.com/" target="_blank" rel="noopener noreferrer">
          <img className="maptiler-logo" src={MaptilerLogo} alt="" />
        </a>
      </LeafletMap>
    );
  }
}

const mapStoreToProps = (store) => {
  return {
    lat: store.mainMap.lat,
    lng: store.mainMap.lng,
    zoom: store.mainMap.zoom,
    mapBounds: store.mainMap.bounds,
    enabledOverlaysId: store.mainMap.enabledOverlaysId,
    aoiGeometry: store.aoi.geometry,
    aoiShape: store.aoi.shape,
    aoiBounds: store.aoi.bounds,
    aoiLastEdited: store.aoi.lastEdited,
    displayTimelapseAreaPreview: store.timelapse.displayTimelapseAreaPreview,
    poiPosition: store.poi.position,
    poiLastEdited: store.poi.lastEdited,
    datasetId: store.visualization.datasetId,
    visibleOnMap: store.visualization.visibleOnMap,
    visualizationLayerId: store.visualization.layerId,
    visualizationUrl: store.visualization.visualizationUrl,
    fromTime: store.visualization.fromTime,
    toTime: store.visualization.toTime,
    customSelected: store.visualization.customSelected,
    evalscript: store.visualization.evalscript,
    evalscripturl: store.visualization.evalscripturl,
    dataFusion: store.visualization.dataFusion,
    dataSourcesInitialized: store.themes.dataSourcesInitialized,
    selectedTabIndex: store.tabs.selectedTabIndex,
    selectedLanguage: store.language.selectedLanguage,
    gainEffect: store.visualization.gainEffect,
    gammaEffect: store.visualization.gammaEffect,
    redRangeEffect: store.visualization.redRangeEffect,
    greenRangeEffect: store.visualization.greenRangeEffect,
    blueRangeEffect: store.visualization.blueRangeEffect,
    redCurveEffect: store.visualization.redCurveEffect,
    greenCurveEffect: store.visualization.greenCurveEffect,
    blueCurveEffect: store.visualization.blueCurveEffect,
    minQa: store.visualization.minQa,
    upsampling: store.visualization.upsampling,
    downsampling: store.visualization.downsampling,
    speckleFilter: store.visualization.speckleFilter,
    orthorectification: store.visualization.orthorectification,
    error: store.visualization.error,
    comparedLayers: store.compare.comparedLayers,
    comparedOpacity: store.compare.comparedOpacity,
    comparedClipping: store.compare.comparedClipping,
    auth: store.auth,
    commercialDataSearchResults: store.commercialData.searchResults,
    commercialDataHighlightedResult: store.commercialData.highlightedResult,
    commercialDataDisplaySearchResults: store.commercialData.displaySearchResults,
    commercialDataSelectedOrder: store.commercialData.selectedOrder,
    selectedTabSearchPanelIndex: store.tabs.selectedTabSearchPanelIndex,
  };
};

export default connect(mapStoreToProps, null)(Map);
