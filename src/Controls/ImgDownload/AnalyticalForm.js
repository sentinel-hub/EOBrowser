import React from 'react';
import Toggle from 'react-toggle';
import { t } from 'ttag';
import { CheckboxGroup, Checkbox } from 'react-checkbox-group';

import { AVAILABLE_CRS, RESOLUTION_DIVISORS, IMAGE_FORMATS, IMAGE_FORMATS_INFO } from './consts';
import ExternalLink from '../../ExternalLink/ExternalLink';

export default class AnalyticalForm extends React.PureComponent {
  CAPTIONS_TITLE = t`File will have logo attached.`;
  DATAMASK_TITLE = t`A dataMask-band will be included in the downloaded raw bands as second band.`;

  componentDidUpdate(prevProps) {
    if (prevProps.imageFormat !== this.props.imageFormat) {
      const JPGandPNG = [IMAGE_FORMATS.JPG, IMAGE_FORMATS.PNG];
      if (JPGandPNG.includes(prevProps.imageFormat) && !JPGandPNG.includes(this.props.imageFormat)) {
        if (this.props.showLogo) {
          // Logo can only be applied to PNG and JPG
          this.props.updateFormData('showLogo', false);
        }
        this.props.updateFormData('addDataMask', false);
      } else if (!JPGandPNG.includes(prevProps.imageFormat) && JPGandPNG.includes(this.props.imageFormat)) {
        this.props.updateFormData('addDataMask', true);
      }
    }
  }

  render() {
    const {
      imageFormat,
      resolutionDivisor,
      selectedCrs,
      allLayers,
      allBands,
      showLogo,
      renderImageSize,
      updateFormData,
      renderCRSResolution,
      onErrorMessage,
      isCurrentLayerCustom,
      customSelected,
      selectedLayers,
      selectedBands,
      updateSelectedLayers,
      updateSelectedBands,
      supportedImageFormats,
      addDataMask,
    } = this.props;

    const isJPGorPNG = imageFormat === IMAGE_FORMATS.JPG || imageFormat === IMAGE_FORMATS.PNG;

    return (
      <div className="analytical-mode">
        {isJPGorPNG && (
          <div className="form-field">
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
              <Toggle
                checked={showLogo}
                icons={false}
                onChange={() => updateFormData('showLogo', !showLogo)}
              />
            </div>
          </div>
        )}
        <div className="row">
          <label>{t`Image format`}:</label>
          <select
            className="dropdown"
            value={imageFormat}
            onChange={e => updateFormData('imageFormat', e.target.value)}
          >
            {supportedImageFormats.map(format => (
              <option key={IMAGE_FORMATS_INFO[format].text} value={format}>
                {IMAGE_FORMATS_INFO[format].text}
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
                <option key={obj.text} value={obj.id}>
                  {obj.text}
                </option>
              ))}
            </select>
            <small>{renderCRSResolution(resolutionDivisor, selectedCrs)}</small>
          </div>
        </div>
        {selectedBands.length > 0 && !isJPGorPNG && (
          <div className="form-field">
            <label title={this.DATAMASK_TITLE}>
              {t`Add dataMask band`}
              <ExternalLink href="https://docs.sentinel-hub.com/api/latest/user-guides/datamask/">
                <i className="fa fa-question-circle" />
              </ExternalLink>
            </label>
            <div className="form-input">
              <Toggle
                checked={addDataMask}
                icons={false}
                onChange={() => updateFormData('addDataMask', !addDataMask)}
              />
            </div>
          </div>
        )}
        <div className="row">
          <label>{t`Layers`}:</label>
          <div className="download-layers">
            <div className="column">
              <span className="layer-title">{t`Visualized`}</span>
              {isCurrentLayerCustom ? (
                <label>
                  <input
                    type="checkbox"
                    checked={customSelected}
                    onChange={e => updateFormData('customSelected', e.target.checked)}
                  />
                  Custom
                </label>
              ) : null}
              <CheckboxGroup name="layers" value={selectedLayers} onChange={updateSelectedLayers}>
                {allLayers.map(l => (
                  <label key={l.layerId}>
                    <Checkbox value={l.layerId} /> {l.title}
                  </label>
                ))}
              </CheckboxGroup>
            </div>
            <div className="column">
              <span className="layer-title">{t`Raw`}</span>
              <CheckboxGroup value={selectedBands} onChange={updateSelectedBands}>
                {allBands.map(l => (
                  <label key={l.name}>
                    <Checkbox value={l.name} /> {l.name}
                  </label>
                ))}
              </CheckboxGroup>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
