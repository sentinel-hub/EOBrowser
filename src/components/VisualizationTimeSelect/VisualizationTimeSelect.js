import React, { Component } from 'react';
import { t } from 'ttag';

import DatePicker from '../DatePicker/DatePicker';
import { TimespanPicker } from '../../components/TimespanPicker/TimespanPicker';
import './VisualizationTimeSelect.scss';

export class VisualizationTimeSelect extends Component {
  state = {
    timespanExpanded: false,
    maxCloudCover: 100,
  };

  updateTimespan = (fromTime, toTime) => {
    this.props.updateSelectedTime(fromTime, toTime);
  };

  updateDate = (date) => {
    const fromTime = date.clone().startOf('day');
    const toTime = date.clone().endOf('day');
    this.props.updateSelectedTime(fromTime, toTime);
  };

  toggleTimespan = () => {
    this.setState(
      (prevState) => {
        return { timespanExpanded: !prevState.timespanExpanded };
      },
      () => {
        if (!this.state.timespanExpanded) {
          this.updateDate(this.props.toTime);
        }
      },
    );
  };

  render() {
    const {
      maxDate,
      minDate,
      onQueryDatesForActiveMonth,
      showNextPrev,
      fromTime,
      toTime,
      timespanSupported,
      onQueryFlyoversForActiveMonth,
      hasCloudCoverage,
    } = this.props;

    const { timespanExpanded, maxCloudCover } = this.state;
    if (!toTime) {
      return null;
    }

    if (!timespanSupported) {
      return (
        <>
          <div className="visualization-time-select">
            <div>
              <b className="time-select-type">{t`Date:`}</b>
            </div>
            <DatePicker
              id="visualization-date-picker"
              calendarContainer={this.calendarHolder}
              selectedDay={toTime.clone().startOf('day')}
              setSelectedDay={this.updateDate}
              minDate={minDate}
              maxDate={maxDate}
              showNextPrevDateArrows={showNextPrev}
              onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
            />
            <div />
          </div>
          <div className="visualization-calendar-holder" ref={(e) => (this.calendarHolder = e)} />
        </>
      );
    }

    return (
      <>
        <div className={`visualization-time-select ${timespanExpanded ? 'expanded' : ''}`}>
          <div>
            <b className="time-select-type">{timespanExpanded ? t`Timespan:` : t`Date:`}</b>
            {!timespanExpanded &&
              (hasCloudCoverage ? (
                <DatePicker
                  id="cloud-cover-datepicker-wrap"
                  calendarContainer={this.calendarHolder}
                  selectedDay={toTime.clone().utc().startOf('day')}
                  setSelectedDay={this.updateDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  showNextPrevDateArrows={showNextPrev}
                  onQueryDatesForActiveMonth={onQueryFlyoversForActiveMonth}
                  hasCloudCoverFilter={true}
                  setMaxCloudCover={(value) => this.setState({ maxCloudCover: value })}
                  maxCloudCover={maxCloudCover}
                />
              ) : (
                <DatePicker
                  id="visualization-date-picker"
                  calendarContainer={this.calendarHolder}
                  selectedDay={toTime.clone().utc().startOf('day')}
                  setSelectedDay={this.updateDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  showNextPrevDateArrows={showNextPrev}
                  onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
                />
              ))}
          </div>
          {timespanExpanded && (
            <div className="timespan-title-wrap">
              <div className="timespan-label" onClick={this.toggleTimespan}>
                {`${fromTime.clone().utc().format('YYYY-MM-DD HH:mm')} - ${toTime
                  .clone()
                  .utc()
                  .format('YYYY-MM-DD HH:mm')}`}
              </div>
            </div>
          )}
          <div className="timespan-toggle" onClick={this.toggleTimespan}>
            {timespanExpanded ? t`Single date` : t`Timespan`}
          </div>
        </div>
        {timespanExpanded && (
          <TimespanPicker
            id="visualization-time-select"
            minDate={minDate}
            maxDate={maxDate}
            timespan={{ fromTime: fromTime, toTime: toTime }}
            applyTimespan={this.updateTimespan}
            onQueryDatesForActiveMonth={onQueryDatesForActiveMonth}
            timespanExpanded={timespanExpanded}
          />
        )}
        <div className="visualization-calendar-holder" ref={(e) => (this.calendarHolder = e)} />
      </>
    );
  }
}
