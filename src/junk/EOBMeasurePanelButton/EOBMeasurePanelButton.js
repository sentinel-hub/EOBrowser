import React from 'react';
import { t } from 'ttag';

import MeasureIcon from './MeasureIcon';
import { getLoggedInErrorMsg } from '../ConstMessages';
import '../EOBPanel.scss';
import './EOBMeasurePanelButton.scss';

export class EOBMeasurePanelButton extends React.Component {
  showMeasureInfo = () => (
    <span className="aoiCords">
      {this.props.distance && (
        <div className="measure-text">
          <PrettyDistance distance={this.props.distance} />
        </div>
      )}
      {this.props.area !== 0 && this.props.area ? (
        <div className="measure-text">
          <PrettyArea area={this.props.area} />
        </div>
      ) : null}
      <span>
        {
          // jsx-a11y/anchor-is-valid
          // eslint-disable-next-line
          <a onClick={this.props.removeMeasurement} title={t`Remove measurement`}>
            <i className={`fa fa-close`} />
          </a>
        }
      </span>
    </span>
  );

  renderMeasureIcon = () => {
    const errMsg = this.props.isLoggedIn ? null : getLoggedInErrorMsg();
    const isEnabled = errMsg === null;
    const errorMessage = errMsg ? `(${errMsg})` : '';
    const title = t`Measure distances` + ` ${errorMessage}`;
    return (
      // jsx-a11y/anchor-is-valid
      // eslint-disable-next-line
      <a
        className={`drawGeometry ${this.props.isLoggedIn ? '' : 'disabled'}`}
        onClick={ev => {
          if (!isEnabled) {
            this.props.onErrorMessage(title);
            return;
          }
          this.props.toggleMeasure();
        }}
        title={title}
      >
        <i>
          <MeasureIcon />
        </i>
      </a>
    );
  };

  render() {
    return (
      <div className="measurePanel panelButton floatItem">
        {this.props.hasMeasurement && this.showMeasureInfo()}
        {this.renderMeasureIcon()}
      </div>
    );
  }
}

const PrettyDistance = ({ distance }) => {
  const divided = distance / 1000;
  if (divided >= 1) {
    return (
      <span>
        {divided.toFixed(2)} {t`km`}
      </span>
    );
  } else {
    return (
      <span>
        {distance.toFixed()} {t`m`}
      </span>
    );
  }
};

const PrettyArea = ({ area }) => {
  const areaKM = area / 1000000;
  return (
    <span>
      {areaKM.toFixed(3)} {t`km`}
      <sup>2</sup>
    </span>
  );
};
