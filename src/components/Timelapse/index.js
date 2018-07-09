import React, { Component } from 'react';
import Store from '../../store';
import moment from 'moment';
import 'react-toggle/style.css';
import RCSlider from 'rc-slider';
import CCSlider from '../CCSlider';
import AlertContainer from 'react-alert';
import gifshot from 'gifshot';
import FileSaver from 'file-saver';
import { fetchDates, getCurrentBboxUrl, fetchBlobObj, getCC } from './timelapseUtils';
import DayPicker from '../DayPicker';
import Button from '../Button';
import './Timelapse.scss';

export default class Timelapse extends Component {
  MAX_COUNT = 300;
  fetchedImages = [];
  state = {
    ccWithDates: [],
    maxCCAllowed: 0.5,
    allDates: [],
    selectedDates: [],
    tooCloudy: [],
    isSelectAllChecked: true,
    sliderValue: 0,
    intervalSpeed: 1,
    dateRange: {
      from: moment(Store.current.selectedResult.time)
        .subtract(1, 'months')
        .format('YYYY-MM-DD'),
      to: Store.current.selectedResult.time,
    },
    isPlaying: false,
    imgUrl: getCurrentBboxUrl(),
    gifCreationProgress: null,
    preparingGifCreation: false,
    loadingCloudCoverage: false,
    loadingDates: false,
    allImagesLoading: false,
  };

  layerName = Store.current.selectedResult.name;
  canWeFilterByClouds = Store.current.cloudCoverageLayers[this.layerName] !== undefined;

  alertOptions = {
    offset: 14,
    position: 'top center',
    theme: 'dark',
    time: 4000,
    transition: 'scale',
  };
  componentDidMount() {
    this.searchDates();
  }

  componentWillMount() {
    this.timer && this.clearInterval(this.timer);
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
        this.state.selectedDates.length === this.state.allDates.length - this.state.tooCloudy.length;
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
  }
  datesForGif = (selectedDates, tooCloudy) => {
    return selectedDates.filter(date => !tooCloudy.includes(date));
  };
  showAlert = errMsg => {
    this.alertContainer.show(errMsg, { type: 'info' });
  };

  searchDates = () => {
    this.stopGifPreviewLoop();
    this.fetchedImages = [];
    this.setState({
      allDates: [],
      tooCloudy: [],
      selectedDates: [],
      ccWithDates: [],
      loadingDates: true,
    });
    fetchDates(this.state.dateRange, this.MAX_COUNT, this.state.maxCC)
      .then(res => {
        const dates = res.reverse();
        if (dates.length === this.MAX_COUNT) {
          this.showAlert(`Maximum number of images is ${this.MAX_COUNT}`);
        }
        this.fetchImages(dates);
      })
      .catch(e => {
        this.setState({ error: 'Error querying dates.' });
      })
      .then(() => {
        this.setState({
          loadingDates: false,
        });
      });

    if (this.canWeFilterByClouds) {
      this.setState({
        loadingCloudCoverage: true,
      });
      getCC(this.state.dateRange)
        .then(data => {
          this.setState(
            {
              ccWithDates: data,
            },
            this.updateFilterAndCheckedState(),
          );
        })
        .catch(err => {
          this.setState({
            error: 'Error fetching cloudcoverage ',
          });
        })
        .then(() => {
          this.setState({
            loadingCloudCoverage: false,
          });
        });
    }
  };

  updateDate = (key, date) => {
    this.stopGifPreviewLoop();
    this.setState(oldState => {
      const newDateRange = oldState.dateRange;
      newDateRange[key] = date.format ? date.format('YYYY-MM-DD') : date;
      return { dateRange: newDateRange };
    });
  };

  fetchImages = datesArray => {
    this.setState({ allImagesLoading: true });
    const imgUrlArr = datesArray.map(date => {
      return {
        url: `${getCurrentBboxUrl()}&SHOWLOGO=FALSE&time=${date}/${date}`,
        date: date,
      };
    });
    const allImagesPromises = imgUrlArr.map(imgUrl => {
      return fetchBlobObj(imgUrl)
        .then(response => {
          const dateToBeAdded = response.date;
          this.fetchedImages[dateToBeAdded] = response;

          this.setState(oldState => {
            const allDates = [...oldState.allDates, dateToBeAdded].sort((a, b) => new Date(a) - new Date(b));
            const selectedDates = [...oldState.selectedDates, dateToBeAdded].sort(
              (a, b) => new Date(a) - new Date(b),
            );
            this.updateFilterAndCheckedState();
            return {
              allDates,
              selectedDates,
            };
          });
        })
        .catch(err => {
          console.log(err);
        });
    });

    Promise.all(allImagesPromises).then(() => {
      this.setState({ allImagesLoading: false });
    });
  };

