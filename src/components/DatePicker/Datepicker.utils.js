import moment from 'moment';

export const isNextMonthAvailable = (maxDate, selectedDay) => {
  // check if we can go forward another year
  if (maxDate.year() - selectedDay.year() > 0) {
    return true;
  }

  // if this is the last year, check if another month is available
  return maxDate.month() - selectedDay.month() > 0;
};

export const isPreviousMonthAvailable = (minDate, selectedDay) => {
  // check if we can go back another year
  if (selectedDay.year() - minDate.year() > 0) {
    return true;
  }

  // if this is the last year, check if another month is available
  return selectedDay.month() - minDate.month() > 0;
};

export const getAvailableYears = (fromDate, toDate) => {
  const fromDateMoment = moment(fromDate);
  const toDateMoment = moment(toDate);

  const years = [];
  for (let i = fromDateMoment.year(); i <= toDateMoment.year(); i += 1) {
    years.push(i);
  }

  return years;
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

export const momentToDate = momentObj => {
  return convertDateToUTC(
    momentObj
      .clone()
      .utc()
      .toDate(),
  );
};
