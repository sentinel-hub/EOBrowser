import React from 'react';
import Toggle from 'react-toggle';
import { t } from 'ttag';

import { IMAGE_FORMATS } from './utils/IMAGE_FORMATS';
import { AVAILABLE_CRS, RESOLUTION_DIVISORS } from './utils/consts';
import { isCustomPreset } from '../EOBCommon/utils/utils';

export default class AnalyticalForm extends React.PureComponent {
  CAPTIONS_TITLE = t`File will have logo attached.`;

  renderLayerCheckbox = (text, value) => {
    const { downloadLayers, updateLayer } = this.props;
    return (
      <label key={text}>
        <input
          type="checkbox"
          checked={!!downloadLayers[value]}
          onChange={e => updateLayer(value, e.target.checked)}
        />
        {text}
      </label>
    );
  };

  render() {
    const {
      imageFormat,
      isIPT,
      resolutionDivisor,
      selectedCrs,
      mPresets,
      mChannels,
      showLogo,
      renderImageSize,
      updateFormData,
      renderCRSResolution,
      onErrorMessage,
      preset,
    } = this.props;
    return (
      <div className="analyticalMode opened">
        <div className="formField">
          <label title={this.CAPTIONS_TITLE}>
            {t`Show logo`}
            <i
              className="fa fa-question-circle"
              onClick={() => {
                onErrorMessage(this.CAPTIONS_TITLE);
              }}
            />
          </label>
          <div className="form-input">
            <Toggle checked={showLogo} icons={false} onChange={() => updateFormData('showLogo', !showLogo)} />
          </div>
        </div>
        <div className="row">
          <label>{t`Image format`}:</label>
          <select
            className="dropdown"
            value={imageFormat}
            onChange={e => updateFormData('imageFormat', e.target.value)}
          >
            {IMAGE_FORMATS.filter(imf => (isIPT ? !imf.value.includes('application') : imf)).map(obj => (
              <option key={obj.text} data-ext={obj.ext} value={obj.value}>
                {obj.text}
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <label>{t`Image resolution`}:</label>
          <div>
            <select
              className="dropdown"
              value={resolutionDivisor}
              onChange={ev => updateFormData('resolutionDivisor', ev.target.value)}
            >
              {RESOLUTION_DIVISORS.map(r => (
                <option key={r.text} value={r.value}>
                  {r.text}
                </option>
              ))}
            </select>
            <small>{renderImageSize(resolutionDivisor)}</small>
          </div>
        </div>
        <div className="row">
          <label>{t`Coordinate system`}:</label>
          <div>
            <select
              className="dropdown"
              value={selectedCrs}
              onChange={ev => updateFormData('selectedCrs', ev.target.value)}
            >
              {AVAILABLE_CRS.map(obj => (
                <option key={obj.text} value={obj.value}>
                  {obj.text}
                </option>
              ))}
            </select>
            <small>{renderCRSResolution(resolutionDivisor, selectedCrs)}</small>
          </div>
        </div>
        <div className="row">
          <label>{t`Layers`}:</label>
          <div className="downloadLayers">
            <div className="column">
              <span className="layerTitle">{t`Visualized`}</span>
              {isCustomPreset(preset) ? this.renderLayerCheckbox('Custom', 'custom') : null}
              {mPresets.map(l => this.renderLayerCheckbox(l.text, l.value))}
            </div>
            <div className="column">
              <span className="layerTitle">{t`Raw`}</span>
              {mChannels.map(l => this.renderLayerCheckbox(l.text, l.value))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
