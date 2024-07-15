import React, { Component } from 'react';
import { connect } from 'react-redux';
import center from '@turf/center';
import moment from 'moment';
import { t } from 'ttag';
import { isMobile } from 'react-device-detect';

import HeaderWithLogin from './Header/Header';
import SearchPanel from './SearchPanel/SearchPanel';
import VisualizationPanel from './VisualizationPanel/VisualizationPanel';
import PinPanel from './Pins/PinPanel';
import ComparePanel from './ComparePanel/ComparePanel';
import { Tabs, Tab } from '../junk/Tabs/Tabs';
import ToolsFooter from './ToolsFooter/ToolsFooter';
import store, {
  notificationSlice,
  visualizationSlice,
  tabsSlice,
  compareLayersSlice,
  modalSlice,
} from '../store';
import { savePinsToServer, savePinsToSessionStorage, constructPinFromProps } from './Pins/Pin.utils';
import { checkIfCustom } from './SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { getNotSupportedIn3DMsg } from '../junk/ConstMessages';
import { FUNCTIONALITY_TEMPORARILY_UNAVAILABLE_MSG, FATHOM_TRACK_EVENT_LIST } from '../const';

import './Tools.scss';
import { TABS } from '../const';
import { handleFathomTrackEvent } from '../utils';

class Tools extends Component {
  constructor(props) {
    super(props);
    this.wrapperDivRef = React.createRef();
  }

  state = {
    toolsOpen: !isMobile,
    resultsAvailable: false,
    selectedPin: null,
    selectedResult: null,
    timespanExpanded: false,
    showEffects: false,
  };

  setTimeSpanExpanded = (isExpanded) => {
    this.setState({
      timespanExpanded: isExpanded,
    });
  };

  setShowEffects = (showEffects) => {
    this.setState({ showEffects: showEffects });
  };

  componentDidMount() {
    const sidebarMutation = () => {
      let clonedDiv = this.wrapperDivRef.current.cloneNode(true);
      let elementsToHide = Array.from(clonedDiv.querySelectorAll('.discover-tab, .results-panel'));
      elementsToHide.forEach((el) => {
        el.style.display = 'none';
      });

      clonedDiv.style.visibility = 'hidden';
      clonedDiv.style.position = 'absolute';
      clonedDiv.style.left = '0';
      clonedDiv.style.top = '0';

      document.body.appendChild(clonedDiv);

      // Delay measurement to ensure styles are recalculated
      setTimeout(() => {
        const clonedSize = clonedDiv.clientHeight;
        const toolBarPositionOffset = 20;
        const discoverTabPadding = 20;

        const sizeToSubtract = toolBarPositionOffset + discoverTabPadding + clonedSize;
        document.documentElement.style.cssText = `--sidebarHeight: calc(100vh - ${sizeToSubtract}px)`;

        // Clean up
        document.body.removeChild(clonedDiv);
      }, 100);
    };

    this.observer = new MutationObserver(sidebarMutation);
    this.observer.observe(this.wrapperDivRef.current, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.datasetId && this.props.datasetId) {
      this.setActiveTabIndex(2);
    }
    if (prevProps.datasetId && !this.props.datasetId) {
      this.setActiveTabIndex(0);
    }
    if (
      prevProps.selectedModeId !== this.props.selectedModeId ||
      prevProps.selectedThemeId !== this.props.selectedThemeId
    ) {
      this.resetSearch();
    }
  }

  toggleTools = () => {
    this.setState({
      toolsOpen: !this.state.toolsOpen,
    });
  };

  onSearchFinished = (query) => {
    this.setState({
      resultsAvailable: true,
      showEffects: false,
    });
    this.props.setQuery(query);
  };

  resetSearch = () => {
    this.setState({
      resultsAvailable: false,
      showEffects: false,
    });
    this.props.setQuery(null);
  };

