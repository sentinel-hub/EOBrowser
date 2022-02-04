import { Bounds, LatLngBounds } from 'leaflet';
import moment from 'moment';
import {
  getFlyoversToFetch,
  getMinMaxDates,
  getTimelapseBounds,
  isImageApplicable,
  isImageClearEnough,
  isImageCoverageEnough,
} from './Timelapse.utils';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

jest.mock('../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers', () => ({
  getDataSourceHandler: jest.fn(),
}));

describe('getTimelapseBounds', () => {
  const pixelBounds = new Bounds([
    [71120, 47154],
    [70175, 46401],
  ]);
  const zoom = 10;

  const bounds = new LatLngBounds(
    { lat: 74.75816257328852, lng: -83.49609375000001 },
    { lat: 75.02695401233501, lng: -82.46475219726564 },
  );

  const aoi = {
    bounds,
  };

  it('should return a center bbox when pixel bounds and zoom is passed', () => {
    expect(getTimelapseBounds(pixelBounds, zoom)).toEqual(bounds);
  });

  it('should return bounds when aoi bounds are passed', () => {
    expect(getTimelapseBounds(pixelBounds, zoom, aoi)).toEqual(bounds);
  });
});

describe('getMinMaxDates', () => {
  it('should return min and max dates', () => {
    getDataSourceHandler.mockReturnValue({
      getMinMaxDates: jest.fn(() => ({
        minDate: moment.utc('2020-01-01'),
        maxDate: moment.utc('2020-01-02'),
      })),
    });

    expect(getMinMaxDates()).toEqual({
      minDate: moment.utc('2020-01-01'),
      maxDate: moment.utc('2020-01-02'),
    });
  });

  it('should return default min and max date', () => {
    getDataSourceHandler.mockReturnValue({
      getMinMaxDates: jest.fn(() => ({
        maxDate: moment.utc('2020-01-02'),
      })),
    });

    expect(getMinMaxDates()).toEqual({
      minDate: moment.utc('1970-01-01'),
      maxDate: moment.utc('2020-01-02'),
    });
  });
});

describe('getFlyoversToFetch', () => {
  const flyovers = [
    {
      coveragePercent: 100,
      fromTime: moment.utc('2021-11-25').startOf('day'),
      toTime: moment.utc('2021-11-25').endOf('day'),
      meta: {
        averageCloudCoverPercent: 55,
      },
    },
    {
      coveragePercent: 40,
      fromTime: moment.utc('2021-11-26').startOf('day'),
      toTime: moment.utc('2021-11-26').endOf('day'),
      meta: {
        averageCloudCoverPercent: 90,
      },
    },
    {
      coveragePercent: 99,
      fromTime: moment.utc('2021-12-15').startOf('day'),
      toTime: moment.utc('2021-12-15').endOf('day'),
      meta: {
        averageCloudCoverPercent: 15,
      },
    },
    {
      coveragePercent: 99,
      fromTime: moment.utc('2021-12-23').startOf('day'),
      toTime: moment.utc('2021-12-23').endOf('day'),
      meta: {
        averageCloudCoverPercent: 15,
      },
    },
    {
      coveragePercent: 50,
      fromTime: moment.utc('2021-12-23').startOf('day'),
      toTime: moment.utc('2021-12-23').endOf('day'),
      meta: {
        averageCloudCoverPercent: 99,
      },
    },
    {
      coveragePercent: 90,
      fromTime: moment.utc('2022-01-06').startOf('day'),
      toTime: moment.utc('2022-01-06').endOf('day'),
      meta: {
        averageCloudCoverPercent: 20,
      },
    },
    {
      coveragePercent: 50,
      fromTime: moment.utc('2022-02-07').startOf('day'),
      toTime: moment.utc('2022-02-07').endOf('day'),
      meta: {
        averageCloudCoverPercent: 100,
      },
    },
  ];

  it('should return all flyovers by orbit', () => {
    const flyoversToFetch = getFlyoversToFetch(flyovers, 'orbit');

    expect(flyoversToFetch.length).toEqual(7);
  });

  it('should return best flyover by day', () => {
    const flyoversToFetch = getFlyoversToFetch(flyovers, 'day');

    expect(flyoversToFetch.length).toEqual(6);
  });

  it('should return best flyover by week', () => {
    const flyoversToFetch = getFlyoversToFetch(flyovers, 'week');

    expect(flyoversToFetch.length).toEqual(5);
  });

  it('should return best flyover by month', () => {
    const flyoversToFetch = getFlyoversToFetch(flyovers, 'month');

    expect(flyoversToFetch.length).toEqual(4);
  });

  it('should return best flyover by year', () => {
    const flyoversToFetch = getFlyoversToFetch(flyovers, 'year');

    expect(flyoversToFetch.length).toEqual(2);
    expect(flyoversToFetch[0].coveragePercent).toEqual(99);
    expect(flyoversToFetch[0].meta.averageCloudCoverPercent).toEqual(15);
    expect(flyoversToFetch[1].coveragePercent).toEqual(90);
    expect(flyoversToFetch[1].meta.averageCloudCoverPercent).toEqual(20);
  });
});

