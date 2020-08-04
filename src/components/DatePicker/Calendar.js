import React from 'react';
import ReactDOM from 'react-dom';
import onClickOutside from 'react-onclickoutside';
import DayPicker from 'react-day-picker';

import { getFirstDayOfWeek, getWeekDaysLong, getWeekDaysMin, getMonths } from './MomentLocaleUtils';
import { momentToDate } from './Datepicker.utils';
import Navbar from './Navbar';
import YearMonthForm from './YearMonthForm';

import './Calendar.scss';

function Calendar(props) {
  const {
    selectedDay,
    minDate,
    maxDate,
    locale,
    calendarContainer,
    handleMonthChange,
    handleDayClick,
    onMonthOrYearDropdownChange,
  } = props;

  return ReactDOM.createPortal(
    <div className="calendar-wrapper">
      <DayPicker
        showOutsideDays
        selectedDays={momentToDate(selectedDay)}
        month={momentToDate(selectedDay)}
        onMonthChange={handleMonthChange}
        onDayClick={handleDayClick}
        disabledDays={[
          {
            after: momentToDate(maxDate),
            before: momentToDate(minDate),
          },
        ]}
        navbarElement={<Navbar minDate={minDate} maxDate={maxDate} selectedDate={selectedDay} />}
        captionElement={({ date, locale }) => (
          <YearMonthForm
            minFromDate={minDate}
            maxToDate={maxDate}
            date={date}
            onChange={onMonthOrYearDropdownChange}
            locale={locale}
          />
        )}
        locale={locale}
        weekdaysLong={getWeekDaysLong(locale)}
        weekdaysShort={getWeekDaysMin(locale)}
        months={getMonths(locale)}
        firstDayOfWeek={getFirstDayOfWeek(locale)}
      />
    </div>,
    calendarContainer,
  );
}

export default onClickOutside(Calendar);
