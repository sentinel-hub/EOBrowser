import React from 'react';

import { getAvailableYears } from './Datepicker.utils';
import { getMonths } from './MomentLocaleUtils';

const YearMonthForm = ({ minFromDate, maxToDate, date, onChange, locale }) => {
  const months = getMonths(locale);
  const years = getAvailableYears(minFromDate, maxToDate);

  const handleChange = function handleChange(e) {
    const { year, month } = e.target.form;
    onChange(month.value, year.value);
  };

  return (
    <form className="year-month-form">
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

export default YearMonthForm;
