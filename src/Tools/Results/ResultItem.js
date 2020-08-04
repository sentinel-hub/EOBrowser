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
    scihubError: false,
    scihubLink: null,
  };

  toggleLinksPanel = async () => {
    this.setState(prevState => ({
      linksVisible: !prevState.linksVisible,
    }));
    if (this.props.tile.metadata.hasSciHubLink && !this.state.scihubLink) {
      const scihubLink = await this.props.tile.metadata
        .getSciHubLink(this.props.tile.metadata.tileId)
        .catch(e => {
          this.setState({ scihubError: true });
          return null;
        });
      this.setState({
        scihubLink: scihubLink,
      });
    }
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
        {metadata.previewUrl ? (
          <img className="preview-image" src={metadata.previewUrl} alt={`${datasource} ${datasetId}`} />
        ) : (
          <div className="no-image preview-image">{`${getDatasetLabel(datasetId)}`}</div>
        )}
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

          {metadata.tileCRS && (
            <div className="detail" title={t`Tile CRS`}>
              <i className="fa fa-file-text-o" />
              {metadata.tileCRS}
            </div>
          )}
          {metadata.MGRSLocation && (
            <div className="detail" title={t`MGRS location`}>
              <i className="fa fa-map-o" />
              {metadata.MGRSLocation}
            </div>
          )}

          {(metadata.AWSPath || metadata.hasSciHubLink || metadata.EOCloudPath || metadata.creoDIASPath) && (
            <div
              className={`detail path-link-icon ${this.state.linksVisible && 'active'}`}
              onClick={() => this.toggleLinksPanel()}
            >
              <i className="fa fa-link" />
            </div>
          )}
          <EOBButton text={t`Visualize`} className="small" onClick={this.handleClick} />
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
            {metadata.hasSciHubLink && !this.state.scihubError && (
              <div>
                {t`SciHub link`}:{' '}
                <ExternalLink className="scihub-link" href={this.state.scihubLink}>
                  {this.state.scihubLink}
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
