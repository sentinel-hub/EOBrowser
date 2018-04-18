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
import { queryIndex, queryActiveMonth } from '../utils/ajax';
import AnalyticalPanel from './AnalyticalPanel';
import DatePicker from './DatePicker';
import Timelapse from './Timelapse';

class Visualization extends Component {
  state = {
    showEffects: false,
    analyticalDialog: false,
    checkL2a: false
  };

  zoomTo = ({ lat, lng }) => {
    Store.setMapView({ lat, lng, zoom: 10, update: true });
  };

  updateDate = date => {
    Store.setSelectedResult({
      ...Store.current.selectedResult,
      time: moment(date).format('YYYY-MM-DD')
    });
  };
  getDates = obj => {
    queryActiveMonth(obj);
  };
  toggleTimelapse = () => {
    this.setState({ showTimelapse: true });
  };
  getTileInfo() {
    const {
      isActiveLayerVisible,
      selectedResult,
      presets,
      datasetMap
    } = Store.current;
    const { datasource, lat, time, lng, zoom, userId } = selectedResult;
    const hasZoom = !datasource.includes('MODIS');
    const isL1C =
      datasource.includes('L1C') && datasource.includes('Sentinel-2');
    const l2a = isL1C ? 'Sentinel-2 L2A' : 'Sentinel-2 L1C';
    const addL1C = !isL1C || this.allowL2AorL1Ccheck(datasource, time);
    const { showEffects, checkL2a, showTimelapse } = this.state;

    return (
      <div className="visualizationInfoPanel">
        <div className="tileActions">
          {hasZoom && lat && lng ? (
            <a
              onClick={() => this.zoomTo({ lat, lng, zoom })}
              title="Zoom to tile"
            >
              <i className="fa fa-search" />
            </a>
          ) : null}
          <AddPin onAddToPin={this.onAddToPin} />

          {showTimelapse && (
            <Timelapse
              datasource={datasource}
              startDate={moment(time)}
              captionPrefix={datasource || 'Sentinel-2'}
              onClose={() => this.setState({ showTimelapse: false })}
            />
          )}
          <a onClick={() => Store.toggleActiveLayer(!isActiveLayerVisible)}>
            <i
              title={isActiveLayerVisible ? 'Hide layer' : 'Show layer'}
              className={`fa fa-eye${isActiveLayerVisible ? '-slash' : ''}`}
            />
          </a>
          <a
            onClick={() => this.setState({ showEffects: !showEffects })}
            title={`Show ${showEffects ? 'visualization' : 'effects'}`}
          >
            <i className={`fa fa-${showEffects ? 'paint-brush' : 'gear'}`} />
          </a>
        </div>
        {userId && [
          <b className="leaveMeAlone">Configuration:</b>,
          datasource,
          <br />
        ]}
        <b className="leaveMeAlone">Satellite:</b>{' '}
        {userId
          ? presets[datasource]
            ? datasetMap[presets[datasource][0].dataset]
            : datasource
          : datasource}
        {datasource.includes('Sentinel-2') &&
          addL1C && (
            <a
              style={{ marginLeft: 10 }}
              title={`Search for ${l2a} tiles on this date`}
              className="btn small"
              onClick={() => this.checkforL2AorL1C(isL1C, time)}
            >
              {checkL2a ? (
                <i className="fa fa-spinner fa-spin fa-fw" />
              ) : isL1C ? (
                'L2A'
              ) : (
                'L1C'
              )}
            </a>
          )}
        <br />
        <b className="leaveMeAlone">Date:</b>
        <DatePicker
          key="dateFrom"
          ref="dateFrom"
          className="inlineDatepicker"
          // maxDate={maxDate}
          onNavClick={(from, to) => this.getDates({ datasource, from, to })}
          defaultValue={time}
          onExpand={e => this.getDates({ datasource, singleDate: e || time })}
          onSelect={e => this.updateDate(e)}
          showNextPrev={true}
        />
      </div>
    );
  }

