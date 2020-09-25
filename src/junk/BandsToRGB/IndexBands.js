import React from 'react';
import { t } from 'ttag';

import { SelectedBand } from './SelectedBand';
import { DraggableBand } from './DraggableBand';
import { DraggableBandGhost } from './DraggableBandGhost';
import { SliderThreshold } from './SliderThreshold';
import { pickColor, spreadHandlersEvenly } from './utils';
import { parseIndexEvalscript } from '../../utils';

import './BandsToRGB.scss';

const GRADIENTS = [
  ['0x000000', '0xffffff'],
  ['0xd73027', '0x1a9850'],
  ['0xffffff', '0x005824'],
  ['0xffffff', '0xFF0000'],
];

const DEFAULT_GRADIENT = GRADIENTS[0];

const FLOAT_REGEX = /^[-]?\d{0,2}\.?\d{0,2}$/; // limited on two decimals
const ALLOWED_CHARS_REGEX = /^$|^\.$|^-$/; // if empty string or first char is dot or minus
const DEFAULT_DOMAIN = { min: 0, max: 1 };
const EQUATIONS = ['(A-B)/(A+B)', '(A/B)'];
const DEFAULT_VALUES = spreadHandlersEvenly(8, DEFAULT_DOMAIN.min, DEFAULT_DOMAIN.max);

