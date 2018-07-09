import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import LayerDatasourcePicker from './LayerDatasourcePicker';
import EffectsPanel from './EffectsPanel';
import NotificationPanel from './NotificationPanel';
import DownloadPanel from './DownloadPanel';
import Store from '../store';
import AddPin from './AddPin';
import Rodal from 'rodal';
import { isCustomPreset } from '../utils/utils';
import { downloadCanvas } from '../utils/downloadZip';
import { fetchDatesFromServiceIndex } from '../utils/ajax';
import AnalyticalPanel from './AnalyticalPanel';
import DayPicker from './DayPicker';

import Timelapse from './Timelapse';
import { DATASOURCES } from '../store/config';

class Visualization extends Component {
  state = {
    showEffects: false,
    fetchingAlternativeDatasourceInfo: false,
  };

  zoomTo = ({ lat, lng }) => {
    Store.setMapView({ lat, lng, zoom: 10, update: true });
  };

  updateDate = date => {
    Store.setSelectedResult({
      ...Store.current.selectedResult,
      time: moment(date).format('YYYY-MM-DD'),
    });
  };

  showTimelapse = () => {
    const modalDialogId = 'timelapse';
    const datasourceName = Store.current.selectedResult.datasource;
    Store.addModalDialog(
      modalDialogId,
      <Timelapse
        datasource={datasourceName}
        startDate={moment(Store.current.selectedResult.time)}
        captionPrefix={datasourceName || 'Sentinel-2'}
        onClose={() => Store.removeModalDialog(modalDialogId)}
      />,
    );
  };

  getTileInfo() {
    const { isActiveLayerVisible, selectedResult, presets, datasetMap } = Store.current;
    const { datasource: datasourceName, lat, time, lng, zoom, userId } = selectedResult;
    let datasource = DATASOURCES.find(ds => ds.name === datasourceName);
    if (!datasource) {
      datasource = Store.current.instances.find(inst => inst.name === datasourceName);
    }
    const dsSupportsZoomToTile = datasource.zoomToTile !== false;
    const dsSupportsEffects = datasource.effects !== false;
    const isL1C = datasourceName.includes('L1C') && datasourceName.includes('Sentinel-2');
    const l2a = isL1C ? 'Sentinel-2 L2A' : 'Sentinel-2 L1C';
    const showNextPrev = !datasourceName.includes('Proba-V');
    const addL1C = !isL1C || this.allowL2AorL1Ccheck(datasourceName, time);
    const { showEffects, fetchingAlternativeDatasourceInfo } = this.state;

    return (
      <div className="visualizationInfoPanel">
        <div className="tileActions">
          {dsSupportsZoomToTile && lat && lng ? (
            <a onClick={() => this.zoomTo({ lat, lng, zoom })} title="Zoom to tile">
              <i className="fa fa-search" />
            </a>
          ) : null}
          <AddPin onAddToPin={this.onAddToPin} />

          <a onClick={() => Store.toggleActiveLayer(!isActiveLayerVisible)}>
            <i
              title={isActiveLayerVisible ? 'Hide layer' : 'Show layer'}
              className={`fa fa-eye${isActiveLayerVisible ? '-slash' : ''}`}
            />
          </a>
          {dsSupportsEffects && (
            <a
              onClick={() => this.setState({ showEffects: !showEffects })}
              title={`Show ${showEffects ? 'visualization' : 'effects'}`}
            >
              <i className={`fa fa-${showEffects ? 'paint-brush' : 'gear'}`} />
            </a>
          )}
        </div>
        {userId && [<b className="leaveMeAlone">Configuration:</b>, datasourceName, <br />]}
        <b className="leaveMeAlone">Dataset:</b>{' '}
        {userId
          ? presets[datasourceName]
            ? datasetMap[presets[datasourceName][0].dataset]
            : datasourceName
          : datasourceName}
        {datasourceName.includes('Sentinel-2') &&
          addL1C && (
            <a
              style={{ marginLeft: 20 }}
              title={`Search for ${l2a} tiles on this date`}
              className="btn"
              onClick={() => this.checkforL2AorL1C(isL1C, time)}
            >
              {fetchingAlternativeDatasourceInfo ? (
                <i className="fa fa-spinner fa-spin fa-fw" />
              ) : isL1C ? (
                'Show L2A'
              ) : (
                'Show L1C'
              )}
            </a>
          )}
        <br />
        <b className="leaveMeAlone">Date:</b>
        <DayPicker onSelect={e => this.updateDate(e)} selectedDay={time} showNextPrev={showNextPrev} />
      </div>
    );
  }

