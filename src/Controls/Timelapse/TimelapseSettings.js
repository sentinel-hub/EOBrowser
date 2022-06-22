import React, { useState } from 'react';
import { t } from 'ttag';

import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import Rodal from 'rodal';
import { EXPORT_FORMAT } from '../../const';
import InputWithBouncyLimit from '../../components/InputWithBouncyLimit/InputWithBouncyLimit';
import HelpTooltip from '../../Tools/SearchPanel/dataSourceHandlers/DatasourceRenderingComponents/HelpTooltip';

export default function TimelapseSettings({
  size,
  format,
  fadeDuration,
  updateSize,
  updateFormat,
  updateFadeDuration,
  toggleDownloadPanel,
}) {
  const [localSize, setLocalSize] = useState(size);
  const [localFormat, setLocalFormat] = useState(format);
  const [localFadeDuration, setLocalFadeDuration] = useState(fadeDuration);

  function onUpdateWidth(width) {
    setLocalSize({ ...localSize, width, height: Math.round(width / size.ratio) });
  }

  function onUpdateHeight(height) {
    setLocalSize({ ...localSize, width: Math.round(height * size.ratio), height });
  }

  function onSaveButtonClick() {
    updateSize(localSize);
    updateFormat(localFormat);
    updateFadeDuration(localFadeDuration);
    toggleDownloadPanel(false);
  }

  return (
    <Rodal
      className="settings"
      visible={true}
      customStyles={{
        width: '350px',
        height: 'auto',
        bottom: 'auto',
        top: '50%',
        transform: 'translateY(-50%)',
      }}
      onClose={() => toggleDownloadPanel(false)}
    >
      <h2>{t`Settings`}</h2>
      <div>
        <div className="settings-row">
          <label className="label">{t`Width`}:</label>
          <InputWithBouncyLimit
            className="input"
            type="integer"
            min={200}
            max={2500}
            step={1}
            timeoutDuration={1000}
            value={localSize.width}
            setValue={onUpdateWidth}
          />
          <span className="unit">px</span>
        </div>
        <div className="settings-row">
          <label className="label">{t`Height`}:</label>
          <InputWithBouncyLimit
            className="input"
            type="integer"
            min={200}
            max={2500}
            step={1}
            timeoutDuration={1000}
            value={localSize.height}
            setValue={onUpdateHeight}
          />
          <span className="unit">px</span>
        </div>
        <div className="settings-row">
          <label className="label">
            {t`Fade duration`}:
            <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
              {t`Fade duration relative to frame duration`}
            </HelpTooltip>
          </label>
          <InputWithBouncyLimit
            className="input"
            type="float"
            min={0.1}
            max={1}
            step={0.01}
            timeoutDuration={1000}
            value={localFadeDuration}
            setValue={setLocalFadeDuration}
          />
          <span className="unit">[0.1-1]</span>
        </div>
        <div className="settings-row">
          <label className="label">{t`Format`}:</label>
          <select
            className="input"
            name="format"
            value={localFormat}
            onChange={(e) => setLocalFormat(e.target.value)}
          >
            <option value={EXPORT_FORMAT.gif}>{EXPORT_FORMAT.gif}</option>
            <option value={EXPORT_FORMAT.mpeg4}>{EXPORT_FORMAT.mpeg4}</option>
          </select>
        </div>
      </div>

      <div className="notes">{t`For optimisation reasons MPEG4 output format will always be used for generating a timelapse with transition "fade", even when GIF is selected.`}</div>

      <EOBButton onClick={onSaveButtonClick} text={t`Apply`} className="timelapse-download-btn" />
    </Rodal>
  );
}
