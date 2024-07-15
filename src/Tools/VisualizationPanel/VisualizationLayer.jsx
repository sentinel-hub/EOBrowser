import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import { gettext, t } from 'ttag';

import Legend from './Legend';
import ExternalLink from '../../ExternalLink/ExternalLink';
import {
  findMatchingLayerMetadata,
  getDescriptionFromMetadata,
  getShortDescriptionFromMetadata,
  getTitleFromMetadata,
  getLegendDefinitionFromMetadata,
} from './legendUtils';

import { md5 } from 'js-md5';
import previews from '../../previews.json';
import { PLANET_NICFI } from '../SearchPanel/dataSourceHandlers/dataSourceConstants';
import { REACT_MARKDOWN_REHYPE_PLUGINS } from '../../const';

const EMPTY_IMAGE_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export default class VisualizationLayer extends Component {
  state = { detailsOpen: false };

  toggleDetails = (e) => {
    e.stopPropagation();
    this.setState((prevState) => ({ detailsOpen: !prevState.detailsOpen }));
  };

  getIconSrc(viz) {
    const { selectedThemeId, datasetId } = this.props;
    const { instanceId, url } = viz;
    const urlHash = instanceId ? instanceId.substr(0, 6) : md5(url).substring(0, 8);
    let layerId = viz.layerId;
    if (datasetId === PLANET_NICFI) {
      layerId = layerId.replace(/_\d{4}-\d{2}/g, '');
    }
    const filename = `${selectedThemeId}-${urlHash}-${layerId}.png`;
    if (!previews.includes(filename)) {
      return EMPTY_IMAGE_DATA_URI;
    }
    return `${import.meta.env.VITE_ROOT_URL}previews/${filename}`;
  }

  getTranslatedDynamicString(x) {
    // we are using dynamic strings (fetched from SH service) to call gettext(), which causes
    // `npm run translate` to break unless we disable ttag within this block:
    /* disable ttag */
    // empty string gets translated to .po file information, so we must guard against it here:
    if (!x) {
      return '';
    }
    return gettext(x);
  }

  render() {
    const {
      layer: viz,
      selectedVisualizationId,
      customSelected,
      datasetId,
      selectedThemeId,
      selectedModeId,
      setEvalScriptAndCustomVisualization,
      toTime,
      supportsCustom,
    } = this.props;

    const iconSrc = this.getIconSrc(viz);
    const vizId = viz.duplicateLayerId ? viz.duplicateLayerId : viz.layerId;
    const isActive = selectedVisualizationId === vizId && !customSelected;
    const hasEvalScript = !!viz.evalscript;

    const layerMetadata = findMatchingLayerMetadata(datasetId, viz.layerId, selectedThemeId, toTime);
    const longDescription = getDescriptionFromMetadata(layerMetadata);
    const shortDescription =
      getShortDescriptionFromMetadata(layerMetadata, selectedModeId) || viz.description;
    const title = getTitleFromMetadata(layerMetadata, selectedModeId) || viz.title;
    const legend = getLegendDefinitionFromMetadata(layerMetadata) || viz.legend;

    const hasDetails = viz.legendUrl || legend || longDescription;

    return (
      <div key={vizId}>
        <div
          onClick={() => this.props.setSelectedVisualization(viz)}
          className={isActive ? 'layer active' : 'layer'}
        >
          <img className="icon" crossOrigin="Anonymous" src={iconSrc} alt="" />
          {isActive && (
            <div className="layer-icons-wrapper">
              {hasEvalScript && supportsCustom && (
                <i
                  className={`fas fa-edit`}
                  title={t`Show evalscript`}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.hash = '#custom-script'; // open accordion option for evalscript
                    setEvalScriptAndCustomVisualization(vizId);
                  }}
                ></i>
              )}
              {hasDetails && (
                <i
                  className={`fa fa-angle-double-down ${this.state.detailsOpen ? 'show' : ''}`}
                  title={this.state.detailsOpen ? t`Hide details` : t`Show details`}
                  onClick={this.toggleDetails}
                />
              )}
            </div>
          )}
          {this.getTranslatedDynamicString(title)}
          <small>{this.getTranslatedDynamicString(shortDescription)}</small>
          {isActive && this.state.detailsOpen && (
            <div className="layer-details">
              <Legend legendDefinitionFromLayer={legend} legendUrl={viz.legendUrl} />
              {longDescription && (
                <div className="layer-description">
                  <ReactMarkdown
                    rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
                    children={longDescription}
                    components={{
                      a: (props) => <ExternalLink href={props.href}>{props.children}</ExternalLink>,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}
