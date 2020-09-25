import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import store, { visualizationSlice } from '../../store';

import './VisualizationErrorPanel.scss';

function VisualizationErrorPanel(props) {
  const { error } = props;

  useEffect(() => {
    store.dispatch(visualizationSlice.actions.setError(null));
  }, [props.selectedMode, props.selectedTabIndex]);

  if (!error) {
    return null;
  }

  return (
    <div className="visualization-error-panel">
      <div className="visualization-error-header">
        <i className="fa fa-exclamation-circle" />
        {t`An error has occurred while fetching images:`}
      </div>
      <div className="textarea-wrapper">
        <pre className="error-container">{error}</pre>
      </div>
    </div>
  );
}

const mapStoreToProps = store => ({
  error: store.visualization.error,
  selectedMode: store.modes.selectedMode,
  selectedTabIndex: store.tabs.selectedTabIndex,
});

export default connect(mapStoreToProps, null)(VisualizationErrorPanel);
