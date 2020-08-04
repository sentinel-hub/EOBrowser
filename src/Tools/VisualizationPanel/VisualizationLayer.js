import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';

import Legend from './Legend';
import ExternalLink from '../../ExternalLink/ExternalLink';
import { getDescription, findMatchingLayerMetadata } from './legendUtils';

import md5 from '../../utils/md5';
import previews from '../../previews.json';

const EMPTY_IMAGE_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export default class VisualizationLayer extends Component {
  state = { detailsOpen: false };

  toggleDetails = () => {
    this.setState(prevState => ({ detailsOpen: !prevState.detailsOpen }));
  };

  getIconSrc(viz) {
    const { selectedThemeId } = this.props;
    const { instanceId, url } = viz;
    const urlHash = instanceId ? instanceId.substr(0, 6) : md5(url).substr(0, 8);
    const filename = `${selectedThemeId}-${urlHash}-${viz.layerId}.png`;
    if (!previews.includes(filename)) {
      return EMPTY_IMAGE_DATA_URI;
    }
    return `${process.env.REACT_APP_ROOT_URL}previews/${filename}`;
  }

  render() {
    const viz = this.props.layer;
    const iconSrc = this.getIconSrc(viz);
    const vizId = viz.duplicateLayerId ? viz.duplicateLayerId : viz.layerId;
    const isActive = this.props.selectedVisualizationId === vizId && !this.props.customSelected;
    const hasMetadata =
      !!findMatchingLayerMetadata(this.props.datasetId, viz.layerId, this.props.selectedThemeId) ||
      viz.legendUrl ||
      viz.legend;
    const longDescription = getDescription(this.props.datasetId, viz.layerId, this.props.selectedThemeId);
    return (
      <div key={vizId}>
        <div
          onClick={() => this.props.setSelectedVisualization(viz)}
          className={isActive ? 'layer active' : 'layer'}
        >
          <img className="icon" crossOrigin="Anonymous" src={iconSrc} alt="" />
          {isActive && hasMetadata && (
            <i
              className={`fa fa-angle-double-down ${this.state.detailsOpen ? 'show' : ''}`}
              onClick={this.toggleDetails}
            />
          )}
          {viz.title}
          <small>{viz.description}</small>
          {isActive && this.state.detailsOpen && (
            <div className="layer-details">
              <Legend
                layerId={viz.layerId}
                legendDefinitionFromLayer={viz.legend}
                legendUrl={viz.legendUrl}
              />
              <div className="layer-description">
                <ReactMarkdown
                  escapeHtml={true}
                  source={longDescription}
                  renderers={{
                    link: props => <ExternalLink href={props.href}>{props.children}</ExternalLink>,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
