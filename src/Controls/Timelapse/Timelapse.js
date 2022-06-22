import React, { Component } from 'react';
import { connect } from 'react-redux';
import Rodal from 'rodal';
import { t } from 'ttag';
import moment from 'moment';
import { isMobile } from 'react-device-detect';

import { CancelToken, isCancelled, MimeTypes, ProcessingDataFusionLayer } from '@sentinel-hub/sentinelhub-js';

import store, { modalSlice, timelapseSlice } from '../../store';
import { getAppropriateAuthToken, getGetMapAuthToken } from '../../App';
import { TimelapseControls } from './TimelapseControls';
import { TimelapseSidebarPins } from './TimelapseSidebarPins';
import { TimelapseImages } from './TimelapseImages';
import { TimelapsePreview } from './TimelapsePreview';
import { constructBBoxFromBounds, getLayerFromParams } from '../ImgDownload/ImageDownload.utils';
import { constructGetMapParamsEffects } from '../../utils/effectsUtils';

import {
  getFlyoversToFetch,
  getMinMaxDates,
  findDefaultActiveImageIndex,
  isImageApplicable,
  findNextActiveImageIndex,
  generateTimelapseWithGifshot,
  fetchTimelapseImage,
  getTimelapseBounds,
  determineDefaultImageSize,
  generateTimelapseWithFFMPEG,
  getFlyOverVisualization,
  DEFAULT_IMAGE_DIMENSION,
} from './Timelapse.utils';

