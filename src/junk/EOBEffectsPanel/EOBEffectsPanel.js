import React from 'react';
import RCSlider from 'rc-slider';
import { t } from 'ttag';

import './EOBEffectsPanel.scss';

export class EOBEffectsPanel extends React.Component {
  static defaultProps = {
    effects: {
      gainEffect: 1,
      gammaEffect: 1,
      redRangeEffect: [0, 1],
      greenRangeEffect: [0, 1],
      blueRangeEffect: [0, 1],
      minQa: 50,
      upsampling: '',
      downsampling: '',
    },
    isFISLayer: undefined,
    doesDatasetSupportMinQa: undefined,
    doesDatasetSupportInterpolation: undefined,
    onUpdateGainEffect: value => {},
    onUpdateGammaEffect: value => {},
    onUpdateRedRangeEffect: value => {},
    onUpdateGreenRangeEffect: value => {},
    onUpdateBlueRangeEffect: value => {},
    onUpdateMinQa: value => {},
    onResetEffects: () => {},
  };

  constructor(props) {
    super(props);

    const {
      gainEffect = 1,
      gammaEffect = 1,
      redRangeEffect = [0, 1],
      greenRangeEffect = [0, 1],
      blueRangeEffect = [0, 1],
      minQa = 50,
      upsampling = '',
      downsampling = '',
    } = this.props.effects;

    this.state = {
      gainEffect: this.logToLinear(gainEffect, 0.01, 100),
      gainEffectLabels: gainEffect,
      gammaEffect: this.logToLinear(gammaEffect, 0.1, 10),
      gammaEffectLabels: gammaEffect,

      redRangeEffect: redRangeEffect,
      redRangeEffectLabels: redRangeEffect,
      greenRangeEffect: greenRangeEffect,
      greenRangeEffectLabels: greenRangeEffect,
      blueRangeEffect: blueRangeEffect,
      blueRangeEffectLabels: blueRangeEffect,

      minQa: minQa,
      minQaLabels: minQa,

      upsampling: upsampling,
      downsampling: downsampling,
    };
  }

  getDefaultState = () => ({
    gainEffect: this.logToLinear(1, 0.01, 100),
    gainEffectLabels: 1,
    gammaEffect: this.logToLinear(1, 0.1, 10),
    gammaEffectLabels: 1,

    redRangeEffect: [0, 1],
    redRangeEffectLabels: [0, 1],
    greenRangeEffect: [0, 1],
    greenRangeEffectLabels: [0, 1],
    blueRangeEffect: [0, 1],
    blueRangeEffectLabels: [0, 1],

    minQa: this.props.defaultMinQaValue ? this.props.defaultMinQaValue : 50,
    minQaLabels: this.props.defaultMinQaValue ? this.props.defaultMinQaValue : 50,

    upsampling: '',
    downsampling: '',
  });

  logToLinear = (e, min, max) => {
    return ((Math.log(e) - Math.log(min)) / (Math.log(max) - Math.log(min))) * max;
  };

  calcLog = (e, min, max) => {
    const pos = e / max;
    const value = min * Math.exp(pos * Math.log(max / min));
    return value.toFixed(1);
  };

  updateGainEffectFromInput = e => {
    const cappedValue = Math.max(Math.min(e.target.value, 100), 0.01);
    this.setState(
      {
        gainEffect: this.logToLinear(cappedValue, 0.01, 100),
        gainEffectLabels: cappedValue,
      },
      this.props.onUpdateGainEffect(cappedValue),
    );
  };

  updateGammaEffectFromInput = e => {
    const cappedValue = Math.max(Math.min(e.target.value, 10), 0.1);
    this.setState(
      {
        gammaEffect: this.logToLinear(cappedValue, 0.1, 10),
        gammaEffectLabels: cappedValue,
      },
      this.props.onUpdateGammaEffect(cappedValue),
    );
  };

  updateRedRangeEffectFromInput = (position, event) => {
    const cappedValue = Math.max(Math.min(event.target.value, 100), 0);
    let range = [...this.state.redRangeEffectLabels];
    if (position === 'min') {
      range[0] = cappedValue <= range[1] ? cappedValue : range[1];
    } else if (position === 'max') {
      range[1] = cappedValue >= range[0] ? cappedValue : range[0];
    }
    this.setState(
      { redRangeEffect: range, redRangeEffectLabels: range },
      this.props.onUpdateRedRangeEffect(range),
    );
  };

  updateGreenRangeEffectFromInput = (position, event) => {
    const cappedValue = Math.max(Math.min(event.target.value, 100), 0);
    let range = [...this.state.greenRangeEffectLabels];
    if (position === 'min') {
      range[0] = cappedValue <= range[1] ? cappedValue : range[1];
    } else if (position === 'max') {
      range[1] = cappedValue >= range[0] ? cappedValue : range[0];
    }
    this.setState(
      { greenRangeEffect: range, greenRangeEffectLabels: range },
      this.props.onUpdateGreenRangeEffect(range),
    );
  };

