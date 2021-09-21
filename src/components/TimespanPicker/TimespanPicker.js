import React, { Component } from 'react';
import { t } from 'ttag';

import { DateTimeInput } from './DateTimeInput';
import './TimespanPicker.scss';

export class TimespanPicker extends Component {
  state = {
    fromTime: null,
    toTime: null,
  };

  componentDidMount() {
    this.handleTimespan();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.timespan !== this.props.timespan) {
      this.handleTimespan();
    }
  }

  handleTimespan = () => {
    const { fromTime, toTime } = this.props.timespan;
    this.setState({
      fromTime: fromTime.clone(),
      toTime: toTime.clone(),
    });
  };

  apply = () => {
    const { fromTime, toTime } = this.state;
    this.props.applyTimespan(fromTime, toTime);
  };

  setFromTime = (time) => {
    const { autoApply } = this.props;
    this.setState(
      {
        fromTime: time.clone(),
      },
      autoApply ? this.apply : undefined,
    );
  };

  setToTime = (time) => {
    const { autoApply } = this.props;
    this.setState(
      {
        toTime: time.clone(),
      },
      autoApply ? this.apply : undefined,
    );
  };

  render() {
    const { fromTime, toTime } = this.state;
    const { id, autoApply, onQueryDatesForActiveMonth } = this.props;

    return (
      <div className="timespan-picker">
        <DateTimeInput
          id={`${id}-from`}
          label={t`From:`}
          calendarContainer={this.calendarHolder}
          selectedTime={fromTime}
          setSelectedTime={this.setFromTime}
          minDate={this.props.minDate}
          maxDate={toTime}
          onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        />
        <DateTimeInput
          id={`${id}-to`}
          label={t`Until:`}
          calendarContainer={this.calendarHolder}
          selectedTime={toTime}
          setSelectedTime={this.setToTime}
          minDate={fromTime}
          maxDate={this.props.maxDate}
          onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
        />
        <div className="timespan-calendar-holder" ref={(e) => (this.calendarHolder = e)} />
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
