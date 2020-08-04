import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import DatePickerInput from './DatePickerInput';
import Calendar from './Calendar';

import './DatePicker.scss';

const STANDARD_STRING_DATE_FORMAT = 'YYYY-MM-DD';

class DatePicker extends Component {
  state = {
    displayCalendar: false,
  };

  openCalendar = () => {
    this.setState({
      displayCalendar: true,
    });
  };

  closeCalendar = () => {
    this.setState({
      displayCalendar: false,
    });
  };

  handleClickOutside = () => {
    this.closeCalendar();
  };

  handleDayClick = day => {
    this.props.setSelectedDay(moment.utc(day));
    this.closeCalendar();
  };

  handleMonthChange = date => {
    const { selectedDay, setSelectedDay } = this.props;
    const newSelectedDay = selectedDay
      .clone()
      .month(date.getMonth())
      .year(date.getFullYear());
    setSelectedDay(newSelectedDay);
  };

  onMonthOrYearDropdownChange = (month, year) => {
    const { selectedDay, setSelectedDay } = this.props;
    const newSelectedDay = selectedDay
      .clone()
      .month(month)
      .year(year);
    setSelectedDay(newSelectedDay);
  };

  render() {
    const { selectedDay, setSelectedDay, minDate, maxDate, locale, calendarContainer, id } = this.props;
    const { displayCalendar } = this.state;
    return (
      <div className={`date-picker ${displayCalendar ? id : ''}`}>
        <DatePickerInput
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          dateFormat={STANDARD_STRING_DATE_FORMAT}
          onClick={this.openCalendar}
          onValueConfirmed={this.closeCalendar}
        />
        {displayCalendar && (
          <Calendar
            selectedDay={selectedDay}
            minDate={minDate}
            maxDate={maxDate}
            locale={locale}
            calendarContainer={calendarContainer}
            handleMonthChange={this.handleMonthChange}
            handleDayClick={this.handleDayClick}
            onMonthOrYearDropdownChange={this.onMonthOrYearDropdownChange}
            handleClickOutside={this.handleClickOutside}
            outsideClickIgnoreClass={id}
          />
        )}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  locale: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(DatePicker);
