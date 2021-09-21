import moment from 'moment';

export const isNextMonthAvailable = (maxDate, selectedDay) => {
  return selectedDay.clone().add(1, 'month').startOf('month') <= maxDate;
};

export const isPreviousMonthAvailable = (minDate, selectedDay) => {
  return selectedDay.clone().subtract(1, 'month').endOf('month') >= minDate;
};

export const getAvailableYears = (fromDate, toDate) => {
  const years = [];
  for (let i = fromDate.year(); i <= toDate.year(); i += 1) {
    years.push(i);
  }

  return years;
};

export const getAvailableMonths = (allMonths, minDate, maxDate, selectedDay) => {
  minDate = moment.max(minDate, selectedDay.clone().startOf('year'));
  maxDate = moment.min(maxDate, selectedDay.clone().endOf('year'));

  let months = [];
  for (let i = minDate.get('month'); i <= maxDate.get('month'); i++) {
    months.push({ name: allMonths[i], index: i });
  }
  return months;
};

export function convertDateToUTC(date) {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
}

export const momentToDate = (momentObj) => {
  return convertDateToUTC(momentObj.clone().utc().toDate());
};
