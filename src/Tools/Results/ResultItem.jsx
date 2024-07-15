import React from 'react';
import moment from 'moment';
import { t } from 'ttag';

import CopyToClipboard from './CopyToClipboard';
import { getDatasetLabel } from '../SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { DATASOURCES, FATHOM_TRACK_EVENT_LIST } from '../../const';
import { handleFathomTrackEvent } from '../../utils';

class ResultItem extends React.Component {
  state = {
    linksVisible: false,
    previewError: false,
  };

  toggleLinksPanel = async () => {
    this.setState((prevState) => ({
      linksVisible: !prevState.linksVisible,
    }));
  };

  handleClick = () => {
    this.props.onResultSelected(this.props.tile);
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.VISUALIZE_BUTTON);
  };

  render() {
    const { sensingTime, datasetId, datasource, metadata } = this.props.tile;
    const { previewError } = this.state;
    return (
      <div
        onMouseEnter={(e) => this.props.onHover(this.props.tile)}
        onMouseLeave={this.props.onStopHover}
        className="result-item"
      >
        <div className="img-info">
          <div className="img-btn">
            {metadata.previewUrl && !previewError ? (
              <img
                className="preview-image"
                src={metadata.previewUrl}
                alt={`${datasource} ${datasetId}`}
                onClick={this.handleClick}
                onError={() => this.setState({ previewError: true })}
              />
            ) : (
              <div className="no-image">{`${getDatasetLabel(datasetId)}`}</div>
            )}
            <EOBButton text={t`Visualize`} className="small visualize" onClick={this.handleClick} />
          </div>

          <div className="details">
            <div className="detail bold" title={t`Data source name`}>
              <i className="fa fa-satellite" />
              {getDatasetLabel(datasetId)}
            </div>
            {datasource !== DATASOURCES.DEM && datasource !== DATASOURCES.PLANET_NICFI && (
              <>
                <div className="detail" title={t`Sensing date`}>
                  <i className="fa fa-calendar" />
                  {sensingTime !== null
                    ? moment.utc(sensingTime).format('YYYY-MM-DD')
                    : t`No acquisition date`}
                </div>
                <div className="detail" title={t`Sensing time`}>
                  <i className="fa fa-clock-o" />
                  {sensingTime !== null
                    ? `${moment.utc(sensingTime).format('HH:mm:ss')}  UTC`
                    : t`No acquisition date`}
                </div>
              </>
            )}
            {datasource === DATASOURCES.PLANET_NICFI && (
              <div className="detail" title={t`Sensing date`}>
                <i className="fa fa-calendar" />
                {`${moment.utc(metadata.mosaicTimeRange.fromTime).format('YYYY-MM-DD')} - ${moment
                  .utc(metadata.mosaicTimeRange.toTime)
                  .format('YYYY-MM-DD')}`}
              </div>
            )}
            {metadata.cloudCoverage !== undefined && (
              <div className="detail" title={t`Cloud coverage`}>
                <i className="fa fa-cloud" />
                {metadata.cloudCoverage.toFixed(1)}%
              </div>
            )}
            {metadata.sunElevation !== undefined && (
              <div className="detail" title={t`Sun elevation`}>
                <i className="fa fa-sun-o" />
                {metadata.sunElevation.toFixed(1)}°
              </div>
            )}
            {metadata.MGRSLocation && (
              <div className="detail" title={t`MGRS location`}>
                <i className="fa fa-map-o" />
                {metadata.MGRSLocation}
              </div>
            )}

            {(metadata.AWSPath || metadata.EOCloudPath || metadata.creoDIASPath) && (
              <div
                className={`detail path-link-icon ${this.state.linksVisible && 'active'}`}
                onClick={() => this.toggleLinksPanel()}
              >
                <i className="fa fa-link" />
              </div>
            )}
          </div>
        </div>
        {this.state.linksVisible && (
          <div className="show-link-panel">
            {metadata.AWSPath && (
              <div style={{ marginBottom: '10px' }}>
                {t`AWS path`}:
                <div className="aws-path">
                  <CopyToClipboard value={metadata.AWSPath} />
                </div>
              </div>
            )}
            {metadata.EOCloudPath && (
              <div>
                {t`EO Cloud path`}:
                <div>
                  <CopyToClipboard value={metadata.EOCloudPath} />
                </div>
              </div>
            )}
            {metadata.creoDIASPath && (
              <div>
                {t`CreoDIAS path`}:
                <div>
                  <CopyToClipboard value={metadata.creoDIASPath} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default ResultItem;
