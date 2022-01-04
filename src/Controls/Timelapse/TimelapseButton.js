import React, { Component } from 'react';
import { connect } from 'react-redux';
import { EOBTimelapsePanelButton } from '../../junk/EOBTimelapsePanelButton/EOBTimelapsePanelButton';
import 'rodal/lib/rodal.css';

import store, { notificationSlice, timelapseSlice } from '../../store';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

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
    return (
      <div className="timelapse-wrapper">
        <EOBTimelapsePanelButton
          selectedResult={this.generateSelectedResult()}
          isLoggedIn={!!this.props.user.userdata}
          selectedTabIndex={this.props.selectedTabIndex}
          is3D={this.props.is3D}
          onErrorMessage={(msg) => store.dispatch(notificationSlice.actions.displayError(msg))}
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
});

export default connect(mapStoreToProps, null)(TimelapseButton);
