import React from 'react';
import ReactDOM from 'react-dom';
import onClickOutside from 'react-onclickoutside';
import DayPicker from 'react-day-picker';
import { t } from 'ttag';

import { getFirstDayOfWeek, getWeekDaysLong, getWeekDaysMin, getMonths } from './MomentLocaleUtils';
import { momentToDateWithUTCValues } from './Datepicker.utils';
import Navbar from './Navbar';
import YearMonthForm from './YearMonthForm';

import 'react-day-picker/lib/style.css';
import './Calendar.scss';
import { EOBCCSlider } from '../../junk/EOBCommon/EOBCCSlider/EOBCCSlider';

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
    highlightedDays,
    hasCloudCoverFilter,
    setMaxCloudCover,
    cloudCoverPercentage,
  } = props;

  const modifiers = {
    highlighted: highlightedDays.map((d) => momentToDateWithUTCValues(d)),
  };

  return ReactDOM.createPortal(
    <div className="calendar-wrapper">
      {hasCloudCoverFilter && (
        <div className="cloud-cover-calendar-cc-section">
          <b className="time-select-type cc-picker-label">{t`Max. cloud coverage:`}</b>
          <EOBCCSlider
            sliderWidth={'100%'}
            onChange={(value) => setMaxCloudCover(value)}
            cloudCoverPercentage={cloudCoverPercentage}
          />
        </div>
      )}
      <DayPicker
        showOutsideDays
        selectedDays={selectedDay ? momentToDateWithUTCValues(selectedDay) : null}
        modifiers={modifiers}
        month={selectedDay ? momentToDateWithUTCValues(selectedDay) : null}
        onMonthChange={handleMonthChange}
        onDayClick={handleDayClick}
        disabledDays={[
          {
            after: momentToDateWithUTCValues(maxDate),
            before: momentToDateWithUTCValues(minDate),
          },
        ]}
        navbarElement={<Navbar minDate={minDate} maxDate={maxDate} selectedDate={selectedDay} />}
        captionElement={({ locale }) => (
          <YearMonthForm
            minFromDate={minDate}
            maxToDate={maxDate}
            onChange={onMonthOrYearDropdownChange}
            locale={locale}
            selectedDay={selectedDay}
          />
        )}
        locale={locale}
        weekdaysLong={getWeekDaysLong(locale)}
        weekdaysShort={getWeekDaysMin(locale)}
        months={getMonths(locale)}
        firstDayOfWeek={getFirstDayOfWeek(locale)}
      />
    </div>,
    calendarContainer && calendarContainer.current ? calendarContainer.current : calendarContainer,
  );
}

export default onClickOutside(Calendar);
