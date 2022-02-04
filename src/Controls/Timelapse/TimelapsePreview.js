import React, { Component } from 'react';
import { t } from 'ttag';
import RCSlider from 'rc-slider';
import { isMobile } from 'react-device-detect';
import { CSSTransitionGroup } from 'react-transition-group';

import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { generateS3PreSignedPost, getS3FileUrl, isImageApplicable, uploadFileToS3 } from './Timelapse.utils';
import SocialShare from '../../components/SocialShare/SocialShare';
import FileSaver from 'file-saver';
import { TRANSITION } from '../../const';
import TimelapseSettings from './TimelapseSettings';

export class TimelapsePreview extends Component {
  state = {
    displaySocialShareOptions: false,
    displayDownloadPanel: false,
    previewFileUrlPassThrough: null,
  };

  toggleSocialSharePanel = async () => {
    const displaySocialShareOptions = !this.state.displaySocialShareOptions;

    if (displaySocialShareOptions) {
      this.setState({
        previewFileUrlPassThrough: this.props.previewFileUrl
          ? this.props.previewFileUrl
          : await this.generatePreviewFile(),
      });
    }

    this.setState({ displaySocialShareOptions });
  };

  toggleDownloadPanel = (displayDownloadPanel) => {
    this.setState({
      displayDownloadPanel: !!displayDownloadPanel ?? !this.state.displayDownloadPanel,
    });
  };

  downloadTimelapse = async () => {
    this.toggleDownloadPanel(false);

    if (this.props.previewFileUrl) {
      const link = document.createElement('a');
      link.href = this.props.previewFileUrl;
      link.click();
    } else {
      const file = await this.props.generateTimelapse().catch(() => {});
      if (file) {
        FileSaver.saveAs(file, file.name);
      } else {
        alert(t`Could not generate timelapse animation file. Try using lower resolution or fewer frames.`);
      }
    }
  };

  generatePreviewFile = async () => {
    const file = await this.props.generateTimelapse().catch(() => {});
    if (!file) {
      alert(t`Could not generate timelapse animation file. Try using lower resolution or fewer frames.`);
      return null;
    }

    this.props.updateUploadingTimelapseProgress(true);
    const preSignedPost = await generateS3PreSignedPost(this.props.access_token, file.name);

    if (preSignedPost && file) {
      await uploadFileToS3(preSignedPost, file);
      this.props.updateUploadingTimelapseProgress(false);
      return getS3FileUrl(preSignedPost);
    }

    this.props.updateUploadingTimelapseProgress(false);
  };

  shouldDisplayPreviewFile = () => {
    return this.props.shouldDisplayPreviewFile && this.props.shouldDisplayPreviewFile();
  };

  onUpdateWidth = (event) => {
    const width = parseInt(event.target.value, 10);
    if (width) {
      this.heightInput.value = Math.round(width / this.props.size.ratio);
    }
  };

  onUpdateHeight = (event) => {
    const height = parseInt(event.target.value, 10);
    if (height) {
      this.widthInput.value = Math.round(height * this.props.size.ratio);
    }
  };

  onSaveButtonClick = () => {
    const width = parseInt(this.widthInput.value, 10);
    const height = parseInt(this.heightInput.value, 10);

    if (width && height) {
      this.props.updateSize({ width, height });

      if (width !== this.props.size.width || height !== this.props.size.height) {
        this.props.searchDatesAndFetchImages();
      }
    }

    this.props.updateFormat(this.formatInput.value);
    this.toggleDownloadPanel(false);
  };

