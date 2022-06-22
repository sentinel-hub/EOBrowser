import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import DatePickerInput from './DatePickerInput';
import Calendar from './Calendar';

import { getNextBestDate } from './Datepicker.utils';

import './DatePicker.scss';

const STANDARD_STRING_DATE_FORMAT = 'YYYY-MM-DD';

class DatePicker extends Component {
  state = {
    displayCalendar: false,
    availableDays: null,
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
    const { selectedDay, maxDate, setSelectedDay } = this.props;
    const { displayCalendar } = this.state;

    if (!!displayCalendar) {
      const days = await this.fetchAvailableDaysInMonth(selectedDay);
      if (!selectedDay) {
        if (days.length > 0) {
          setSelectedDay(moment.utc(days[0].date));
        } else {
          let latestDate;
          if (this.props.getLatestAvailableDate) {
            latestDate = await this.props.getLatestAvailableDate();
          }
          setSelectedDay(latestDate ? moment.utc(latestDate) : maxDate.clone().utc());
        }
      }
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
          date: moment.utc(date.fromTime),
          cloudCoverPercent: date.meta.averageCloudCoverPercent,
        }));
      } else {
        dateArray = dateArray.map((date) => ({ date: moment.utc(date), cloudCoverPercent: 100 }));
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

  handleGetAndSetNextPrevDate = async (direction) => {
    let { loading } = this.state;
    let { selectedDay, setSelectedDay, minDate, maxDate, maxCloudCover, limitMonthsSearch = 3 } = this.props;

    if (loading) {
      return;
    }

    if (!selectedDay) {
      selectedDay = maxDate.clone().utc();
      if (this.props.getLatestAvailableDate) {
        const latestDate = await this.props.getLatestAvailableDate();
        if (latestDate) {
          if (direction === 'prev') {
            // No selectedDay is set and best date in the direction towards earlier dates was requested.
            // We set selectedDay to one day after latest available date, so that latest available date is considered.
            selectedDay = latestDate.clone().add(1, 'day');
          }
          if (direction === 'next') {
            // Same as other direction.
            selectedDay = latestDate.clone().subtract(1, 'day');
          }
        }
      }
    }

    let newSelectedDay;

    newSelectedDay = await getNextBestDate({
      selectedDay: selectedDay,
      direction: direction,
      maxCC: maxCloudCover,
      fetchDates: this.fetchAvailableDaysInMonth,
      minDate: minDate,
      maxDate: maxDate,
      limitMonthsSearch: limitMonthsSearch,
    });
    setSelectedDay(newSelectedDay.clone().utc());
    if (newSelectedDay.get('month') !== selectedDay.get('month')) {
      this.fetchDates();
    }
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
      setMaxCloudCover,
      maxCloudCover,
      additionalClassNameForDatePicker,
    } = this.props;
    const { displayCalendar, availableDays, loading } = this.state;
    const highlightedDays = (availableDays || [])
      .filter(({ cloudCoverPercent }) =>
        maxCloudCover !== null && maxCloudCover !== undefined ? cloudCoverPercent <= maxCloudCover : true,
      )
      .map(({ date }) => date);
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
            additionalClassNameForDatePicker={additionalClassNameForDatePicker}
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
            setMaxCloudCover={setMaxCloudCover}
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
            highlightedDays={highlightedDays}
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
