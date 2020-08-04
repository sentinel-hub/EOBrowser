import React from 'react';
import { connect } from 'react-redux';

import { getDataSourceHandler } from '../SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { NotificationPanel } from '../../Notification/NotificationPanel';
import { t } from 'ttag';

const ZoomInNotification = ({ datasetId, zoom }) => {
  if (!datasetId || zoom === null || zoom === undefined) {
    // if we do not know the displayed datasetId or map zoom level there is no reason to display the notification
    return null;
  }

  let zoomConfiguration;
  const dsh = getDataSourceHandler(datasetId);
  if (dsh) {
    zoomConfiguration = dsh.getLeafletZoomConfig(datasetId);
  }
  const displayNotification = zoomConfiguration && zoomConfiguration.min && zoom < zoomConfiguration.min;

  if (!displayNotification) {
    return null;
  }

  return (
    <div className="zoom-notification-footer">
      <NotificationPanel type={'info'} msg={t`Zoom in to view data`} />
    </div>
  );
};

const mapStoreToProps = store => ({
  datasetId: store.visualization.datasetId,
  zoom: store.mainMap.zoom,
});

export default connect(mapStoreToProps, null)(ZoomInNotification);
