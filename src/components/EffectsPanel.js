import React from 'react';
import Store from '../store';
import { connect } from 'react-redux';
import 'react-toggle/style.css';
import RCSlider from 'rc-slider';
import NotificationPanel from './NotificationPanel';

const ATM_FILTERS = {
  null: 'None',
  DOS1: 'DOS1',
  ATMCOR: 'Statistical',
};
class EffectsPanel extends React.Component {
  constructor(props) {
    super(props);
    const { gain = 1, gamma = 1 } = Store.current.selectedResult;
    this.state = {
      atmFilterValues: Object.keys(ATM_FILTERS).map(key => ({
        value: key,
        text: ATM_FILTERS[key],
      })),
      gain: this.logToLinear(gain, 0.01, 100),
      gainLbl: gain,
      gamma: this.logToLinear(gamma, 0.1, 10),
      gammaLbl: gamma,
    };
  }

  getDefaultState = () => ({
    gain: this.logToLinear(1, 0.01, 100),
    gainLbl: 1,
    gamma: this.logToLinear(1, 0.1, 10),
    gammaLbl: 1,
  });

  logToLinear = (e, min, max) => {
    return (Math.log(e) - Math.log(min)) / (Math.log(max) - Math.log(min)) * max;
  };

  updateGain = () => {
    Store.setGain(this.state.gainLbl);
  };

  updateGamma = () => {
    Store.setGamma(this.state.gammaLbl);
  };

  calcLog = (e, min, max) => {
    const pos = e / max;
    const value = min * Math.exp(pos * Math.log(max / min));
    return value.toFixed(1);
  };

  changeGamma = e => {
    this.setState({
      gamma: e,
      gammaLbl: this.calcLog(e, 0.1, 10),
    });
  };

  updateAtmFilter = e => {
    Store.setAtmFilter(e.target.value);
  };

  changeGain = e => {
    this.setState({
      gain: e,
      gainLbl: this.calcLog(e, 0.01, 100),
    });
  };

  resetAll = () => {
    this.setState({ ...this.getDefaultState() }, () => {
      Store.setAtmFilter('none');
      this.updateGamma();
      this.updateGain();
    });
  };

  render() {
    const { atmFilter, datasource } = Store.current.selectedResult;
    const { atmFilterValues } = this.state;
    return (
      <div className="effectsPanel">
        <div style={{ marginBottom: 10, textAlign: 'right' }}>
          <a onClick={this.resetAll}>
            <i className="fa fa-undo" /> Reset all
          </a>
        </div>
        {datasource.includes('Sentinel-2') && (
          <label>
            <span>Atmospheric correction</span>
            <div className="gainSlider">
              <select value={atmFilter} onChange={this.updateAtmFilter}>
                {atmFilterValues.map(obj => <option value={obj.value}>{obj.text}</option>)}
              </select>
            </div>
          </label>
        )}
        <div />
        <label>
          <span>Gain</span>
          <div className="gainSlider">
            <RCSlider
              min={0.01}
              max={100}
              step={0.1}
              value={this.state.gain}
              onChange={this.changeGain}
              onAfterChange={this.updateGain}
            />
            <span>{this.state.gainLbl}</span>
          </div>
        </label>
        <label>
          <span>Gamma</span>
          <div className="gainSlider">
            <RCSlider
              min={0.1}
              max={10}
              step={0.1}
              value={this.state.gamma}
              onChange={this.changeGamma}
              onAfterChange={this.updateGamma}
            />
            <span>{this.state.gammaLbl}</span>
          </div>
        </label>
        <NotificationPanel msg="Effects are disabled for some preconfigured products" type="warning" />
      </div>
    );
  }
}
export default connect(store => store)(EffectsPanel);
