import React, { Component } from 'react';
import keyBy from 'lodash/keyBy';
import Store from '../../store';
import moment from 'moment';
import 'react-toggle/style.css';
import RCSlider from 'rc-slider';
import AlertContainer from 'react-alert';
import gifshot from 'gifshot';
import FileSaver from 'file-saver';
import { queryDates, getCurrentBboxUrl, fetchBlobObjs } from './timelapseUtils';
import DatePicker from '../DatePicker';
import { queryActiveMonth } from '../../utils/ajax';
import Button from '../Button';
import './Timelapse.scss';

export default class Timelapse extends Component {
  MAX_COUNT = 200;
  fetchedImages = [];
  state = {
    maxCC: 50,
    dates: [],
    isSelectAllChecked: true,
    sliderValue: 0,
    intervalSpeed: 1,
    dateRange: {
      from: moment()
        .subtract(1, 'months')
        .format('YYYY-MM-DD'),
      to: moment().format('YYYY-MM-DD')
    },
    isPlaying: false,
    selectedDates: [],
    imgUrl: getCurrentBboxUrl(),
    progress: null,
    preparing: false
  };

  alertOptions = {
    offset: 14,
    position: 'top center',
    theme: 'dark',
    time: 4000,
    transition: 'scale'
  };
  componentDidMount() {
    this.searchDates();
  }

  componentWillMount() {
    this.timer && this.clearInterval(this.timer);
  }

  componentDidUpdate(prevProps, oldState) {
    const didPlayStopChange = oldState.isPlaying !== this.state.isPlaying;
    const didSelectedDatesChange =
      oldState.selectedDates !== this.state.selectedDates;
    const didIntervalSpeedChange =
      oldState.intervalSpeed !== this.state.intervalSpeed;

    if (didPlayStopChange) {
      if (this.state.isPlaying) {
        this.startGifPreviewLoop(this.state.intervalSpeed);
      } else {
        this.stopGifPreviewLoop();
      }
    }

    if (didSelectedDatesChange) {
      if (this.state.selectedDates.length === 0) {
        this.stopGifPreviewLoop();
        this.resetSlider();
      } else {
        this.state.isPlaying &&
          this.startGifPreviewLoop(this.state.intervalSpeed);
      }
    }
    if (didIntervalSpeedChange) {
      this.state.isPlaying &&
        this.startGifPreviewLoop(this.state.intervalSpeed);
    }
  }

  showAlert = errMsg => {
    this.alertContainer.show(errMsg, { type: 'info' });
  };

  maxCcHandler = e => {
    this.setState({ maxCC: e.target.value });
  };