  render() {
    const {
      images,
      activeImageIndex,
      previewFileUrl,
      isPreviewPlaying,
      timelapseFPS,
      transition,
      canWeFilterByClouds,
      canWeFilterByCoverage,
      maxCCPercentAllowed,
      minCoverageAllowed,
      generatingTimelapse,
      generatingTimelapseProgress,
      loadingImages,
      size,
      format,
    } = this.props;

    const { previewFileUrlPassThrough, displayDownloadPanel } = this.state;

    let image, applicableImageIndexes, applicableImageActiveIndex;

    if (this.shouldDisplayPreviewFile()) {
      image = { url: previewFileUrl };
    } else {
      if (!images) {
        return null;
      }

      image = activeImageIndex !== null ? images[activeImageIndex] : null;

      applicableImageIndexes = images.reduce((acc, image, index) => {
        if (
          isImageApplicable(
            image,
            canWeFilterByClouds,
            canWeFilterByCoverage,
            maxCCPercentAllowed,
            minCoverageAllowed,
          )
        ) {
          acc.push(index);
        }
        return acc;
      }, []);

      applicableImageActiveIndex = applicableImageIndexes.findIndex((i) => i === activeImageIndex);
    }

    if (!image) {
      return null;
    }

    const isVideoElement = image.url && image.url.endsWith('mp4');

    return (
      <div className="preview-panel">
        {generatingTimelapse && (
          <div className="progress">
            <div className="bar" style={{ width: `${generatingTimelapseProgress * 100}%` }} />
          </div>
        )}

        <div className="preview">
          {isVideoElement ? (
            <video className="preview-video" src={image.url} autoPlay loop muted />
          ) : isPreviewPlaying && transition !== TRANSITION.none ? (
            <CSSTransitionGroup
              className="transition-group"
              transitionName="example"
              transitionEnterTimeout={500 / timelapseFPS}
              transitionLeaveTimeout={500 / timelapseFPS}
            >
              <img
                key={image.url}
                className="preview-image-transition"
                src={image.url}
                alt=""
                style={{ transitionDuration: 500 / timelapseFPS + 'ms' }}
              />
            </CSSTransitionGroup>
          ) : (
            <img className="preview-image" src={image.url} alt="" />
          )}
        </div>

        <SocialShare
          extraParams={{
            timelapseSharePreviewMode: true,
            ...(previewFileUrlPassThrough && { previewFileUrl: previewFileUrlPassThrough }),
          }}
          displaySocialShareOptions={this.state.displaySocialShareOptions}
          toggleSocialSharePanel={this.toggleSocialSharePanel}
          datasetId={null}
        />

        <div className="preview-controls">
          {this.shouldDisplayPreviewFile() ? (
            !isMobile && (
              <div
                className="edit-timelapse"
                onClick={this.props.timelapseSharePreviewModeDisable}
              >{t`Edit timelapse`}</div>
            )
          ) : (
            <>
              <span className="pause-play" onClick={this.props.togglePreviewPlaying}>
                {isPreviewPlaying ? (
                  <i className="fas fa-pause-circle" />
                ) : (
                  <i className="fas fa-play-circle" />
                )}
              </span>

              <span className="interval">
                {t`Speed:`}
                <input
                  value={timelapseFPS}
                  onChange={(e) => this.props.changetimelapseFPS(e.target.value)}
                  type="number"
                  min={1}
                  max={10}
                  style={{ width: '30px' }}
                />{' '}
                {t`fps`}
              </span>

              {!isMobile && (
                <span className="transition">
                  {t`Transition:`}
                  <select
                    name="transition"
                    value={transition}
                    onChange={(e) => this.props.changeTransition(e.target.value)}
                  >
                    <option value={TRANSITION.none}>{t`None`}</option>
                    <option value={TRANSITION.fade}>{t`Fade`}</option>
                  </select>
                </span>
              )}

              <RCSlider
                disabled={applicableImageIndexes.length === 0}
                min={0}
                max={applicableImageIndexes.length - 1}
                step={1}
                onChange={(index) => this.props.setImageToActive(applicableImageIndexes[index])}
                value={applicableImageActiveIndex}
                className="timeline-slider"
              />

              <small className="timeline-label">
                {applicableImageActiveIndex + 1} / {applicableImageIndexes.length}
              </small>
            </>
          )}

          {!this.shouldDisplayPreviewFile() ? (
            <>
              <div
                className={'settings-button' + (generatingTimelapse || loadingImages ? ' disabled' : '')}
                onClick={() => this.toggleDownloadPanel(true)}
                title={t`Settings`}
              >
                <i className="fas fa-cogs"></i>
              </div>

              {displayDownloadPanel ? (
                <TimelapseSettings
                  size={size}
                  format={format}
                  updateSize={this.props.updateSize}
                  updateFormat={this.props.updateFormat}
                  toggleDownloadPanel={this.toggleDownloadPanel}
                  searchDatesAndFetchImages={this.props.searchDatesAndFetchImages}
                />
              ) : null}
            </>
          ) : null}

          <EOBButton
            disabled={generatingTimelapse || loadingImages}
            loading={generatingTimelapse}
            onClick={this.downloadTimelapse}
            text={generatingTimelapse ? t`Preparing...` : t`Download`}
            className="timelapse-download-btn"
          />

          <div
            className={'share' + (generatingTimelapse || loadingImages ? ' disabled' : '')}
            onClick={this.toggleSocialSharePanel}
          >
            Share
          </div>
        </div>
      </div>
    );
  }
}
