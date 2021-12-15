import moment from 'moment';

import { getAvailableYears, isNextMonthAvailable, isPreviousMonthAvailable } from './Datepicker.utils';

describe('isNextMonthAvailable', () => {
  it('should return true when the last available month is after the currently selected month', () => {
    const maxDate = moment.utc('2020-03-03');
    const selectedDay = moment.utc('2020-02-02');
    const isAvailable = isNextMonthAvailable(maxDate, selectedDay);
    expect(isAvailable).toBe(true);
  });

  it('should return false when the last available month is the same as the currently selected month', () => {
    const maxDate = moment.utc('2020-02-02');
    const selectedDay = moment.utc('2020-02-02');
    const isAvailable = isNextMonthAvailable(maxDate, selectedDay);
    expect(isAvailable).toBe(false);
  });

  it('should return false when the last available month is before the currently selected month', () => {
    const maxDate = moment.utc('2020-01-01');
    const selectedDay = moment.utc('2020-02-02');
    const isAvailable = isNextMonthAvailable(maxDate, selectedDay);
    expect(isAvailable).toBe(false);
  });
});

describe('isPreviousMonthAvailable', () => {
  it('should return true when the first available month is before the currently selected month', () => {
    const minDate = moment.utc('2020-01-01');
    const selectedDay = moment.utc('2020-02-02');
    const isAvailable = isPreviousMonthAvailable(minDate, selectedDay);
    expect(isAvailable).toBe(true);
  });

  it('should return false when the first available month is the same as the currently selected month', () => {
    const minDate = moment.utc('2020-02-02');
    const selectedDay = moment.utc('2020-02-02');
    const isAvailable = isPreviousMonthAvailable(minDate, selectedDay);
    expect(isAvailable).toBe(false);
  });

  it('should return false when the first available month is after the currently selected month', () => {
    const minDate = moment.utc('2020-03-03');
    const selectedDay = moment.utc('2020-02-02');
    const isAvailable = isPreviousMonthAvailable(minDate, selectedDay);
    expect(isAvailable).toBe(false);
  });
});

describe('getAvailableYears', () => {
  it('should return an array of available years', () => {
    const fromDate = moment.utc('2019-01-01');
    const toDate = moment.utc('2021-01-01');

    const availableYears = getAvailableYears(fromDate, toDate);
    expect(availableYears).toEqual([2019, 2020, 2021]);
  });

  it('should return only the current year when min and max date are in the same year', () => {
    const fromDate = moment.utc('2019-01-01');
    const toDate = moment.utc('2019-01-01');

    const availableYears = getAvailableYears(fromDate, toDate);
    expect(availableYears).toEqual([2019]);
  });

  it('should return an empty array when from date is after toDate', () => {
    const fromDate = moment.utc('2022-01-01');
    const toDate = moment.utc('2021-01-01');

    const availableYears = getAvailableYears(fromDate, toDate);
    expect(availableYears).toEqual([]);
  });
});
