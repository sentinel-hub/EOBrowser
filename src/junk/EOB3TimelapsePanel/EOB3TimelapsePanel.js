import React, { Component } from 'react';

import moment from 'moment';
import { CancelToken, isCancel } from 'axios';
import RCSlider from 'rc-slider';
import { isAuthTokenSet, setAuthToken } from '@sentinel-hub/sentinelhub-js';

import { EOBButton } from '../EOBCommon/EOBButton/EOBButton';
import { EOBCCSlider } from '../EOBCommon/EOBCCSlider/EOBCCSlider';
import { default as EOBDatePicker } from '../EOBCommon/EOBDatePicker/EOBDatePicker';
import AlertContainer from 'react-alert';
import gifshot from 'gifshot';
import FileSaver from 'file-saver';
import {
  getCurrentBboxUrl,
  fetchBlobObj,
  getWidthOrHeight,
  fetchSHLayerFlyovers,
  legacyFetchDates,
} from './timelapseUtils';
import { calcBboxFromXY } from '../EOBCommon/utils/coords';
import EOBFilterSearchByMonths from '../EOBCommon/EOBFilterSearchByMonths/EOBFilterSearchByMonths';
import { getInstantsFromTimeInterval } from '../EOBCommon/utils/timespanHelpers';
import { t } from 'ttag';

import './EOB3TimelapsePanel.scss';

const createDefaultDateRange = time => {
  const { timeTo } = getInstantsFromTimeInterval(time);
  return {
    from: moment
      .utc(timeTo)
      .subtract(1, 'months')
      .format('YYYY-MM-DD'),
    to: moment.utc(timeTo).format('YYYY-MM-DD'),
  };
};

export class EOB3TimelapsePanel extends Component {
  MAX_COUNT = 300;
  PERIODS_FOR_BEST_IMG = [
    { value: 'orbit', text: t`orbit` },
    { value: 'day', text: t`day` },
    { value: 'isoWeek', text: t`week` },
    { value: 'month', text: t`month` },
    { value: 'year', text: t`year` },
  ];
  selectedLayerSHJS = null;
  fetchedImages = [];
  state = {
    maxCCPercentAllowed: 50,
    allFlyovers: [],
    allDatesWithImgs: [],
    selectedDates: [],
    tooCloudy: [],
    isSelectAllChecked: true,
    selectedPeriodForBestImg: 'day',
    isSelectPeriodPossible: true,
    sliderValue: 0,
    intervalSpeed: 1,
    dateRange: createDefaultDateRange(this.props.selectedResult.time),
    filterMonths: null,
    isPlaying: false,
    imgUrl: getCurrentBboxUrl(
      this.props.lat,
      this.props.lng,
      this.props.zoom,
      this.props.isEvalUrl,
      this.props.selectedResult,
      this.props.presets,
      this.props.instances,
      this.props.evalscriptoverrides,
      this.props.mapBounds,
      this.props.aoiBounds,
      this.props.effects,
    ),
    gifCreationProgress: null,
    preparingGifCreation: false,
    loadingData: false,
    allImagesLoading: false,
    showOverlayLayers: this.props.overlayLayers.map(overlay => ({ name: overlay.name, checked: false })),
  };

  cancelTokenSource = CancelToken.source();

  alertOptions = {
    offset: 14,
    position: 'top center',
    theme: 'dark',
    time: 4000,
    transition: 'scale',
  };

  imagesRefs = {};

  async componentDidMount() {
    const { SHJSLayer, authToken } = this.props;
    if (!isAuthTokenSet()) {
      setAuthToken(authToken);
    }

    this.selectedLayerSHJS = SHJSLayer;

    await this.searchDates();
  }

  componentWillMount() {
    this.timer && this.clearInterval(this.timer);
  }

  componentWillUnmount() {
    this.cancelTokenSource.cancel('Operation cancelled by user.');
  }

