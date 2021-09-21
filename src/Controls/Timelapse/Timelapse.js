import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { t } from 'ttag';
import { EOB3TimelapsePanel } from '../../junk/EOB3TimelapsePanel/EOB3TimelapsePanel';
import { LayersFactory, ApiType, BBox, CRS_EPSG4326, DATASET_S5PL2 } from '@sentinel-hub/sentinelhub-js';
import 'rodal/lib/rodal.css';

import store, { modalSlice } from '../../store';
import { getAppropriateAuthToken } from '../../App';
import {
  getDataSourceHandler,
  getEvalsource,
  checkIfCustom,
} from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { b64EncodeUnicode } from '../../utils/base64MDN';
import { DATASOURCES, reqConfigMemoryCache } from '../../const';

export const timelapseBorders = (width, height, bbox) => ({
  sortIndex: 1,
  url: `https://api.maptiler.com/maps/${process.env.REACT_APP_MAPTILER_MAP_ID_BORDERS}/static/${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}/${width}x${height}.png?key=${process.env.REACT_APP_MAPTILER_KEY}&attribution=false`,
  params: {},
});

class Timelapse extends Component {
  state = { obtainedLayerInfo: false };
  componentDidMount() {
    this.getLayerInfo();
  }
  generateSelectedResult = () => {
    return {
      name: this.props.datasetId,
      baseUrls: {
        WMS: this.props.visualizationUrl,
      },
      time: this.props.time.toISOString(),
      evalsource: getEvalsource(this.props.datasetId),
      preset: this.props.layerId ? this.props.layerId : 'CUSTOM',
      evalscript: this.props.evalscript ? b64EncodeUnicode(this.props.evalscript) : null,
      evalscripturl: this.props.evalscripturl ? this.props.evalscripturl : null,
    };
  };

  generateInstances = () => {
    return [
      {
        name: this.props.datasetId,
        baseUrls: {
          WMS: this.props.visualizationUrl,
        },
      },
    ];
  };

  generatePresets = () => {
    return {
      [this.props.datasetId]: [
        {
          id: this.props.layerId ? this.props.layerId : this.layer.layerId,
        },
      ],
    };
  };

  getMinMaxDates = () => {
    let { minDate, maxDate } = getDataSourceHandler(this.props.datasetId).getMinMaxDates(
      this.props.datasetId,
    );
    minDate = minDate ? minDate.toDate() : new Date('1970-01-01');
    maxDate = maxDate ? maxDate.toDate() : new Date();
    return { minDate, maxDate };
  };

  onFetchAvailableDates = async (fromMoment, toMoment, bounds) => {
    const { mapBounds } = this.props;
    const bbox = new BBox(
      CRS_EPSG4326,
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth(),
    );
    const dates = await this.layer.findDatesUTC(bbox, fromMoment.toDate(), toMoment.toDate());
    return dates;
  };

  onQueryDatesForActiveMonth = async (date) => {
    const monthStart = moment(date).startOf('month');
    const monthEnd = moment(date).endOf('month');
    const dates = await this.onFetchAvailableDates(monthStart, monthEnd);
    return dates;
  };

  getLayerInfo = async () => {
    const { layerId, datasetId, visualizationUrl } = this.props;
    const datasourceHandler = getDataSourceHandler(datasetId);
    const shJsDatasetId = datasourceHandler.getSentinelHubDataset(datasetId)
      ? datasourceHandler.getSentinelHubDataset(datasetId).id
      : null;
    let layer = await LayersFactory.makeLayers(
      visualizationUrl,
      (layer, dataset) =>
        !shJsDatasetId
          ? dataset === null && layer === layerId
          : !layerId
          ? true
          : dataset.id === shJsDatasetId && layer === layerId,
      null,
      reqConfigMemoryCache,
    );

    this.layer = layer[0];
    await this.layer.updateLayerFromServiceIfNeeded(reqConfigMemoryCache);
    if (this.layer.dataset === DATASET_S5PL2) {
      this.layer.productType = datasourceHandler.getProductType(datasetId);
    }

    const canWeFilterByClouds = datasourceHandler.tilesHaveCloudCoverage(datasetId);

    const apiType = this.layer.supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS;

    this.setState({
      apiType: apiType,
      obtainedLayerInfo: true,
      canWeFilterByClouds: canWeFilterByClouds,
    });
  };

