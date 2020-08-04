import React, { Component } from 'react';
import { connect } from 'react-redux';
import DayPicker from 'react-day-picker';
import moment from 'moment';
import onClickOutside from 'react-onclickoutside';
import AlertContainer from 'react-alert';
import { getFirstDayOfWeek, getWeekDaysLong, getWeekDaysMin, getMonths } from './MomentLocaleUtils';

import { getAvailableYears } from './Datepicker.utils';

import Navbar from './Navbar';

import 'react-day-picker/lib/style.css';
import './EOBDatePicker.scss';

const STANDARD_STRING_DATE_FORMAT = 'YYYY-MM-DD';

class EOBDatePicker extends Component {
  static defaultProps = {
    showNextPrev: false,
    searchAvailableDays: true,
    alignment: 'lb',
    onExpandedChange: () => {},
  };

  constructor(props) {
    super(props);
    this.state = {
      availableDays: [],
      dateInput: this.props.selectedDay.format(STANDARD_STRING_DATE_FORMAT),
      initialSelectedDay: this.props.selectedDay,
      selectedDay: this.props.selectedDay,
      expanded: false,
    };
    this.setTextInputRef = element => {
      this.textInput = element;
    };
  }

  alertOptions = {
    offset: 14,
    position: 'top center',
    theme: 'dark',
    time: 2000,
    transition: 'scale',
  };

  static getDerivedStateFromProps(props, state) {
    if (
      props.selectedDay.format(STANDARD_STRING_DATE_FORMAT) !==
      state.initialSelectedDay.format(STANDARD_STRING_DATE_FORMAT)
    ) {
      return {
        dateInput: props.selectedDay.format(STANDARD_STRING_DATE_FORMAT),
        selectedDay: props.selectedDay,
        initialSelectedDay: props.selectedDay,
      };
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.expanded !== this.state.expanded) {
      this.props.onExpandedChange(this.state.expanded);
    }
    // whenever selectedDay changes, the change should reflect in parent value:
    if (
      prevState.selectedDay.format(STANDARD_STRING_DATE_FORMAT) !==
      this.state.selectedDay.format(STANDARD_STRING_DATE_FORMAT)
    ) {
      this.props.onSelect(this.state.selectedDay);
    } else {
      // Workaround for use case when selectedDate is changed outside
      // of this component and result is passed back as a new selected date
      // (for example limiting interval to lower / upper range).
      // In this case components internal state  needs to be updated to reflect
      // the change made by parent
      if (
        this.props.selectedDay.format(STANDARD_STRING_DATE_FORMAT) !==
        this.state.selectedDay.format(STANDARD_STRING_DATE_FORMAT)
      ) {
        this.setState({
          dateInput: this.props.selectedDay.format(STANDARD_STRING_DATE_FORMAT),
          selectedDay: this.props.selectedDay,
          initialSelectedDay: this.props.selectedDay,
        });
      }
    }
  }

  showAlert = msg => {
    this.alertContainer.show(msg, {
      type: 'info',
    });
  };

  fetchAvailableDaysInMonth = date => {
    const { searchAvailableDays } = this.props;
    if (!searchAvailableDays) return;
    this.props.onQueryDatesForActiveMonth(date).then(dateArray => {
      this.setState({
        availableDays: dateArray,
      });
    });
  };

  handleDayClick = dateString => {
    const date = moment.utc(dateString);
    this.setState({
      selectedDay: date,
      expanded: false,
    });
    this.textInput.blur();
  };

  onMonthChange = day => {
    this.fetchAvailableDaysInMonth(day);
    this.handleYearMonthChange(day);
  };

  showDatePicker = e => {
    this.setState({
      expanded: true,
    });
  };

  handleYearMonthChange = selectedMonthYear => {
    // todo check if month can be changed before updating state

    this.setState(oldState => ({
      selectedDay: moment.utc(selectedMonthYear).date(
        Math.min(
          oldState.selectedDay.date(),
          moment(selectedMonthYear)
            .endOf('month')
            .date(),
        ),
      ),
    }));
  };

  onMonthOrYearDropdownChange = day => {
    this.fetchAvailableDaysInMonth(day);
    this.handleYearMonthChange(day);
  };

  onNextOrPrev = direction => {
    this.props
      .onGetAndSetNextPrev(direction)
      .then(res => {
        this.handleDayClick(res);
      })
      .catch(err => {
        this.showAlert(err);
      });
  };

  onFocusHandler = e => {
    const { selectedDay } = this.state;
    this.fetchAvailableDaysInMonth(selectedDay);
    this.setState({
      expanded: true,
    });
  };

