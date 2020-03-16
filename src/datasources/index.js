import React from 'react';
import flatten from 'lodash/flatten';
import moment from 'moment';

import Sentinel1DataSourceHandler from './Sentinel1DataSourceHandler';
import Sentinel2AWSDataSourceHandler from './Sentinel2AWSDataSourceHandler';
import Sentinel3DataSourceHandler from './Sentinel3DataSourceHandler';
import Sentinel5PDataSourceHandler from './Sentinel5PDataSourceHandler';
import LandsatDataSourceHandler from './LandsatDataSourceHandler';
import ProbaVDataSourceHandler from './ProbaVDataSourceHandler';
import EnvisatMerisDataSourceHandler from './EnvisatMerisDataSourceHandler';
import ModisDataSourceHandler from './ModisDataSourceHandler';
import GibsDataSourceHandler from './GibsDataSourceHandler';
import { applyFilterMonthsToDateRange } from './filterDates';

let dataSourceHandlers = [];

class Search {
  /*
    If user wants to filter by months, we need to perform search on multiple date intervals. This
    class does that for us - it creates such intervals, then calls performSearch function with
    correct parameters and merges the results.

    Initializing:
      currentSearch.prepareNewSearch(...params);
      firstNResults = currentSearch.getNext50Results();

    "Load more".onClick:
      nextNResults = currentSearch.getNext50Results();
  */
  searchIntervals = null;
  bounds = null;
  currentIntervalIndex = -1;
  currentIntervalHasMore = false;
  static N_RESULTS = 50;

  prepareNewSearch(fromMoment, toMoment, bounds, filterMonths) {
    this.searchIntervals = applyFilterMonthsToDateRange(fromMoment, toMoment, filterMonths);
    this.searchIntervals.reverse(); // we want most recent intervals first
    this.currentIntervalHasMore = false;
    this.currentIntervalIndex = -1;
    this.bounds = bounds;
  }

  hasMoreResults() {
    return this.currentIntervalHasMore || this.currentIntervalIndex < this.searchIntervals.length - 1;
  }

  async getNext50Results(currentLat, currentLng) {
    let results = [];

    while (true) {
      // keep performing search until you gather 50 results or until there is no more
      // intervals left:
      if (!this.currentIntervalHasMore) {
        // do we have some other interval we can search within?
        if (this.currentIntervalIndex >= this.searchIntervals.length - 1) {
          return results;
        }
        // advance to next search interval:
        this.currentIntervalIndex = this.currentIntervalIndex + 1;
        const interval = this.searchIntervals[this.currentIntervalIndex];
        prepareNewSearch(interval.fromMoment, interval.toMoment, this.bounds);
      }

      const nMissing = Search.N_RESULTS - results.length;
      const { results: nextResults, hasMore } = await performSearch(currentLat, currentLng, nMissing);
      results = results.concat(nextResults);
      this.currentIntervalHasMore = hasMore;

      if (results.length >= Search.N_RESULTS) {
        return results;
      }
    }
  }
}

export let currentSearch = new Search();

export function initializeDataSourceHandlers() {
  dataSourceHandlers = [
    new Sentinel1DataSourceHandler(),
    new Sentinel2AWSDataSourceHandler(),
    new Sentinel3DataSourceHandler(),
    new Sentinel5PDataSourceHandler(),
    new LandsatDataSourceHandler(),
    new EnvisatMerisDataSourceHandler(),
    new ModisDataSourceHandler(),
    new ProbaVDataSourceHandler(),
    new GibsDataSourceHandler(),
  ];
}

export function registerHandlers(service, url, name, configs, preselected) {
  const handledBy = dataSourceHandlers.filter(dsHandler =>
    dsHandler.willHandle(service, url, name, configs, preselected),
  );
  return handledBy.length !== 0;
}

function prepareNewSearch(fromMoment, toMoment, bounds) {
  dataSourceHandlers
    .filter(dsh => dsh.isHandlingAnyUrl())
    .forEach(dsh => dsh.prepareNewSearch(fromMoment, toMoment, bounds));
}

function performSearch(currentLat, currentLng, nResults) {
  /*
    - returns next nResults results for the current search
    - returns hasMore variable (so we know if we should display "Show more" button)
    - advances the datasource handlers' internal offset counters so that next invocation of performSearch()
      will continue where we left off

    Note that currentLat / Lng are only used to decorate tileData.
  */
  const applicableDSHandlers = dataSourceHandlers.filter(dsh => dsh.isHandlingAnyUrl());
  const allSearchPromises = applicableDSHandlers.map(dsh => dsh.performSearch());
  return new Promise((resolve, reject) => {
    if (allSearchPromises.filter(searchPromise => searchPromise !== null).length === 0) {
      reject('Please select data source(s)!');
      return;
    }

    Promise.all(allSearchPromises)
      .then(resultsLists => {
        // This is a very simplistic way of retrieving the search results. We put them all in the same
        // array, sort them and take first 50.

        // We need to remember the handlerIndex in each of the results, so that when we sort the results
        // and pick the first 50, we can tell the handlers how many of their results were consumed:
        const markedResultsLists = resultsLists.map(
          (tiles, handlerIndex) => (tiles === null ? [] : tiles.map(tile => ({ ...tile, handlerIndex }))),
        );

        // Sort results and take only first 50:
        const results = flatten(markedResultsLists);
        results.sort((a, b) => moment(b.sensingTime).diff(moment(a.sensingTime)));
        const firstNResults = results.slice(0, nResults);

        const hasMore = results.length > nResults;

        // Tell handlers that their results were consumed, so that "Load more" will skip them:
        firstNResults.forEach(t => {
          applicableDSHandlers[t.handlerIndex].markAsConsumed(t);
        });

        const finalResults = firstNResults.map((t, resultIndex) => ({
          tileData: {
            ...t,
            sensingTime: moment.utc(t.sensingTime).format('HH:mm:ss') + ' UTC',
            time: moment.utc(t.sensingTime).format('YYYY-MM-DD'),
            cloudCoverage: t.cloudCoverage === undefined ? -1 : t.cloudCoverage,
            lat: currentLat,
            lng: currentLng,
          },
          resultIndex: resultIndex,
          properties: {
            index: 0,
            queryParams: {},
          },
        }));

        resolve({
          results: finalResults,
          hasMore: hasMore,
        });
      })
      .catch(e => {
        console.error(e);
        reject(`Search error: ${e}`);
      });
  });
}

export function renderDataSourcesInputs() {
  return dataSourceHandlers
    .filter(dsh => dsh.isHandlingAnyUrl())
    .map((dsh, dshIndex) => <div key={dshIndex}>{dsh.getSearchFormComponents()}</div>);
}