  triggerUserDownload = blob => {
    const { name } = Store.current.selectedResult;
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
        const selectedDates = oldState.allDates.filter(date => {
          if (!this.canWeFilterByClouds) {
            return true;
          }
          const ccDate = oldState.ccWithDates.find(dateCC => dateCC.date === date);
          if (ccDate === undefined) {
            return false;
          }
          if (ccDate.basicStats.mean === 'NaN') return true;
          return ccDate.basicStats.mean <= oldState.maxCCAllowed;
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

  setMaxCCAlowed = valuePercent => {
    this.setState(
      {
        maxCCAllowed: valuePercent / 100.0,
      },
      this.updateFilterAndCheckedState(),
    );
  };

  scrollToImage = currentDate => {
    const currentNode = this.refs[currentDate];
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
        this.canWeFilterByClouds && !oldState.loadingCloudCoverage
          ? oldState.allDates.filter(date => {
              const ccDate = oldState.ccWithDates.find(d => d.date === date);
              if (ccDate === undefined || ccDate.basicStats.mean === 'NaN') {
                return false;
              }

              return ccDate.basicStats.mean > oldState.maxCCAllowed;
            })
          : [];

      return {
        tooCloudy,
      };
    });
  };
  render() {
    const {
      dateRange: { from, to },
      selectedDates,
      tooCloudy,
      sliderValue,
      isPlaying,
      error,
      loading,
      preparingGifCreation,
      intervalSpeed,
      gifCreationProgress,
      maxCCAllowed,
      allDates,
      loadingCloudCoverage,
      allImagesLoading,
    } = this.state;

    const datesForGif = selectedDates.filter(date => !tooCloudy.includes(date));
    const isSelectAllChecked = datesForGif.length === allDates.length - tooCloudy.length;

    return (
      <div>
        <AlertContainer ref={a => (this.alertContainer = a)} {...this.alertOptions} />
        <div className="wrapHolder">
          <h1>Timelapse</h1>
          <div className="wrap">
            <div className="side">
              <div className="head">
                <div className="date-range">
                  <DayPicker onSelect={e => this.updateDate('from', e)} selectedDay={from} />
                  <span className="datePickerSeparator">-</span>
                  <DayPicker onSelect={e => this.updateDate('to', e)} selectedDay={to} />
                </div>

                {!allImagesLoading ? (
                  <Button
                    className={'centeredFa'}
                    disabled={loading}
                    onClick={() => !loading && this.searchDates()}
                    text={''}
                    icon={'search'}
                  />
                ) : (
                  <div className="loader" />
                )}
              </div>
              <div className="filter-tools">
                {this.canWeFilterByClouds ? (
                  <div className="ccslider">
                    <CCSlider
                      sliderWidth={100}
                      onChange={this.setMaxCCAlowed}
                      cloudCoverPercentage={Math.round(maxCCAllowed * 100)}
                    />
                  </div>
                ) : null}

                <div className="checkbox left-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={isSelectAllChecked}
                      value={isSelectAllChecked}
                      onChange={() => this.isSelectAllCheckedChange(isSelectAllChecked)}
                    />Select All
                  </label>
                </div>
              </div>

              <div className="images">
                {loadingCloudCoverage ? (
                  <span className="loader" />
                ) : error ? (
                  <div style={{ color: 'red' }}>{error}</div>
                ) : (
                  allDates.map(date => {
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
                        <span onClick={() => this.toggleDateSelection(date)} ref={date} id={date} />
                        <img
                          src={this.getDataUrlFromDate(date)}
                          alt=""
                          onClick={() => this.setCurrentImgonClick(date)}
                        />
                        <i>{date}</i>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="content">
              <Preview
                error={error}
                loading={loadingCloudCoverage}
                currDate={datesForGif[sliderValue]}
                getDataUrlFromDate={this.getDataUrlFromDate}
                gifCreationProgress={gifCreationProgress}
                preparingGifCreation={preparingGifCreation}
                noData={datesForGif.length === 0}
              />

              {datesForGif.length !== 0 && !loading ? (
                <Controls
                  togglePlay={() => this.togglePlay(!isPlaying)}
                  isPlaying={isPlaying}
                  intervalSpeed={intervalSpeed}
                  updateIntervalSpeed={this.updateIntervalSpeed}
                  sliderValue={sliderValue}
                  selectedDates={datesForGif}
                  createGIF={() => this.createGif(datesForGif)}
                  stopGifPreviewLoop={this.stopGifPreviewLoop}
                  changeSliderValue={this.changeSliderValue}
                  preparingGifCreation={preparingGifCreation}
                />
              ) : null}
            </div>
          </div>
          <a className="closeWindow" onClick={() => this.props.onClose()}>
            {' '}
          </a>
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
      <div className="error">An error occured: {error}</div>
    ) : loading ? (
      <div className="loader" />
    ) : noData ? (
      <p>No images selected</p>
    ) : currDate ? (
      <div>
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
  loading,
}) => (
  <div className="controls">
    <a className="ctrl" onClick={togglePlay}>
      <span className={isPlaying ? 'pause' : 'play'} />
    </a>
    <span className="intervalPanel">
      Speed:
      <input
        value={intervalSpeed}
        onChange={updateIntervalSpeed}
        type="number"
        min={1}
        max={10}
        style={{ width: '30px' }}
      />{' '}
      frames / s
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
    />
    <small>
      {sliderValue + 1} / {selectedDates.length}: {selectedDates[sliderValue]}
    </small>

    <Button
      disabled={preparingGifCreation}
      onClick={() => createGIF()}
      text={preparingGifCreation ? 'Preparing...' : 'Download'}
    />
  </div>
);

const GifProgressBar = ({ progress }) => (
  <div className="myProgress">
    <div className="myBar" style={{ width: `${progress * 100}%` }} />
  </div>
);
