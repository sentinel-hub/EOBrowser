import React from 'react';
import geo_area from '@mapbox/geojson-area';
import { t } from 'ttag';

import { FisChartLink } from '../FisChartLink';
import { getLoggedInErrorMsg } from '../ConstMessages';
import '../EOBPanel.scss';

export class EOBAOIPanelButton extends React.Component {
  state = {
    showOptions: false,
    copyGeometryConfirmation: false,
  };

  showOptions = () => {
    if (this.hideOptionsTimeout) {
      clearTimeout(this.hideOptionsTimeout);
      this.hideOptionsTimeout = null;
    }
    this.setState({ showOptions: true });
  };

  hideOptions = () => {
    this.hideOptionsTimeout = setTimeout(() => {
      this.setState({ showOptions: false });
    }, 400);
  };

  renderOptionButtons = () => (
    <div className="aoiCords">
      <OpenUploadDataDialogButton handleClick={this.props.openUploadGeoFileDialog} />
      {
        // jsx-a11y/anchor-is-valid
        // eslint-disable-next-line
        <a onClick={this.props.onDrawPolygon} title={t`Draw area of interest for image downloads`}>
          <i className={`fa fa-pencil`} />
        </a>
      }
    </div>
  );

  copyGeometryToClipboard = () => {
    const geometry = this.props.aoiBounds.geometry ? this.props.aoiBounds.geometry : this.props.aoiBounds;
    let textField = document.createElement('textarea');
    textField.innerText = JSON.stringify(geometry);
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
    this.setState({
      copyGeometryConfirmation: true,
    });
    setTimeout(() => this.setState({ copyGeometryConfirmation: false }), 400);
  };

  renderAioInfo = () => (
    <span className="aoiCords">
      <span
        className="copy-coord"
        title={t`Copy geometry to clipboard`}
        onClick={this.copyGeometryToClipboard}
      >
        {this.state.copyGeometryConfirmation ? (
          <i className="fas fa-check-circle" />
        ) : (
          <i className="far fa-copy" />
        )}
      </span>
      <span className="area-text">
        {(
          parseFloat(
            geo_area.geometry(
              this.props.aoiBounds ? this.props.aoiBounds.geometry : this.props.mapGeometry.geometry,
            ),
          ) / 1000000
        ).toFixed(2)}{' '}
        {t`km`}
        <sup>2</sup>
      </span>
      <span>
        {
          // jsx-a11y/anchor-is-valid
          // eslint-disable-next-line
          <a onClick={() => this.props.centerOnFeature('aoiLayer')} title={t`Center map on feature`}>
            <i className={`fa fa-crosshairs`} />
          </a>
        }
        {this.props.aoiBounds &&
          this.props.aoiBounds.geometry &&
          this.props.aoiBounds.geometry.coordinates[0].length > 3 && (
            <FisChartLink
              aoiOrPoi={'aoi'}
              selectedResult={this.props.selectedResult}
              openFisPopup={this.props.openFisPopup}
              presetLayerName={this.props.presetLayerName}
              fisShadowLayer={this.props.fisShadowLayer}
              onErrorMessage={this.props.onErrorMessage}
            />
          )}
        {
          // jsx-a11y/anchor-is-valid
          // eslint-disable-next-line
          <a
            onClick={this.props.resetAoi}
            title={this.props.isAoiClip ? t`Cancel edit.` : t`Remove geometry`}
          >
            <i className={`fa fa-close`} />
          </a>
        }
      </span>
    </span>
  );

  render() {
    const { aoiBounds, isAoiClip } = this.props;
    const { showOptions } = this.state;
    const doWeHaveAOI = aoiBounds || isAoiClip;
    const showOptionsMenu = !doWeHaveAOI && showOptions;
    const errMsg = this.props.disabled ? getLoggedInErrorMsg() : null;
    const isEnabled = errMsg === null;
    const title = t`Draw area of interest` + errMsg ? errMsg : '';
    return (
      <div
        className="aoiPanel panelButton floatItem"
        onMouseEnter={!this.props.disabled ? this.showOptions : null}
        onMouseLeave={!this.props.disabled ? this.hideOptions : null}
        onClick={ev => {
          if (!isEnabled) {
            this.props.onErrorMessage(title);
          }
        }}
        title={title}
      >
        {showOptionsMenu && this.renderOptionButtons()}
        {doWeHaveAOI && !this.props.disabled && this.renderAioInfo()}
        {
          // jsx-a11y/anchor-is-valid
          // eslint-disable-next-line
          <a className={`drawGeometry ${this.props.disabled ? 'disabled' : ''}`}>
            <i>
              <PolygonSvgIcon />
            </i>
          </a>
        }
      </div>
    );
  }
}

const OpenUploadDataDialogButton = ({ handleClick }) => (
  // jsx-a11y/anchor-is-valid
  // eslint-disable-next-line
  <a title={t`Upload data`} onClick={handleClick}>
    <i className="fa fa-upload" />
  </a>
);

const PolygonSvgIcon = ({ fillColor }) => (
  <svg height="16px" version="1.1" viewBox="0 0 16 16" width="16px" xmlns="http://www.w3.org/2000/svg">
    <defs id="defs4" />
    <g id="layer1" transform="translate(0,-1036.3622)">
      <path
        d="M 8,0.75 0.75,6.5 4,15.25 l 8,0 3.25,-8.75 z"
        id="path2985"
        fill={fillColor || '#b6bf00'}
        transform="translate(0,1036.3622)"
      />
    </g>
  </svg>
);
