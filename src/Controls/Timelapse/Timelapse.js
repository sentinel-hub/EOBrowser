import React, { Component } from 'react';
import { connect } from 'react-redux';
import Rodal from 'rodal';
import { t } from 'ttag';
import moment from 'moment';
import gifshot from 'gifshot';
import FileSaver from 'file-saver';
import { isMobile } from 'react-device-detect';

import { CancelToken, MimeTypes, ProcessingDataFusionLayer } from '@sentinel-hub/sentinelhub-js';

import store, { modalSlice, timelapseSlice } from '../../store';
import { getAppropriateAuthToken, getGetMapAuthToken } from '../../App';
import { TimelapseControls } from './TimelapseControls';
import { TimelapseSidebarPins } from './TimelapseSidebarPins';
import { TimelapseImages } from './TimelapseImages';
import { TimelapsePreview } from './TimelapsePreview';
import { getLayerFromParams } from '../ImgDownload/ImageDownload.utils';
import { constructGetMapParamsEffects } from '../../utils/effectsUtils';

import {
  getFlyoversToFetch,
  fetchImage,
  getMinMaxDates,
  getTimelapseBBox,
  findDefaultActiveImageIndex,
  isImageApplicable,
  findNextActiveImageIndex,
} from './Timelapse.utils';

import './Timelapse.scss';
import { applyFilterMonthsToDateRange } from '../../junk/EOBCommon/utils/filterDates';

const IMAGE_WIDTH = 512;
const IMAGE_HEIGHT = 512;

export const TRANSITION = {
  none: 'none',
  fade: 'fade',
};

class Timelapse extends Component {
  state = {
    images: null,
    activeImageIndex: null,
    loadingLayer: true,
    loadingImages: false,
    canWeFilterByClouds: false,
    canWeFilterByCoverage: false,
    isPreviewPlaying: false,
    generatingTimelapse: false,
    generatingTimelapseProgress: null,
    supportsOrbitPeriod: false,
    showSidebar: true,
    sidebarPopup: null,
  };

  async componentDidMount() {
    const { fromTime, toTime, timelapseSharePreviewMode, auth, authToken } = this.props;

    this.cancelToken = new CancelToken();
    this.layer = await getLayerFromParams(
      { ...this.props, fromTime: undefined, toTime: undefined },
      this.cancelToken,
      authToken || auth.anonToken,
    );

    if (!fromTime || !toTime) {
      store.dispatch(timelapseSlice.actions.setInitialTime(this.props.visualizationToTime));
    }

    if (timelapseSharePreviewMode) {
      this.togglePreviewPlaying();
    }

    this.setState({ loadingLayer: false });
    this.searchDatesAndFetchImages();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pins.length > this.props.pins.length) {
      this.searchDatesAndFetchImages();
    }
    if (prevProps.showBorders !== this.props.showBorders) {
      this.searchDatesAndFetchImages();
    }
    if (
      prevProps.timelapseSharePreviewMode !== this.props.timelapseSharePreviewMode &&
      prevProps.previewFileUrl !== this.props.previewFileUrl
    ) {
      this.searchDatesAndFetchImages();
    }