  render() {
    const {
      lat,
      lng,
      zoom,
      datasetId,
      authToken,
      mapBounds,
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      redCurveEffect,
      greenCurveEffect,
      blueCurveEffect,
      upsampling,
      downsampling,
      speckleFilter,
      orthorectification,
      minQa,
      dataFusion,
      evalscripturl,
    } = this.props;
    const { minDate, maxDate } = this.getMinMaxDates();

    if (!this.state.obtainedLayerInfo) {
      return null;
    }

    const effects = {
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      redCurveEffect,
      greenCurveEffect,
      blueCurveEffect,
      upsampling,
      downsampling,
      speckleFilter,
      demInstanceType: orthorectification,
      minQa,
    };
    const timelapseOverlayLayers = [{ name: t`Borders`, layer: timelapseBorders }];
    const dsh = getDataSourceHandler(datasetId);
    const supportsTimeRange = dsh && dsh.supportsTimeRange();
    const isGIBS = dsh && dsh.datasource === DATASOURCES.GIBS;
    const isBYOC = checkIfCustom(datasetId);

    return (
      <div className="timelapse-wrapper">
        <EOB3TimelapsePanel
          onClose={() => store.dispatch(modalSlice.actions.removeModal())}
          lat={lat}
          lng={lng}
          zoom={zoom}
          mapBounds={mapBounds}
          authToken={authToken}
          apiType={this.state.apiType}
          minDate={minDate}
          maxDate={maxDate}
          dataFusion={dataFusion}
          selectedResult={this.generateSelectedResult()}
          instances={this.generateInstances()}
          presets={this.generatePresets()}
          SHJSLayer={this.layer}
          onFetchAvailableDates={this.onFetchAvailableDates}
          onQueryDatesForActiveMonth={this.onQueryDatesForActiveMonth}
          overlayLayers={timelapseOverlayLayers}
          canWeFilterByClouds={this.state.canWeFilterByClouds}
          isEvalUrl={!!evalscripturl}
          effects={effects}
          supportsTimeRange={supportsTimeRange}
          showSHLogo={!isGIBS}
          showCopernicusLogo={!isGIBS && !isBYOC}
          // TO DO
          evalscriptoverrides={''}
          aoiBounds={undefined}
          cloudCoverageLayers={null}
        />
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  time: store.visualization.toTime,
  mapBounds: store.mainMap.bounds,
  datasetId: store.visualization.datasetId,
  layerId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  visualizationUrl: store.visualization.visualizationUrl,
  evalscript: store.visualization.evalscript,
  evalscripturl: store.visualization.evalscripturl,
  authToken: getAppropriateAuthToken(store.auth, store.themes.selectedThemeId),
  gainEffect: store.visualization.gainEffect,
  gammaEffect: store.visualization.gammaEffect,
  redRangeEffect: store.visualization.redRangeEffect,
  greenRangeEffect: store.visualization.greenRangeEffect,
  blueRangeEffect: store.visualization.blueRangeEffect,
  redCurveEffect: store.visualization.redCurveEffect,
  greenCurveEffect: store.visualization.greenCurveEffect,
  blueCurveEffect: store.visualization.blueCurveEffect,
  upsampling: store.visualization.upsampling,
  downsampling: store.visualization.downsampling,
  speckleFilter: store.visualization.speckleFilter,
  orthorectification: store.visualization.orthorectification,
  minQa: store.visualization.minQa,
  dataFusion: store.visualization.dataFusion,
});

export default connect(mapStoreToProps, null)(Timelapse);
