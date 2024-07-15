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

export const momentToDateWithUTCValues = (momentObj) => {
  // Date objects automatically set the timezone to user's local time.
  // Moment object with UTC 2021-01-01 00:00 will therefore become e.g. 2020-12-31 17:00 GMT-0700 (Mountain Standard Time)
  // react-daypicker will therefore render 2020-12-31 instead of 2021-01-01
  // Here we therefore set UTC values in the Date object
  // Note: the timezone is still present, so converting it back to moment directly will take it into account and will be incorrect
  function setUTCValuesInDate(date) {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
    );
  }
  return setUTCValuesInDate(momentObj.clone().utc().toDate());
};

function orderAvailableDates(availableDays, direction, selectedDay) {
  if (direction === 'prev') {
    availableDays = availableDays.sort((a, b) => b.date.diff(a.date));
    const dateLimit = selectedDay.clone().startOf('day');
    availableDays = availableDays.filter((d) => d.date.isBefore(dateLimit));
  }
  if (direction === 'next') {
    availableDays = availableDays.sort((a, b) => a.date.diff(b.date));
    const dateLimit = selectedDay.clone().endOf('day');
    availableDays = availableDays.filter((d) => d.date.isAfter(dateLimit));
  }
  return availableDays;
}

function getNextMonthDay(day, direction, nMonths) {
  if (direction === 'prev') {
    return day.clone().subtract(nMonths, 'month');
  }
  if (direction === 'next') {
    return day.clone().add(nMonths, 'month');
  }
}

export async function getNextBestDate({ selectedDay, direction, maxCC, fetchDates, limitMonths = 12 }) {
  let bestDay;
  let availableDays;

  for (let nMonths = 0; nMonths <= limitMonths; nMonths++) {
    const nextMonthDay = getNextMonthDay(selectedDay, direction, nMonths);
    availableDays = await fetchDates(nextMonthDay);
    availableDays = orderAvailableDates([...availableDays], direction, selectedDay);
    for (let day of availableDays) {
      if (day.cloudCoverPercent <= maxCC) {
        return day.date;
      }
      if (!bestDay || bestDay.cloudCoverPercent > day.cloudCoverPercent) {
        bestDay = day;
      }
    }
  }
  return bestDay ? bestDay.date.clone() : selectedDay.clone();
}
