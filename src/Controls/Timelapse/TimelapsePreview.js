import React, { Component } from 'react';
import { t } from 'ttag';
import RCSlider from 'rc-slider';
import { isMobile } from 'react-device-detect';
import { CSSTransitionGroup } from 'react-transition-group';

import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { generateS3PreSignedPost, getS3FileUrl, isImageApplicable, uploadFileToS3 } from './Timelapse.utils';
import SocialShare from '../../components/SocialShare/SocialShare';
import { TRANSITION } from './Timelapse';

export class TimelapsePreview extends Component {
  state = {
    displaySocialShareOptions: false,
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

  generatePreviewFile = async () => {
    const file = await this.props.generateTimelapse();
    this.props.updateUploadingTimelapseProgress(true);
    const preSignedPost = await generateS3PreSignedPost(this.props.access_token, file.name);

    if (preSignedPost && file) {
      await uploadFileToS3(preSignedPost, file);
      this.props.updateUploadingTimelapseProgress(false);
      return getS3FileUrl(preSignedPost);
    }

    this.props.updateUploadingTimelapseProgress(false);
  };

  render() {
    const {
      images,
      activeImageIndex,
      timelapseSharePreviewMode,
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
    } = this.props;

    const { previewFileUrlPassThrough } = this.state;

    let image, applicableImageIndexes, applicableImageActiveIndex;

    if (this.props.shouldDisplayPreviewFile()) {
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

    const isVideoElement = image.url.endsWith('mp4');

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
          {timelapseSharePreviewMode && this.props.shouldDisplayPreviewFile() ? (
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

          <EOBButton
            disabled={generatingTimelapse || loadingImages}
            loading={generatingTimelapse}
            onClick={this.props.downloadTimelapse}
            text={generatingTimelapse ? t`Preparing...` : t`Download`}
            className="timelapse-download-btn"
          />

          <div className="share" onClick={this.toggleSocialSharePanel}>
            Share
          </div>
        </div>
      </div>
    );
  }
}
