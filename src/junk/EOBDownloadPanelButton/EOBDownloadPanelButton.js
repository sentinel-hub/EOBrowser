import React from 'react';
import { t } from 'ttag';

import {
  getLayerNotSelectedMsg,
  getCompareModeErrorMsg,
  getDatasourceNotSupportedMsg,
} from '../ConstMessages';
import '../EOBPanel.scss';
import downloadIcon from './download-icon.svg';

export class EOBDownloadPanelButton extends React.Component {
  render() {
    const isLayerSelected = !!this.props.selectedResult;

    const errMsg = this.props.isCompareMode
      ? getCompareModeErrorMsg()
      : !isLayerSelected
      ? getLayerNotSelectedMsg()
      : !this.props.selectedResult.baseUrls.WMS
      ? getDatasourceNotSupportedMsg()
      : null;
    const isEnabled = errMsg === null;
    const errorMessage = errMsg ? `(${errMsg})` : '';
    const title = t`Download image` + ` ${errorMessage}`;
    return (
      <div
        className="screenshotPanelButton panelButton floatItem"
        title={title}
        onClick={ev => {
          if (!isEnabled) {
            this.props.onErrorMessage(title);
            return;
          }
          this.props.openImageDownloadPanel();
        }}
      >
        {
          // jsx-a11y/anchor-is-valid
          // eslint-disable-next-line
          <a className={`drawGeometry ${isEnabled ? '' : 'disabled'}`}>
            <img style={{ backgroundColor: 'none' }} alt="logo" src={downloadIcon} />
          </a>
        }
      </div>
    );
  }
}