  componentDidUpdate(prevProps, oldState) {
    const didPlayStopChange = oldState.isPlaying !== this.state.isPlaying;
    const didDateSelectionChange = oldState.selectedDates !== this.state.selectedDates;
    const didIntervalSpeedChange = oldState.intervalSpeed !== this.state.intervalSpeed;

    if (didPlayStopChange) {
      if (this.state.isPlaying) {
        this.startGifPreviewLoop(this.state.intervalSpeed);
      } else {
        this.stopGifPreviewLoop();
      }
    }
    if (didDateSelectionChange || this.state.tooCloudy !== oldState.tooCloudy) {
      if (this.state.selectedDates.length === 0) {
        this.stopGifPreviewLoop();
        this.resetSlider();
      } else {
        this.state.isPlaying && this.startGifPreviewLoop(this.state.intervalSpeed);
      }
      const isSelectAllChecked =
        this.state.selectedDates.length === this.state.allDatesWithImgs.length - this.state.tooCloudy.length;
      this.setState({
        isSelectAllChecked,
      });
    }
    if (didIntervalSpeedChange) {
      this.state.isPlaying && this.startGifPreviewLoop(this.state.intervalSpeed);
    }
    if (this.state.sliderValue !== oldState.sliderValue) {
      const datesForGif = this.datesForGif(this.state.selectedDates, this.state.tooCloudy);
      const currDate = datesForGif[this.state.sliderValue];
      this.scrollToImage(currDate);
    }
    if (
      this.state.allDatesWithImgs !== oldState.allDatesWithImgs ||
      this.state.maxCCPercentAllowed !== oldState.maxCCPercentAllowed
    ) {
      this.updateFilterAndCheckedState();
    }
  }
  datesForGif = (selectedDates, tooCloudy) => {
    return selectedDates.filter(date => !tooCloudy.includes(date));
  };
  showAlert = errMsg => {
    this.alertContainer.show(errMsg, { type: 'info' });
  };

  searchDates = async () => {
    const { lat, lng, zoom, mapBounds, aoiBounds } = this.props;
    const { filterMonths } = this.state;
    this.stopGifPreviewLoop();
    this.fetchedImages = [];
    this.setState({
      allDatesWithImgs: [],
      tooCloudy: [],
      selectedDates: [],
    });

    this.setState({
      loadingData: true,
    });

    if (
      !this.selectedLayerSHJS ||
      !this.selectedLayerSHJS.findFlyovers ||
      !this.selectedLayerSHJS.findTiles
    ) {
      await this.useLegacyFunctions();
    } else {
      await fetchSHLayerFlyovers(
        this.selectedLayerSHJS,
        this.state.dateRange,
        lat,
        lng,
        zoom,
        mapBounds,
        aoiBounds,
        filterMonths,
      )
        .then(flyovers => {
          // flyover = {fromTime, toTime, coveragePercent, meta: {averageCloudCoverPercent}}
          this.setState({
            allFlyovers: flyovers,
            loadingData: false,
          });
        })
        .catch(async e => {
          console.error(e);

          this.setState(prevState => {
            const selectedPeriodInLegacy =
              prevState.selectedPeriodForBestImg === 'orbit' ? 'day' : prevState.selectedPeriodForBestImg;
            return {
              selectedPeriodForBestImg: selectedPeriodInLegacy,
              isSelectPeriodPossible: false,
            };
          });

          await this.useLegacyFunctions();
        });
    }

    await this.fetchImages();
  };

  useLegacyFunctions = async () => {
    const {
      lat,
      lng,
      zoom,
      mapBounds,
      aoiBounds,
      selectedResult,
      presets,
      canWeFilterByClouds,
      cloudCoverageLayers,
      onFetchAvailableDates,
    } = this.props;
    const { filterMonths } = this.state;
    await legacyFetchDates(
      this.state.dateRange,
      lat,
      lng,
      zoom,
      mapBounds,
      aoiBounds,
      filterMonths,
      selectedResult,
      presets,
      canWeFilterByClouds,
      cloudCoverageLayers,
      onFetchAvailableDates,
      this.cancelTokenSource.token,
    )
      .then(flyovers => {
        // flyover = {fromTime, toTime, coveragePercent, meta: {averageCloudCoverPercent}}

        this.setState({
          allFlyovers: flyovers,
          loadingData: false,
        });
      })
      .catch(e => {
        console.error(e);
        this.setState({
          error: 'Error fetching data',
          loadingData: false,
        });
      });
  };

  updateDate = (key, date) => {
    this.stopGifPreviewLoop();
    this.setState(oldState => {
      const newDateRange = oldState.dateRange;
      newDateRange[key] = date.format ? date.format('YYYY-MM-DD') : date;
      return { dateRange: newDateRange };
    });
  };