  searchDates = () => {
    this.stopGifPreviewLoop();
    this.setState({
      loading: true,
      selectedDates: [],
      dates: []
    });

    queryDates(this.state.dateRange, this.MAX_COUNT, this.state.maxCC)
      .then(res => {
        const dates = res.reverse();
        if (dates.length === this.MAX_COUNT) {
          this.showAlert(`Maximum number of images is ${this.MAX_COUNT}`);
        }
        this.setState({
          dates,
          selectedDates: dates,
          isSelectAllChecked: true
        });
        this.fetchImages(dates);
      })
      .catch(e => {
        this.setState({ error: 'Error querying dates.', loading: false });
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

  fetchImages = dates => {
    const imgUrlArr = dates.map(date => {
      return {
        url: `${getCurrentBboxUrl()}&SHOWLOGO=FALSE&time=${date}/${date}`,
        date: date
      };
    });

    fetchBlobObjs(imgUrlArr)
      .then(fetchedImages => {
        const succeededImgs = fetchedImages.filter(img => img.success);
        this.fetchedImages = keyBy(succeededImgs, 'date');
        const successfulDates = succeededImgs.map(d => d.date);
        if (successfulDates.length !== dates.length) {
          this.showAlert('Not all images retrieved, please try again');
        }
        this.setState({
          dates: successfulDates,
          selectedDates: successfulDates,
          loading: false,
          error: null
        });
      })
      .catch(err => {
        console.log(err);
        this.fetchedImages = [];
        this.setState({
          error: 'Error getting all images.',
          loading: false,
          dates: []
        });
      });
  };

  toggleDateSelection = date => {
    this.setState(prevState => {
      const mustRemove = prevState.selectedDates.includes(date);
      let selectedDates;
      if (mustRemove) {
        selectedDates = prevState.selectedDates.filter(d => d !== date);
      } else {
        selectedDates = [...prevState.selectedDates, date].sort(
          (a, b) => new Date(a) - new Date(b)
        );
      }
      const isSelectAllChecked =
        selectedDates.length === prevState.dates.length;
      return {
        selectedDates,
        isSelectAllChecked
      };
    });
  };

  triggerUserDownload = blob => {
    const { name } = Store.current.selectedResult;
    FileSaver.saveAs(blob, `${name.replace(' ', '_')}-timelapse.gif`);
  };

  createGif = () => {
    if (this.state.selectedDates.length === 0) return;
    this.setState({ error: null, preparing: true });
    gifshot.createGIF(
      {
        images: this.state.selectedDates.map(date =>
          this.getDataUrlFromDate(date)
        ),
        gifWidth: 512,
        interval: 1 / this.state.intervalSpeed,
        //frameDuration: 5,
        gifHeight: 512,
        numWorkers: 4,
        sampleInterval: 20,
        progressCallback: progress => {
          this.setState({ progress: progress });
        }
      },
      obj => {
        if (obj.error) {
          this.setState({ error: obj.error, preparing: false });
        } else {
          this.setState({
            preparing: false,
            progress: null
          });
          this.triggerUserDownload(obj.image);
        }
      }
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
      const sliderValue =
        oldState.sliderValue === oldState.selectedDates.length - 1
          ? 0
          : oldState.sliderValue + 1;
      return {
        sliderValue,
        currDate: oldState.selectedDates[sliderValue]
      };
    });
  };

  togglePlay = shouldPlay => {
    this.setState({ isPlaying: shouldPlay });
  };

  updateIntervalSpeed = e => {
    this.setState({ intervalSpeed: e.target.value });
  };

  isSelectAllCheckedChange = () => {
    this.setState(oldState => {
      if (!oldState.isSelectAllChecked) {
        return {
          selectedDates: oldState.dates,
          isSelectAllChecked: true
        };
      } else {
        return {
          selectedDates: [],
          isSelectAllChecked: false
        };
      }
    });
  };

  getDataUrlFromDate = date => {
    return this.fetchedImages[date].objectUrl;
  };

  render() {
    const {
      dateRange: { from, to },
      selectedDates,
      sliderValue,
      isPlaying,
      error,
      loading,
      preparing,
      intervalSpeed,
      progress,
      maxCC
    } = this.state;
    const { datasource } = this.props;
    return (
      <div>
        <AlertContainer
          ref={a => (this.alertContainer = a)}
          {...this.alertOptions}
        />
        <div className="wrapHolder">
          <h1>Timelapse</h1>
          <div className="wrap">
            <div className="side">
              <div className="head">
                <div className="date-range">
                  <DatePicker
                    className="inlineDatepicker"
                    onNavClick={(from, to) =>
                      queryActiveMonth({ from, to, datasource })
                    }
                    defaultValue={from}
                    onExpand={() =>
                      queryActiveMonth({ singleDate: from, datasource })
                    }
                    onSelect={e => this.updateDate('from', e)}
                  />
                  <span className="datePickerSeparator">-</span>
                  <DatePicker
                    className="inlineDatepicker"
                    onNavClick={(from, to) =>
                      queryActiveMonth({ from, to, datasource })
                    }
                    defaultValue={to}
                    onExpand={() =>
                      queryActiveMonth({ singleDate: to, datasource })
                    }
                    onSelect={e => this.updateDate('to', e)}
                  />
                </div>

                <div className="maxCC">
                  <i className="fa fa-cloud " />
                  <span>
                    <div className="react-flex react-flex-v2--align-items-center react-flex-v2--row react-flex-v2--display-inline-flex">
                      <input
                        className="react-date-field__input"
                        type="text"
                        placeholder={20}
                        min={0}
                        max={100}
                        style={{ maxWidth: '25px' }}
                        defaultValue={maxCC}
                        onChange={this.maxCcHandler}
                      />
                    </div>%
                  </span>
                </div>
                <Button
                  className={'centeredFa'}
                  disabled={loading}
                  onClick={() => !loading && this.searchDates()}
                  text={''}
                  icon={'search'}
                />
              </div>
              <div className="checkbox left-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={this.state.isSelectAllChecked}
                    value={this.state.isSelectAllChecked}
                    onChange={this.isSelectAllCheckedChange}
                  />Select All
                </label>
              </div>
              <div className="images">
                {loading ? (
                  <span className="loader" />
                ) : error ? (
                  <div style={{ color: 'red' }}>{error}</div>
                ) : (
                  this.state.dates.map(date => {
                    return (
                      <span
                        className={selectedDates.includes(date) && 'active'}
                        onClick={() => this.toggleDateSelection(date)}
                        key={date.valueOf()}
                        id={date}
                      >
                        <img
                          src={this.getDataUrlFromDate(date)}
                          alt="timelapse"
                        />
                        <i>{date}</i>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            <div className="content">
              <Preview
                error={error}
                loading={loading}
                currDate={selectedDates[sliderValue]}
                getDataUrlFromDate={this.getDataUrlFromDate}
                progress={progress}
                preparing={preparing}
              />
              {selectedDates.length !== 0 && !loading ? (
                <Controls
                  togglePlay={() => this.togglePlay(!isPlaying)}
                  isPlaying={isPlaying}
                  intervalSpeed={intervalSpeed}
                  updateIntervalSpeed={this.updateIntervalSpeed}
                  sliderValue={sliderValue}
                  selectedDates={selectedDates}
                  createGIF={this.createGif}
                  stopGifPreviewLoop={this.stopGifPreviewLoop}
                  changeSliderValue={this.changeSliderValue}
                  preparing={preparing}
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
  progress,
  error,
  getDataUrlFromDate,
  currDate,
  preparing,
  loading
}) => (
  <div className="preview">
    {preparing ? (
      <ProgressBar progress={progress} />
    ) : error ? (
      <div className="error">An error occured: {error}</div>
    ) : currDate && !loading ? (
      <img src={getDataUrlFromDate(currDate)} alt="" />
    ) : (
      <div className="loader" />
    )}
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
  preparing,
  changeSliderValue,
  stopGifPreviewLoop,
  loading
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
    />
    <small>
      {sliderValue + 1} / {selectedDates.length}: {selectedDates[sliderValue]}
    </small>

    <Button
      disabled={preparing}
      onClick={() => createGIF()}
      text={preparing ? 'Preparing...' : 'Download'}
    />
  </div>
);

const ProgressBar = ({ progress }) => (
  <div className="myProgress">
    <div className="myBar" style={{ width: `${progress * 100}%` }} />
  </div>
);