  onResultSelected = (tile) => {
    this.setSelectedDate(tile.sensingTime);
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({
        datasetId: tile.datasetId,
        selectedTile: tile,
      }),
    );
    this.setState({
      selectedPin: null,
      selectedResult: tile,
      showEffects: false,
    });
    this.setActiveTabIndex(2);
    this.props.setHighlightedTile(null);
  };

  setSelectedDate = (date) => {
    if (date !== null) {
      const fromTime = moment(date).utc().startOf('day');
      const toTime = moment(date).utc().endOf('day');

      store.dispatch(
        visualizationSlice.actions.setVisualizationTime({
          fromTime: fromTime,
          toTime: toTime,
        }),
      );
    }
  };

  setActiveTabIndex = (index) => {
    store.dispatch(tabsSlice.actions.setTabIndex(index));

    if (index === TABS.COMPARE_TAB) {
      //Reset the counter badge
      store.dispatch(compareLayersSlice.actions.setNewCompareLayersCount(0));
    }

    if (index !== TABS.VISUALIZE_TAB) {
      store.dispatch(modalSlice.actions.removeModal());
    }
  };

  savePin = async () => {
    const {
      datasetId,
      layerId,
      visualizationUrl,
      evalscript,
      evalscripturl,
      customSelected,
      selectedThemeId,
      access_token,
      impersonatedUserId,
    } = this.props;
    if (!import.meta.env.VITE_EOB_BACKEND) {
      store.dispatch(notificationSlice.actions.displayError(FUNCTIONALITY_TEMPORARILY_UNAVAILABLE_MSG));
      return;
    }
    if (
      !(
        datasetId &&
        selectedThemeId &&
        visualizationUrl &&
        (layerId || (customSelected && (evalscript || evalscripturl)))
      )
    ) {
      return null;
    }
    let pin = await constructPinFromProps(this.props);
    if (this.props.user) {
      const { uniqueId } = await savePinsToServer([pin], false, access_token, impersonatedUserId);
      this.setLastAddedPin(uniqueId);
    } else {
      const uniqueId = savePinsToSessionStorage([pin]);
      this.setLastAddedPin(uniqueId);
    }
    this.setActiveTabIndex(3);

    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.ADD_TO_PINS_BUTTON);
  };

  saveLocalPinsOnLogin = async (pins) => {
    const { access_token, impersonatedUserId } = this.props;
    return await savePinsToServer(pins, false, access_token, impersonatedUserId);
  };

  setLastAddedPin = (id) => {
    this.props.setLastAddedPin(id);
  };

  setSelectedPin = (pin) => {
    this.setState({
      selectedPin: pin,
      selectedResult: null,
      showEffects: false,
    });
  };

  // returns an object with the correct lng, lat and zoom based on selected pin or selected search result
  // returns null when a search result or a pin are not selected
  getZoomToTileConfig = () => {
    const { selectedResult, selectedPin } = this.state;
    const isBYOC = !!checkIfCustom(this.props.datasetId);

    if (selectedResult && selectedResult.geometry) {
      const tileCenterPoint = center({
        type: 'Feature',
        geometry: selectedResult.geometry,
      });
      return {
        lng: parseFloat(tileCenterPoint.geometry.coordinates[0]),
        lat: parseFloat(tileCenterPoint.geometry.coordinates[1]),
        zoom: isBYOC ? undefined : 10, // We shouldn't have a predefined zoom for BYOC, because the areas with data can be very small. Ideally we would calculate optimal zoom from tile geometry, but that can wait for now.
      };
    }
    if (selectedPin) {
      return {
        lng: selectedPin.lng,
        lat: selectedPin.lat,
        zoom: selectedPin.zoom,
      };
    }
    return null;
  };

  render() {
    const zoomToTileConfig = this.getZoomToTileConfig();
    const { timespanExpanded, showEffects, resultsAvailable } = this.state;
    const { is3D } = this.props;

    return (
      <div ref={this.wrapperDivRef} className="tools-wrapper">
        <div
          className="open-tools"
          onClick={this.toggleTools}
          style={{ display: this.state.toolsOpen ? 'none ' : 'block' }}
        >
          <i className="fa fa-bars" />
        </div>
        <div className="tools-container" style={{ display: this.state.toolsOpen ? 'flex' : 'none' }}>
          <HeaderWithLogin toggleTools={this.toggleTools} />
          <Tabs
            activeIndex={this.props.selectedTabIndex}
            onErrorMessage={(msg) => store.dispatch(notificationSlice.actions.displayError(msg))}
            onSelect={this.setActiveTabIndex}
          >
            <Tab id="SearchTab" title={t`Discover`} icon="search" renderKey={TABS.DISCOVER_TAB}>
              <SearchPanel
                onSearchFinished={this.onSearchFinished}
                resetSearch={this.resetSearch}
                query={this.props.query}
                onResultSelected={this.onResultSelected}
                setHighlightedTile={this.props.setHighlightedTile}
                selectedTiles={this.props.selectedTiles}
                resultsAvailable={resultsAvailable}
                setTimeSpanExpanded={this.setTimeSpanExpanded}
                shouldDisplayTileGeometries={this.props.shouldDisplayTileGeometries}
                setSelectedHighlight={this.setSelectedPin}
              />
            </Tab>
            <Tab
              id="visualization-tab"
              title={t`Visualize`}
              icon="paint-brush"
              renderKey={TABS.VISUALIZE_TAB}
              enabled={!!this.props.datasetId}
            >
              <VisualizationPanel
                selectedDate={this.props.fromTime}
                setSelectedDate={this.setSelectedDate}
                onSavePin={this.savePin}
                zoomToTileConfig={zoomToTileConfig}
                timespanExpanded={timespanExpanded}
                setTimeSpanExpanded={this.setTimeSpanExpanded}
                showEffects={showEffects}
                setShowEffects={this.setShowEffects}
              />
            </Tab>
            <Tab
              id="CompareTab"
              title={t`Compare`}
              icon="exchange-alt"
              enabled={!is3D}
              errorMsg={getNotSupportedIn3DMsg()}
              renderKey={TABS.COMPARE_TAB}
              count={this.props.newCompareLayersCount}
            >
              <ComparePanel />
            </Tab>
            <Tab id="pins-tab" title={t`Pins`} icon="thumb-tack" renderKey={TABS.PINS_TAB}>
              <PinPanel
                resetSearch={this.resetSearch}
                setActiveTabIndex={this.setActiveTabIndex}
                saveLocalPinsOnLogin={this.saveLocalPinsOnLogin}
                setLastAddedPin={this.props.setLastAddedPin}
                lastAddedPin={this.props.lastAddedPin}
                setSelectedPin={this.setSelectedPin}
                setTimeSpanExpanded={this.setTimeSpanExpanded}
              />
            </Tab>
          </Tabs>
          <ToolsFooter selectedLanguage={this.props.selectedLanguage} />
        </div>
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  user: store.auth.user.userdata,
  access_token: store.auth.user.access_token,
  impersonatedUserId: store.auth.impersonatedUser.userId,
  zoom: store.mainMap.zoom,
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  fromTime: store.visualization.fromTime,
  toTime: store.visualization.toTime,
  datasetId: store.visualization.datasetId,
  visualizationUrl: store.visualization.visualizationUrl,
  layerId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  evalscript: store.visualization.evalscript,
  evalscripturl: store.visualization.evalscripturl,
  dataFusion: store.visualization.dataFusion,
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
  backscatterCoeff: store.visualization.backscatterCoeff,
  demSource3D: store.visualization.demSource3D,
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
  selectedThemeId: store.themes.selectedThemeId,
  selectedModeId: store.themes.selectedModeId,
  newCompareLayersCount: store.compare.newCompareLayersCount,
  terrainViewerSettings: store.terrainViewer.settings,
  is3D: store.mainMap.is3D,
});

export default connect(mapStoreToProps, null)(Tools);