import './Timelapse.scss';
import { applyFilterMonthsToDateRange } from '../../junk/EOBCommon/utils/filterDates';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { EXPORT_FORMAT, TRANSITION } from '../../const';
import { NotificationPanel } from '../../Notification/NotificationPanel';

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
    errorMessage: null,
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

    // update size on first load or if the ratio changes
    const size = determineDefaultImageSize(this.props.pixelBounds, this.props.zoom, this.props.aoi);
    if (!this.props.size || this.props.size.ratio.toFixed(3) !== size.ratio.toFixed(3)) {
      store.dispatch(timelapseSlice.actions.setSize(size));
    }

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
    const { pixelBounds, zoom, aoi } = this.props;
    const bbox = constructBBoxFromBounds(getTimelapseBounds(pixelBounds, zoom, aoi));
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
    const { datasetId, pins, auth, customSelected } = this.props;

    // always include base layer visualization
    const visualizations = [
      {
        layer: this.layer,
        datasetId: datasetId,
        effects: constructGetMapParamsEffects(this.props),
        customSelected: customSelected,
      },
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
        pin: pin,
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
        ...(await Promise.all(
          layerFlyoversToFetch.map(async (flyover) => ({
            ...flyover,
            visualization: await getFlyOverVisualization(visualization, flyover),
            visualizationIndex: index,
          })),
        )),
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

    await this.fetchImages(flyoversToFetch.sort((a, b) => a.toTime - b.toTime));
  };

  searchDates = async (layer) => {
    this.setState({
      sidebarPopup: null,
      loadingImages: true,
      images: null,
      activeImageIndex: null,
    });
    const { pixelBounds, zoom, fromTime, toTime, filterMonths, selectedPeriod, aoi } = this.props;

    const bbox = constructBBoxFromBounds(getTimelapseBounds(pixelBounds, zoom, aoi));
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
    const {
      auth,
      maxCCPercentAllowed,
      minCoverageAllowed,
      showBorders,
      isSelectAllChecked,
      pixelBounds,
      zoom,
      aoi,
    } = this.props;
    const { canWeFilterByClouds, canWeFilterByCoverage } = this.state;

    const size = determineDefaultImageSize(pixelBounds, zoom, aoi);
    let images = [];

    const fetchTimelapseImages = flyoversToFetch.map((flyover) =>
      fetchTimelapseImage({
        layer: flyover.visualization.layer,
        datasetId: flyover.visualization.datasetId,
        bounds: getTimelapseBounds(pixelBounds, zoom, aoi),
        fromTime: flyover.fromTime,
        toTime: flyover.toTime,
        width: size.width,
        height: size.height,
        imageFormat: MimeTypes.JPEG,
        cancelToken: this.cancelToken,
        geometry: aoi.geometry,
        effects: flyover.visualization.effects,
        getMapAuthToken: getGetMapAuthToken(auth),
        showBorders: showBorders && !(aoi && aoi.bounds),
      })
        .then((image) => {
          const augmentedImage = {
            url: image.url,
            layer: flyover.visualization.layer,
            datasetId: flyover.visualization.datasetId,
            fromTime: flyover.fromTime,
            toTime: flyover.toTime,
            effects: flyover.visualization.effects,
            customSelected: flyover.visualization.customSelected,
            pin: flyover.visualization.pin,
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
        })
        .catch((err) => {
          if (!isCancelled(err)) {
            console.warn('Unable to fetch timelapse image', err);
            this.showErrorMessage(t`Unable to fetch timelapse image`);
          }
        }),
    );

    await Promise.all(fetchTimelapseImages);

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
    const { maxCCPercentAllowed, minCoverageAllowed } = this.props;

    this.setState((prevState) => {
      const newImages = [...prevState.images];
      newImages[index].isSelected = !newImages[index].isSelected;

      const newActiveImageIndex = newImages[index].isSelected
        ? index
        : prevState.activeImageIndex === index
        ? findNextActiveImageIndex(
            newImages,
            prevState.canWeFilterByClouds,
            prevState.canWeFilterByCoverage,
            maxCCPercentAllowed,
            minCoverageAllowed,
            0,
          )
        : prevState.activeImageIndex;

      store.dispatch(
        timelapseSlice.actions.setIsSelectAllChecked(newImages.every((image) => image.isSelected)),
      );

      return {
        images: newImages,
        activeImageIndex: newActiveImageIndex,
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
      const nextActiveImageIndex = findNextActiveImageIndex(
        images,
        canWeFilterByClouds,
        canWeFilterByCoverage,
        maxCCPercentAllowed,
        minCoverageAllowed,
        activeImageIndex,
      );
      return {
        activeImageIndex: nextActiveImageIndex,
      };
    });
  };

  changetimelapseFPS = (fps) => {
    store.dispatch(timelapseSlice.actions.setTimelapseFPS(fps));
  };

  changeTransition = (transition) => {
    store.dispatch(timelapseSlice.actions.setTransition(transition));
  };

  generateTimelapse = async () => {
    const { maxCCPercentAllowed, minCoverageAllowed, size } = this.props;
    const { images, canWeFilterByClouds, canWeFilterByCoverage } = this.state;

    // Cancel any previous requests
    this.cancelToken.cancel();
    this.cancelToken = new CancelToken();

    try {
      this.setState({ generatingTimelapse: true });

      const filteredImages = images.filter((image) =>
        isImageApplicable(
          image,
          canWeFilterByClouds,
          canWeFilterByCoverage,
          maxCCPercentAllowed,
          minCoverageAllowed,
        ),
      );

      const applicableImageUrls = await this.refetchImages(filteredImages, size);

      return await this.encodeImages(applicableImageUrls);
    } catch (err) {
      if (!isCancelled(err)) {
        console.warn('Unable to generate timelapse', err);
        this.showErrorMessage(
          t`Could not generate timelapse animation file. Try using lower resolution or fewer frames.`,
        );
      }
    } finally {
      this.setState({
        generatingTimelapse: false,
        generatingTimelapseProgress: null,
      });
    }
  };

  shouldRefetchImages = () => {
    const { size } = this.props;
    return size.width !== DEFAULT_IMAGE_DIMENSION || size.height !== DEFAULT_IMAGE_DIMENSION;
  };

  refetchImages = async (images) => {
    const { size, pixelBounds, zoom, aoi, auth, showBorders } = this.props;
    let resolvedCounter = 0;

    return await Promise.all(
      images.map(async (image) => {
        if (!this.shouldRefetchImages()) {
          return image.url;
        }

        // refetch images with custom size
        let response = await fetchTimelapseImage({
          layer: image.layer,
          datasetId: image.datasetId,
          bounds: getTimelapseBounds(pixelBounds, zoom, aoi),
          fromTime: image.fromTime,
          toTime: image.toTime,
          width: size.width,
          height: size.height,
          imageFormat: MimeTypes.JPEG,
          cancelToken: this.cancelToken,
          geometry: aoi.geometry,
          effects: image.effects,
          getMapAuthToken: getGetMapAuthToken(auth),
          showBorders: showBorders && !(aoi && aoi.bounds),
        }).catch((err) => {
          console.warn('Unable to refetch timelapse image', err);
          throw err;
        });

        this.updateFetchAndEncodeProgress(++resolvedCounter / images.length, true);
        return response && response.url;
      }),
    );
  };

  encodeImages = async (imageUrls) => {
    const { transition, datasetId, timelapseFPS, size, format, fadeDuration } = this.props;

    if (format === EXPORT_FORMAT.gif && transition === TRANSITION.none) {
      return generateTimelapseWithGifshot({
        imageUrls,
        datasetId,
        timelapseFPS,
        size,
        progress: (percent) => {
          this.updateFetchAndEncodeProgress(percent);
        },
      });
    } else {
      return generateTimelapseWithFFMPEG({
        imageUrls,
        datasetId,
        timelapseFPS,
        fadeDuration,
        transition,
        size,
        progress: (percent) => {
          this.updateFetchAndEncodeProgress(percent);
        },
      });
    }
  };

  // first 50% of the progress is fetching, the rest is encoding
  updateFetchAndEncodeProgress = (percent, isFetch) => {
    let progress = percent;

    if (this.shouldRefetchImages()) {
      progress = percent * 0.5 + (isFetch ? 0 : 0.5);
    }

    this.setState({ generatingTimelapseProgress: progress });
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

  updateSize = (size) => {
    store.dispatch(
      timelapseSlice.actions.setSize({
        width: size.width,
        height: size.height,
        ratio: this.props.size.ratio, // always keep initial ratio
      }),
    );
  };

  updateFormat = (format) => {
    store.dispatch(timelapseSlice.actions.setFormat(format));
  };

  updateFadeDuration = (fadeDuration) => {
    store.dispatch(timelapseSlice.actions.setFadeDuration(fadeDuration));
  };

  showErrorMessage = (errorMessage) => {
    this.setState({ errorMessage });
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
      errorMessage,
    } = this.state;

    const {
      datasetId,
      pinsItems,
      fromTime,
      toTime,
      filterMonths,
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
      customSelected,
      aoi,
      size,
      format,
      fadeDuration,
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

    const sidebarPins = pinsItems.filter((pin) => {
      const dsh = getDataSourceHandler(pin.item.datasetId);
      return dsh && dsh.supportsTimelapse();
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
        {errorMessage && (
          <Rodal
            visible={true}
            customStyles={{ height: '100px', width: '500px' }}
            onClose={() => {
              this.showErrorMessage(false);
            }}
          >
            <NotificationPanel msg={errorMessage} type="info" />
          </Rodal>
        )}
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
                    filterMonths={filterMonths}
                    selectedPeriod={selectedPeriod}
                    supportsOrbitPeriod={supportsOrbitPeriod}
                    updateDate={this.updateDate}
                    setFilterMonths={this.setFilterMonths}
                    onQueryDatesForActiveMonth={this.onQueryDatesForActiveMonth}
                    setSelectedPeriod={this.setSelectedPeriod}
                    pins={pins}
                    layer={this.layer}
                    customSelected={customSelected}
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
                    enableBorders={!(aoi && aoi.bounds)}
                    showBorders={showBorders && !(aoi && aoi.bounds)}
                    setMaxCCPercentAllowed={this.setMaxCCPercentAllowed}
                    setMinCoverageAllowed={this.setMinCoverageAllowed}
                    toggleImageSelected={this.toggleImageSelected}
                    toggleAllImagesSelected={this.toggleAllImagesSelected}
                    setImageToActive={this.setImageToActive}
                    toggleShowBorders={this.toggleShowBorders}
                  />
                  {sidebarPopup === 'pins' ? (
                    <TimelapseSidebarPins
                      pins={sidebarPins}
                      onAddPin={this.onAddPin}
                      onSidebarPopupToggle={this.onSidebarPopupToggle}
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            <TimelapsePreview
              images={images}
              size={size}
              format={format}
              fadeDuration={fadeDuration}
              activeImageIndex={activeImageIndex}
              access_token={this.props.auth.user.access_token}
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
              timelapseSharePreviewModeDisable={this.timelapseSharePreviewModeDisable}
              updateSize={this.updateSize}
              updateFormat={this.updateFormat}
              updateFadeDuration={this.updateFadeDuration}
              searchDatesAndFetchImages={this.searchDatesAndFetchImages}
              showErrorMessage={this.showErrorMessage}
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
  aoi: store.aoi,
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
  redCurveEffect: store.visualization.redCurveEffect,
  greenCurveEffect: store.visualization.greenCurveEffect,
  blueCurveEffect: store.visualization.blueCurveEffect,
  upsampling: store.visualization.upsampling,
  downsampling: store.visualization.downsampling,
  speckleFilter: store.visualization.speckleFilter,
  orthorectification: store.visualization.orthorectification,
  backscatterCoeff: store.visualization.backscatterCoeff,
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
  size: store.timelapse.size,
  format: store.timelapse.format,
  fadeDuration: store.timelapse.fadeDuration,
});

export default connect(mapStoreToProps, null)(Timelapse);
