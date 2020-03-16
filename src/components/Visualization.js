import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import LayerDatasourcePicker from './LayerDatasourcePicker';
import { NotificationPanel, EOBEffectsPanel } from '@sentinel-hub/eo-components';
import Store from '../store';
import AddPin from './AddPin';
import Rodal from 'rodal';
import { isCustomPreset, getZoomLimitsForSelectedLayer, checkIfFisLayer } from '../utils/utils';
import { getAndSetNextPrev, queryDatesForActiveMonth } from '../utils/datesHelper';
import {
  EOBVisualizationTimeSelect,
  getInstantsFromTimeInterval,
  isTimeInterval,
} from '@sentinel-hub/eo-components';
import { DATASOURCES, DATASET_MAP } from '../store/config';

class Visualization extends Component {
  state = {
    showEffects: false,
    fetchingAlternativeDatasourceInfo: false,
  };

  zoomTo = ({ lat, lng }) => {
    Store.setMapView({ lat, lng, zoom: 10, update: true });
  };

  updateSelectedTime = time => {
    Store.setSelectedResult({ ...Store.current.selectedResult, time: time });
  };

  getTileInfo() {
    const { isActiveLayerVisible, selectedResult, presets, minDate, maxDate } = Store.current;
    const { datasource: datasourceName, lat, time, lng, zoom, userId } = selectedResult;
    let datasource = DATASOURCES.find(ds => ds.name === datasourceName);
    if (!datasource) {
      datasource = Store.current.instances.find(inst => inst.name === datasourceName);
    }
    const dsSupportsZoomToTile = datasource.zoomToTile !== false;
    const dsSupportsEffects = datasource.effects !== false;

    const showNextPrev = datasource.showPrevNextDate === undefined ? true : datasource.showPrevNextDate;
    const timespanSupported =
      datasource.timespanSupported === undefined ? true : datasource.timespanSupported;
    const siblingDatasource = datasource.siblingDatasourceId
      ? DATASOURCES.find(ds => ds.id === datasource.siblingDatasourceId)
      : undefined;

    const isSiblingDataAvailable = datasource.siblingDatasourceId
      ? this.checkSiblingAvailability(siblingDatasource, time)
      : false;

    const { showEffects, fetchingAlternativeDatasourceInfo } = this.state;
    const minDateRange = selectedResult.minDate ? new Date(selectedResult.minDate) : new Date(minDate);
    const maxDateRange = selectedResult.maxDate ? new Date(selectedResult.maxDate) : new Date(maxDate);
    return (
      <div className="visualizationInfoPanel">
        <div className="tileActions">
          {dsSupportsZoomToTile && lat && lng ? (
            <a
              onClick={() =>
                this.zoomTo({
                  lat,
                  lng,
                  zoom,
                })
              }
              title="Zoom to tile"
            >
              <i className="fa fa-search" />
            </a>
          ) : null}
          <AddPin />
          <a onClick={() => Store.toggleActiveLayer(!isActiveLayerVisible)}>
            <i
              title={isActiveLayerVisible ? 'Hide layer' : 'Show layer'}
              className={`fa fa-eye${isActiveLayerVisible ? '-slash' : ''}`}
            />
          </a>
          {dsSupportsEffects && (
            <a
              onClick={() =>
                this.setState({
                  showEffects: !showEffects,
                })
              }
              title={`Show ${showEffects ? 'visualization' : 'effects'}`}
            >
              <i className={`fa fa-${showEffects ? 'paint-brush' : 'sliders'}`} />
            </a>
          )}
        </div>
        {userId && (
          <div>
            <b className="leaveMeAlone">Configuration:</b> {datasourceName}
          </div>
        )}
        <div>
          <b className="leaveMeAlone">Dataset:</b>{' '}
          {userId
            ? presets[datasourceName]
              ? DATASET_MAP[presets[datasourceName][0].dataset]
              : datasourceName
            : datasourceName}
          {siblingDatasource && (
            <a
              style={{ marginLeft: 20 }}
              title={
                isSiblingDataAvailable
                  ? `Search for ${siblingDatasource.name} tiles on this date`
                  : `Tiles for ${siblingDatasource.name} are not available on this date or in this area`
              }
              className="btn"
              onClick={() => this.getSiblingData(siblingDatasource, time)}
              disabled={!isSiblingDataAvailable}
            >
              {fetchingAlternativeDatasourceInfo ? (
                <i className="fa fa-spinner fa-spin fa-fw" />
              ) : (
                `Show ${siblingDatasource.shortName}`
              )}
            </a>
          )}
        </div>
        <EOBVisualizationTimeSelect
          maxDate={maxDateRange}
          minDate={minDateRange}
          showNextPrev={showNextPrev}
          onGetAndSetNextPrev={this.onGetAndSetNextPrev}
          onQueryDatesForActiveMonth={this.onQueryDatesForActiveMonth}
          time={time}
          updateSelectedTime={this.updateSelectedTime}
          timespanSupported={timespanSupported}
        />
      </div>
    );
  }

