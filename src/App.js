import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  setAuthToken,
  registerHostnameReplacing,
  setDefaultRequestsConfig,
} from '@sentinel-hub/sentinelhub-js';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';

import store, { notificationSlice } from './store';
import Map from './Map/Map';
import Notification from './Notification/Notification';
import Tools from './Tools/Tools';
import { Modals, propsSufficientToRender } from './Modals/Utils';
import { updatePath } from './utils/';
import { importSharedPins } from './Tools/Pins/Pin.utils';
import { MODES } from './const';
import TerrainViewerScriptProvider from './TerrainViewer/TerrainViewerScriptProvider';
import TerrainViewer from './TerrainViewer/TerrainViewer';
import Tutorial from './Tutorial/Tutorial';
import SearchBox from './SearchBox/SearchBox';
import { getZoomConfiguration } from './Tools/SearchPanel/dataSourceHandlers/helper';

import './App.scss';

const ALL_DEFAULT_THEMES = MODES.map((mode) => mode.themes).flat();

class App extends Component {
  themesFromThemesUrl = [];
  userInstances = [];
  state = {
    selectedTiles: null,
    query: null,
    highlightedTile: null,
    lastAddedPin: null,
    displayingTileGeometries: false,
    hasSwitchedFrom3D: false,
  };

  async componentDidMount() {
    const { sharedPinsListIdFromUrlParams } = this.props;
    if (sharedPinsListIdFromUrlParams) {
      if (process.env.REACT_APP_EOB_BACKEND) {
        const pins = await importSharedPins(sharedPinsListIdFromUrlParams);
        if (pins) {
          this.setLastAddedPin(pins.uniqueId);
        }
      } else {
        store.dispatch(
          notificationSlice.actions.displayError(
            'Accessing shared pins is temporarily unavailable due to updates. Please try again later.',
          ),
        );
      }
    }

    // this allows using an alternative hostname for SH services, which is useful for testing purposes:
    if (process.env.REACT_APP_REPLACE_SERVICES_HOSTNAME) {
      registerHostnameReplacing('services.sentinel-hub.com', process.env.REACT_APP_REPLACE_SERVICES_HOSTNAME);
    }

    setDefaultRequestsConfig({
      rewriteUrlFunc: (url) => {
        // performance optimization: instead of original GetCapabilities requests, use
        // the proxied ones: (gzipped)
        if (
          url.startsWith('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?') &&
          url.includes('request=GetCapabilities')
        ) {
          return 'https://eob-getcapabilities-cache-prod.s3.eu-central-1.amazonaws.com/gibs.xml';
        }
        if (
          url.startsWith('https://proba-v-mep.esa.int/applications/geo-viewer/app/geoserver/ows?') &&
          url.includes('request=GetCapabilities')
        ) {
          return 'https://eob-getcapabilities-cache-prod.s3.eu-central-1.amazonaws.com/probav.xml';
        }
        return url;
      },
    });
  }

  async componentDidUpdate(prevProps) {
    if (this.props.termsPrivacyAccepted) {
      if (this.props.handlePositions === prevProps.handlePositions) {
        updatePath(this.props);
      } else {
        updatePath(this.props, false);
      }
    }

    if (this.props.authToken && this.props.authToken !== prevProps.authToken) {
      setAuthToken(this.props.authToken);
    }

    if (prevProps.is3D && !this.props.is3D) {
      this.setState({ hasSwitchedFrom3D: true });
    }
    if (!prevProps.is3D && this.props.is3D) {
      this.setState({ hasSwitchedFrom3D: false });
    }
  }

  setQuery = (query) => {
    this.setState({
      query: query,
    });
  };

  setSelectedTiles = (selectedTiles) => {
    this.setState({
      selectedTiles: selectedTiles,
    });
  };

  setHighlightedTile = (highlightedTile) => {
    this.setState({
      highlightedTile: highlightedTile,
    });
  };

  setLastAddedPin = (lastAddedPin) => this.setState({ lastAddedPin: lastAddedPin });

  shouldDisplayTileGeometries = (shouldDisplay) => {
    this.setState({
      displayingTileGeometries: shouldDisplay,
    });
  };

