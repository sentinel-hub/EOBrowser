import React, { Component } from 'react';
import { t } from 'ttag';

import { EOBCCSlider } from '../../junk/EOBCommon/EOBCCSlider/EOBCCSlider';
import { getDatasetLabel } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { dateTimeDisplayFormat } from './Timelapse.utils';

export class TimelapseImages extends Component {
  render() {
    const {
      images,
      selectedPeriod,
      loadingImages,
      canWeFilterByClouds,
      canWeFilterByCoverage,
      maxCCPercentAllowed,
      minCoverageAllowed,
      isSelectAllChecked,
      activeImageIndex,
      showBorders,
    } = this.props;

    if (!images) {
      return null;
    }
    return (
      <>
        <h2>{t`Visualisations`}</h2>
        <div className="container">
          <div className="filter-tools">
            {canWeFilterByCoverage ? (
              <div className="ccslider">
                {t`Min. tile coverage`}:
                <EOBCCSlider
                  sliderWidth={100}
                  onChange={this.props.setMinCoverageAllowed}
                  cloudCoverPercentage={Math.round(minCoverageAllowed)}
                  icon={'fas fa-border-all'}
                />
              </div>
            ) : null}
          </div>

          <div className="filter-tools">
            {canWeFilterByClouds ? (
              <div className="ccslider">
                {t`Max. cloud coverage`}:
                <EOBCCSlider
                  sliderWidth={100}
                  onChange={this.props.setMaxCCPercentAllowed}
                  cloudCoverPercentage={Math.round(maxCCPercentAllowed)}
                />
              </div>
            ) : null}
          </div>

          <div className="overlays">
            <div className="checkbox">
              <label className="label">
                <input
                  type="checkbox"
                  checked={showBorders}
                  value={showBorders}
                  disabled={loadingImages}
                  onChange={this.props.toggleShowBorders}
                />
                {t`Borders`}
              </label>
            </div>
          </div>

          <div className="select-all">
            <label className="left">
              <input
                type="checkbox"
                checked={isSelectAllChecked}
                value={isSelectAllChecked}
                onChange={this.props.toggleAllImagesSelected}
              />
              {t`Select All`}
            </label>
          </div>
        </div>

        <div className="images">
          {!images ? (
            <span className="loader" />
          ) : (
            images.map((image, i) => {
              const isImageSelected = image.isSelected;
              const isImageTooCloudy =
                canWeFilterByClouds && Math.round(image.averageCloudCoverPercent) > maxCCPercentAllowed;
              const isImageTooSmallCoverage = Math.round(image.coveragePercent) < minCoverageAllowed;
              return (
                <div className="image-container" key={i}>
                  <div
                    className={`image-item ${i === activeImageIndex ? 'active' : ''} ${
                      isImageTooCloudy || isImageTooSmallCoverage || !isImageSelected ? 'not-selected' : ''
                    }`}
                  >
                    {isImageTooSmallCoverage ? <i className="fas fa-border-all" /> : null}
                    {isImageTooCloudy ? <i className="fas fa-cloud-sun" /> : null}

                    {!isImageTooCloudy && !isImageTooSmallCoverage ? (
                      <span
                        className={`image-select ${isImageSelected ? 'selected' : ''}`}
                        onClick={() => this.props.toggleImageSelected(i)}
                      />
                    ) : null}

                    <img
                      className="image"
                      src={image.url}
                      alt=""
                      onClick={() => this.props.setImageToActive(i)}
                    />
                    <i className="image-date">{dateTimeDisplayFormat(image.toTime, selectedPeriod)}</i>
                  </div>
                  {isImageSelected && !isImageTooCloudy && !isImageTooSmallCoverage ? (
                    <div className="dataset-info">
                      <span>{getDatasetLabel(image.datasetId)}</span>
                      <span className="break">{image.layer.title}</span>
                      {image.coveragePercent !== undefined ? (
                        <span>
                          {t`Coverage`}: {Math.round(image.coveragePercent)}%
                        </span>
                      ) : null}
                      {image.averageCloudCoverPercent !== undefined ? (
                        <span>
                          {t`Cloud cover`}: {Math.round(image.averageCloudCoverPercent)}%
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }
}