  allowL2AorL1Ccheck = (datasource, time) => {
    const l2abounds = [
      { lat: 66.79190947341796, lng: -24.082031250000004 },
      { lat: 72.55449849665266, lng: 28.300781250000004 },
      { lat: 68.52823492039879, lng: 45.52734375000001 },
      { lat: 36.03133177633189, lng: 46.40625000000001 },
      { lat: 35.31736632923788, lng: -11.77734375 }
    ];
    return (
      datasource.includes('Sentinel-2 ') &&
      moment(time).isAfter('2017-03-28') &&
      Store.current.mapBounds &&
      Store.current.mapBounds.intersects(l2abounds)
    );
  };

  checkforL2AorL1C = (isL1C, date) => {
    if (this.state.checkL2a) return;
    const l2a = isL1C ? 'Sentinel-2 L2A' : 'Sentinel-2 L1C';
    this.setState({ checkL2a: true, l2aNotFound: false });
    queryIndex(true, l2a, { from: date, to: date })
      .then(data => {
        if (data.tiles.length > 0) {
          this.setState({ checkL2a: false });
          const result = {
            datasource: l2a,
            time: moment(data.tiles[0].sensingTime)
              .utc()
              .format('YYYY-MM-DD'),
            preset: Store.current.presets[l2a][0].id
          };
          Store.setSelectedResult({ ...this.props.selectedResult, ...result });
        } else {
          this.setState({ checkL2a: false, l2aNotFound: true });
        }
      })
      .catch(e => {
        this.setState({ checkL2a: false, l2aNotFound: true });
        console.error('Error getting dates for ' + l2a, e);
      });
  };

  downloadImage = () => {
    const { isAnalytical, imageExt, showLogo } = Store.current;
    if (isAnalytical) {
      this.setState({ analyticalDialog: true });
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
    const { showEffects, l2aNotFound, analyticalDialog, loading } = this.state;
    const {
      channels,
      presets,
      isAnalytical,
      selectedResult: {
        datasource,
        preset,
        minZoom = 5,
        maxZoom = 16,
        time,
        userId
      },
      views,
      currView,
      zoom
    } = this.props;
    const dsPresets = presets[datasource];
    const dsChannels = channels[datasource];
    const mapZoom = Number(zoom);
    const showNotification = mapZoom < minZoom || mapZoom > maxZoom;
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
            isCustom={isCustomPreset(preset) && currView !== views.PRESETS}
            presets={dsPresets}
            onActivate={this.activateResult}
          />
        )}
        {mapZoom < minZoom && (
          <NotificationPanel msg="Zoom in to view data" type="info" />
        )}
        {mapZoom > maxZoom && (
          <NotificationPanel msg="Zoom out to view data" type="info" />
        )}

        {!showNotification && (
          <DownloadPanel
            ref={downloadPanel => {
              this.downloadPanel = downloadPanel;
            }}
            loading={loading}
            isAnalytical={isAnalytical}
            onDownload={this.downloadImage}
            toggleTimelapse={this.toggleTimelapse}
            onChangeAnalytical={() => {
              Store.setAnalytical(!isAnalytical);
            }}
          />
        )}
        {analyticalDialog && (
          <Rodal
            animation="slideUp"
            customStyles={{
              height: 'auto',
              bottom: 'auto',
              width: '500px',
              top: '50%',
              transform: 'translateY(-50%)'
            }}
            onClose={() => this.setState({ analyticalDialog: false })}
            visible
          >
            <AnalyticalPanel />
          </Rodal>
        )}
        {l2aNotFound && (
          <Rodal
            animation="slideUp"
            visible={true}
            width={400}
            height={120}
            onClose={() => this.setState({ l2aNotFound: false })}
          >
            <div>
              <h3>No tile found</h3>
              No{' '}
              {datasource.includes('L2A')
                ? 'Sentinel-2 L1C'
                : 'Sentinel-2 L2A'}{' '}
              tiles found on {time} for the current view. Try other Sentinel-2
              tiles or use the search form to get other dates.
            </div>
          </Rodal>
        )}
      </div>
    );
  }
}

export default connect(s => s)(Visualization);
