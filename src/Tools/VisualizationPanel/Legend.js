import React from 'react';
import { connect } from 'react-redux';

import { getLegendDefinition } from './legendUtils';
import LegendFromSpec from './LegendFromSpec';
import LegendFromUrl from './LegendFromUrl';
import './Legend.scss';

class Legend extends React.Component {
  render() {
    const { datasetId, layerId, selectedThemeId, legendDefinitionFromLayer, legendUrl } = this.props;
    const legendDefinition = getLegendDefinition(datasetId, layerId, selectedThemeId);
    return (
      <div className="layer-legend">
        {legendDefinition ? (
          <LegendFromSpec legend={legendDefinition} />
        ) : legendDefinitionFromLayer ? (
          <LegendFromSpec legend={legendDefinitionFromLayer} />
        ) : legendUrl ? (
          <LegendFromUrl legendUrl={legendUrl} />
        ) : null}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  datasetId: store.visualization.datasetId,
  selectedThemeId: store.themes.selectedThemeId,
});

export default connect(mapStoreToProps, null)(Legend);