    if (prevProps.timelapseFPS !== this.props.timelapseFPS) {
      this.updatePreviewLoop();
    }
  }

  componentWillUnmount() {
    this.cancelToken.cancel();
    this.timer && clearInterval(this.timer);
  }

  updateDate = (fromOrTo, date) => {
    if (fromOrTo === 'from') {
      store.dispatch(timelapseSlice.actions.setFromTime(date.clone().startOf('day')));
    }
    if (fromOrTo === 'to') {
      store.dispatch(timelapseSlice.actions.setToTime(date.clone().endOf('day')));
    }
  };

  setFilterMonths = (months) => {
    store.dispatch(timelapseSlice.actions.setFilterMonths(months));
  };

  onFetchAvailableDates = async (fromMoment, toMoment, bounds) => {
    if (!this.layer) {
      return [];
    }
    const { pixelBounds, zoom } = this.props;
    const { bbox } = getTimelapseBBox(pixelBounds, zoom);
    const dates = await this.layer.findDatesUTC(bbox, fromMoment.toDate(), toMoment.toDate());
    return dates;
  };

  onQueryDatesForActiveMonth = async (day) => {
    const monthStart = day.clone().startOf('month');
    const monthEnd = day.clone().endOf('month');
    const dates = await this.onFetchAvailableDates(monthStart, monthEnd);
    return dates;
  };

  setSelectedPeriod = (period) => {
    store.dispatch(timelapseSlice.actions.setSelectedPeriod(period));
  };

  getVisualizations = async () => {
    const { datasetId, pins, auth } = this.props;

    // always include base layer visualization
    const visualizations = [
      { layer: this.layer, datasetId: datasetId, effects: constructGetMapParamsEffects(this.props) },
    ];

    // add visualizations from pins
    for (const pin of pins) {
      visualizations.push({
        layer: await getLayerFromParams(
          { ...pin, fromTime: undefined, toTime: undefined },
          this.cancelToken,
          getAppropriateAuthToken(auth, pin.themeId) || auth.anonToken,
        ),
        datasetId: pin.datasetId,
        effects: constructGetMapParamsEffects(pin),
      });
    }
    return visualizations;
  };

  shouldDisplayPreviewFile = () => {
    return this.props.timelapseSharePreviewMode && this.props.previewFileUrl;
  };

  searchDatesAndFetchImages = async () => {
    if (this.shouldDisplayPreviewFile()) {
      return;
    }

    const { selectedPeriod } = this.props;

    // Cancel any previous requests
    this.cancelToken.cancel();
    this.cancelToken = new CancelToken();

    const visualizations = await this.getVisualizations();

    let flyoversToFetch = [];
    let supportsOrbitPeriod = true;
    let canWeFilterByClouds = true;
    let canWeFilterByCoverage = true;

    for (const [index, visualization] of visualizations.entries()) {
      let { flyovers: layerFlyovers, supportsOrbitPeriod: layerSupportsOrbitPeriod } = await this.searchDates(
        visualization.layer,
      );

      if (layerFlyovers.length === 0) {
        continue;
      }

      const layerFlyoversToFetch = getFlyoversToFetch(layerFlyovers, selectedPeriod);

      flyoversToFetch = [
        ...flyoversToFetch,
        ...layerFlyoversToFetch.map((flyover) => ({ ...flyover, visualization, visualizationIndex: index })),
      ];
      supportsOrbitPeriod = supportsOrbitPeriod && layerSupportsOrbitPeriod;
      canWeFilterByClouds =
        canWeFilterByClouds &&
        !!(layerFlyovers[0].meta && layerFlyovers[0].meta.averageCloudCoverPercent !== undefined);
      canWeFilterByCoverage = canWeFilterByCoverage && layerFlyovers[0].coveragePercent !== undefined;
    }

    this.setState({
      supportsOrbitPeriod,
      canWeFilterByClouds,
      canWeFilterByCoverage,
    });

    this.fetchImages(flyoversToFetch.sort((a, b) => a.toTime - b.toTime));
  };

  searchDates = async (layer) => {
    this.setState({
      sidebarPopup: null,
      loadingImages: true,
      images: null,
      activeImageIndex: null,
    });
    const { pixelBounds, zoom, fromTime, toTime, filterMonths, selectedPeriod } = this.props;

    const { bbox } = getTimelapseBBox(pixelBounds, zoom);
    const intervals = applyFilterMonthsToDateRange(fromTime, toTime, filterMonths);

    const reqConfig = {
      cancelToken: this.cancelToken,
    };

    let flyovers = [];
    let supportsOrbitPeriod;
    for (const interval of intervals) {
      try {
        if (layer instanceof ProcessingDataFusionLayer) {
          flyovers = [
            ...flyovers,
            ...(await layer.layers[0].layer.findFlyovers(
              bbox,
              interval.fromMoment,
              interval.toMoment,
              100,
              100,
              reqConfig,
            )),
          ].map((flyover) => ({
            ...flyover,
            fromTime:
              selectedPeriod === 'orbit' ? flyover.fromTime : moment.utc(flyover.fromTime).startOf('day'),
            toTime: selectedPeriod === 'orbit' ? flyover.toTime : moment.utc(flyover.toTime).endOf('day'),
          }));
        } else {
          flyovers = [
            ...flyovers,
            ...(await layer.findFlyovers(bbox, interval.fromMoment, interval.toMoment, 100, 100, reqConfig)),
          ];
        }
        supportsOrbitPeriod = true;
      } catch (err) {
        try {
          const dates = await layer.findDatesUTC(bbox, interval.fromMoment, interval.toMoment, reqConfig);
          flyovers = [
            ...flyovers,
            ...dates.map((date) => ({
              fromTime: moment.utc(date).startOf('day'),
              toTime: moment.utc(date).endOf('day'),
            })),
          ];
          supportsOrbitPeriod = false;
        } catch (err) {
          flyovers = [...flyovers, interval];
        }
      }
    }
    return { flyovers, supportsOrbitPeriod };
  };

  fetchImages = async (flyoversToFetch) => {
    const { auth, maxCCPercentAllowed, minCoverageAllowed, showBorders, isSelectAllChecked } = this.props;
    const { canWeFilterByClouds, canWeFilterByCoverage } = this.state;

    let images = [];

    await Promise.all(
      flyoversToFetch.map((flyover) =>
        fetchImage({
          ...this.props,
          layer: flyover.visualization.layer,
          datasetId: flyover.visualization.datasetId,
          effects: flyover.visualization.effects,
          fromTime: flyover.fromTime,
          toTime: flyover.toTime,
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          imageFormat: MimeTypes.JPEG,
          showBorders: showBorders,
          getMapAuthToken: getGetMapAuthToken(auth),
          cancelToken: this.cancelToken,
        }).then((image) => {
          if (image === undefined) {
            return;
          }

          const augmentedImage = {
            ...image,
            layer: flyover.visualization.layer,
            datasetId: flyover.visualization.datasetId,
            fromTime: flyover.fromTime,
            toTime: flyover.toTime,
            isSelected: isSelectAllChecked,
            averageCloudCoverPercent: flyover.meta && flyover.meta.averageCloudCoverPercent,
            coveragePercent: flyover.coveragePercent,
            visualizationIndex: flyover.visualizationIndex,
          };
          images = [...images, augmentedImage].sort(
            (a, b) => a.toTime - b.toTime || a.visualizationIndex - b.visualizationIndex,
          );

          this.setState((prevState) => {
            const activeImageIndex =
              prevState.activeImageIndex !== null &&
              isImageApplicable(
                images[prevState.activeImageIndex],
                canWeFilterByClouds,
                canWeFilterByCoverage,
                maxCCPercentAllowed,
                minCoverageAllowed,
              )
                ? prevState.activeImageIndex
                : findDefaultActiveImageIndex(
                    images,
                    canWeFilterByClouds,
                    canWeFilterByCoverage,
                    maxCCPercentAllowed,
                    minCoverageAllowed,
                  );

            return {
              images,
              activeImageIndex,
            };
          });
        }),
      ),
    );

    this.setState({
      loadingImages: false,
    });
  };

  setMaxCCPercentAllowed = (ccPercent) => {
    store.dispatch(timelapseSlice.actions.setMaxCCPercentAllowed(ccPercent));

    const { minCoverageAllowed } = this.props;
    this.setState((prevState) => {
      const { images, activeImageIndex, canWeFilterByClouds, canWeFilterByCoverage } = prevState;
      // If the currently active image doesn't fit new criteria, we selected the next possible one
      let newActiveImage;
      if (activeImageIndex && images[activeImageIndex].averageCloudCoverPercent <= ccPercent) {
        newActiveImage = activeImageIndex;
      } else {
        newActiveImage = findDefaultActiveImageIndex(
          images,
          canWeFilterByClouds,
          canWeFilterByCoverage,
          ccPercent,
          minCoverageAllowed,
        );
      }
      return {
        activeImageIndex: newActiveImage,
      };
    });
  };

  setMinCoverageAllowed = (coveragePercent) => {
    store.dispatch(timelapseSlice.actions.setMinCoverageAllowed(coveragePercent));

    const { maxCCPercentAllowed } = this.props;
    this.setState((prevState) => {
      const { images, activeImageIndex, canWeFilterByClouds, canWeFilterByCoverage } = prevState;
      // If the currently active image doesn't fit new criteria, we selected the next possible one
      let newActiveImage;
      if (activeImageIndex && images[activeImageIndex].coveragePercent >= coveragePercent) {
        newActiveImage = activeImageIndex;
      } else {
        newActiveImage = findDefaultActiveImageIndex(
          images,
          canWeFilterByClouds,
          canWeFilterByCoverage,
          maxCCPercentAllowed,
          coveragePercent,
        );
      }
      return {
        activeImageIndex: newActiveImage,
      };
    });
  };

  toggleImageSelected = (index) => {
    this.setState((prevState) => {
      const newImages = [...prevState.images];
      newImages[index].isSelected = !newImages[index].isSelected;
      return {
        images: newImages,
      };
    });
  };

  toggleAllImagesSelected = () => {
    const { isSelectAllChecked, maxCCPercentAllowed, minCoverageAllowed } = this.props;
    const { canWeFilterByClouds, canWeFilterByCoverage } = this.state;

    store.dispatch(timelapseSlice.actions.setIsSelectAllChecked(!isSelectAllChecked));

    this.setState((prevState) => {
      const { images } = prevState;
      const newImages = images.map((image) => ({ ...image, isSelected: !isSelectAllChecked }));
      return {
        images: newImages,
        activeImageIndex: findDefaultActiveImageIndex(
          newImages,
          canWeFilterByClouds,
          canWeFilterByCoverage,
          maxCCPercentAllowed,
          minCoverageAllowed,
        ),
      };
    });
  };

  setImageToActive = (index) => {
    this.setState({
      activeImageIndex: index,
    });
  };

  toggleShowBorders = () => {
    store.dispatch(timelapseSlice.actions.setShowBorders(!this.props.showBorders));
  };

  togglePreviewPlaying = () => {
    this.setState(
      (prevState) => ({
        isPreviewPlaying: !prevState.isPreviewPlaying,
      }),
      this.updatePreviewLoop,
    );
  };

  updatePreviewLoop = () => {
    const { timelapseFPS } = this.props;
    const { isPreviewPlaying } = this.state;

    this.timer && clearInterval(this.timer);

    if (isPreviewPlaying) {
      this.timer = setInterval(() => {
        this.iterateOverImages();
      }, 1000 / timelapseFPS);
    }
  };

  iterateOverImages = () => {
    const { maxCCPercentAllowed, minCoverageAllowed } = this.props;

    this.setState((prevState) => {
      const { images, canWeFilterByClouds, canWeFilterByCoverage, activeImageIndex } = prevState;
      const newActiveImage = findNextActiveImageIndex(
        images,
        canWeFilterByClouds,
        canWeFilterByCoverage,
        maxCCPercentAllowed,
        minCoverageAllowed,
        activeImageIndex,
      );
      return {
        activeImageIndex: newActiveImage,
      };
    });
  };

  changetimelapseFPS = (fps) => {
    store.dispatch(timelapseSlice.actions.setTimelapseFPS(fps));
  };

  changeTransition = (transition) => {
    store.dispatch(timelapseSlice.actions.setTransition(transition));
  };

  generateTimelapse = () => {
    const { maxCCPercentAllowed, minCoverageAllowed, transition } = this.props;
    const { images, canWeFilterByClouds, canWeFilterByCoverage } = this.state;

    return new Promise((resolve, reject) => {
      const applicableImageUrls = images
        .filter((image) =>
          isImageApplicable(
            image,
            canWeFilterByClouds,
            canWeFilterByCoverage,
            maxCCPercentAllowed,
            minCoverageAllowed,
          ),
        )
        .map((image) => image.url);

      if (applicableImageUrls.length === 0) {
        reject();
      }

      if (transition === TRANSITION.none) {
        this.generateTimelapseWithoutTransition(applicableImageUrls, resolve, reject);
      } else {
        this.generateTimelapseWithTransition(applicableImageUrls, resolve, reject);
      }
    });
  };

  generateTimelapseWithoutTransition = (applicableImageUrls, resolve, reject) => {
    const { timelapseFPS } = this.props;

    this.setState({
      generatingTimelapse: true,
      generatingTimelapseProgress: null,
    });

    gifshot.createGIF(
      {
        images: applicableImageUrls,
        gifWidth: 512,
        interval: 1 / timelapseFPS,
        gifHeight: 512,
        numWorkers: 4,
        progressCallback: (progress) => {
          this.setState({ generatingTimelapseProgress: progress });
        },
      },
      (obj) => {
        if (obj.error) {
          this.setState({ generatingTimelapse: false });
          reject();
        } else {
          this.setState({
            generatingTimelapse: false,
            generatingTimelapseProgress: null,
          });

          const file = new File([obj.image], this.generateTimelapseFilename() + '.gif', {
            type: obj.image.type,
          });
          resolve(file);
        }
      },
    );
  };

  generateTimelapseWithTransition = (applicableImageUrls, resolve, reject) => {
    this.setState({
      generatingTimelapse: true,
      generatingTimelapseProgress: null,
    });

    const worker = new Worker('ffmpeg.js/ffmpeg-worker-mp4.js');
    worker.onmessage = (e) => {
      const msg = e.data;
      switch (msg.type) {
        default:
          break;
        case 'ready':
          runFFmpegProcess();
          break;
        case 'stdout':
          console.log(msg.data);
          break;
        case 'stderr':
          console.log(msg.data);
          updateProgress(msg.data, applicableImageUrls.length);
          break;
        case 'done':
          console.log(msg.data);
          doneFFmpegProcess(msg);
          break;
      }
    };

    const runFFmpegProcess = () => {
      const { timelapseFPS } = this.props;

      worker.postMessage({
        type: 'run',
        MEMFS: applicableImageUrls.map((url, index) => ({
          name: `img${`00${index}`.slice(-3)}.png`,
          data: convertDataURIToBinary(url),
        })),
        // https://superuser.com/questions/833232/create-video-with-5-images-with-fadein-out-effect-in-ffmpeg/
        arguments: [
          ...applicableImageUrls.flatMap((url, index) => [
            '-loop',
            '1',
            '-t',
            (1 / timelapseFPS).toString(),
            '-i',
            `img${`00${index}`.slice(-3)}.png`,
          ]),
          ...(applicableImageUrls.length > 1
            ? [
                '-filter_complex',
                [
                  ...applicableImageUrls
                    .slice(0, -1)
                    .map(
                      (url, index) =>
                        `[${index + 1}]fade=d=${0.5 / timelapseFPS}:t=in:alpha=1,setpts=PTS-STARTPTS+${
                          (index + 1) / timelapseFPS
                        }/TB[fade${index + 1}]`,
                    ),
                  ...applicableImageUrls
                    .slice(0, -1)
                    .map(
                      (url, index) =>
                        `[${index > 0 ? 'slice' : ''}${index}][fade${index + 1}]overlay[slice${index + 1}]`,
                    ),
                ].join(';'),
                '-map',
                `[slice${applicableImageUrls.length - 1}]`,
              ]
            : []),
          '-pix_fmt',
          'yuv420p',
          'out.mp4',
        ],
      });
    };

    const updateProgress = (data, totalImages) => {
      const { timelapseFPS } = this.props;

      const progress = data.match(/frame=\s*(\d+)\sfps/);
      if (progress) {
        const outputFPS = 25;
        const totalFrames = (totalImages * outputFPS) / timelapseFPS;
        this.setState({ generatingTimelapseProgress: Math.min(progress[1] / totalFrames, 1) });
      }
    };

    const doneFFmpegProcess = (msg) => {
      this.setState({
        generatingTimelapse: false,
        generatingTimelapseProgress: null,
      });

      if (msg.data?.MEMFS[0]?.data?.length > 0) {
        const file = new File([msg.data.MEMFS[0].data], this.generateTimelapseFilename() + '.mp4', {
          type: 'video/mp4',
        });
        resolve(file);
      } else {
        reject();
      }
    };

    const convertDataURIToBinary = (dataURI) => {
      const base64 = dataURI.split(',')[1];
      const raw = window.atob(base64);

      const array = new Uint8Array(new ArrayBuffer(raw.length));
      for (let i = 0; i < raw.length; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array;
    };
  };

  generateTimelapseFilename = () => {
    const random = Math.round(Date.now() * Math.random() * 1000);
    return `${this.props.datasetId.replace(' ', '_')}-${random}-timelapse`;
  };

  downloadTimelapse = async () => {
    if (this.props.previewFileUrl) {
      const link = document.createElement('a');
      link.href = this.props.previewFileUrl;
      link.click();
    } else {
      const file = await this.generateTimelapse();
      FileSaver.saveAs(file, file.name);
    }
  };

  onSidebarPopupToggle = (content) => {
    this.setState({
      sidebarPopup: this.state.sidebarPopup === content ? null : content,
    });
  };

  onAddPin = (pin) => {
    store.dispatch(timelapseSlice.actions.addPin(pin));
  };

  onRemovePin = (pin) => {
    const { pins } = this.props;
    store.dispatch(timelapseSlice.actions.removePin(pins.indexOf(pin)));
  };

  toggleSidebar = () => {
    const { showSidebar } = this.state;

    this.setState({
      showSidebar: !showSidebar,
    });
  };

  timelapseSharePreviewModeDisable = () => {
    this.setState({ isPreviewPlaying: false }, this.updatePreviewLoop);
    store.dispatch(timelapseSlice.actions.setTimelapseSharePreviewMode(false));
    store.dispatch(timelapseSlice.actions.setPreviewFileUrl(null));
  };

  onCloseModal = () => {
    store.dispatch(modalSlice.actions.removeModal());
    this.timelapseSharePreviewModeDisable();
  };

  updateUploadingTimelapseProgress = (generatingTimelapse) => {
    this.setState({
      generatingTimelapse,
      ...(generatingTimelapse && { generatingTimelapseProgress: 1 }),
    });
  };

  render() {
    const {
      images,
      loadingLayer,
      loadingImages,
      canWeFilterByClouds,
      canWeFilterByCoverage,
      activeImageIndex,
      isPreviewPlaying,
      generatingTimelapse,
      generatingTimelapseProgress,
      supportsOrbitPeriod,
      showSidebar,
      sidebarPopup,
    } = this.state;

    const {
      datasetId,
      pinsItems,
      fromTime,
      toTime,
      selectedPeriod,
      maxCCPercentAllowed,
      minCoverageAllowed,
      isSelectAllChecked,
      showBorders,
      timelapseSharePreviewMode,
      previewFileUrl,
      timelapseFPS,
      transition,
      pins,
    } = this.props;

    let { minDate, maxDate } = getMinMaxDates(datasetId);

    pins.forEach((pin) => {
      const { minDate: pinMinDate, maxDate: pinMaxDate } = getMinMaxDates(pin.datasetId);
      if (pinMinDate.isBefore(minDate)) {
        minDate = pinMinDate;
      }
      if (pinMaxDate.isAfter(maxDate)) {
        maxDate = pinMaxDate;
      }
    });

    const screenCoverage = timelapseSharePreviewMode ? (isMobile ? 80 : 90) : 100;

    return (
      <Rodal
        animation="fade"
        visible={true}
        customStyles={{ height: screenCoverage + 'vh', width: screenCoverage + 'vw', padding: 0, border: 0 }}
        onClose={this.onCloseModal}
        closeOnEsc={true}
      >
        <div className="timelapse">
          <div className="title">
            <h1>{t`Timelapse`}</h1>
          </div>

          <div className="timelapse-panel">
            {showSidebar && !timelapseSharePreviewMode ? (
              <>
                <div className="sidebar">
                  <TimelapseControls
                    fromTime={fromTime}
                    toTime={toTime}
                    minDate={minDate}
                    maxDate={maxDate}
                    selectedPeriod={selectedPeriod}
                    supportsOrbitPeriod={supportsOrbitPeriod}
                    updateDate={this.updateDate}
                    setFilterMonths={this.setFilterMonths}
                    onQueryDatesForActiveMonth={this.onQueryDatesForActiveMonth}
                    setSelectedPeriod={this.setSelectedPeriod}
                    pins={pins}
                    layer={this.layer}
                    datasetId={datasetId}
                    onRemovePin={this.onRemovePin}
                    onSidebarPopupToggle={this.onSidebarPopupToggle}
                    onSearch={this.searchDatesAndFetchImages}
                    loadingLayer={loadingLayer}
                    loadingImages={loadingImages}
                  />
                </div>

                <div className="sidebar-2">
                  <TimelapseImages
                    images={images}
                    loadingImages={loadingImages}
                    selectedPeriod={selectedPeriod}
                    canWeFilterByClouds={canWeFilterByClouds}
                    canWeFilterByCoverage={canWeFilterByCoverage}
                    maxCCPercentAllowed={maxCCPercentAllowed}
                    minCoverageAllowed={minCoverageAllowed}
                    isSelectAllChecked={isSelectAllChecked}
                    activeImageIndex={activeImageIndex}
                    showBorders={showBorders}
                    setMaxCCPercentAllowed={this.setMaxCCPercentAllowed}
                    setMinCoverageAllowed={this.setMinCoverageAllowed}
                    toggleImageSelected={this.toggleImageSelected}
                    toggleAllImagesSelected={this.toggleAllImagesSelected}
                    setImageToActive={this.setImageToActive}
                    toggleShowBorders={this.toggleShowBorders}
                  />
                  {sidebarPopup === 'pins' ? (
                    <TimelapseSidebarPins
                      pins={pinsItems}
                      onAddPin={this.onAddPin}
                      onSidebarPopupToggle={this.onSidebarPopupToggle}
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            <TimelapsePreview
              images={images}
              activeImageIndex={activeImageIndex}
              access_token={this.props.auth.user.access_token}
              timelapseSharePreviewMode={timelapseSharePreviewMode}
              shouldDisplayPreviewFile={this.shouldDisplayPreviewFile}
              previewFileUrl={previewFileUrl}
              isPreviewPlaying={isPreviewPlaying}
              timelapseFPS={timelapseFPS}
              transition={transition}
              canWeFilterByClouds={canWeFilterByClouds}
              canWeFilterByCoverage={canWeFilterByCoverage}
              maxCCPercentAllowed={maxCCPercentAllowed}
              minCoverageAllowed={minCoverageAllowed}
              selectedPeriod={selectedPeriod}
              loadingImages={loadingImages}
              generatingTimelapse={generatingTimelapse}
              generatingTimelapseProgress={generatingTimelapseProgress}
              togglePreviewPlaying={this.togglePreviewPlaying}
              changetimelapseFPS={this.changetimelapseFPS}
              changeTransition={this.changeTransition}
              setImageToActive={this.setImageToActive}
              generateTimelapse={this.generateTimelapse}
              updateUploadingTimelapseProgress={this.updateUploadingTimelapseProgress}
              downloadTimelapse={this.downloadTimelapse}
              timelapseSharePreviewModeDisable={this.timelapseSharePreviewModeDisable}
            />
          </div>
        </div>
      </Rodal>
    );
  }
}

const mapStoreToProps = (store) => ({
  zoom: store.mainMap.zoom,
  visualizationToTime: store.visualization.toTime,
  pixelBounds: store.mainMap.pixelBounds,
  datasetId: store.visualization.datasetId,
  layerId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  visualizationUrl: store.visualization.visualizationUrl,
  evalscript: store.visualization.evalscript,
  evalscripturl: store.visualization.evalscripturl,
  authToken: getAppropriateAuthToken(store.auth, store.themes.selectedThemeId),
  gainEffect: store.visualization.gainEffect,
  gammaEffect: store.visualization.gammaEffect,
  redRangeEffect: store.visualization.redRangeEffect,
  greenRangeEffect: store.visualization.greenRangeEffect,
  blueRangeEffect: store.visualization.blueRangeEffect,
  upsampling: store.visualization.upsampling,
  downsampling: store.visualization.downsampling,
  speckleFilter: store.visualization.speckleFilter,
  orthorectification: store.visualization.orthorectification,
  minQa: store.visualization.minQa,
  dataFusion: store.visualization.dataFusion,
  pinsItems: store.pins.items,
  auth: store.auth,
  selectedThemeId: store.themes.selectedThemeId,
  fromTime: store.timelapse.fromTime,
  toTime: store.timelapse.toTime,
  filterMonths: store.timelapse.filterMonths,
  selectedPeriod: store.timelapse.selectedPeriod,
  maxCCPercentAllowed: store.timelapse.maxCCPercentAllowed,
  minCoverageAllowed: store.timelapse.minCoverageAllowed,
  isSelectAllChecked: store.timelapse.isSelectAllChecked,
  showBorders: store.timelapse.showBorders,
  timelapseSharePreviewMode: store.timelapse.timelapseSharePreviewMode,
  previewFileUrl: store.timelapse.previewFileUrl,
  timelapseFPS: store.timelapse.timelapseFPS,
  transition: store.timelapse.transition,
  pins: store.timelapse.pins,
});

export default connect(mapStoreToProps, null)(Timelapse);
