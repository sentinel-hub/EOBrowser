import React from 'react';
import PropTypes from 'prop-types';
import request from 'axios';
import AddPin from '../AddPin';

class ResultItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      linkVisible: false,
      scihubLink: '',
    };
  }

  toggleLinksPanel = tileData => {
    const {
      activeLayer: { getTileUrl, getSciHubLink },
    } = tileData;
    this.setState({ linkVisible: !this.state.linkVisible });
    if (this.state.scihubLink === '' && getTileUrl) {
      request
        .get(getTileUrl(tileData))
        .then(res => {
          let product = res.data.product['@ref'];
          this.setState({
            scihubLink: getSciHubLink(product),
          });
        })
        .catch(e => {
          this.setState({ scihubError: e.message });
        });
    }
  };

  render() {
    let {
      result,
      result: {
        tileData,
        properties: { index },
      },
    } = this.props;
    let {
      datasource: datasourceName,
      time,
      sensingTime,
      cloudCoverage,
      sunElevation,
      activeLayer: datasource,
      satellite,
    } = tileData;
    const { crs, mgrs } = datasource.getCrsLabel ? datasource.getCrsLabel(tileData) : {};
    let isS2 = datasourceName.includes('Sentinel-2');
    return (
      <div className="resultItem" onMouseOver={() => this.props.onResultHover(index, datasourceName)}>
        {datasource.getPreviewImage ? (
          <img src={datasource.getPreviewImage(tileData)} alt={datasourceName} />
        ) : (
          <div className="noImage">{datasourceName}</div>
        )}
        <div className="details">
          <div title="Sensing time">
            <i className="fa fa-calendar" />
            {time}
          </div>
          {satellite && (
            <div title="Satellite name">
              <i className="fa fa-globe" />
              Sentinel-2{satellite}
            </div>
          )}
          <div title="Sensing time">
            <i className="fa fa-clock-o" />
            {sensingTime}
          </div>
          {cloudCoverage !== -1 && (
            <div title="Cloud coverage">
              <i className="fa fa-cloud" />
              {cloudCoverage} %
            </div>
          )}
          {sunElevation && (
            <div title="Sun elevation">
              <i className="fa fa-sun-o" />
              {sunElevation.toFixed(1)} %
            </div>
          )}
          {isS2 &&
            crs && (
              <div title="Tile CRS">
                <i className="fa fa-file-text-o" />
                {crs}
              </div>
            )}
          {isS2 &&
            mgrs && (
              <div title="MGRS location">
                <i className="fa fa-map-o" />
                {mgrs}
              </div>
            )}
          {(datasource.getAwsPath || datasource.getSciHubLink || datasource.getEOPath) && (
            <a
              className={`pathLinkIcon ${this.state.linkVisible && 'active'}`}
              onClick={() => this.toggleLinksPanel(tileData)}
            >
              <i className="fa fa-link" />
            </a>
          )}
          <AddPin pin={tileData} />
          <a className="btn" onClick={() => this.props.onResultClick(index, result)}>
            Visualize
          </a>
        </div>
        {this.state.linkVisible && (
          <div className="showLinkPanel">
            {datasource.getAwsPath ? (
              <div style={{ marginBottom: '15px' }}>
                AWS path:<a className="scihubLink" href={datasource.getAwsPath(tileData)} target="_blank">
                  {datasource.getAwsPath(tileData)}
                </a>
              </div>
            ) : (
              <div>
                EO Cloud path:<input
                  ref="linkUrl"
                  className="urlInput"
                  defaultValue={datasource.getEOPath(tileData)}
                  readOnly={true}
                  onFocus={() => this.refs.linkUrl.select()}
                />
              </div>
            )}
            {datasource.getSciHubLink && (
              <div>
                SciHub link:{' '}
                <a className="scihubLink" href={this.state.scihubLink} target="_blank">
                  {this.state.scihubLink}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

ResultItem.PropTypes = {
  onResultClick: PropTypes.func,
  onResultHover: PropTypes.func,
};
export default ResultItem;
