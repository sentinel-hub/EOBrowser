import Store from '../store';
import { DATASOURCES } from '../store/config';

// DataSourceHandler subclasses take care of:
// - recognizing (WMS / WMTS) URLs as "theirs"
// - fetching additional information from their services as needed
// - displaying search form
// - returning search results corresponding to search input
// - ...
export default class DataSourceHandler {
  fetchingFunctions = [];
  offsets = [];
  static N_RESULTS = 50;

  willHandle(service, url, name, configs, preselected) {
    // Returns boolean, indicating if the protocol (typically WMS / WMTS) and URL are
    // supported by this class; that is, this class knows how to handle them.
    // Should remember protocol / url so it can handle the subsequent method invocations.
    // Note that `configs` is an object which can have 2 keys, `capabilities` and `instanceConfig`.
    return false;
  }
  isHandlingAnyUrl() {
    // Returns whether this handler accepted handling of anything.
    return false;
  }
  getSearchFormComponents() {
    return [];
  }

  prepareNewSearch(fromMoment, toMoment, queryArea = null) {
    this.fetchingFunctions = this.getNewFetchingFunctions(fromMoment, toMoment, queryArea);
    // now that fetching function are prepared, initialize the offsets to zeros:
    this.offsets = this.fetchingFunctions.map(() => 0);
  }

  performSearch() {
    // Returns a promise that will resolve with (sorted!) search results for everything that
    // we handle. If search fails for some reason, promise should be rejected with an error
    // message (string).
    /*
      - input for search is:
        - urls + parameters + method (packed in a "fetchingFunction")
        - offsets for each endpoint
    */

    if (this.fetchingFunctions.length === 0) {
      return null;
    }

    // We fetch the data according to offset (every fetchingFunction has a different offset). This is not
    // the most efficient solution for "Load more" because we are probably fetching results that we have
    // already fetched, but it is much less complex and "Load more" (probably) doesn't happen very often.
    const fetchingPromises = this.fetchingFunctions.map((ff, i) =>
      ff(this.offsets[i], DataSourceHandler.N_RESULTS + 1),
    );
    return Promise.all(fetchingPromises).then(tilesLists => {
      // we must return a single list, but each element (result item) should know the index of its
      // fetchingFunction, so that we can increment the offset when it is used:
      const result = [];
      tilesLists.forEach((tiles, fetchingFunctionIndex) => {
        result.push(...tiles.map(tile => ({ ...tile, fetchingFunctionIndex })));
      });
      return result;
    });
  }

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    // If using default implementation of `performSearch`, this function returns an array of
    // functions. Each function takes two parameters (offset, nResults) and returns a promise that
    // will resolve to a list of tiles.
    return [];
  }

  markAsConsumed(result) {
    this.offsets[result.fetchingFunctionIndex]++;
  }

  // Hack until we clean result items format: utility function that "enriches" tiles
  // with "instance", as needed by other parts of application.
  // List of possible datasets: "S2L1C", "S2L2A", "L8L1C", "Planet", "MODIS", "DEM", "S1GRD", "S2GM"
  _enrichTilesWithLegacyStuffAWS(tiles, dataset, urls, configs, themeDatasource = null) {
    // among the instances with the URLs we support, we need to find those that have
    // this dataset:
    urls = urls.filter(url => url.includes('.sentinel-hub.com/ogc/'));
    let instances = Store.current.instances.filter(inst => {
      if (!urls.includes(inst.baseUrls.WMS)) {
        return false;
      }
      const { capabilities } = configs[inst.baseUrls.WMS];
      const usesDataset = !!capabilities.datasets.find(d => d.name === dataset);
      return usesDataset;
    });
    // conceiveably, user could specify URLS which point to multiple instances, which
    // could have the same dataset. We don't support this.
    if (instances.length > 1) {
      console.error(
        `Warning: multiple instances in the theme include the same dataset (${dataset} @ AWS), which is not supported. Only first one will be used, others will be ignored.`,
      );
    }
    if (instances.length === 0 && themeDatasource) {
      // It seems that neither predefined datasources nor the user's instances hold this
      // instance. This could happen because we specified a theme with custom instances
      // which are unknown to EO Browser. But, despair not - we will enrich data with the
      // datasource and fake the WMS URLs. Tadaaa!
      // throw Error('Could not find appropriate instance for searching!');
      //
      // themeDatasource has been added to handle L8 USGS instances in custom themes:
      // `activeLayer` must contain the correct object from config.js, based on its `id`.
      // Thus, we pass the specific themeDatasourceId so that we find the correct one.
      const ds = themeDatasource ? themeDatasource : dataset;
      return this._enrichTilesWithLegacyStuffUsingDatasources(tiles, ds).map(t => {
        t.activeLayer.baseUrls.WMS = urls[0];
        t.activeLayer.baseUrls.FIS = urls[0].replace('/ogc/wms/', '/ogc/fis/');
        t.isFakedFromDataSourceWithThemeURL = true;
        t.siblingDatasourceId = undefined;
        return t;
      });
    }

    return tiles.map(t => ({
      ...t,
      cloudCoverage: t.cloudCoverPercentage,
      activeLayer: instances[0],
      datasource: instances[0].name,
    }));
  }

  _enrichTilesWithLegacyStuffUsingDatasources(tiles, datasourceId) {
    // EO Cloud is a bit easier, because we don't support custom instances there, so
    // we have the whole list of possible instanceIDs in the DATASOURCES: (probably)
    const ds = DATASOURCES.find(ds2 => ds2.id === datasourceId);
    if (!ds) {
      throw Error('Could not find appropriate datasource for searching!');
    }
    return tiles.map(t => ({
      ...t,
      // cloudCoverage: t.cloudCoverPercentage,
      activeLayer: ds,
      datasource: ds.name,
      // rename (copy) tileDrawRegionGeometry => dataGeometry for tiles highlighting / selecting: (if needed)
      dataGeometry: t.dataGeometry || t.tileDrawRegionGeometry,
    }));
  }
}
