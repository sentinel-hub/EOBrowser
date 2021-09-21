import React, { Component } from 'react';
import { connect } from 'react-redux';
import center from '@turf/center';
import moment from 'moment';
import { t } from 'ttag';

import HeaderWithLogin from './Header/Header';
import SearchPanel from './SearchPanel/SearchPanel';
import VisualizationPanel from './VisualizationPanel/VisualizationPanel';
import PinPanel from './Pins/PinPanel';
import ComparePanel from './ComparePanel/ComparePanel';
import { Tabs, Tab } from '../junk/Tabs/Tabs';
import ToolsFooter from './ToolsFooter/ToolsFooter';
import store, { notificationSlice, visualizationSlice, tabsSlice, compareLayersSlice } from '../store';
import { savePinsToServer, savePinsToSessionStorage, constructPinFromProps } from './Pins/Pin.utils';
import { checkIfCustom } from './SearchPanel/dataSourceHandlers/dataSourceHandlers';

import './Tools.scss';

class Tools extends Component {
  state = {
    toolsOpen: true,
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
    const fromTime = moment(date).utc().startOf('day');
    const toTime = moment(date).utc().endOf('day');

    store.dispatch(
      visualizationSlice.actions.setVisualizationTime({
        fromTime: fromTime,
        toTime: toTime,
      }),
    );
  };

  setActiveTabIndex = (index) => {
    store.dispatch(tabsSlice.actions.setTabIndex(index));

    if (index === 4) {
      //Reset the counter badge
      store.dispatch(compareLayersSlice.actions.setNewCompareLayersCount(0));
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
    } = this.props;
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
    let pin = constructPinFromProps(this.props);
    if (this.props.user) {
      const { uniqueId } = await savePinsToServer([pin]);
      this.setLastAddedPin(uniqueId);
    } else {
      const uniqueId = savePinsToSessionStorage([pin]);
      this.setLastAddedPin(uniqueId);
    }
    this.setActiveTabIndex(3);
  };

  saveLocalPinsOnLogin = async (pins) => {
    return await savePinsToServer(pins);
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

    return (
      <div className="tools-wrapper">
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
            <Tab id="SearchTab" title={t`Discover`} icon="search" renderKey={0}>
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
              renderKey={2}
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
              renderKey={4}
              count={this.props.newCompareLayersCount}
            >
              <ComparePanel />
            </Tab>
            <Tab id="pins-tab" title={t`Pins`} icon="thumb-tack" renderKey={3}>
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
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
  selectedThemeId: store.themes.selectedThemeId,
  selectedModeId: store.themes.selectedModeId,
  newCompareLayersCount: store.compare.newCompareLayersCount,
});

export default connect(mapStoreToProps, null)(Tools);
