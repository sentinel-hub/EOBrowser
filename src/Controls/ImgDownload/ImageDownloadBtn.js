import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import store, { modalSlice, notificationSlice } from '../../store';
import { ModalId } from '../../Modals/Consts';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

import downloadIcon from './download-icon.svg';
import './ImgDownloadBtn.scss';

class ImageDownloadBtn extends Component {
  onOpenImageDownloadPanel = (enabled, errorMessage) => {
    if (!enabled) {
      store.dispatch(notificationSlice.actions.displayError(errorMessage));
      return;
    }
    store.dispatch(modalSlice.actions.addModal({ modal: ModalId.IMG_DOWNLOAD }));
  };

  checkIfEnabled = () => {
    const { layerId, customSelected, datasetId, selectedTabIndex } = this.props;

    const isOnVisualizationPanel = selectedTabIndex === 2;
    const hasVisualization = !!(layerId || customSelected);
    let isDatasourceSupported = false;
    if (datasetId) {
      const dsh = getDataSourceHandler(datasetId);
      isDatasourceSupported = dsh && dsh.datasource !== 'GIBS';
    }

    if (!hasVisualization) {
      return { enabled: false, errorMessage: t`please select a layer` };
    }
    if (!isOnVisualizationPanel) {
      return { enabled: false, errorMessage: t`you can only download image while visualizing` };
    }
    if (!isDatasourceSupported) {
      return { enabled: false, errorMessage: t`this datasource is not supported` };
    }
    return { enabled: true, errorMessage: null };
  };

  render() {
    const { enabled, errorMessage } = this.checkIfEnabled();
    const title = t`Download image` + ` ${errorMessage ? `(${errorMessage})` : ''}`;

    return (
      <div
        className="img-download-btn-wrapper"
        title={title}
        onClick={() => this.onOpenImageDownloadPanel(enabled, title)}
      >
        {
          <div className={`${enabled ? '' : 'disabled'}`}>
            <img alt="download-icon" src={downloadIcon} />
          </div>
        }
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
  selectedTabIndex: store.tabs.selectedTabIndex,
});

export default connect(mapStoreToProps, null)(ImageDownloadBtn);
