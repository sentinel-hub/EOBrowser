import React from 'react';
import { t } from 'ttag';

import BasicForm from './BasicForm';
import withMapDOMSize from './utils/withMapDOMSize';

class PrintForm extends React.Component {
  OVERLAY_TITLE = t`The map's overlay layers (place labels, streets and political boundaries) will be added to the image.`;
  CAPTIONS_TITLE = t`Exported image(s) will include datasource and date, zoom scale and branding`;
  DESCRIPTION_TITLE = t`Add a short description to the exported image`;

  ensureHeightInchesUpdated = () => {
    const { updateFormData, imageWidthInches, imageHeightInches } = this.props;
    const newImageHeightInches = Number(this.calculateHeightFromWidth(Number(imageWidthInches)).toFixed(1));
    if (imageHeightInches !== newImageHeightInches) {
      updateFormData('imageHeightInches', newImageHeightInches);
    }
  };

  calculateHeightFromWidth = w => {
    const { mapWidth, mapHeight } = this.props;
    return Math.abs(mapHeight) * (w / Math.abs(mapWidth));
  };

  render() {
    const {
      showCaptions,
      updateFormData,
      addMapOverlays,
      showLegend,
      userDescription,
      hasLegendData,
      imageWidthInches,
      imageHeightInches,
      resolutionDpi,
      imageFormat,
      onErrorMessage,
    } = this.props;

    this.ensureHeightInchesUpdated();

    return (
      <div>
        <BasicForm
          addingMapOverlaysPossible={false}
          addMapOverlays={addMapOverlays}
          updateFormData={updateFormData}
          showCaptions={showCaptions}
          showLegend={showLegend}
          userDescription={userDescription}
          hasLegendData={hasLegendData}
          onErrorMessage={onErrorMessage}
          imageFormat={imageFormat}
        />

        <div className="formField">
          <label>{t`Image width [inches]:`}</label>
          <div className="form-input">
            <input
              className=""
              type="number"
              min={1}
              max={80}
              step={0.1}
              value={imageWidthInches}
              onChange={ev => {
                updateFormData('imageWidthInches', ev.target.value);
                this.ensureHeightInchesUpdated();
              }}
            />
          </div>
        </div>

        <div className="formField">
          <label>{t`Image height [inches]:`}</label>
          <div className="form-input">
            <input
              className=""
              type="number"
              min={1}
              max={80}
              step={0.1}
              disabled
              value={imageHeightInches}
            />
          </div>
        </div>

        <div className="formField">
          <label>{t`DPI:`}</label>
          <div className="form-input">
            <input
              className=""
              type="number"
              min={150}
              max={600}
              step={50}
              value={resolutionDpi}
              onChange={ev => updateFormData('resolutionDpi', ev.target.value)}
            />
          </div>
        </div>
      </div>
    );
  }
}

const PrintFormWithMapDomSize = withMapDOMSize(PrintForm);

export default PrintFormWithMapDomSize;
