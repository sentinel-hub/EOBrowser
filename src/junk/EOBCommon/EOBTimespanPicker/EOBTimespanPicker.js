import React, { Component } from 'react';
import moment from 'moment';
import { t } from 'ttag';

import EOBDatePicker from '../EOBDatePicker/EOBDatePicker';
import './EOBTimespanPicker.scss';

const NumericInput = ({ label, value, min, max, setValue }) => (
  <div className="numeric-input">
    <label className="input-label"> {label}</label>
    <input
      className="input-value"
      type="text"
      min={min}
      max={max}
      value={value}
      onChange={e => {
        if (parseInt(e.target.value) < min || parseInt(e.target.value) > max) {
          return;
        }
        setValue(e.target.value);
      }}
    />
    <div className="spinner">
      <div className="up" onClick={() => setValue(parseInt(value) + 1)}>
        <i className="fa fa-caret-up" />
      </div>
      <div className="down" onClick={() => setValue(parseInt(value) - 1)}>
        <i className="fa fa-caret-down" />
      </div>
    </div>
  </div>
);

class DateTimeInput extends Component {
  setHours = hours => {
    const { value, valueKey } = this.props;
    const minutesValue = moment.utc(value).format('mm');
    this.props.setDateTimeValue(valueKey, moment.utc(value).format('YYYY-MM-DD'), hours, minutesValue);
  };

  setMinutes = minutes => {
    const { value, valueKey } = this.props;
    const hoursValue = moment.utc(value).format('HH');
    this.props.setDateTimeValue(valueKey, moment.utc(value).format('YYYY-MM-DD'), hoursValue, minutes);
  };

  render() {
    const { value, label, valueKey } = this.props;
    const date = moment.utc(value).format('YYYY-MM-DD');
    const hours = moment.utc(value).format('HH');
    const minutes = moment.utc(value).format('mm');

    if (!value) {
      return null;
    }

    return (
      <div className="date-time-input">
        <div className="date-time-input-label">{label}</div>
        <div className="date-input">
          <EOBDatePicker
            onSelect={v =>
              this.props.setDateTimeValue(valueKey, moment(v).format('YYYY-MM-DD'), hours, minutes)
            }
            selectedDay={moment.utc(date)}
            alignment={'lt'}
            minDate={this.props.minDate}
            maxDate={this.props.maxDate}
            onQueryDatesForActiveMonth={this.props.onQueryDatesForActiveMonth}
          />
        </div>
        <div className="time-input">
          <div>
            <i className={`fa fa-clock-o`} />
          </div>
          <div className="time-input-hours-minutes">
            <NumericInput label={t`hh`} min="0" max="23" value={hours} setValue={this.setHours} />
          </div>
          <div className="time-input-hours-minutes">:</div>
          <div className="time-input-hours-minutes">
            <NumericInput label={t`mm`} min="0" max="59" value={minutes} setValue={this.setMinutes} />
          </div>
        </div>
      </div>
    );
  }
}

export class EOBTimespanPicker extends Component {
  static defaultProps = {
    applyTimespan: value => {},
    initialTimespan: null,
    maxDate: null,
    minDate: null,
    onQueryDatesForActiveMonth: () => new Promise((resolve, reject) => resolve([])),
    autoApply: false,
  };

  state = {
    dateTimeFrom: null,
    dateTimeTo: null,
  };

  componentDidMount() {
    this.handleInitialTimespan();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.initialTimespan !== this.props.initialTimespan) {
      this.handleInitialTimespan();
    }
  }

  handleInitialTimespan = () => {
    const [dateTimeFrom, dateTimeTo] = this.props.initialTimespan.split('/');
    this.setState({
      dateTimeFrom: dateTimeFrom,
      dateTimeTo: dateTimeTo,
    });
  };

  apply = () => {
    const { dateTimeFrom, dateTimeTo } = this.state;
    const result = `${moment.utc(dateTimeFrom).format()}/${moment.utc(dateTimeTo).format()}`;
    this.props.applyTimespan(result);
  };

  setDateTimeValue = (key, date, hours, minutes) => {
    let newDate = moment
      .utc(date)
      .hour(parseInt(hours))
      .minute(parseInt(minutes))
      .format();

    const { dateTimeFrom, dateTimeTo } = this.state;
    const { autoApply } = this.props;

    if (key === 'dateTimeFrom') {
      // Start of interval shouldn't be after interval end
      newDate = moment.min(moment.utc(newDate), moment.utc(dateTimeTo)).format();
    }

    if (key === 'dateTimeTo') {
      // End of interval shouldn't be before interval start
      newDate = moment.max(moment.utc(newDate), moment.utc(dateTimeFrom)).format();
    }

    this.setState(
      {
        [key]: newDate,
      },
      autoApply ? this.apply : undefined,
    );
  };

  render() {
    const { dateTimeFrom, dateTimeTo } = this.state;
    const { autoApply } = this.props;

    return (
      <div className="timespan-picker">
        <DateTimeInput
          label={t`From:`}
          value={dateTimeFrom}
          valueKey="dateTimeFrom"
          setDateTimeValue={this.setDateTimeValue}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          onQueryDatesForActiveMonth={this.props.onQueryDatesForActiveMonth}
        />
        <DateTimeInput
          label={t`Until:`}
          value={dateTimeTo}
          valueKey="dateTimeTo"
          setDateTimeValue={this.setDateTimeValue}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          onQueryDatesForActiveMonth={this.props.onQueryDatesForActiveMonth}
        />
        {!autoApply && (
          <div className="apply-button">
            <button className="btn" onClick={this.apply}>
              {t`Apply`}
            </button>
          </div>
        )}
      </div>
    );
  }
}