describe('isImageApplicable', () => {
  it('should be applicable when is selected', () => {
    const image = {
      isSelected: true,
      averageCloudCoverPercent: 10,
      coveragePercent: 100,
    };
    expect(isImageApplicable(image, true, true, 50, 80)).toBe(true);

    image.averageCloudCoverPercent = 50;
    expect(isImageApplicable(image, true, true, 50, 80)).toBe(true);

    image.coveragePercent = 75;
    expect(isImageApplicable(image, true, true, 50, 80)).toBe(false);

    image.isSelected = false;
    expect(isImageApplicable(image, true, true, 50, 80)).toBe(false);
  });
});

describe('isImageCoverageEnough', () => {
  it('should be applicable when coverage is high enough', () => {
    // we are rounding `coveragePercent` to whole number before doing the comparison so that it's consistent with display that's also rounded
    const image = {
      isSelected: true,
      averageCloudCoverPercent: 10,
      coveragePercent: 100,
    };
    expect(isImageCoverageEnough(image, true, 80)).toBe(true);

    image.coveragePercent = 70;
    expect(isImageCoverageEnough(image, true, 80)).toBe(false);

    image.coveragePercent = 79.4; // round to 79
    expect(isImageCoverageEnough(image, true, 80)).toBe(false);

    image.coveragePercent = 79.5; // round to 80
    expect(isImageCoverageEnough(image, true, 80)).toBe(true);

    image.coveragePercent = 80;
    expect(isImageCoverageEnough(image, true, 80)).toBe(true);

    image.coveragePercent = 80.5; // round to 81
    expect(isImageCoverageEnough(image, true, 80)).toBe(true);
  });
});

describe('isImageClearEnough', () => {
  it('should be applicable when cloud coverage is low enough', () => {
    // we are rounding `averageCloudCoverPercent` to whole number before doing the comparison so that it's consistent with display that's also rounded
    const image = {
      isSelected: true,
      averageCloudCoverPercent: 10,
      coveragePercent: 100,
    };
    expect(isImageClearEnough(image, true, 50)).toBe(true);

    image.averageCloudCoverPercent = 70;
    expect(isImageClearEnough(image, true, 50)).toBe(false);

    image.averageCloudCoverPercent = 50.5; // round to 51
    expect(isImageClearEnough(image, true, 50)).toBe(false);

    image.averageCloudCoverPercent = 50.4; // round to 50
    expect(isImageClearEnough(image, true, 50)).toBe(true);

    image.averageCloudCoverPercent = 50;
    expect(isImageClearEnough(image, true, 50)).toBe(true);

    image.averageCloudCoverPercent = 49.5; // round to 50
    expect(isImageClearEnough(image, true, 50)).toBe(true);
  });
});
