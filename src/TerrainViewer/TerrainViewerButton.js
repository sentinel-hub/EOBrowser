import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import store, { modalSlice } from '../store';
import { ModalId } from '../Modals/Consts';

import './TerrainViewer.scss';

class TerrainViewerButton extends Component {
  render() {
    const { visualizationUrl, datasetId, layerId, customSelected } = this.props;
    const isDisabled = !visualizationUrl && !datasetId && !layerId && !customSelected;
    return (
      <div
        className="terrain-viewer-button"
        onClick={() =>
          !isDisabled && store.dispatch(modalSlice.actions.addModal({ modal: ModalId.TERRAIN_VIEWER }))
        }
        title={t`Visualize terrain in 3D`}
      >
        <i className={`fas fa-cube ${isDisabled ? 'disabled' : ''}`} />
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  layerId: store.visualization.layerId,
  datasetId: store.visualization.datasetId,
  visualizationUrl: store.visualization.visualizationUrl,
  customSelected: store.visualization.customSelected,
});

export default connect(mapStoreToProps, null)(TerrainViewerButton);
