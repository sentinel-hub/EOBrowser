import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import DatePickerInput from './DatePickerInput';
import Calendar from './Calendar';
import { convertDateToUTC } from './Datepicker.utils';

import './DatePicker.scss';

const STANDARD_STRING_DATE_FORMAT = 'YYYY-MM-DD';

class DatePicker extends Component {
  state = {
    displayCalendar: false,
    availableDays: [],
    maxCloudCover: 100,
    loading: false,
  };

  async componentDidMount() {
    await this.fetchDates();
  }

  async componentDidUpdate(prevProps) {
    //refetch available dates when zoom is changed
    if (!!this.props.zoom && this.props.zoom !== prevProps.zoom) {
      await this.fetchDates();
    }
  }

  async fetchDates() {
    const { selectedDay } = this.props;
    const { displayCalendar } = this.state;

    if (!!displayCalendar) {
      const days = await this.fetchAvailableDaysInMonth(selectedDay);
      this.setState({ availableDays: days });
    }
  }

  openCalendar = () => {
    this.setState(
      {
        displayCalendar: true,
      },
      this.fetchDates,
    );
  };

  closeCalendar = () => {
    this.setState({
      displayCalendar: false,
    });
  };

  handleClickOutside = () => {
    this.closeCalendar();
  };

  handleDayClick = (day) => {
    this.props.setSelectedDay(moment.utc(day));
    this.closeCalendar();
  };

  handleMonthChange = (date) => {
    const { selectedDay, setSelectedDay } = this.props;
    const newSelectedDay = this.checkAndSetWithinAvailableRange(
      selectedDay.clone().month(date.getMonth()).year(date.getFullYear()),
    );
    setSelectedDay(newSelectedDay);

    this.fetchAvailableDaysInMonth(newSelectedDay).then((dates) => this.setState({ availableDays: dates }));
  };

  onMonthOrYearDropdownChange = (month, year) => {
    const { selectedDay, setSelectedDay } = this.props;
    const newSelectedDay = this.checkAndSetWithinAvailableRange(selectedDay.clone().month(month).year(year));
    this.fetchAvailableDaysInMonth(newSelectedDay).then((dates) => this.setState({ availableDays: dates }));

    setSelectedDay(newSelectedDay);
  };

  checkAndSetWithinAvailableRange = (newSelectedDay) => {
    const { minDate, maxDate } = this.props;
    if (newSelectedDay < minDate) {
      newSelectedDay = minDate.clone();
    }
    if (newSelectedDay > maxDate) {
      newSelectedDay = maxDate.clone();
    }
    return newSelectedDay;
  };

  fetchAvailableDaysInMonth = async (date) => {
    if (!this.props.onQueryDatesForActiveMonth) return [];
    let dateArray = [];
    try {
      this.setState({ loading: true });
      const { hasCloudCoverFilter } = this.props;
      dateArray = await this.props.onQueryDatesForActiveMonth(date);
      if (hasCloudCoverFilter) {
        dateArray = dateArray.map((date) => ({
          date: convertDateToUTC(date.fromTime),
          cloudCoverPercent: date.meta.averageCloudCoverPercent,
        }));
      } else {
        dateArray = dateArray.map((date) => ({ date: convertDateToUTC(date), cloudCoverPercent: 100 }));
      }
    } catch (err) {
      console.error('Unable to fetch available days in month!\n', err);
    } finally {
      this.setState({ loading: false });
      return dateArray;
    }
  };

  checkAndSetWithinAvailableRange = (newSelectedDay) => {
    const { minDate, maxDate } = this.props;
    if (newSelectedDay < minDate) {
      newSelectedDay = minDate.clone();
    }
    if (newSelectedDay > maxDate) {
      newSelectedDay = maxDate.clone();
    }
    return newSelectedDay;
  };

  isMinOrMaxDate = (date) => {
    const selectedDate = moment(date).clone();
    const maxDate = moment(this.props.maxDate).clone();
    const minDate = moment(this.props.minDate).clone();
    if (selectedDate.isSameOrBefore(minDate, 'date') || selectedDate.isSameOrAfter(maxDate, 'date')) {
      return true;
    }
    return false;
  };

