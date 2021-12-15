import React from 'react';
import { t } from 'ttag';

import {
  getLoggedInErrorMsg,
  getLayerNotSelectedMsg,
  getCompareModeErrorMsg,
  getDatasourceNotSupportedMsg,
  getNotSupportedIn3DMsg,
} from '../ConstMessages';
import store, { timelapseSlice } from '../../store';

import '../EOBPanel.scss';

export class EOBTimelapsePanelButton extends React.Component {
  toggleAreaPreview = () => {
    store.dispatch(timelapseSlice.actions.toggleTimelapseAreaPreview());
  };

  render() {
    const isLayerSelected = !!this.props.selectedResult;
    const isTimelapseSupported =
      isLayerSelected &&
      this.props.selectedResult.getDates &&
      this.props.selectedResult.baseUrls.WMS &&
      !this.props.is3D;

    const errMsg = this.props.is3D
      ? getNotSupportedIn3DMsg()
      : this.props.isCompareMode
      ? getCompareModeErrorMsg()
      : !this.props.isLoggedIn
      ? getLoggedInErrorMsg()
      : !isLayerSelected
      ? getLayerNotSelectedMsg()
      : !isTimelapseSupported
      ? getDatasourceNotSupportedMsg()
      : null;
    const isEnabled = errMsg === null;
    const errorMessage = errMsg ? `(${errMsg})` : '';
    const title = t`Create timelapse animation` + ` ${errorMessage}`;
    return (
      <div
        className="timelapsePanelButton panelButton floatItem"
        title={title}
        onClick={(ev) => {
          if (!isEnabled) {
            this.props.onErrorMessage(title);
            return;
          }
          this.toggleAreaPreview();
        }}
      >
        {
          // jsx-a11y/anchor-is-valid
          // eslint-disable-next-line
          <a className={`drawGeometry ${isEnabled ? '' : 'disabled'}`}>
            <i className="fa fa-film" />
          </a>
        }
      </div>
    );
  }
}