  allowL2AorL1Ccheck = (datasource, time) => {
    const l2abounds = [
      { lat: 66.79190947341796, lng: -24.082031250000004 },
      { lat: 72.55449849665266, lng: 28.300781250000004 },
      { lat: 68.52823492039879, lng: 45.52734375000001 },
      { lat: 36.03133177633189, lng: 46.40625000000001 },
      { lat: 35.31736632923788, lng: -11.77734375 },
    ];
    return (
      datasource.includes('Sentinel-2 ') &&
      moment(time).isAfter('2017-03-28') &&
      Store.current.mapBounds &&
      Store.current.mapBounds.intersects(l2abounds)
    );
  };

  checkforL2AorL1C = (wasL1C, date) => {
    const selectedS2DataSource = wasL1C ? 'Sentinel-2 L2A' : 'Sentinel-2 L1C';
    this.setState({
      fetchingAlternativeDatasourceInfo: true,
    });
    fetchDatesFromServiceIndex(selectedS2DataSource, { from: date, to: date })
      .then(data => {
        if (data.tiles.length > 0) {
          this.setState({ fetchingAlternativeDatasourceInfo: false });
          const result = {
            datasource: selectedS2DataSource,
            time: moment(data.tiles[0].sensingTime)
              .utc()
              .format('YYYY-MM-DD'),
            preset: Store.current.presets[selectedS2DataSource][0].id,
          };
          Store.setSelectedResult(result);
        } else {
          this.setState({
            fetchingAlternativeDatasourceInfo: false,
          });
          this.displayL2AWarning(wasL1C, date);
        }
      })
      .catch(e => {
        this.setState({
          fetchingAlternativeDatasourceInfo: false,
        });
        this.displayL2AWarning(wasL1C, date);
        console.error('Error getting dates for ' + selectedS2DataSource, e);
      });
  };

  displayL2AWarning = (wasL1C, date) => {
    const modalDialogId = 'l2a-warning';
    Store.addModalDialog(
      modalDialogId,
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={120}
        onClose={() => Store.removeModalDialog(modalDialogId)}
      >
        <div>
          <h3>No tile found</h3>
          No {wasL1C ? 'Sentinel-2 L2A' : 'Sentinel-2 L1C'} tiles found on {date} for the current view. Try
          other Sentinel-2 tiles or use the search form to get other dates.
        </div>
      </Rodal>,
    );
  };

  downloadImage = () => {
    const { isAnalytical, imageExt, showLogo } = Store.current;
    if (isAnalytical) {
      const modalDialogId = 'analytical-download';
      Store.addModalDialog(
        modalDialogId,
        <Rodal
          animation="slideUp"
          customStyles={{
            height: 'auto',
            bottom: 'auto',
            width: '500px',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          visible
          onClose={() => Store.removeModalDialog(modalDialogId)}
        >
          <AnalyticalPanel />
        </Rodal>,
      );
    } else {
      this.setState({ loading: true });
      Store.generateImageLink();
      const isPngJpg = ['jpg', 'png'].includes(imageExt);
      if (isPngJpg && showLogo) {
        downloadCanvas()
          .then(res => {
            this.setState({ loading: false });
          })
          .catch(err => {
            this.setState({ loading: false });
            console.error(err);
          });
      } else {
        window.open(Store.current.imgWmsUrl, '_blank');
      }
    }
  };

  onAddToPin = () => {
    Store.setTabIndex(3);
  };

  activateResult = preset => {
    Store.setPreset(preset);
    this.setState({ showEffects: false });
  };

  render() {
    const { showEffects, loading } = this.state;
    const {
      channels,
      presets,
      isAnalytical,
      selectedResult: { datasource: datasourceName, preset, minZoom = 5, maxZoom = 16, userId },
      views,
      currView,
      zoom,
    } = this.props;

    const dsLayers = presets[datasourceName];
    let datasource = DATASOURCES.find(ds => ds.name === datasourceName);
    if (!datasource) {
      datasource = Store.current.instances.find(inst => inst.name === datasourceName);
    }

    const dsChannels = channels[datasourceName];
    const mapZoom = Number(zoom);
    const showNotification = mapZoom < minZoom || mapZoom > maxZoom;
    const supportsCustom = datasource.customLayer !== false;
    return (
      <div>
        {this.getTileInfo()}
        {showEffects ? (
          <EffectsPanel />
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
        {mapZoom > maxZoom && <NotificationPanel msg="Zoom out to view data" type="info" />}

        {!showNotification && (
          <DownloadPanel
            ref={downloadPanel => {
              this.downloadPanel = downloadPanel;
            }}
            loading={loading}
            isAnalytical={isAnalytical}
            onDownload={this.downloadImage}
            showTimelapse={this.showTimelapse}
            onChangeAnalytical={() => {
              Store.setAnalytical(!isAnalytical);
            }}
          />
        )}
      </div>
    );
  }
}

export default connect(s => s)(Visualization);