  onGetAndSetNextPrev = direction => {
    const { maxDate, minDate, selectedResult, mapBounds, instances, userInstances } = Store.current;
    return getAndSetNextPrev(
      direction,
      maxDate,
      minDate,
      selectedResult,
      mapBounds,
      instances,
      userInstances,
    );
  };

  onQueryDatesForActiveMonth = date => {
    const {
      selectedResult,
      selectedResult: { datasource },
      instances,
      mapBounds,
    } = Store.current;
    return queryDatesForActiveMonth(date, datasource || null, selectedResult, instances, mapBounds);
  };

  checkSiblingAvailability = (datasource, time) => {
    const { timeStart, timeEnd } = getInstantsFromTimeInterval(time);
    const timeIsAfterMinDate = datasource.minDate ? moment.utc(timeEnd).isAfter(datasource.minDate) : true;
    const timeIsBeforeMaxDate = datasource.maxDate
      ? moment.utc(timeStart).isBefore(datasource.maxDate)
      : true;
    return timeIsAfterMinDate && timeIsBeforeMaxDate;
  };

  getSiblingData = (datasource, time) => {
    if (this.checkSiblingAvailability(datasource, time)) {
      this.setState({ fetchingAlternativeDatasourceInfo: true });

      let fromMoment = null;
      let toMoment = null;
      if (isTimeInterval(time)) {
        const { timeFrom, timeTo } = getInstantsFromTimeInterval(time);
        fromMoment = moment.utc(timeFrom);
        toMoment = moment.utc(timeTo);
      } else {
        fromMoment = moment.utc(time).startOf('day');
        toMoment = moment.utc(time).endOf('day');
      }

      datasource
        .getDates(fromMoment, toMoment)
        .then(data => {
          let fetchedTime = data.length > 0 ? data[0] : undefined;

          // if datasource is limited to some area, check if map intersects datasource bounds
          const isInBounds = datasource.limitedBounds
            ? Store.current.mapBounds && Store.current.mapBounds.intersects(datasource.limitedBounds)
            : true;

          if (fetchedTime && isInBounds) {
            this.setState({ fetchingAlternativeDatasourceInfo: false });
            const result = {
              activeLayer: datasource,
              datasource: datasource.name,
              time: fetchedTime,
              preset: Store.current.presets[datasource.name][0].id,
            };
            Store.setSelectedResult(result);
          } else {
            this.setState({ fetchingAlternativeDatasourceInfo: false });
            this.displayNoSiblingDateWarning(datasource, time);
          }
        })
        .catch(e => {
          this.setState({ fetchingAlternativeDatasourceInfo: false });
          this.displayNoSiblingDateWarning(datasource, time);
          console.error('Error getting dates for ' + datasource.name, e);
        });
    } else {
      this.displayNoSiblingDateWarning(datasource, time);
    }
  };

