import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  setAuthToken,
  registerHostnameReplacing,
  setDefaultRequestsConfig,
} from '@sentinel-hub/sentinelhub-js';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';
import EOBModeSelection from './junk/EOBModeSelection/EOBModeSelection';

import store, { themesSlice, visualizationSlice } from './store';
import Map from './Map/Map';
import Notification from './Notification/Notification';
import Tools from './Tools/Tools';
import { Modals } from './Modals/Consts';
import { updatePath } from './utils/';
import { importSharedPins } from './Tools/Pins/Pin.utils';
import { EDUCATION_MODE, MODES } from './const';

import './App.scss';

const ALL_DEFAULT_THEMES = MODES.map(mode => mode.themes).flat();

class App extends Component {
  themesFromThemesUrl = [];
  userInstances = [];
  state = {
    selectedTiles: null,
    query: null,
    highlightedTile: null,
    lastAddedPin: null,
    displayingTileGeometries: false,
  };

  async componentDidMount() {
    const { sharedPinsListIdFromUrlParams } = this.props;
    if (sharedPinsListIdFromUrlParams) {
      const pins = await importSharedPins(sharedPinsListIdFromUrlParams);
      if (pins) {
        this.setLastAddedPin(pins.uniqueId);
      }
    }

    // this allows using an alternative hostname for SH services, which is useful for testing purposes:
    if (process.env.REACT_APP_REPLACE_SERVICES_HOSTNAME) {
      registerHostnameReplacing('services.sentinel-hub.com', process.env.REACT_APP_REPLACE_SERVICES_HOSTNAME);
    }

    setDefaultRequestsConfig({
      rewriteUrlFunc: url => {
        // performance optimization: instead of original GetCapabilities requests, use
        // the proxied ones: (gzipped)
        if (
          url.startsWith('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?') &&
          url.includes('request=GetCapabilities')
        ) {
          return 'https://eob-getcapabilities-cache.s3.eu-central-1.amazonaws.com/gibs.xml';
        }
        if (
          url.startsWith('https://proba-v-mep.esa.int/applications/geo-viewer/app/geoserver/ows?') &&
          url.includes('request=GetCapabilities')
        ) {
          return 'https://eob-getcapabilities-cache.s3.eu-central-1.amazonaws.com/probav.xml';
        }
        return url;
      },
    });
  }

  async componentDidUpdate(prevProps) {
    updatePath(this.props);

    if (this.props.authToken && this.props.authToken !== prevProps.authToken) {
      setAuthToken(this.props.authToken);
    }
  }

  setQuery = query => {
    this.setState({
      query: query,
    });
  };

  setSelectedTiles = selectedTiles => {
    this.setState({
      selectedTiles: selectedTiles,
    });
  };

  setHighlightedTile = highlightedTile => {
    this.setState({
      highlightedTile: highlightedTile,
    });
  };

  setLastAddedPin = lastAddedPin => this.setState({ lastAddedPin: lastAddedPin });

  onSelectMode = modeId => {
    store.dispatch(visualizationSlice.actions.reset());
    store.dispatch(themesSlice.actions.setSelectedModeIdAndDefaultTheme(modeId));
  };

  shouldDisplayTileGeometries = shouldDisplay => {
    this.setState({
      displayingTileGeometries: shouldDisplay,
    });
  };

  render() {
    const { modalId, authToken, selectedModeId } = this.props;
    const authenticated = Boolean(authToken);
    return (
      <div id="app">
        <Map
          setSelectedTiles={this.setSelectedTiles}
          query={this.state.query}
          highlightedTile={this.state.highlightedTile}
          authenticated={authenticated}
          displayingTileGeometries={this.state.displayingTileGeometries}
        />
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
        {selectedModeId && (
          <EOBModeSelection
            highlighted={this.props.selectedModeId === EDUCATION_MODE.id}
            modes={MODES}
            onSelectMode={this.onSelectMode}
            selectedModeId={this.props.selectedModeId}
          />
        )}
        {Modals[modalId]}
        <Notification />
      </div>
    );
  }
}

export const getAppropriateAuthToken = (auth, selectedThemeId) => {
  if (!selectedThemeId) {
    return null;
  }
  if (ALL_DEFAULT_THEMES.find(t => t.id === selectedThemeId) || !auth.user.access_token) {
    return auth.anonToken;
  } else {
    return auth.user.access_token;
  }
};

const mapStoreToProps = store => ({
  modalId: store.modal.id,
  currentZoom: store.mainMap.zoom,
  currentLat: store.mainMap.lat,
  currentLng: store.mainMap.lng,
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
  dataFusion: store.visualization.dataFusion,
  selectedThemeId: store.themes.selectedThemeId,
  selectedModeId: store.themes.selectedModeId,
});

export default connect(mapStoreToProps, null)(App);
