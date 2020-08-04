import React, { Component } from 'react';
import { EOBDownloadPanelButton } from '../../junk/EOBDownloadPanelButton/EOBDownloadPanelButton';
import { connect } from 'react-redux';
import store, { modalSlice, notificationSlice } from '../../store';
import { ModalId } from '../../Modals/Consts';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import 'rodal/lib/rodal.css';

class ImgDownloadBtn extends Component {
  state = {};

  openImageDownloadPanel = async () => {
    store.dispatch(modalSlice.actions.addModal({ modal: ModalId.IMG_DOWNLOAD }));
  };

  render() {
    const enabled = this.props.layerId || this.props.customSelected;
    let datasourceSupported = false;
    if (this.props.datasetId) {
      const dsh = getDataSourceHandler(this.props.datasetId);
      datasourceSupported = dsh && dsh.datasource !== 'GIBS';
    }

    return (
      <div className="img-download-wrapper">
        <EOBDownloadPanelButton
          selectedResult={
            enabled && {
              baseUrls: {
                WMS: datasourceSupported,
              },
            }
          } //TO DO
          isCompareMode={false} //TO DO
          openImageDownloadPanel={this.openImageDownloadPanel}
          onErrorMessage={msg => store.dispatch(notificationSlice.actions.displayError(msg))}
          presets={this.state.presets}
          channels={this.state.channels}
          name={this.state.name}
        />
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  layerId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  evalscript: store.visualization.evalscript,
  visualizationUrl: store.visualization.visualizationUrl,
  datasetId: store.visualization.datasetId,
});

export default connect(mapStoreToProps, null)(ImgDownloadBtn);