  displayNoSiblingDateWarning = (datasource, time) => {
    const reason = this.checkSiblingAvailability(datasource, time)
      ? 'No ' + datasource.name + ' tiles found on ' + time + ' for the current view.'
      : datasource.minDate && datasource.maxDate
        ? datasource.name + ' is available from ' + datasource.minDate + ' to ' + datasource.maxDate + '.'
        : datasource.minDate && !datasource.maxDate
          ? datasource.name + ' is available from ' + datasource.minDate + ' onward.'
          : !datasource.minDate && datasource.maxDate
            ? datasource.name + ' is available to ' + datasource.maxDate + '.'
            : datasource.name + " isn't available.";

    const modalDialogId = 'noSiblingDate-warning';
    Store.addModalDialog(
      modalDialogId,
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={130}
        onClose={() => Store.removeModalDialog(modalDialogId)}
        closeOnEsc={true}
      >
        <div>
          <h3>No tile found</h3>
          {reason}
          <br />
          Try other {datasource.name} tiles or use the search form to get other dates.
        </div>
      </Rodal>,
    );
  };

  activateResult = preset => {
    Store.setPreset(preset);
    this.setState({ showEffects: false });
  };

  onUpdateGainOverride = value => {
    Store.setGainOverride(value);
  };

  onUpdateGammaOverride = value => {
    Store.setGammaOverride(value);
  };

  onUpdateRedRangeOverride = value => {
    Store.setRedRangeOverride(value);
  };

  onUpdateGreenRangeOverride = value => {
    Store.setGreenRangeOverride(value);
  };

  onUpdateBlueRangeOverride = value => {
    Store.setBlueRangeOverride(value);
  };

  onUpdateValueRangeOverride = value => {
    Store.setValueRangeOverride(value);
  };

  render() {
    const { showEffects } = this.state;

    const {
      channels,
      presets,
      selectedResult: {
        datasource: datasourceName,
        preset,
        userId,
        gainOverride,
        gammaOverride,
        redRangeOverride,
        greenRangeOverride,
        blueRangeOverride,
      },
      views,
      currView,
      zoom,
    } = this.props;

    const dsLayers = presets[datasourceName];
    let datasource = DATASOURCES.find(ds => ds.name === datasourceName);
    if (!datasource) {
      datasource = Store.current.instances.find(inst => inst.name === datasourceName);
    }

    const effectsOverrides = {
      gainOverride,
      gammaOverride,
      redRangeOverride,
      greenRangeOverride,
      blueRangeOverride,
    };

    const { minZoom, maxZoom, allowOverZoomBy } = getZoomLimitsForSelectedLayer();
    const maxZoomWithOverZoom = maxZoom + allowOverZoomBy;
    const dsChannels = channels[datasourceName];
    const mapZoom = Number(zoom);
    const supportsCustom = datasource.customLayer !== false;
    return (
      <div>
        {this.getTileInfo()}
        {showEffects ? (
          <EOBEffectsPanel
            effectsOverrides={effectsOverrides}
            isFISLayer={checkIfFisLayer()}
            onUpdateGainOverride={this.onUpdateGainOverride}
            onUpdateGammaOverride={this.onUpdateGammaOverride}
            onUpdateRedRangeOverride={this.onUpdateRedRangeOverride}
            onUpdateGreenRangeOverride={this.onUpdateGreenRangeOverride}
            onUpdateBlueRangeOverride={this.onUpdateBlueRangeOverride}
            onUpdateValueRangeOverride={this.onUpdateValueRangeOverride}
          />
        ) : (
          <LayerDatasourcePicker
            userId={userId}
            activePreset={preset}
            channels={dsChannels}
            supportsCustom={supportsCustom}
            isCustomSelected={supportsCustom && isCustomPreset(preset) && currView !== views.PRESETS}
            presets={dsLayers}
            onActivate={this.activateResult}
          />
        )}
        {mapZoom < minZoom && <NotificationPanel msg="Zoom in to view data" type="info" />}
        {mapZoom > maxZoomWithOverZoom && <NotificationPanel msg="Zoom out to view data" type="info" />}
      </div>
    );
  }
}

export default connect(s => s)(Visualization);