  getLowestCloudCoverDate(dates) {
    let lowest = dates[0];

    dates.forEach((date) => {
      if (date.cloudCoverPercent < lowest.cloudCoverPercent) {
        lowest = date;
      }
    });

    return lowest.date;
  }

  getAllDatesWithinMonth(dates, selectedDate) {
    let datesWithinMonth = [];

    dates.forEach((date) => {
      if (moment(date.date).clone().isSame(selectedDate, 'month')) {
        datesWithinMonth.push(date);
      }
    });

    return datesWithinMonth;
  }

  handleGetAndSetNextPrevDate = async (direction) => {
    const { availableDays, loading } = this.state;
    const { selectedDay, setSelectedDay } = this.props;

    if (loading) {
      return;
    }

    if (direction === 'prev') {
      const prevDate = this.getPreviousDateBelowCloudCover(selectedDay, availableDays);
      if (prevDate) {
        setSelectedDay(moment(prevDate).utc().clone());
        return;
      }

      const lastDayInPrevMonth = moment(selectedDay).subtract(1, 'month').endOf('month').clone();

      const newValidDate = this.checkAndSetWithinAvailableRange(lastDayInPrevMonth);
      let allDates = [];
      let monthOffset = 0;
      let firstDateBelowCloudCover = null;
      let currentMonth;
      let newDates;
      let searchedInvalidMonth = false;
      while (!firstDateBelowCloudCover && monthOffset < 12) {
        currentMonth = moment(newValidDate).clone().clone().subtract(monthOffset, 'month');

        if (this.isMinOrMaxDate(currentMonth)) {
          searchedInvalidMonth = true;
          break;
        }

        newDates = await this.fetchAvailableDaysInMonth(currentMonth);
        firstDateBelowCloudCover = this.getPreviousDateBelowCloudCover(
          moment(newValidDate).clone().add(1, 'day'),
          newDates,
        );
        monthOffset = monthOffset + 1;
        allDates = [...allDates, ...newDates];
      }

      if (searchedInvalidMonth) {
        const lowestCCDate = moment(this.getLowestCloudCoverDate(allDates)).clone();
        const allDatesWithinMonth = this.getAllDatesWithinMonth(allDates, lowestCCDate);
        this.setState({ availableDays: allDatesWithinMonth });
        setSelectedDay(lowestCCDate.clone().utc());
        throw new Error('Lowest cloud cover date available before going over min date');
      }

      if (allDates.length === 0) {
        setSelectedDay(moment(currentMonth).clone());
      }
      if (firstDateBelowCloudCover) {
        setSelectedDay(moment(firstDateBelowCloudCover).utc().clone());
        this.setState({ availableDays: newDates });
        return;
      } else {
        const lowestCCDate = moment(this.getLowestCloudCoverDate(allDates)).clone();
        const allDatesWithinMonth = this.getAllDatesWithinMonth(allDates, lowestCCDate);
        this.setState({ availableDays: allDatesWithinMonth });
        setSelectedDay(lowestCCDate.clone().utc());
        return;
      }
    }

    if (direction === 'next') {
      const nextDate = this.getNextDateBelowCloudCover(selectedDay, availableDays);

      if (nextDate) {
        setSelectedDay(moment(nextDate).utc().clone());
        return;
      }
      const firstDayInNextMonth = moment(selectedDay).clone().add(1, 'month').startOf('month');
      const newValidDate = this.checkAndSetWithinAvailableRange(firstDayInNextMonth);

      let monthOffset = 0;
      let firstDateBelowCloudCover = null;
      let currentMonth;
      let newDates;
      let allDates = [];
      let searchedInvalidMonth = false;
      while (!firstDateBelowCloudCover && monthOffset < 12) {
        currentMonth = moment(newValidDate).clone().clone().add(monthOffset, 'month');

        if (this.isMinOrMaxDate(currentMonth)) {
          searchedInvalidMonth = true;
          break;
        }
        newDates = await this.fetchAvailableDaysInMonth(currentMonth);
        firstDateBelowCloudCover = this.getNextDateBelowCloudCover(
          moment(newValidDate).clone().subtract(1, 'day'),
          newDates,
        );
        monthOffset = monthOffset + 1;
        allDates = [...allDates, ...newDates];
      }

      if (searchedInvalidMonth) {
        const lowestCCDate = moment(this.getLowestCloudCoverDate(allDates)).clone();
        const allDatesWithinMonth = this.getAllDatesWithinMonth(allDates, lowestCCDate);
        this.setState({ availableDays: allDatesWithinMonth });
        setSelectedDay(lowestCCDate);
        throw new Error('Lowest cloud cover date available before going over max date');
      }

      if (allDates.length === 0) {
        setSelectedDay(moment(currentMonth).clone());
      }

      if (firstDateBelowCloudCover) {
        setSelectedDay(moment(firstDateBelowCloudCover).utc().clone());
        this.setState({ availableDays: newDates });
      } else {
        const lowestCCDate = moment(this.getLowestCloudCoverDate(allDates)).clone();
        const allDatesWithinMonth = this.getAllDatesWithinMonth(allDates, lowestCCDate);
        this.setState({ availableDays: allDatesWithinMonth });
        setSelectedDay(lowestCCDate.clone().utc());
      }
    }
  };