export const IndexBands = ({ bands, layers, onChange, evalscript }) => {
  const [equation, setEquation] = React.useState(EQUATIONS[0]);
  const [gradient, setGradient] = React.useState(DEFAULT_GRADIENT);
  const [values, setValues] = React.useState(DEFAULT_VALUES); //
  const [min, setMin] = React.useState(DEFAULT_DOMAIN.min);
  const [max, setMax] = React.useState(DEFAULT_DOMAIN.max);
  const [colorRamp, setColorRamp] = React.useState(); // [ "#000000", "#242424", ... , "#ffffff" ]
  const [open, setOpen] = React.useState(false);

  const equationArray = [...equation]; // split string into array

  React.useEffect(() => {
    if (evalscript) {
      const parsed = parseIndexEvalscript(evalscript);

      if (parsed !== null) {
        initEvalFromUrl(parsed);
      }
    }
    // eslint-disable-next-line
  }, []);

  const initEvalFromUrl = parsed => {
    setValues(parsed.positions);
    setGradient([
      parsed.colors[0].replace('#', '0x'),
      parsed.colors[parsed.colors.length - 1].replace('#', '0x'),
    ]);
    setEquation(parsed.equation);
    setColorRamp(parsed.colors);
    setMin(parsed.positions[0]); // because we don't save slider min/max use first/last values from evalscript
    setMax(parsed.positions[parsed.positions.length - 1]);
    onChange(layers, { equation: parsed.equation, colorRamp: parsed.colors, values: parsed.positions });
  };

  const initColors = (values, currentGradient, min, max) => {
    return values.map(item => pickColor(currentGradient[0], currentGradient[1], item, min, max));
  };

  const onDraggableBandChange = selectedIndexBands => {
    onChange(selectedIndexBands, { equation, colorRamp, values });
  };

  const onEquationChange = selectedEquation => {
    setEquation(selectedEquation);
    onChange(layers, { equation: selectedEquation, colorRamp, values });
  };

  const onGradientChange = selectedGradient => {
    const newColors = initColors(values, selectedGradient, min, max);
    onChange(layers, { equation, colorRamp: newColors, values });
    setGradient(selectedGradient);
    setColorRamp(newColors);
    setOpen(false);
  };

  const onSliderChange = newValues => {
    const newColors = initColors(newValues, gradient, min, max);
    onChange(layers, { equation, colorRamp: newColors, values });
  };

  const onSliderUpdate = newValues => {
    const newColors = initColors(newValues, gradient, min, max);
    setColorRamp(newColors);
  };

  const removeHandle = () => {
    // remove item
    let newValues = values.filter((val, index) => index !== values.length - 1);
    // distribute slider values
    newValues = spreadHandlersEvenly(newValues.length, min, max);
    // get new color for each slider
    const newColors = initColors(newValues, gradient, min, max);
    // dispatch generateEval & fetch call
    onChange(layers, { equation, colorRamp: newColors, values: newValues });
    // save values & colors in state
    setValues(newValues);
    setColorRamp(newColors);
  };

  const addHandle = () => {
    let newValues = [...values, ''];
    newValues = spreadHandlersEvenly(newValues.length, min, max);
    const newColors = initColors(newValues, gradient, min, max);
    onChange(layers, { equation, colorRamp: newColors, values: newValues });
    setValues(newValues);
    setColorRamp(newColors);
  };

  const onMinChange = newMin => {
    const parsedMin = parseFloat(newMin);
    if (!isNaN(parsedMin) && FLOAT_REGEX.test(newMin) && parsedMin >= -10 && parsedMin <= 10) {
      setMin(newMin);
      const newValues = spreadHandlersEvenly(values.length, parsedMin, max);
      const newColors = initColors(newValues, gradient, parsedMin, max);
      onChange(layers, { equation, colorRamp: newColors, values: newValues });
      setValues(newValues);
      setColorRamp(newColors);
    } else if (ALLOWED_CHARS_REGEX.test(newMin)) {
      setMin(newMin);
    }
  };

  const onMaxChange = newMax => {
    const parsedMax = parseFloat(newMax);
    if (!isNaN(parsedMax) && FLOAT_REGEX.test(newMax) && parsedMax >= -10 && parsedMax <= 10) {
      setMax(newMax);
      const newValues = spreadHandlersEvenly(values.length, min, parsedMax);
      const newColors = initColors(newValues, gradient, min, parsedMax);
      onChange(layers, { equation, colorRamp: newColors, values: newValues });
      setValues(newValues);
      setColorRamp(newColors);
    } else if (ALLOWED_CHARS_REGEX.test(newMax)) {
      setMax(newMax);
    }
  };

  const invalidMinMax = () => {
    return Boolean(isNaN(parseFloat(min)) || isNaN(parseFloat(max)));
  };

  return (
    <React.Fragment>
      <p>{t`Drag bands into the index equation`}</p>
      <div className="colors-container">
        {bands.map((band, index) => (
          <DraggableBand key={index} band={band} value={layers} onChange={onDraggableBandChange} />
        ))}
        <DraggableBandGhost bands={bands} />
      </div>

      {/* Equation select */}
      <p>
        {t`Index `}
        <select
          key={equation}
          defaultValue={equation}
          className="dropdown index"
          onChange={e => onEquationChange(e.target.value)}
        >
          {EQUATIONS.map((equation, i) => (
            <option key={i}>{equation}</option>
          ))}
        </select>
      </p>

      {/* Colors dropzones displayed in a math equation/formula style */}
      <div className="colors-container">
        <div className="colors-output index">
          {equationArray.map((item, index) => {
            if (item === 'A' || item === 'B') {
              return <SelectedBand key={index} bands={bands} bandName={item.toLowerCase()} value={layers} />;
            }
            if (item === '/')
              return (
                <div key={index} className="divide">
                  /
                </div>
              );
            return <span key={index}>{item}</span>;
          })}
        </div>
      </div>

      {/* Threshold gradient sliders */}
      <div className="treshold">
        <div style={{ padding: '20px 0' }}>
          {t`Threshold`} <i className="fa fa-cog" onClick={() => setOpen(!open)} />
          {open && (
            <div className="gradients-list">
              {GRADIENTS.map((g, index) => (
                <div
                  key={index}
                  onClick={() => onGradientChange(GRADIENTS[index])}
                  className="gradient-option"
                  style={{
                    background: `linear-gradient(90deg, ${g.map(item => item.replace('0x', '#'))} 100%)`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="add-remove-buttons">
          <button
            className="btn primary"
            disabled={values.length === 2 || invalidMinMax()}
            onClick={removeHandle}
            title={t`Remove color picker`}
          >
            <i className="fas fa-minus-square" />
          </button>
          <button
            className="btn primary"
            disabled={values.length === 8 || invalidMinMax()}
            onClick={addHandle}
            title={t`Add color picker`}
          >
            <i className="fas fa-plus-square" />
          </button>
        </div>
        <div style={{ padding: '4px 10px' }}>
          <SliderThreshold
            colors={colorRamp}
            domain={[min, max]}
            gradient={gradient}
            onSliderUpdate={onSliderUpdate}
            onSliderChange={onSliderChange}
            values={values}
            invalidMinMax={invalidMinMax}
          />
        </div>
        <div className="scale-wrap">
          <input type="text" value={min} onChange={e => onMinChange(e.target.value)} />
          <input type="text" value={max} onChange={e => onMaxChange(e.target.value)} />
        </div>
      </div>
    </React.Fragment>
  );
};
