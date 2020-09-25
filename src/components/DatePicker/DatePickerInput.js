import React, { useState, useEffect } from 'react';
import moment from 'moment';

function DatePickerInput(props) {
  const {
    onClick,
    dateFormat,
    selectedDay,
    setSelectedDay,
    onValueConfirmed,
    showNextPrevDateArrows,
    getAndSetNextPrevDate,
    minDate,
    maxDate,
  } = props;
  const [dateValue, setDateValue] = useState(selectedDay.utc().format(dateFormat));
  const [prevDateDisabled, setPrevDateDisabled] = useState(false);
  const [nextDateDisabled, setNextDateDisabled] = useState(false);

  useEffect(() => {
    setDateValue(props.selectedDay.utc().format(props.dateFormat));
    setPrevDateDisabled(false);
    setNextDateDisabled(false);
  }, [props.selectedDay, props.dateFormat]);

  function isValueValidDate(value) {
    const parsedDate = moment.utc(value, dateFormat, true);
    return parsedDate.isValid() && parsedDate >= minDate && maxDate >= parsedDate;
  }

  function handleChange(e) {
    setDateValue(e.target.value);
    if (isValueValidDate(e.target.value)) {
      setSelectedDay(moment.utc(e.target.value));
    }
  }

  function handleBlur() {
    if (!isValueValidDate(dateValue)) {
      setDateValue(selectedDay.utc().format(dateFormat));
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      if (isValueValidDate(e.target.value)) {
        onValueConfirmed();
      }
    }
  }

  async function getPrevDate() {
    if (prevDateDisabled) {
      return;
    }
    await getAndSetNextPrevDate('prev', selectedDay).catch(err => setPrevDateDisabled(true));
  }

  async function getNextDate() {
    if (nextDateDisabled) {
      return;
    }
    await getAndSetNextPrevDate('next', selectedDay).catch(err => setNextDateDisabled(true));
  }

  return (
    <div className="date-picker-input-wrapper">
      {showNextPrevDateArrows && (
        <i
          className={`fa fa-caret-left cal-icon-left ${prevDateDisabled ? 'disabled' : ''}`}
          title={''}
          onClick={getPrevDate}
        />
      )}
      <i onClick={onClick} className="fa fa-calendar date-picker-input-icon" />
      {showNextPrevDateArrows && (
        <i
          className={`fa fa-caret-right cal-icon-right ${nextDateDisabled ? 'disabled' : ''}`}
          title={''}
          onClick={getNextDate}
        />
      )}
      <input
        className="date-picker-input"
        value={dateValue}
        onClick={onClick}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
}

export default DatePickerInput;