  fetchImages = async () => {
    const {
      lat,
      lng,
      zoom,
      isEvalUrl,
      selectedResult,
      presets,
      instances,
      evalscriptoverrides,
      mapBounds,
      aoiBounds,
      overlayLayers,
      apiType,
      effects,
      dataFusion,
    } = this.props;

    const { showOverlayLayers, selectedPeriodForBestImg, allFlyovers } = this.state;

    this.setState({ allImagesLoading: true });

    const widthOrHeight = getWidthOrHeight();
    const bbox = calcBboxFromXY({
      lat,
      lng,
      zoom,
      width: widthOrHeight,
      height: widthOrHeight,
      mapBounds,
      aoiBounds,
      wgs84: true,
    });

    let flyoverArray = allFlyovers;
    if (selectedPeriodForBestImg) {
      const intervalsFromFlyovers = this.createIntervalsFromFlyovers();
      flyoverArray = this.getFlyoversForBestImgsFromIntervals(intervalsFromFlyovers);
    }

    if (flyoverArray.length >= this.MAX_COUNT) {
      this.showAlert(`Maximum number of images is ${this.MAX_COUNT}.`);
      this.setState({ allImagesLoading: false });
      return;
    }

    const imgUrlArr = flyoverArray.map(flyover => {
      // subtracting / adding 1 minute to get all images
      // (backend seems to not include the images with the exact same time as the tiles have)
      // caution: moment.add(), moment.subtract() are in-place functions
      const formatedFromTimeWithBufferTime = flyover.fromTime
        .clone()
        .subtract(1, 'minute')
        .format();
      const formatedToTimeWithBufferTime = flyover.toTime
        .clone()
        .add(1, 'minute')
        .format();

      return {
        url: `${getCurrentBboxUrl(
          lat,
          lng,
          zoom,
          isEvalUrl,
          selectedResult,
          presets,
          instances,
          evalscriptoverrides,
          mapBounds,
          aoiBounds,
          effects,
        )}&SHOWLOGO=FALSE&time=${formatedFromTimeWithBufferTime}/${formatedToTimeWithBufferTime}`,
        // something here went wrong, time is added here ^ and in fetchBlobObj
        date: moment(flyover.fromTime).format(),
        dateToBeShown:
          selectedPeriodForBestImg === 'orbit'
            ? flyover.fromTime.format('YYYY-MM-DD HH:mm:ss')
            : flyover.fromTime.format('YYYY-MM-DD'),
        try: 0,
      };
    });

    const allImagesPromises = imgUrlArr.map(imgUrl => {
      const selectedOverlays = overlayLayers
        .filter(l => showOverlayLayers.find(layer => layer.name === l.name && layer.checked))
        .map(overlay => overlay.layer);

      // something here went wrong, time is added above and in fetchBlobObj
      return fetchBlobObj(
        imgUrl,
        widthOrHeight,
        widthOrHeight,
        bbox,
        selectedOverlays && selectedOverlays.length > 0 ? selectedOverlays : null,
        this.cancelTokenSource.token,
        apiType,
        effects,
        dataFusion,
      )
        .then(response => {
          const dateToBeAdded = response.date;
          this.fetchedImages[dateToBeAdded] = response;

          this.setState(oldState => {
            const allDatesWithImgs = [...oldState.allDatesWithImgs, dateToBeAdded].sort(
              (a, b) => new Date(a) - new Date(b),
            );
            const selectedDates = [...oldState.selectedDates, dateToBeAdded].sort(
              (a, b) => new Date(a) - new Date(b),
            );

            return {
              allDatesWithImgs,
              selectedDates,
            };
          });
        })
        .catch(err => {
          if (isCancel(err)) {
            return;
          }
        });
    });

    Promise.all(allImagesPromises).then(() => {
      this.setState({ allImagesLoading: false });
    });
  };

  triggerUserDownload = blob => {
    const { name } = this.props.selectedResult;
    FileSaver.saveAs(blob, `${name.replace(' ', '_')}-timelapse.gif`);
  };