  getPreviousDateBelowCloudCover = (selectedDay, availableDays) => {
    const { maxCloudCover } = this.state;

    const nextDay = availableDays.find(
      ({ date, cloudCoverPercent }) =>
        moment(date).clone().isBefore(selectedDay, 'date') && cloudCoverPercent <= maxCloudCover,
    );

    if (!nextDay) {
      return null;
    }
    return nextDay.date;
  };

  getNextDateBelowCloudCover = (selectedDay, availableDays) => {
    const { maxCloudCover } = this.state;
    const nextDay = availableDays
      .slice()
      .reverse()
      .find(
        ({ date, cloudCoverPercent }) =>
          moment(date).clone().isAfter(selectedDay, 'date') && cloudCoverPercent <= maxCloudCover,
      );
    if (!nextDay) {
      return null;
    }
    return nextDay.date;
  };

  render() {
    const {
      selectedDay,
      setSelectedDay,
      minDate,
      maxDate,
      locale,
      calendarContainer,
      id,
      showNextPrevDateArrows,
      hasCloudCoverFilter,
    } = this.props;
    const { displayCalendar, availableDays, maxCloudCover, loading } = this.state;
    return (
      <>
        <div className={`date-picker ${displayCalendar ? id : ''}`}>
          <DatePickerInput
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            dateFormat={STANDARD_STRING_DATE_FORMAT}
            onClick={this.state.displayCalendar ? this.closeCalendar : this.openCalendar}
            onValueConfirmed={this.closeCalendar}
            showNextPrevDateArrows={showNextPrevDateArrows}
            getAndSetNextPrevDate={this.handleGetAndSetNextPrevDate}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
        {loading && (
          <div className="date-picker-loader">
            <i className="fa fa-spinner fa-spin fa-fw" />
          </div>
        )}
        {displayCalendar && (
          <Calendar
            hasCloudCoverFilter={hasCloudCoverFilter}
            cloudCoverPercentage={maxCloudCover}
            setMaxCloudCover={(value) => this.setState({ maxCloudCover: value })}
            selectedDay={selectedDay}
            minDate={minDate}
            handleMonthChange={this.handleMonthChange}
            maxDate={maxDate}
            locale={locale}
            calendarContainer={calendarContainer}
            handleDayClick={this.handleDayClick}
            onMonthOrYearDropdownChange={this.onMonthOrYearDropdownChange}
            handleClickOutside={this.handleClickOutside}
            outsideClickIgnoreClass={id}
            highlightedDays={availableDays
              .filter(({ cloudCoverPercent }) => cloudCoverPercent <= maxCloudCover)
              .map(({ date }) => date)}
            eventTypes="click"
          />
        )}
      </>
    );
  }
}

const mapStoreToProps = (store) => ({
  locale: store.language.selectedLanguage,
  zoom: store.mainMap.zoom,
});

export default connect(mapStoreToProps, null)(DatePicker);
