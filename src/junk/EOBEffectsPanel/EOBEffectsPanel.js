import React from 'react';
import RCSlider from 'rc-slider';
import Toggle from 'react-toggle';
import { t } from 'ttag';
import 'react-toggle/style.css';

import AdvancedRgbEffects from './AdvancedRgbEffects/AdvancedRgbEffects';

import './EOBEffectsPanel.scss';
import HelpTooltip from '../../Tools/SearchPanel/dataSourceHandlers/DatasourceRenderingComponents/HelpTooltip';
import ExternalLink from '../../ExternalLink/ExternalLink';

import { defaultEffects, ORTHORECTIFICATION_OPTIONS } from '../../const';

export const findSpeckleFilterIndex = (speckleFilters, speckleFilter) =>
  speckleFilter
    ? speckleFilters.findIndex((element) =>
        Object.keys(element.params).every((key) => element.params[key] === speckleFilter[key]),
      )
    : null;

const capitalize = (text) => text.toLowerCase().charAt(0).toUpperCase() + text.toLowerCase().slice(1);

export class EOBEffectsPanel extends React.Component {
  static defaultProps = {
    effects: defaultEffects,
    isFISLayer: undefined,
    doesDatasetSupportMinQa: undefined,
    doesDatasetSupportInterpolation: undefined,

    onUpdateGainEffect: (value) => {},
    onUpdateGammaEffect: (value) => {},

    onUpdateRedRangeEffect: (value) => {},
    onUpdateGreenRangeEffect: (value) => {},
    onUpdateBlueRangeEffect: (value) => {},

    onUpdateRedCurveEffect: (value) => {},
    onUpdateGreenCurveEffect: (value) => {},
    onUpdateBlueCurveEffect: (value) => {},

    onUpdateMinQa: (value) => {},
    onResetEffects: () => {},

    updateOrthorectification: (value) => {},
  };

  constructor(props) {
    super(props);

    const { redCurveEffect: rce, greenCurveEffect: gce, blueCurveEffect: bce } = this.props.effects;
    const advancedRgbEffectsOpen = rce || gce || bce ? true : false;

    const {
      gainEffect = 1,
      gammaEffect = 1,

      redRangeEffect = [0, 1],
      greenRangeEffect = [0, 1],
      blueRangeEffect = [0, 1],

      redCurveEffect = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      },
      greenCurveEffect = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      },
      blueCurveEffect = {
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      },

      minQa = 50,
      upsampling = '',
      downsampling = '',
      speckleFilter = '',
      orthorectification = '',
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

      redCurveEffect: redCurveEffect,
      greenCurveEffect: greenCurveEffect,
      blueCurveEffect: blueCurveEffect,

      minQa: minQa,
      minQaLabels: minQa,

      upsampling: upsampling,
      downsampling: downsampling,

      speckleFilter: speckleFilter,

      orthorectification: orthorectification,

      advancedRgbEffectsOpen: advancedRgbEffectsOpen,
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

    redCurveEffect: {
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    },
    greenCurveEffect: {
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    },
    blueCurveEffect: {
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    },

    minQa: this.props.defaultMinQaValue ? this.props.defaultMinQaValue : 50,
    minQaLabels: this.props.defaultMinQaValue ? this.props.defaultMinQaValue : 50,

    upsampling: '',
    downsampling: '',

