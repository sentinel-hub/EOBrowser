import React, { Component } from 'react';
import { connect } from 'react-redux';
import { EOBTimelapsePanelButton } from '../../junk/EOBTimelapsePanelButton/EOBTimelapsePanelButton';
import 'rodal/lib/rodal.css';

import store, { notificationSlice, timelapseSlice } from '../../store';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { TIMELAPSE_3D_MIN_EYE_HEIGHT } from '../../TerrainViewer/TerrainViewer.const';

class TimelapseButton extends Component {
  componentDidUpdate = (prevProps) => {
    if (prevProps.datasetId !== this.props.datasetId) {
      store.dispatch(timelapseSlice.actions.reset());
    }
  };

  generateSelectedResult = () => {
    const { dataSourcesInitialized, layerId, customSelected, datasetId, visualizationUrl } = this.props;
    const isVisualizationSet =
      dataSourcesInitialized && (layerId || customSelected) && datasetId && visualizationUrl;
    let selectedResult;

    if (isVisualizationSet) {
      selectedResult = { name: datasetId };
      const dsh = getDataSourceHandler(datasetId);
      if (dsh && dsh.supportsTimelapse()) {
        selectedResult.getDates = true;
        selectedResult.baseUrls = { WMS: true };
      }
    }
    return selectedResult;
  };

  render() {
    const { is3D, terrainViewerSettings, displayTimelapseAreaPreview } = this.props;
    let zoomTooLow = false;
    if (is3D && terrainViewerSettings && Object.keys(terrainViewerSettings).length > 3) {
      const { z } = terrainViewerSettings;
      zoomTooLow = z > TIMELAPSE_3D_MIN_EYE_HEIGHT;
    }
    return (
      <div className="timelapse-wrapper">
        <EOBTimelapsePanelButton
          selectedResult={this.generateSelectedResult()}
          isLoggedIn={!!this.props.user.userdata}
          selectedTabIndex={this.props.selectedTabIndex}
          is3D={this.props.is3D}
          aoi={this.props.aoi}
          onErrorMessage={(msg) => store.dispatch(notificationSlice.actions.displayError(msg))}
          zoomTooLow={zoomTooLow}
          isPlacingVertex={this.props.isPlacingVertex}
          isOpen={displayTimelapseAreaPreview}
        />
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  user: store.auth.user,
  datasetId: store.visualization.datasetId,
  layerId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  dataSourcesInitialized: store.themes.dataSourcesInitialized,
  visualizationUrl: store.visualization.visualizationUrl,
  selectedTabIndex: store.tabs.selectedTabIndex,
  is3D: store.mainMap.is3D,
  aoi: store.aoi,
  terrainViewerSettings: store.terrainViewer.settings,
  isPlacingVertex: store.aoi.isPlacingVertex,
  displayTimelapseAreaPreview: store.timelapse.displayTimelapseAreaPreview,
});

export default connect(mapStoreToProps, null)(TimelapseButton);
