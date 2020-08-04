import React, { Component } from 'react';
import moment from 'moment';
import { t } from 'ttag';

import EOBDatePicker from '../../EOBCommon/EOBDatePicker/EOBDatePicker';
import { EOBTimespanPicker } from '../../EOBCommon/EOBTimespanPicker/EOBTimespanPicker';
import './EOBVisualizationTimeSelect.scss';

export class EOBVisualizationTimeSelect extends Component {
  static defaultProps = {
    maxDate: null,
    minDate: null,
    onGetAndSetNextPrev: () => {},
    onQueryDatesForActiveMonth: () => {},
    showNextPrev: false,
    updateTimespan: value => {},
    timespanSupported: true,
    fromTime: null,
    toTime: null,
  };

  state = {
    timespanExpanded: false,
  };

  updateTimespan = time => {
    this.props.updateSelectedTime(time);
  };

  updateDate = date => {
    this.props.updateSelectedTime(moment(date).format('YYYY-MM-DD'));
  };

  toggleTimespan = () => {
    this.setState(
      prevState => {
        return { timespanExpanded: !prevState.timespanExpanded };
      },
      () => {
        if (!this.state.timespanExpanded) {
          this.props.updateSelectedTime(
            this.props.toTime
              .clone()
              .utc()
              .format('YYYY-MM-DD'),
          );
        }
      },
    );
  };

  render() {
    const {
      maxDate,
      minDate,
      onGetAndSetNextPrev,
      onQueryDatesForActiveMonth,
      showNextPrev,
      fromTime,
      toTime,
      timespanSupported,
    } = this.props;
    const { timespanExpanded } = this.state;
    if (!toTime) {
      return null;
    }

    if (!timespanSupported) {
      return (
        <div className="visualization-time-select">
          <b className="time-select-type">{t`Date`}:</b>
          <EOBDatePicker
            onSelect={this.updateDate}
            selectedDay={toTime.clone().startOf('day')}
            showNextPrev={showNextPrev}
            minDate={minDate}
            maxDate={maxDate}
            onGetAndSetNextPrev={onGetAndSetNextPrev}
            onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
          />
          <div />
        </div>
      );
    }

    return (
      <>
        <div className="visualization-time-select">
          <b className="time-select-type"> {timespanExpanded ? t`Timespan:` : t`Date:`}</b>
          {!timespanExpanded && (
            <EOBDatePicker
              onSelect={this.updateDate}
              selectedDay={toTime.clone().startOf('day')}
              showNextPrev={showNextPrev}
              minDate={minDate}
              maxDate={maxDate}
              onGetAndSetNextPrev={onGetAndSetNextPrev}
              onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
            />
          )}
          {timespanExpanded && (
            <div className="timespan-label" onClick={this.toggleTimespan}>
              {`${fromTime
                .clone()
                .utc()
                .format('YYYY-MM-DD HH:mm')} - ${toTime
                .clone()
                .utc()
                .format('YYYY-MM-DD HH:mm')}`}
            </div>
          )}
          <div className="timespan-toggle" onClick={this.toggleTimespan}>
            {timespanExpanded ? t`Single date` : t`Timespan`}
          </div>
        </div>
        {timespanExpanded && (
          <EOBTimespanPicker
            initialTimespan={`${fromTime.toISOString()}/${toTime.toISOString()}`}
            applyTimespan={this.updateTimespan}
            minDate={minDate}
            maxDate={maxDate}
            onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
          />
        )}
      </>
    );
  }
}
