import React, { Component } from 'react';
import { connect } from 'react-redux';
import URI from 'urijs';
import Store from '../store';
import { getPixelSize } from '../utils/coords';
import {
  downloadZipIt,
  downloadOne
} from '../utils/downloadZip';
import styled from 'styled-components';
import Toggle from 'react-toggle';
import Button from './Button';

const Style = styled.div`
  /*max-height: 300px;*/
  overflow: auto;
  .row {
    display: flex;
    margin-bottom: 6px;

    > * {
      flex: 1;
    }
    > label {
      flex: 0 0 200px;
    }
  }
  .downloadLayers {
    column-count: 2;
    -moz-column-count: 2;
    label {
      display: block;
    }
  }
  .fullSize {
    width: 100%;
    display: block;
    margin-top: 10px;
  }
`;

class AnalyticalPanel extends Component {
  constructor(props) {
    super(props);
    const {
      channels,
      presets,
      selectedResult: { datasource, preset },
      instances
    } = props;
    const mChannels = (channels[datasource] || []).map(obj => ({
      value: obj.name,
      text: obj.name
    }));
    const mPresets = Object.keys(presets[datasource]).map(key => ({
      value: presets[datasource][key].id,
      text: presets[datasource][key].name
    }));
    const activeInstance = instances.find(ins => ins.name === datasource);
    this.state = {
      isDownloading: false,
      layers: [...mChannels, ...mPresets],
      downloadLayers: { [preset !== 'CUSTOM' ? preset : 'custom']: true },
      isIPT: activeInstance.baseUrl.includes('eocloud')
    };
    if (preset === 'CUSTOM') {
      this.state.layers.push({ value: 'custom', text: 'Custom script' });
    }
  }
  getFirstPreset = () => {
    const { presets, selectedResult: { datasource } } = this.props;
    const first = presets[datasource][0];
    return first.id;
  };
  updateImgFormat = e => {
    // cant get data-attr to work, so will do a find for now
    const selected = Store.current.imageFormats.find(
      img => img.value === e.target.value
    );
    Store.setImageFormat({
      imageFormat: e.target.value,
      imageExt: selected.ext
    });
  };

  updateResolution = e => {
    Store.setResolution(e.target.value);
  };

  updateCrs = e => {
    Store.setSelectedCrs(e.target.value);
  };

  downloadImage = () => {
    const { imageExt, showLogo } = Store.current;
    const standardRegexp = /^B[0-9][0-9A]/i;
    Store.generateImageLink();
    this.setState({ isDownloading: true });
    const layerArr = Object.keys(this.state.downloadLayers).filter(
      key => this.state.downloadLayers[key]
    );

    const layerUrls = layerArr.filter(l => l).map(layer => {
      const fullLayer = this.state.layers.find(l => l.value === layer);
      const oldImgUrl = new URI(Store.current.imgWmsUrl);
      if (standardRegexp.test(layer)) {
        oldImgUrl
          .setQuery('LAYERS', this.getFirstPreset())
          .setQuery('EVALSCRIPT', btoa(`return [${layer} * 2.5];`));
      } else if (layer !== 'custom') {
        oldImgUrl.setQuery('LAYERS', layer);
        oldImgUrl.removeQuery('EVALSCRIPT');
      }
      return {
        src: oldImgUrl.toString(),
        preset: fullLayer.text
      };
    });
    if (layerUrls.length === 1) {
      if (['png', 'jpg'].includes(imageExt) && showLogo) {
        downloadOne(layerUrls)
          .then(() => {
            this.setState({ isDownloading: false });
          })
          .catch(err => {
            this.setState({ isDownloading: false });
          });
      } else {
        window.open(Store.current.imgWmsUrl, '_blank');
        this.setState({ isDownloading: false });
      }
    } else {
      this.setState({ isDownloading: true });
      downloadZipIt(layerUrls)
        .then(res => this.setState({ isDownloading: false }))
        .catch(msg => this.setState({ error: msg, isDownloading: false }));
    }
  };

  isAllFalse = () => {
    const { downloadLayers } = this.state;
    return Object.keys(downloadLayers).find(
      key => this.state.downloadLayers[key]
    );
  };

  updateLayer = (key, checked) => {
    this.setState({
      downloadLayers: { ...this.state.downloadLayers, [key]: checked }
    });
  };

  calculateSize = resolution => {
    const { height, width, res } = getPixelSize();
    return `Resolution: ${res * resolution} m/px | Size: ${Math.floor(
      width / resolution
    )} x ${Math.floor(height / resolution)} px`;
  };

  render() {
    const {
      imageFormats,
      resolution,
      resolutions,
      selectedCrs,
      availableCrs,
      imageFormat,
      showLogo
    } = Store.current;
    const isPngOrJpg = imageFormat.includes('jpg' || 'png');
    const { isIPT, layers, downloadLayers, error, isDownloading } = this.state;
    return (
      <Style>
        <h3>Analytical panel</h3>
        <div>
          <label
            title={
              isPngOrJpg
                ? 'Exported image(s) will include datasource and date, zoom scale and branding'
                : 'File will have logo attached.'
            }
          >
            Show {isPngOrJpg ? 'captions' : 'logo'} [?]
          </label>
          <div className="pull-right">
            <Toggle
              checked={showLogo}
              icons={false}
              onChange={() => Store.setLogo(!showLogo)}
            />
          </div>
        </div>
        <div style={{ clear: 'both', height: 10 }} />
        <div className="row">
          <label>Image format:</label>
          <select value={imageFormat} onChange={this.updateImgFormat}>
            {imageFormats
              .filter(imf => (isIPT ? !imf.value.includes('application') : imf))
              .map(obj => (
                <option key={obj.text} data-ext={obj.ext} value={obj.value}>
                  {obj.text}
                </option>
              ))}
          </select>
        </div>
        <div className="row">
          <label>Image resolution:</label>
          <div>
            <select
              style={{ width: '100%' }}
              value={resolution}
              onChange={this.updateResolution}
            >
              {resolutions.map(obj => (
                <option key={obj.text} value={obj.value}>
                  {obj.text}
                </option>
              ))}
            </select>
            <small>{this.calculateSize(resolution)}</small>
          </div>
        </div>
        <div className="row">
          <label>Coordinate system:</label>
          <select value={selectedCrs} onChange={this.updateCrs}>
            {availableCrs.map(obj => (
              <option key={obj.text} value={obj.value}>
                {obj.text}
              </option>
            ))}
          </select>
        </div>
        {
          <div className="row">
            <label>Layers:</label>
            <div className="downloadLayers">
              {layers.map(l => {
                const { text, value } = l;
                return (
                  <label key={text}>
                    <input
                      type="checkbox"
                      checked={!!downloadLayers[value]}
                      onChange={e => this.updateLayer(value, e.target.checked)}
                    />
                    {text}
                  </label>
                );
              })}
            </div>
          </div>
        }

        <Button
          fluid
          loading={isDownloading}
          disabled={isDownloading || !this.isAllFalse()}
          onClick={this.downloadImage}
          text="Download"
        />
        {error ? <p style={{ color: '#b72c2c' }}>{error}</p> : null}
      </Style>
    );
  }
}

export default connect(s => s)(AnalyticalPanel);