  createGif = datesForGif => {
    if (datesForGif.length === 0) return;
    this.setState({ error: null, preparingGifCreation: true });
    gifshot.createGIF(
      {
        images: datesForGif.map(date => this.getDataUrlFromDate(date)),
        gifWidth: 512,
        interval: 1 / this.state.intervalSpeed,
        //frameDuration: 5,
        gifHeight: 512,
        numWorkers: 4,
        // sampleInterval: 20,
        progressCallback: progress => {
          this.setState({ gifCreationProgress: progress });
        },
      },
      obj => {
        if (obj.error) {
          this.setState({ error: obj.error, preparingGifCreation: false });
        } else {
          this.setState({
            preparingGifCreation: false,
            gifCreationProgress: null,
          });
          this.triggerUserDownload(obj.image);
        }
      },
    );
  };

  resetSlider = () => {
    this.setState({ sliderValue: 0 });
  };

  changeSliderValue = e => {
    this.setState({ sliderValue: e });
  };

  startGifPreviewLoop = intervalSpeed => {
    this.timer && window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.gifPreviewLoopTick();
    }, 1000 / intervalSpeed);
  };

  stopGifPreviewLoop = () => {
    this.setState({ isPlaying: false });
    this.timer && window.clearInterval(this.timer);
  };

  gifPreviewLoopTick = () => {
    this.setState(oldState => {
      const datesForGif = this.datesForGif(oldState.selectedDates, oldState.tooCloudy);
      const sliderValue = (oldState.sliderValue + 1) % datesForGif.length;

      return {
        sliderValue,
        currDate: datesForGif[sliderValue],
      };
    });
  };

  togglePlay = shouldPlay => {
    this.setState({ isPlaying: shouldPlay });
  };

  updateIntervalSpeed = e => {
    this.setState({ intervalSpeed: e.target.value });
  };

  isSelectAllCheckedChange = wasChecked => {
    this.setState(oldState => {
      if (!wasChecked) {
        const selectedDates = oldState.allDatesWithImgs.filter(dateTime => {
          if (!this.props.canWeFilterByClouds) {
            return true;
          }

          const foundFlyover = oldState.allFlyovers.find(flyover =>
            flyover.fromTime.isSame(dateTime, 'second'),
          );

          if (foundFlyover === undefined) {
            return false;
          }
          if (
            foundFlyover.meta.averageCloudCoverPercent === 'NaN' ||
            foundFlyover.meta.averageCloudCoverPercent === undefined
          ) {
            return true;
          }
          return foundFlyover.meta.averageCloudCoverPercent <= oldState.maxCCPercentAllowed;
        });
        return {
          selectedDates,
        };
      } else {
        return {
          selectedDates: [],
        };
      }
    });
  };

  getDataUrlFromDate = date => {
    if (this.fetchedImages[date] === undefined) return;
    return this.fetchedImages[date].objectUrl;
  };

  toggleDateSelection = date => {
    this.setState(prevState => {
      let selectedDates;
      if (prevState.selectedDates.includes(date)) {
        selectedDates = prevState.selectedDates.filter(d => d !== date);
      } else {
        selectedDates = [...prevState.selectedDates, date].sort((a, b) => new Date(a) - new Date(b));
      }

      return {
        selectedDates,
      };
    });
  };

  setMaxCCPercentAllowed = valuePercent => {
    this.setState({
      maxCCPercentAllowed: valuePercent,
    });
  };

  scrollToImage = currentDate => {
    const currentNode = this.imagesRefs[currentDate];
    if (currentNode !== undefined) {
      currentNode.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  };

  setCurrentImgonClick = date => {
    this.setState(oldState => {
      const datesForGif = this.datesForGif(oldState.selectedDates, oldState.tooCloudy);
      const indexOfDate = datesForGif.findIndex(el => el === date);
      return {
        sliderValue: indexOfDate,
      };
    });
  };

  updateFilterAndCheckedState = () => {
    this.setState(oldState => {
      const tooCloudy =
        this.props.canWeFilterByClouds && !oldState.loadingData
          ? oldState.allDatesWithImgs.filter(dateTime => {
              const foundFlyover = oldState.allFlyovers.find(flyover =>
                flyover.fromTime.isSame(dateTime, 'second'),
              );
              if (
                foundFlyover === undefined ||
                foundFlyover.meta.averageCloudCoverPercent === 'NaN' ||
                foundFlyover.meta.averageCloudCoverPercent === undefined
              ) {
                return false;
              }

              return foundFlyover.meta.averageCloudCoverPercent > oldState.maxCCPercentAllowed;
            })
          : [];

      return {
        tooCloudy,
      };
    });
  };

  toggleShowOverlayLayers = index => {
    this.setState(
      prevState => {
        const { showOverlayLayers } = prevState;
        showOverlayLayers[index] = {
          ...showOverlayLayers[index],
          checked: !showOverlayLayers[index].checked,
        };
        return { showOverlayLayers: showOverlayLayers };
      },

      () => this.searchDates(),
    );
  };

  setFilterMonths = filterMonths => {
    this.setState({
      filterMonths: filterMonths,
    });
  };

  handleSelectPeriodForBestImg(period) {
    this.setState({ selectedPeriodForBestImg: period.value });
  }

  createIntervalsFromFlyovers() {
    const { allFlyovers, selectedPeriodForBestImg } = this.state;

    if (selectedPeriodForBestImg === 'orbit') {
      return allFlyovers;
    }

    const intervalsForPeriod = [];
    let intervalIndex = 0;
    for (let flyoverIndex = 0; flyoverIndex < allFlyovers.length; flyoverIndex++) {
      if (flyoverIndex === 0) {
        intervalsForPeriod[intervalIndex] = [allFlyovers[flyoverIndex]];
        continue;
      }
      if (
        allFlyovers[flyoverIndex - 1].fromTime.isSame(
          allFlyovers[flyoverIndex].fromTime,
          selectedPeriodForBestImg,
        ) ||
        allFlyovers[flyoverIndex - 1].toTime.isSame(
          allFlyovers[flyoverIndex].toTime,
          selectedPeriodForBestImg,
        ) ||
        allFlyovers[flyoverIndex - 1].fromTime.isSame(
          allFlyovers[flyoverIndex].toTime,
          selectedPeriodForBestImg,
        ) ||
        allFlyovers[flyoverIndex - 1].toTime.isSame(
          allFlyovers[flyoverIndex].fromTime,
          selectedPeriodForBestImg,
        )
      ) {
        intervalsForPeriod[intervalIndex].push(allFlyovers[flyoverIndex]);
      } else {
        intervalIndex++;
        intervalsForPeriod[intervalIndex] = [allFlyovers[flyoverIndex]];
      }
    }

    return intervalsForPeriod;
  }

  getFlyoversForBestImgsFromIntervals(intervals) {
    const { selectedPeriodForBestImg } = this.state;

    if (selectedPeriodForBestImg === 'orbit') {
      return intervals;
    }

    intervals.map(i => i.sort(this.compareFlyoversByImageAndCloudCover));

    let flyoversToReturn = [];
    intervals.map(i => flyoversToReturn.push(i[0]));
    return flyoversToReturn;
  }

  compareFlyoversByImageAndCloudCover = (a, b) => {
    // flyover = {fromTime, toTime, coveragePercent, meta: {averageCloudCoverPercent}}
    if (a.coveragePercent > b.coveragePercent) {
      return -1;
    } else if (a.coveragePercent < b.coveragePercent) {
      return 1;
    } else {
      // (a.coveragePercent === b.coveragePercent)
      if (
        this.props.canWeFilterByClouds &&
        a.meta.averageCloudCoverPercent &&
        b.meta.averageCloudCoverPercent
      ) {
        if (a.meta.averageCloudCoverPercent < b.meta.averageCloudCoverPercent) {
          return -1;
        } else if (a.meta.averageCloudCoverPercent > b.meta.averageCloudCoverPercent) {
          return 1;
        } else {
          // (a.meta.averageCloudCoverPercent === b.meta.averageCloudCoverPercent)
          return 0;
        }
      } else {
        // no averageCloudCoverPercent data
        return 0;
      }
    }
  };

  renderSelectPeriodForBestImg() {
    const { selectedPeriodForBestImg } = this.state;

    return (
      <div className="select-period-container">
        <div className="select-period-label">
          <span>{t`Select 1 image per:`}</span>
        </div>

        <div className="select-period-options">
          {this.PERIODS_FOR_BEST_IMG.map(p => (
            <label
              key={p.value}
              className={`period ${selectedPeriodForBestImg === p.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                checked={selectedPeriodForBestImg === p.value}
                onChange={() => this.handleSelectPeriodForBestImg(p)}
                disabled={!this.state.isSelectPeriodPossible && p.value === 'orbit'}
              />
              {p.text}
            </label>
          ))}
        </div>
      </div>
    );
  }

  render() {
    const {
      dateRange: { from, to },
      selectedDates,
      tooCloudy,
      sliderValue,
      isPlaying,
      error,
      preparingGifCreation,
      intervalSpeed,
      gifCreationProgress,
      maxCCPercentAllowed,
      allDatesWithImgs,
      loadingData,
      allImagesLoading,
      showOverlayLayers,
      selectedPeriodForBestImg,
    } = this.state;
    const { minDate, maxDate } = this.props;
    const datesForGif = selectedDates.filter(date => !tooCloudy.includes(date));
    const isSelectAllChecked = datesForGif.length === allDatesWithImgs.length - tooCloudy.length;

    return (
      <div className="eob-timelapse-panel">
        <AlertContainer ref={a => (this.alertContainer = a)} {...this.alertOptions} />
        <div className="modalTimelapse">
          <h1>{t`Timelapse`}</h1>
          <div className="wrap">
            <div className="side">
              <div className="head">
                <div className="date-range">
                  <EOBDatePicker
                    onSelect={e => this.updateDate('from', e)}
                    selectedDay={moment.utc(from)}
                    minDate={minDate}
                    maxDate={maxDate}
                    onGetAndSetNextPrev={this.props.onGetAndSetNextPrev}
                    onQueryDatesForActiveMonth={this.props.onQueryDatesForActiveMonth}
                  />
                  <span className="datePickerSeparator">-</span>
                  <EOBDatePicker
                    onSelect={e => this.updateDate('to', e)}
                    selectedDay={moment.utc(to)}
                    minDate={minDate}
                    maxDate={maxDate}
                    onGetAndSetNextPrev={this.props.onGetAndSetNextPrev}
                    onQueryDatesForActiveMonth={this.props.onQueryDatesForActiveMonth}
                  />
                </div>

                <div className="filter-months">
                  <EOBFilterSearchByMonths onChange={this.setFilterMonths} />
                </div>

                {this.renderSelectPeriodForBestImg()}

                <EOBButton
                  className="search-button"
                  disabled={loadingData}
                  onClick={() => !allImagesLoading && this.searchDates()}
                  text={t`Search`}
                  icon={'search'}
                  loading={allImagesLoading || loadingData}
                />
              </div>

              <div className="overlays">
                {this.props.overlayLayers &&
                  this.props.overlayLayers.length > 0 &&
                  showOverlayLayers.map((layer, index) => (
                    <div className="checkbox left-checkbox" key={index}>
                      <label className="left">
                        <input
                          type="checkbox"
                          checked={layer.checked}
                          value={layer.checked}
                          disabled={allImagesLoading || loadingData}
                          onChange={() => this.toggleShowOverlayLayers(index)}
                        />
                        {layer.name}
                      </label>
                    </div>
                  ))}
              </div>

              <div className="filter-tools">
                {this.props.canWeFilterByClouds ? (
                  <div className="ccslider">
                    <EOBCCSlider
                      sliderWidth={100}
                      onChange={this.setMaxCCPercentAllowed}
                      cloudCoverPercentage={Math.round(maxCCPercentAllowed)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="select-all checkbox left-checkbox">
                <label className="left">
                  <input
                    type="checkbox"
                    checked={isSelectAllChecked}
                    value={isSelectAllChecked}
                    onChange={() => this.isSelectAllCheckedChange(isSelectAllChecked)}
                  />
                  {t`Select All`}
                </label>
              </div>

              <div className="images">
                {loadingData ? (
                  <span className="loader" />
                ) : error ? (
                  <div style={{ color: 'red' }}>{error}</div>
                ) : (
                  allDatesWithImgs.map(date => {
                    const currDate = datesForGif[sliderValue];
                    return (
                      <div
                        className={
                          tooCloudy.includes(date)
                            ? 'cloudy'
                            : date === currDate
                            ? 'active current-date'
                            : selectedDates.includes(date)
                            ? 'active'
                            : 'false'
                        }
                        key={`${date}`}
                      >
                        {tooCloudy.includes(date) ? (
                          <i className="fa fa-cloud" />
                        ) : (
                          <span
                            onClick={() => this.toggleDateSelection(date)}
                            ref={elem => (this.imagesRefs[date] = elem)}
                            id={date}
                          />
                        )}

                        <img
                          src={this.getDataUrlFromDate(date)}
                          alt=""
                          onClick={() => this.setCurrentImgonClick(date)}
                        />
                        <i>
                          {selectedPeriodForBestImg === 'orbit'
                            ? moment.utc(date).format('YYYY-MM-DD HH:mm:ss')
                            : moment.utc(date).format('YYYY-MM-DD')}
                        </i>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="content">
              <Preview
                error={error}
                loading={loadingData || allImagesLoading}
                currDate={datesForGif[sliderValue]}
                getDataUrlFromDate={this.getDataUrlFromDate}
                gifCreationProgress={gifCreationProgress}
                preparingGifCreation={preparingGifCreation}
                noData={datesForGif.length === 0}
              />

              {datesForGif.length !== 0 && !allImagesLoading ? (
                <Controls
                  togglePlay={() => this.togglePlay(!isPlaying)}
                  isPlaying={isPlaying}
                  intervalSpeed={intervalSpeed}
                  updateIntervalSpeed={this.updateIntervalSpeed}
                  sliderValue={sliderValue}
                  selectedDates={datesForGif}
                  createGIF={() => this.createGif(datesForGif)}
                  preparingGifCreation={preparingGifCreation}
                  changeSliderValue={this.changeSliderValue}
                  stopGifPreviewLoop={this.stopGifPreviewLoop}
                  selectedPeriodForBestImg={selectedPeriodForBestImg}
                />
              ) : null}
            </div>
          </div>
          <i className="fa fa-close" onClick={this.props.onClose} />
        </div>
      </div>
    );
  }
}

const Preview = ({
  gifCreationProgress,
  error,
  getDataUrlFromDate,
  currDate,
  preparingGifCreation,
  loading,
  noData,
}) => (
  <div className="preview">
    {preparingGifCreation ? (
      <GifProgressBar progress={gifCreationProgress} />
    ) : error ? (
      <div className="error">
        {t`An error occured:`} {error}
      </div>
    ) : loading ? (
      <div className="loader" />
    ) : noData ? (
      <p>{t`No images selected`}</p>
    ) : currDate ? (
      <div className="wrapper">
        <img src={getDataUrlFromDate(currDate)} alt="" />
      </div>
    ) : null}
  </div>
);

const Controls = ({
  togglePlay,
  isPlaying,
  intervalSpeed,
  updateIntervalSpeed,
  sliderValue,
  selectedDates,
  createGIF,
  preparingGifCreation,
  changeSliderValue,
  stopGifPreviewLoop,
  selectedPeriodForBestImg,
}) => (
  <div className="controls">
    {
      // eslint-disable-next-line
      <a className="ctrl" onClick={togglePlay}>
        <span className={isPlaying ? 'pause' : 'play'} />
      </a>
    }
    <span className="intervalPanel">
      {t`Speed:`}
      <input
        value={intervalSpeed}
        onChange={updateIntervalSpeed}
        type="number"
        min={1}
        max={10}
        style={{ width: '30px' }}
      />{' '}
      {t`frames / s`}
    </span>
    <RCSlider
      min={0}
      disabled={selectedDates.length === 0}
      max={selectedDates.length - 1}
      step={1}
      onBeforeChange={() => stopGifPreviewLoop()}
      onChange={changeSliderValue}
      value={sliderValue}
      tipFormatter={value => selectedDates[value]}
      className="timeline-slider"
    />
    <small className={`timeline-label per-${selectedPeriodForBestImg}`}>
      {sliderValue + 1} / {selectedDates.length}:{' '}
      {selectedPeriodForBestImg === 'orbit'
        ? selectedDates[sliderValue]
        : moment.utc(selectedDates[sliderValue]).format('YYYY-MM-DD')}
    </small>

    <EOBButton
      disabled={preparingGifCreation}
      loading={preparingGifCreation}
      onClick={() => createGIF()}
      text={preparingGifCreation ? t`Preparing...` : t`Download`}
      className="timelapse-download-btn"
    />
  </div>
);

const GifProgressBar = ({ progress }) => (
  <div className="myProgress">
    <div className="myBar" style={{ width: `${progress * 100}%` }} />
  </div>
);
