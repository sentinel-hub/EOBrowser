import React from 'react';
import geo_area from '@mapbox/geojson-area';
import Store from '../../store';
import App from '../../App';
import { isCustomPreset } from '../../utils/utils';
import { getFisShadowLayer } from '../FIS';

const NOT_LOGGED_IN_ERROR_MESSAGE = 'You need to log in to use this function';

export class DrawMarker extends React.Component {
  state = {
    showOptions: false,
  };
  renderMarkerIcon = () => (
    <span
      onClick={ev => {
        if (this.props.disabled) {
          App.displayErrorMessage(NOT_LOGGED_IN_ERROR_MESSAGE);
          return;
        }
        this.props.drawMarker();
      }}
    >
      <a
        className={this.props.disabled ? 'drawGeometry disabled' : 'drawGeometry'}
        title={!this.props.disabled ? 'Draw point of interest' : NOT_LOGGED_IN_ERROR_MESSAGE}
      >
        <i className="fa fa-map-marker" />
      </a>
    </span>
  );
  renderMarkerInfo = () => (
    <span>
      <a onClick={() => this.props.centerOnFeature('poiLayer')} title="Center map on feature">
        <i className={`fa fa-crosshairs`} />
      </a>
      {this.props.poi &&
        Store.current.selectedResult && (
          <FisChartLink
            aoiOrPoi={'poi'}
            selectedResult={this.props.selectedResult}
            openFisPopup={this.props.openFisPopup}
          />
        )}
      <a onClick={this.props.deleteMarker} title={'Remove geometry'}>
        <i className={`fa fa-close`} />
      </a>
    </span>
  );
  render() {
    const { poi } = this.props;
    return (
      <div className="poiPanel floatItem" title="Area of interest">
        {poi && !this.props.disabled && this.renderMarkerInfo()}
        {this.renderMarkerIcon()}
      </div>
    );
  }
}

export class DrawArea extends React.Component {
  state = {
    showOptions: false,
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
      <OpenKmkDialogButton handleClick={this.props.openUploadKMLDialog} />
      <DrawButton geomType={'polygon'} />
    </div>
  );
  renderAioInfo = () => (
    <span className="aoiCords">
      <span className="area-text">
        {(
          parseFloat(
            geo_area.geometry(
              this.props.aoiBounds ? this.props.aoiBounds.geometry : this.props.mapGeometry.geometry,
            ),
          ) / 1000000
        ).toFixed(2)}{' '}
        km<sup>2</sup>
      </span>
      <span>
        <a onClick={() => this.props.centerOnFeature('aoiLayer')} title="Center map on feature">
          <i className={`fa fa-crosshairs`} />
        </a>
        {this.props.aoiBounds &&
          Store.current.selectedResult && (
            <FisChartLink
              selectedResult={this.props.selectedResult}
              openFisPopup={this.props.openFisPopup}
              aoiOrPoi={'aoi'}
            />
          )}
        <a onClick={this.props.resetAoi} title={this.props.isAoiClip ? 'Cancel edit.' : 'Remove geometry'}>
          <i className={`fa fa-close`} />
        </a>
      </span>
    </span>
  );
  render() {
    const { aoiBounds, isAoiClip } = this.props;
    const { showOptions } = this.state;
    const doWeHaveAOI = aoiBounds || isAoiClip;
    const showOptionsMenu = !doWeHaveAOI && showOptions;
    return (
      <div
        className="aoiPanel floatItem"
        onMouseEnter={!this.props.disabled && this.showOptions}
        onMouseLeave={!this.props.disabled && this.hideOptions}
        onClick={ev => {
          if (this.props.disabled) {
            App.displayErrorMessage(NOT_LOGGED_IN_ERROR_MESSAGE);
          }
        }}
      >
        {showOptionsMenu && this.renderOptionButtons()}
        {doWeHaveAOI && !this.props.disabled && this.renderAioInfo()}
        <a
          className={this.props.disabled ? 'drawGeometry disabled' : 'drawGeometry'}
          title={!this.props.disabled ? 'Draw area of interest' : NOT_LOGGED_IN_ERROR_MESSAGE}
        >
          <i>
            <PolygonSvgIcon />
          </i>
        </a>
      </div>
    );
  }
}

const DrawButton = ({ geomType }) => (
  <a
    onClick={geomType === 'polygon' ? () => Store.setIsClipping(true) : null}
    title="Draw area of interest for image downloads"
  >
    <i className={`fa fa-pencil`} />
  </a>
);

const OpenKmkDialogButton = ({ handleClick }) => (
  <a title="Upload KML/KMZ file" onClick={handleClick}>
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

const FisChartLink = props => {
  const isCustomLayer = isCustomPreset(props.selectedResult.preset);
  const isShadowLayerAvailable = !!getFisShadowLayer(props.selectedResult.name, props.selectedResult.preset);
  const isFisAvailableOnDatasource = props.selectedResult && props.selectedResult.baseUrls.FIS;
  if (isFisAvailableOnDatasource && (isShadowLayerAvailable || isCustomLayer)) {
    return (
      <a
        onClick={() => props.openFisPopup(props.aoiOrPoi)}
        title="Statistical Info / Feature Info Service chart"
      >
        <i className={`fa fa-bar-chart`} />
      </a>
    );
  } else {
    return (
      <a
        onClick={e => {
          e.preventDefault();
        }}
        title={`Statistical Info / Feature Info Service chart - ${
          !isFisAvailableOnDatasource
            ? 'not available for ' + props.selectedResult.name
            : `not available for ${props.selectedResult.preset} (layer with value is not set up)`
        }`}
        className="disabled"
      >
        <i className={`fa fa-bar-chart`} />
      </a>
    );
  }
};
