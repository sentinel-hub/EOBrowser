import React from 'react';
import { EOBAdvancedHolder } from '@sentinel-hub/eo-components';
import WMSImage from './WMSImage';
import { isCustomPreset } from '../utils/utils';
import Legend from './Legend/Legend';
import Store from '../store';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { connect } from 'react-redux';
import { findMatchingLayerMetadata } from '../utils/legendUtils';
import { b64EncodeUnicode } from '../utils/utils';

const GETLEGEND_CACHE = {};

/*
check if legend url exists and returns image
*/
const checkLegendUrl = url => {
  if (GETLEGEND_CACHE[url]) {
    return GETLEGEND_CACHE[url];
  }

  const newPromise = new Promise((resolve, reject) => {
    axios
      .get(url)
      .then(res => {
        if (res.headers['content-type'].indexOf('image') > -1) {
          resolve();
        } else {
          reject();
        }
      })
      .catch(e => {
        reject(e);
      });
  });
  GETLEGEND_CACHE[url] = newPromise;
  return newPromise;
};

class LayerPicker extends React.Component {
  state = {
    hasLegend: false,
  };

  componentDidMount() {
    const { legendDefinitionJsonUrl, legendUrl } = this.props;
    const layerMetadata = findMatchingLayerMetadata(this.props.datasourceId, this.props.id);
    if ((layerMetadata && layerMetadata.legend) || legendDefinitionJsonUrl) {
      this.setHasLegend(true);
    } else if (legendUrl) {
      checkLegendUrl(legendUrl)
        .then(res => this.setHasLegend(true))
        .catch(err => this.setHasLegend(false));
    }
  }

  handleToggleDetails = ev => {
    ev.preventDefault();
    this.props.onToggleDetails();
  };

  setHasLegend = hasLegend => {
    this.setState({
      hasLegend: hasLegend,
    });
  };

  render() {
    const {
      id,
      name,
      description,
      isActive,
      thumbnail,
      showDetails,
      legendUrl,
      legendDefinitionJsonUrl,
    } = this.props;
    const layerMetadata = findMatchingLayerMetadata(this.props.datasourceId, this.props.id);
    const { hasLegend } = this.state;
    const longDescription = layerMetadata && layerMetadata.description ? layerMetadata.description : null;
    const hasDetails = hasLegend || Boolean(longDescription);
    return (
      <div>
        <a
          onClick={() => {
            if (!isActive) {
              this.props.onActivate(id);
            }
          }}
          className={isActive ? 'active' : ''}
        >
          <WMSImage alt={name} src={thumbnail} />
          {isActive &&
            hasDetails && (
              <i
                className={`fa fa-angle-double-down ${showDetails ? 'show' : ''}`}
                onClick={this.handleToggleDetails}
              />
            )}
          {name}
          <small>{description}</small>
        </a>
        {isActive &&
          hasDetails &&
          showDetails && (
            <div className="layer-details">
              {hasLegend && (
                <Legend
                  legendFromSpec={layerMetadata ? layerMetadata.legend : null}
                  legendDefinitionJsonUrl={legendDefinitionJsonUrl}
                  legendUrl={legendUrl}
                  onLoadError={() => this.setHasLegend(false)}
                />
              )}
              {longDescription && (
                <div className="layer-description">
                  <ReactMarkdown
                    escapeHtml={true}
                    source={longDescription}
                    renderers={{
                      link: props => (
                        <a href={props.href} target="_blank" rel="noopener noreferrer">
                          {props.children}
                        </a>
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          )}
      </div>
    );
  }
}

class LayerDatasourcePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDetails: false,
    };
  }

  toggleDetails = () => {
    this.setState(oldState => ({
      showDetails: !oldState.showDetails,
    }));
  };

  renderSimpleHolder() {
    const {
      presets = [],
      channels = [],
      activePreset,
      userId,
      supportsCustom,
      onActivate,
      instances,
      selectedResult,
    } = this.props;
    // legendUrl is in presets[i].legendUrl;

    // const datasource = DATASOURCES.find(ds => ds.name === Store.current.selectedResult.datasource);
    // This doesn't work for custom instances.
    // Custom instances are available in Store.current.instances
    const datasource = instances.find(ds => ds.name === selectedResult.datasource);
    const datasourceId = datasource.id;
    return (
      <div className="layerDatasourcePicker">
        {supportsCustom &&
          channels.length > 0 && (
            <a
              key={0}
              onClick={() => {
                onActivate('CUSTOM');
              }}
              className={isCustomPreset(activePreset) ? 'active' : ''}
            >
              <i className="icon fa fa-paint-brush" />Custom<small>Create custom rendering</small>
            </a>
          )}

        {presets.map((preset, i) => (
          <LayerPicker
            key={`${datasourceId}-${preset.id}`}
            id={preset.id}
            name={preset.name}
            description={preset.description}
            isActive={preset.id === activePreset}
            thumbnail={userId ? preset.image : `images/presets/${preset.id}.jpg`}
            showDetails={this.state.showDetails}
            legendSpec={preset.legend || null}
            onActivate={onActivate}
            onToggleDetails={this.toggleDetails}
            datasourceId={datasourceId}
            legendUrl={presets[i].legendUrl}
            legendDefinitionUrl={presets[i].legendDefinitionUrl}
            legendDefinitionJsonUrl={presets[i].legendDefinitionJsonUrl}
          />
        ))}
      </div>
    );
  }

  onToggleMode = isBand => {
    let { views } = this.props;
    Store.setCurrentView(isBand ? views.BANDS : views.SCRIPT);
  };

  onUpdateScript = state => {
    const { isEvalUrl, evalscript, evalscripturl } = state;
    Store.setEvalScript(b64EncodeUnicode(evalscript));
    Store.setEvalUrl(window.encodeURIComponent(evalscripturl));
    Store.setEvalMode(isEvalUrl);
  };

  onBack = () => {
    Store.setCurrentView(this.props.views.PRESETS);
  };

  onBandsToRGBChange = value => {
    Store.setLayers(value);
  };

  render() {
    const {
      views,
      currView,
      channels,
      selectedResult: { evalscripturl, evalscript, layers, activeLayer },
      isEvalUrl,
      style,
      isCustomSelected,
    } = this.props;

    return (
      <div>
        {isCustomSelected ? (
          <EOBAdvancedHolder
            views={views}
            currView={currView}
            channels={channels}
            evalscripturl={evalscripturl}
            evalscript={evalscript}
            layers={layers}
            activeLayer={activeLayer}
            isEvalUrl={isEvalUrl}
            style={style}
            onToggleMode={this.onToggleMode}
            onUpdateScript={this.onUpdateScript}
            onBack={this.onBack}
            onCodeMirrorRefresh={() => Store.refresh()}
            onBandsToRGBChange={this.onBandsToRGBChange}
          />
        ) : (
          this.renderSimpleHolder()
        )}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  views: store.views,
  currView: store.currView,
  selectedResult: store.selectedResult,
  isEvalUrl: store.isEvalUrl,
  style: store.style,
  instances: store.instances,
});

export default connect(mapStoreToProps)(LayerDatasourcePicker);