  inputChange = e => {
    const date = moment.utc(e.target.value, STANDARD_STRING_DATE_FORMAT, true); //true for strict parsing
    if (date.isValid()) {
      this.daypicker.showMonth(new Date(e.target.value));
      this.setState({ dateInput: e.target.value, selectedDay: date });
    } else {
      this.setState({ dateInput: e.target.value });
    }
  };

  handleKeyPress = e => {
    if (e.key === 'Enter') {
      const date = moment.utc(e.target.value, STANDARD_STRING_DATE_FORMAT, true); //true for strict parsing
      if (date.isValid()) {
        this.handleDayClick(e.target.value);
      }
    }
  };

  handleClickOutside = () => {
    this.setState({ expanded: false });
  };

  convertDateToUTC(date) {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    );
  }

  renderDatePicker = () => {
    const modifiers = {
      available: this.state.availableDays.map(day => this.convertDateToUTC(moment(day).toDate())),
      selected: this.convertDateToUTC(this.state.selectedDay.toDate()),
    };

    const isLeft = this.props.alignment.includes('l');
    let style;

    if (isLeft) {
      style = { left: 10 };
    } else {
      style = { left: -75 };
    }

    style.position = 'absolute';
    return (
      <div className="YearNavigation day-overlay" style={style}>
        <DayPicker
          ref={el => (this.daypicker = el)}
          showOutsideDays
          onMonthChange={month => this.onMonthChange(month)}
          modifiers={modifiers}
          month={this.convertDateToUTC(this.state.selectedDay.toDate())} // initial month, for when expanding
          minFromDate={this.props.minDate}
          maxToDate={this.props.maxDate}
          onDayClick={this.handleDayClick}
          disabledDays={[{ after: new Date() }]}
          locale={this.props.locale}
          weekdaysLong={getWeekDaysLong(this.props.locale)}
          weekdaysShort={getWeekDaysMin(this.props.locale)}
          months={getMonths(this.props.locale)}
          firstDayOfWeek={getFirstDayOfWeek(this.props.locale)}
          captionElement={({ minFromDate, date, locale }) => (
            <YearMonthForm
              minFromDate={this.props.minDate}
              maxToDate={this.props.maxDate}
              date={date}
              onChange={this.onMonthOrYearDropdownChange}
              locale={locale}
            />
          )}
          navbarElement={
            <Navbar
              minDate={this.props.minDate}
              maxDate={this.props.maxDate}
              selectedDate={this.state.selectedDay}
            />
          }
        />
        <div style={{ clear: 'both' }} />
      </div>
    );
  };

  render() {
    const { expanded, dateInput } = this.state;
    const { showNextPrev } = this.props;
    return (
      <div className="inlineDatepicker">
        <AlertContainer ref={a => (this.alertContainer = a)} {...this.alertOptions} />
        {showNextPrev && (
          <i
            className={'fa fa-caret-left cal-icon-left'}
            title={''}
            onClick={() => this.onNextOrPrev('prev')}
          />
        )}
        <i onClick={this.onFocusHandler} className={`fa fa-calendar cal-icon-cal`} />

        {showNextPrev && (
          <i
            className={'fa fa-caret-right cal-icon-right'}
            title={''}
            onClick={() => this.onNextOrPrev('next')}
          />
        )}
        <span>
          <div className="react-flex inline-flex">
            <input
              className="react-date-field__input"
              ref={this.setTextInputRef}
              value={dateInput}
              onChange={this.inputChange}
              onKeyPress={this.handleKeyPress}
              onClick={this.onFocusHandler}
              onBlur={this.handleInputBlur}
            />
          </div>
        </span>

        {expanded && this.renderDatePicker()}
      </div>
    );
  }
}

const YearMonthForm = ({ minFromDate, maxToDate, date, onChange, locale }) => {
  const months = getMonths(locale);
  const years = getAvailableYears(minFromDate, maxToDate);

  const handleChange = function handleChange(e) {
    const { year, month } = e.target.form;
    onChange(new Date(Date.UTC(year.value, month.value)));
  };

  return (
    <form className="DayPicker-Caption">
      <select name="month" onChange={handleChange} value={date.getMonth()}>
        {months.map((month, i) => (
          <option key={month} value={i}>
            {month}
          </option>
        ))}
      </select>
      <select name="year" onChange={handleChange} value={date.getFullYear()}>
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </form>
  );
};

const mapStoreToProps = store => ({
  locale: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(onClickOutside(EOBDatePicker));