  updateBlueRangeEffectFromInput = (position, event) => {
    const cappedValue = Math.max(Math.min(event.target.value, 100), 0);
    let range = [...this.state.blueRangeEffectLabels];
    if (position === 'min') {
      range[0] = cappedValue <= range[1] ? cappedValue : range[1];
    } else if (position === 'max') {
      range[1] = cappedValue >= range[0] ? cappedValue : range[0];
    }
    this.setState(
      { blueRangeEffect: range, blueRangeEffectLabels: range },
      this.props.onUpdateBlueRangeEffect(range),
    );
  };

  updateMinQaFromInput = e => {
    const cappedValue = Math.max(Math.min(e.target.value, 100), 0);
    this.setState(
      {
        minQa: cappedValue,
        minQaLabels: cappedValue,
      },
      this.props.onUpdateMinQa(cappedValue),
    );
  };

  updateGainEffect = () => {
    this.props.onUpdateGainEffect(this.state.gainEffectLabels);
  };
  updateGammaEffect = () => {
    this.props.onUpdateGammaEffect(this.state.gammaEffectLabels);
  };
  updateRedRangeEffect = () => {
    this.props.isFISLayer
      ? this.props.onUpdateRedRangeEffect(undefined)
      : this.props.onUpdateRedRangeEffect(this.state.redRangeEffectLabels);
  };
  updateGreenRangeEffect = () => {
    this.props.isFISLayer
      ? this.props.onUpdateGreenRangeEffect(undefined)
      : this.props.onUpdateGreenRangeEffect(this.state.greenRangeEffectLabels);
  };
  updateBlueRangeEffect = () => {
    this.props.isFISLayer
      ? this.props.onUpdateBlueRangeEffect(undefined)
      : this.props.onUpdateBlueRangeEffect(this.state.blueRangeEffectLabels);
  };

  updateMinQa = () => {
    this.props.onUpdateMinQa(this.state.minQa);
  };

  updateUpsampling = e => {
    this.setState({ upsampling: e.target.value }, this.props.onUpdateUpsampling(e.target.value));
  };

  updateDownsampling = e => {
    this.setState({ downsampling: e.target.value }, this.props.onUpdateDownsampling(e.target.value));
  };

  changeGainEffect = e => {
    this.setState({
      gainEffect: e,
      gainEffectLabels: this.calcLog(e, 0.01, 100),
    });
  };
  changeGammaEffect = e => {
    this.setState({
      gammaEffect: e,
      gammaEffectLabels: this.calcLog(e, 0.1, 10),
    });
  };
  changeRedRangeEffect = e => {
    this.setState({
      redRangeEffect: e,
      redRangeEffectLabels: e,
    });
  };
  changeGreenRangeEffect = e => {
    this.setState({
      greenRangeEffect: e,
      greenRangeEffectLabels: e,
    });
  };
  changeBlueRangeEffect = e => {
    this.setState({
      blueRangeEffect: e,
      blueRangeEffectLabels: e,
    });
  };

  changeMinQa = e => {
    this.setState({
      minQa: e,
      minQaLabels: e,
    });
  };

  resetAll = () => {
    this.setState({ ...this.getDefaultState() }, () => {
      this.props.onResetEffects();
    });
  };

  renderGainSlider() {
    return (
      <div className="effect-container">
        <span className="effect-name">{t`Gain`}</span>
        <div className="effect-slider">
          <RCSlider
            className="slider-no-left-value"
            min={0.01}
            max={100}
            step={0.01}
            value={this.state.gainEffect}
            onChange={this.changeGainEffect}
            onAfterChange={this.updateGainEffect}
          />

          <input
            className="slider-value-input right-value"
            type="number"
            min={0.01}
            max={100}
            step={0.01}
            value={this.state.gainEffectLabels}
            onChange={this.updateGainEffectFromInput}
          />
        </div>
      </div>
    );
  }

  renderGammaSlider() {
    return (
      <div className="effect-container">
        <span className="effect-name">{t`Gamma`}</span>
        <div className="effect-slider">
          <RCSlider
            className="slider-no-left-value"
            min={0.1}
            max={10}
            step={0.1}
            value={this.state.gammaEffect}
            onChange={this.changeGammaEffect}
            onAfterChange={this.updateGammaEffect}
          />

          <input
            className="slider-value-input right-value"
            type="number"
            min={0.1}
            max={10}
            step={0.1}
            value={this.state.gammaEffectLabels}
            onChange={this.updateGammaEffectFromInput}
          />
        </div>
      </div>
    );
  }

