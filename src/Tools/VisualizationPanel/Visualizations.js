import React, { Component } from 'react';
import { connect } from 'react-redux';

import VisualizationLayer from './VisualizationLayer';

import { t } from 'ttag';

class Visualizations extends Component {
  render() {
    const visualizations = this.props.visualizations;
    return (
      <div>
        {visualizations.map((viz, i) => (
          <VisualizationLayer layer={viz} key={i} {...this.props} />
        ))}
        {!this.props.supportsCustom ? null : (
          <div>
            <div
              onClick={() => this.props.setCustomVisualization()}
              className={this.props.customSelected ? 'layer active' : 'layer'}
            >
              <i className="icon fa fa-paint-brush" />
              {t`Custom`}
              <small>{t`Create custom rendering`}</small>
            </div>
          </div>
        )}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  selectedVisualizationId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  datasetId: store.visualization.datasetId,
  selectedThemeId: store.themes.selectedThemeId,
});

export default connect(mapStoreToProps, null)(Visualizations);