  render() {
    const { modalId, authToken, googleAPI, is3D, terrainViewerId, datasetId, termsPrivacyAccepted } =
      this.props;
    const authenticated = Boolean(authToken);
    const zoomConfig = getZoomConfiguration(datasetId);
    return (
      <div id="app">
        <TerrainViewerScriptProvider>
          <TerrainViewer setLastAddedPin={this.setLastAddedPin} />
        </TerrainViewerScriptProvider>
        {!is3D && (
          <Map
            setSelectedTiles={this.setSelectedTiles}
            query={this.state.query}
            highlightedTile={this.state.highlightedTile}
            authenticated={authenticated}
            displayingTileGeometries={this.state.displayingTileGeometries}
            histogramContainer={this.histogramHolder}
            googleAPI={googleAPI}
            shouldAnimateControls={this.state.hasSwitchedFrom3D}
          />
        )}
        <Tools
          selectedTiles={this.state.selectedTiles}
          setQuery={this.setQuery}
          query={this.state.query}
          setHighlightedTile={this.setHighlightedTile}
          setLastAddedPin={this.setLastAddedPin}
          lastAddedPin={this.state.lastAddedPin}
          getThemeAndSetMode={this.getThemeAndSetMode}
          shouldDisplayTileGeometries={this.shouldDisplayTileGeometries}
        />

        {modalId &&
          propsSufficientToRender(this.props) &&
          Modals[modalId]({ setLastAddedPin: this.setLastAddedPin })}
        <Notification />
        {!is3D && !terrainViewerId && (
          <Tutorial
            popupDisabled={
              this.state.hasSwitchedFrom3D || this.props.timelapseSharePreviewMode || !termsPrivacyAccepted
            }
            selectedLanguage={this.props.selectedLanguage}
          />
        )}
        {is3D && (
          <SearchBox
            googleAPI={googleAPI}
            is3D={true}
            minZoom={zoomConfig.min}
            maxZoom={zoomConfig.max}
            zoom={this.props.zoom}
          />
        )}
        <div className="histogram-holder" ref={(e) => (this.histogramHolder = e)} />
      </div>
    );
  }
}

export const getAppropriateAuthToken = (auth, selectedThemeId) => {
  if (!selectedThemeId) {
    return null;
  }
  if (ALL_DEFAULT_THEMES.find((t) => t.id === selectedThemeId) || !auth.user.access_token) {
    return auth.anonToken;
  } else {
    return auth.user.access_token;
  }
};

export const getGetMapAuthToken = (auth) => {
  if (auth.user) {
    const now = new Date().valueOf();
    const isTokenExpired = auth.user.token_expiration < now;

    if (!isTokenExpired) {
      return auth.user.access_token;
    }
  }
  return auth.anonToken;
};

const mapStoreToProps = (store) => ({
  handlePositions: store.index.handlePositions,
  gradient: store.index.gradient,
  modalId: store.modal.id,
  currentZoom: store.mainMap.zoom,
  currentLat: store.mainMap.lat,
  currentLng: store.mainMap.lng,
  is3D: store.mainMap.is3D,
  fromTime: store.visualization.fromTime,
  toTime: store.visualization.toTime,
  datasetId: store.visualization.datasetId,
  visualizationUrl: store.visualization.visualizationUrl,
  layerId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  evalscript: store.visualization.evalscript,
  evalscripturl: store.visualization.evalscripturl,
  themesUrl: store.themes.themesUrl,
  authToken: getAppropriateAuthToken(store.auth, store.themes.selectedThemeId),
  user: store.auth.user.userdata,
  access_token: store.auth.user.access_token,
  selectedTabIndex: store.tabs.selectedTabIndex,
  selectedLanguage: store.language.selectedLanguage,
  mode: store.modes.selectedMode,
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
  demSource3D: store.visualization.demSource3D,
  backscatterCoeff: store.visualization.backscatterCoeff,
  dataFusion: store.visualization.dataFusion,
  selectedThemeId: store.themes.selectedThemeId,
  pixelBounds: store.mainMap.pixelBounds,
  terrainViewerSettings: store.terrainViewer.settings,
  timelapse: store.timelapse,
  terrainViewerId: store.terrainViewer.id,
  timelapseSharePreviewMode: store.timelapse.timelapseSharePreviewMode,
  termsPrivacyAccepted: store.auth.terms_privacy_accepted,
});

export default connect(mapStoreToProps, null)(App);
