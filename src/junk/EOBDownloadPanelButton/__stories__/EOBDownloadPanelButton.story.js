import React from 'react';
import { storiesOf } from '@storybook/react';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';

import { EOBDownloadPanelButton } from '../EOBDownloadPanelButton';

const stories = storiesOf('EOB - Panel - Download', module);

stories.add('Default', ({ state, setState }) => {
  return (
    <EOBDownloadPanelButton
      selectedResult={selectedResult}
      isCompareMode={false}
      openImageDownloadPanel={() => setState({ openImageDownloadPanel: true })}
      onErrorMessage={msg => setState({ errorMsg: msg })}
    />
  );
});
stories.add('Disabled', ({ state, setState }) => {
  return (
    <EOBDownloadPanelButton
      selectedResult={undefined}
      isCompareMode={false}
      openImageDownloadPanel={() => setState({ openImageDownloadPanel: true })}
      onErrorMessage={msg => setState({ errorMsg: msg })}
    />
  );
});

const selectedResult = {
  baseUrls: {
    WMS: 'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE',
  },
};