    speckleFilter: '',
    orthorectification: '',
  });

  logToLinear = (e, min, max) => {
    return ((Math.log(e) - Math.log(min)) / (Math.log(max) - Math.log(min))) * max;
  };

  calcLog = (e, min, max) => {
    const pos = e / max;
    const value = min * Math.exp(pos * Math.log(max / min));
    return value.toFixed(1);
  };

  updateGainEffectFromInput = (e) => {
    const cappedValue = Math.max(Math.min(e.target.value, 100), 0.01);
    this.setState(
      {
        gainEffect: this.logToLinear(cappedValue, 0.01, 100),
        gainEffectLabels: cappedValue,
      },
      this.props.onUpdateGainEffect(cappedValue),
    );
  };

  updateGammaEffectFromInput = (e) => {
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

  updateMinQaFromInput = (e) => {
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

  updateRedCurveEffect = (e) => {
    this.setState({ redCurveEffect: e }, this.props.onUpdateRedCurveEffect(e));
  };
  updateGreenCurveEffect = (e) => {
    this.setState({ greenCurveEffect: e }, this.props.onUpdateGreenCurveEffect(e));
  };
  updateBlueCurveEffect = (e) => {
    this.setState({ blueCurveEffect: e }, this.props.onUpdateBlueCurveEffect(e));
  };

  updateMinQa = () => {
    this.props.onUpdateMinQa(this.state.minQa);
  };

  updateUpsampling = (e) => {
    this.setState({ upsampling: e.target.value }, this.props.onUpdateUpsampling(e.target.value));
  };
  updateDownsampling = (e) => {
    this.setState({ downsampling: e.target.value }, this.props.onUpdateDownsampling(e.target.value));
  };

  updateSpeckleFilter = (e) => {
    const speckleFilter = this.props.supportedSpeckleFilters[e.target.value];

    this.setState(
      { speckleFilter: speckleFilter ? speckleFilter.params : undefined },
      this.props.onUpdateSpeckleFilter(speckleFilter ? speckleFilter.params : undefined),
    );
  };

  updateOrthorectification = (e) => {
    this.setState(
      {
        orthorectification: e.target.value,
      },
      this.props.onUpdateOrthorectification(e.target.value),
    );
  };

  changeGainEffect = (e) => {
    this.setState({
      gainEffect: e,
      gainEffectLabels: this.calcLog(e, 0.01, 100),
    });
  };
  changeGammaEffect = (e) => {
    this.setState({
      gammaEffect: e,
      gammaEffectLabels: this.calcLog(e, 0.1, 10),
    });
  };

  changeRedRangeEffect = (e) => {
    this.setState({
      redRangeEffect: e,
      redRangeEffectLabels: e,
    });
  };
  changeGreenRangeEffect = (e) => {
    this.setState({
      greenRangeEffect: e,
      greenRangeEffectLabels: e,
    });
  };
  changeBlueRangeEffect = (e) => {
    this.setState({
      blueRangeEffect: e,
      blueRangeEffectLabels: e,
    });
  };

  changeMinQa = (e) => {
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

  toggleAdvancedRgbEffectsOpened = () => {
    const {
      redRangeEffect,
      redRangeEffectLabels,
      greenRangeEffect,
      greenRangeEffectLabels,
      blueRangeEffect,
      blueRangeEffectLabels,
      redCurveEffect,
      greenCurveEffect,
      blueCurveEffect,
    } = this.getDefaultState();
    this.setState(
      (oldState) => ({
        redRangeEffect,
        redRangeEffectLabels,
        greenRangeEffect,
        greenRangeEffectLabels,
        blueRangeEffect,
        blueRangeEffectLabels,
        redCurveEffect,
        greenCurveEffect,
        blueCurveEffect,
        advancedRgbEffectsOpen: !oldState.advancedRgbEffectsOpen,
      }),
      this.props.onResetRgbEffects(),
    );
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
              onChange={(e) => this.updateRedRangeEffectFromInput('min', e)}
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
              onChange={(e) => this.updateRedRangeEffectFromInput('max', e)}
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
              onChange={(e) => this.updateGreenRangeEffectFromInput('min', e)}
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
              onChange={(e) => this.updateGreenRangeEffectFromInput('max', e)}
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
              onChange={(e) => this.updateBlueRangeEffectFromInput('min', e)}
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
              onChange={(e) => this.updateBlueRangeEffectFromInput('max', e)}
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
                {t`Layer default`}
              </option>
              {this.props.interpolations.map((i) => (
                <option className="interpolation-option" key={`upsampling-${i}`} value={i}>
                  {capitalize(i)}
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
                {t`Layer default`}
              </option>
              {this.props.interpolations.map((i) => (
                <option className="interpolation-option" key={`downsampling-${i}`} value={i}>
                  {capitalize(i)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  }

  renderSpeckleFilterSelection() {
    const { speckleFilter } = this.state;
    const speckleFilterIndex = findSpeckleFilterIndex(this.props.supportedSpeckleFilters, speckleFilter);

    return (
      <>
        <div className="effect-container effect-with-dropdown">
          <span className="effect-name">
            {t`Speckle Filter`}
            <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
              {t`Speckle filtering is only applied at zoom levels 12 and above for IW and zoom levels 8 and above for EW acquisition. Zoom levels outside this range will render without speckle filtering, even if it is set.`}
              <br />
              <br />
              <ExternalLink href="https://docs.sentinel-hub.com/api/latest/data/sentinel-1-grd/#speckle-filtering">
                {t`More information`}
              </ExternalLink>
            </HelpTooltip>
          </span>
          <div className="effect-dropdown">
            {!this.props.canApplySpeckleFilter && speckleFilterIndex > 0 && (
              <span
                className="alert"
                title={t`Speckle filtering not applied. Zoom in to apply speckle filtering.`}
              >
                !
              </span>
            )}
            <select
              className="dropdown"
              value={speckleFilterIndex !== null ? speckleFilterIndex : ''}
              onChange={this.updateSpeckleFilter}
            >
              <option className="speckle-filter-option" key="speckle-filter-default" value="">
                {t`Layer default`}
              </option>
              {this.props.supportedSpeckleFilters.map((speckleFilter, index) => (
                <option className="speckle-filter-option" key={`speckle-filter-${index}`} value={index}>
                  {capitalize(speckleFilter.label)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  }

  renderOrthorectificationSelection() {
    const { orthorectification } = this.state;

    return (
      <div className="effect-container effect-with-dropdown">
        <span className="effect-name">{t`Orthorectification`}</span>
        <div className="effect-dropdown">
          <select className="dropdown" onChange={this.updateOrthorectification} value={orthorectification}>
            <option key="default" value="">
              Layer default
            </option>
            {Object.keys(ORTHORECTIFICATION_OPTIONS).map((opt) => (
              <option key={opt} value={opt}>
                {ORTHORECTIFICATION_OPTIONS[opt]}
              </option>
            ))}
          </select>
        </div>
      </div>
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

        {(this.props.doesDatasetSupportSpeckleFilter || this.props.doesDatasetSupportOrthorectification) && (
          <>
            <div className="title">{t`Processing parameters`}</div>
            {this.props.doesDatasetSupportSpeckleFilter && this.renderSpeckleFilterSelection()}
            {this.props.doesDatasetSupportOrthorectification && this.renderOrthorectificationSelection()}
            <hr />
          </>
        )}

        {this.renderGainSlider()}
        {this.renderGammaSlider()}

        <div className="rgb-effects-chooser">
          <label>{t`Advanced RGB effects`}:</label>
          <Toggle
            checked={this.state.advancedRgbEffectsOpen}
            icons={false}
            onChange={this.toggleAdvancedRgbEffectsOpened}
          />
        </div>

        {!this.props.isFISLayer && !this.state.advancedRgbEffectsOpen && this.renderColorSliders()}

        {this.state.advancedRgbEffectsOpen && (
          <AdvancedRgbEffects
            redCurveEffect={this.state.redCurveEffect}
            greenCurveEffect={this.state.greenCurveEffect}
            blueCurveEffect={this.state.blueCurveEffect}
            updateRedCurveEffect={this.updateRedCurveEffect}
            updateGreenCurveEffect={this.updateGreenCurveEffect}
            updateBlueCurveEffect={this.updateBlueCurveEffect}
          />
        )}

        {this.props.doesDatasetSupportMinQa && this.renderMinQaSlider()}

        {this.props.doesDatasetSupportInterpolation && this.renderInterpolationSelection()}
      </div>
    );
  }
}