  renderColorSliders() {
    return (
      <>
        <div className="effect-container">
          <span className="effect-name">{t`R`}</span>
          <div className="effect-slider">
            <input
              className="slider-value-input left-value"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={this.state.redRangeEffectLabels[0]}
              onChange={e => this.updateRedRangeEffectFromInput('min', e)}
            />

            <RCSlider.Range
              min={0}
              max={1}
              step={0.01}
              value={this.state.redRangeEffect}
              onChange={this.changeRedRangeEffect}
              onAfterChange={this.updateRedRangeEffect}
              allowCross={false}
            />

            <input
              className="slider-value-input right-value"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={this.state.redRangeEffectLabels[1]}
              onChange={e => this.updateRedRangeEffectFromInput('max', e)}
            />
          </div>
        </div>

        <div className="effect-container">
          <span className="effect-name">{t`G`}</span>
          <div className="effect-slider">
            <input
              className="slider-value-input left-value"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={this.state.greenRangeEffectLabels[0]}
              onChange={e => this.updateGreenRangeEffectFromInput('min', e)}
            />

            <RCSlider.Range
              min={0}
              max={1}
              step={0.01}
              value={this.state.greenRangeEffect}
              onChange={this.changeGreenRangeEffect}
              onAfterChange={this.updateGreenRangeEffect}
              allowCross={false}
            />

            <input
              className="slider-value-input right-value"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={this.state.greenRangeEffectLabels[1]}
              onChange={e => this.updateGreenRangeEffectFromInput('max', e)}
            />
          </div>
        </div>

        <div className="effect-container">
          <span className="effect-name">{t`B`}</span>
          <div className="effect-slider">
            <input
              className="slider-value-input left-value"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={this.state.blueRangeEffectLabels[0]}
              onChange={e => this.updateBlueRangeEffectFromInput('min', e)}
            />

            <RCSlider.Range
              min={0}
              max={1}
              step={0.01}
              value={this.state.blueRangeEffect}
              onChange={this.changeBlueRangeEffect}
              onAfterChange={this.updateBlueRangeEffect}
              allowCross={false}
            />

            <input
              className="slider-value-input right-value"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={this.state.blueRangeEffectLabels[1]}
              onChange={e => this.updateBlueRangeEffectFromInput('max', e)}
            />
          </div>
        </div>
      </>
    );
  }

  renderMinQaSlider() {
    return (
      <div className="effect-container">
        <span className="effect-name">{t`Min. data quality`}</span>
        <div className="effect-slider">
          <RCSlider
            className="slider-no-left-value"
            min={0}
            max={100}
            step={1}
            value={this.state.minQa}
            onChange={this.changeMinQa}
            onAfterChange={this.updateMinQa}
          />

          <input
            className="slider-value-input right-value"
            type="number"
            min={0}
            max={100}
            step={1}
            value={this.state.minQaLabels}
            onChange={this.updateMinQaFromInput}
          />
        </div>
      </div>
    );
  }

  renderInterpolationSelection() {
    const { upsampling, downsampling } = this.state;

    return (
      <>
        <div className="effect-container effect-with-dropdown">
          <span className="effect-name">{t`Upsampling`}</span>
          <div className="effect-dropdown">
            <select className="dropdown" value={upsampling} onChange={this.updateUpsampling}>
              <option className="interpolation-option" key="upsampling-default" value="">
                Default
              </option>
              {this.props.interpolations.map(i => (
                <option className="interpolation-option" key={`upsampling-${i}`} value={i}>
                  {i.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="effect-container effect-with-dropdown">
          <span className="effect-name">{t`Downsampling`}</span>
          <div className="effect-dropdown">
            <select className="dropdown" value={downsampling} onChange={this.updateDownsampling}>
              <option className="interpolation-option" key="downsampling-default" value="">
                Default
              </option>
              {this.props.interpolations.map(i => (
                <option className="interpolation-option" key={`downsampling-${i}`} value={i}>
                  {i.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  }

  render() {
    return (
      <div className="effects-panel">
        <div className="effects-header" style={{ marginBottom: 10, textAlign: 'right' }}>
          {
            // jsx-a11y/anchor-is-valid
            // eslint-disable-next-line
            <a className="reset-effects" onClick={this.resetAll}>
              <i className="fa fa-undo" /> {t`Reset all`}
            </a>
          }
        </div>

        {this.renderGainSlider()}
        {this.renderGammaSlider()}

        {!this.props.isFISLayer && this.renderColorSliders()}

        {this.props.doesDatasetSupportMinQa && this.renderMinQaSlider()}

        {this.props.doesDatasetSupportInterpolation && this.renderInterpolationSelection()}
      </div>
    );
  }
}
