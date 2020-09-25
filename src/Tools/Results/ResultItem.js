import React from 'react';
import ExternalLink from '../../ExternalLink/ExternalLink';
import moment from 'moment';
import { t } from 'ttag';

import CopyToClipboard from './CopyToClipboard';
import { getDatasetLabel } from '../SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';

class ResultItem extends React.Component {
  state = {
    linksVisible: false,
  };

  toggleLinksPanel = async () => {
    this.setState(prevState => ({
      linksVisible: !prevState.linksVisible,
    }));
  };

  handleClick = () => {
    this.props.onResultSelected(this.props.tile);
  };

  render() {
    const { sensingTime, datasetId, datasource, metadata } = this.props.tile;
    return (
      <div
        onMouseEnter={e => this.props.onHover(this.props.tile)}
        onMouseLeave={this.props.onStopHover}
        className="result-item"
      >
        <div className="img-info">
          <div className="img-btn">
            {metadata.previewUrl ? (
              <img className="preview-image" src={metadata.previewUrl} alt={`${datasource} ${datasetId}`} />
            ) : (
              <div className="no-image preview-image">{`${getDatasetLabel(datasetId)}`}</div>
            )}
            <EOBButton text={t`Visualize`} className="small visualize" onClick={this.handleClick} />
          </div>

          <div className="details">
            <div className="detail bold" title={t`Data source name`}>
              <i className="fa fa-satellite" />
              {getDatasetLabel(datasetId)}
            </div>
            <div className="detail" title={t`Sensing time`}>
              <i className="fa fa-calendar" />
              {moment.utc(sensingTime).format('YYYY-MM-DD')}
            </div>
            <div className="detail" title={t`Sensing time`}>
              <i className="fa fa-clock-o" />
              {moment.utc(sensingTime).format('HH:mm:ss')} UTC
            </div>
            {metadata.cloudCoverage !== undefined && (
              <div className="detail" title={t`Cloud coverage`}>
                <i className="fa fa-cloud" />
                {metadata.cloudCoverage.toFixed(1)} %
              </div>
            )}
            {metadata.sunElevation !== undefined && (
              <div className="detail" title={t`Sun elevation`}>
                <i className="fa fa-sun-o" />
                {metadata.sunElevation.toFixed(1)} %
              </div>
            )}
            {metadata.MGRSLocation && (
              <div className="detail" title={t`MGRS location`}>
                <i className="fa fa-map-o" />
                {metadata.MGRSLocation}
              </div>
            )}

            {(metadata.AWSPath || metadata.sciHubLink || metadata.EOCloudPath || metadata.creoDIASPath) && (
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
            {metadata.sciHubLink && (
              <div>
                {t`SciHub link`}:{' '}
                <ExternalLink className="scihub-link" href={metadata.sciHubLink}>
                  {metadata.sciHubLink}
                </ExternalLink>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default ResultItem;
