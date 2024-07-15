import React from 'react';
import { t } from 'ttag';

import { MenuItem } from '../../components/SideBarMenuItem/MenuItem';

import {
  getLoggedInErrorMsg,
  getLayerNotSelectedMsg,
  getCompareModeErrorMsg,
  getDatasourceNotSupportedMsg,
  zoomTooLow3DMsg,
  getFinishDrawingMsg,
} from '../ConstMessages';
import store, { modalSlice, timelapseSlice } from '../../store';

import '../EOBPanel.scss';
import { ModalId, TABS } from '../../const';

export class EOBTimelapsePanelButton extends React.Component {
  onButtonClick = () => {
    const { aoi } = this.props;
    if (aoi && aoi.bounds) {
      store.dispatch(modalSlice.actions.addModal({ modal: ModalId.TIMELAPSE }));
    } else if (this.props.is3D) {
      store.dispatch(modalSlice.actions.addModal({ modal: ModalId.TIMELAPSE }));
    } else {
      store.dispatch(timelapseSlice.actions.setTimelapseAreaPreview(true));
    }
  };

  render() {
    const { selectedResult, isLoggedIn, selectedTabIndex, is3D, zoomTooLow, isPlacingVertex, isOpen } =
      this.props;

    const isLayerSelected = !!selectedResult;
    const isTimelapseSupported = isLayerSelected && selectedResult.getDates && selectedResult.baseUrls.WMS;

    const errMsg = this.props.isCompareMode
      ? getCompareModeErrorMsg()
      : !isLoggedIn
      ? getLoggedInErrorMsg()
      : !isLayerSelected || selectedTabIndex !== TABS.VISUALIZE_TAB
      ? getLayerNotSelectedMsg()
      : !isTimelapseSupported
      ? getDatasourceNotSupportedMsg()
      : zoomTooLow
      ? zoomTooLow3DMsg()
      : isPlacingVertex
      ? getFinishDrawingMsg()
      : null;
    const isEnabled = errMsg === null;
    const errorMessage = errMsg ? `\n(${errMsg})` : '';
    const title = t`Create timelapse animation` + ` ${errorMessage}`;
    return (
      <div className={`timelapsePanelButton panelButton floatItem ${is3D ? 'is3d' : ''}`}>
        {isOpen && !is3D && (
          <MenuItem
            iconClassName="fa fa-close"
            title={t`Remove geometry`}
            onClick={() => {
              store.dispatch(timelapseSlice.actions.setTimelapseAreaPreview(false));
            }}
          />
        )}
        <MenuItem
          className={`drawGeometry ${isEnabled ? '' : 'disabled'}`}
          iconClassName="fa fa-film"
          title={title}
          onClick={() => {
            if (!isEnabled) {
              this.props.onErrorMessage(title);
              return;
            }
            this.onButtonClick();
          }}
        />
      </div>
    );
  }
}
