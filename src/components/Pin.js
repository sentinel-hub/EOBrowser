import React from 'react';
import RCSlider from 'rc-slider';
import Rodal from 'rodal';
import Button from './Button';
import { calcBboxFromXY } from '../utils/coords';
import { evalSourcesMap, getMultipliedLayers } from '../utils/utils';
import Store from '../store';

class Pin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      range: this.props.range,
      isOpacity: true,
      error: null,
    };
  }

  componentDidMount() {
    if (this.props.onComponentDidMount) this.props.onComponentDidMount(this);
  }

  componentWillUnmount() {
    if (this.props.onComponentWillUnmount) this.props.onComponentWillUnmount(this);
  }

  componentWillUpdate(nextProps) {
    if (!nextProps.isCompare && this.state.range[1] !== 1) {
      this.setState({ range: [0, 1] });
    }
    if (!nextProps.isCompare && (this.state.range[1] !== 1 || this.state.range[0] !== 0)) {
      this.setState({ range: [0, 1] });
    }
    if (nextProps.isOpacity !== this.state.isOpacity) {
      this.setState({
        isOpacity: nextProps.isOpacity,
        range: [0, 1],
      });
    }
  }

  onChange = arr => {
    if (arr === null) {
      arr = this.state.range;
      this.props.onOpacityChange(arr);
      return;
    }

    if (this.state.isOpacity) {
      this.setState({ range: [0, arr[1]] });
    } else {
      this.setState({ range: arr });
    }
    this.props.onOpacityChange(arr);
  };
  onTrashClick = (e, index) => {
    e.stopPropagation();
    const modalDialogId = 'confirm-remove-pin';
    Store.addModalDialog(
      modalDialogId,
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={150}
        onClose={() => this.closeDialog(modalDialogId)}
      >
        <h3>Delete pin</h3>
        <b>WARNING:</b> You're about to delete a pin. Do you wish to continue? <br />
        <center>
          <Button
            text="Yes"
            onClick={e => {
              this.onRemove(e, index);
              this.closeDialog(modalDialogId);
            }}
            icon="check"
            style={{ marginRight: 10 }}
          />
          <Button text="No" onClick={() => this.closeDialog(modalDialogId)} icon="times" />
        </center>
      </Rodal>,
    );
  };
  onRemove = (e, index) => {
    e.stopPropagation();
    this.props.onRemove(index);
  };
  closeDialog = modalDialogId => {
    Store.removeModalDialog(modalDialogId);
  };
  onZoomToPin = (e, { lat, lng, zoom }) => {
    e.stopPropagation();
    this.props.onZoomToPin({ lat, lng, zoom });
  };
  onPinClick = (isCompare, item, index) => {
    if (!isCompare) {
      this.props.onPinClick(item, index, false);
    }
  };

  constructImgSrc = item => {
    const { instances, mapBounds, presets } = Store.current;
    const { lat, lng, zoom = 10, datasource, evalscript, preset, time } = item;
    const activeLayer = instances.find(inst => inst.name === datasource);
    if (!activeLayer || !mapBounds || !presets[datasource]) return null;
    const bbox = calcBboxFromXY({ lat, lng, zoom, width: 50, height: 50 }).join(',');
    const baseUrl = activeLayer.baseUrls.WMS;
    const isCustom = preset === 'CUSTOM';
    const Layers = isCustom ? presets[datasource][0].id : preset;
    const evalsource = evalSourcesMap[datasource];
    return `${baseUrl}?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&MAXCC=100&TIME=${time}/${time}&bbox=${bbox}&LAYERS=${Layers}&evalsource=${evalsource}&${
      isCustom ? 'evalscript=' + window.encodeURIComponent(evalscript) : ''
    }&width=50&height=50`;
  };

  render() {
    let {
      item: { time, lat, datasource, preset, layers, evalscript },
      item,
      isCompare,
      index,
      isOpacity,
    } = this.props;
    const { error } = this.state;
    const isCustom = preset === 'CUSTOM';
    const advancedScript =
      evalscript && evalscript !== '' ? 'Custom script' : layers ? getMultipliedLayers(layers) : '';
    return (
      <div className={isCompare ? 'pinItem compareCursor' : 'pinItem'} data-id={item._id}>
        <div onClick={() => this.onPinClick(isCompare, item, index, false)}>
          {lat && (
            <img
              alt="saved pin"
              className="preview"
              // onError={() => this.setState({ error: true })}
              src={
                error ? 'images/no_preview.png' : this.constructImgSrc(item, time) || 'images/no_preview.png'
              }
            />
          )}
          {!isCompare && (
            <a className="removePin" onClick={e => this.onTrashClick(e, index)} title="Remove pin">
              <i className="fa fa-trash" />
            </a>
          )}
          {!isCompare && (
            <a
              className="zoomToPin"
              onClick={e => this.onZoomToPin(e, item, index)}
              title="Zoom to pinned location"
            >
              <i className="fa fa-search" />
              {'\u00A0'}
            </a>
          )}
          <span>
            {datasource}: {isCustom ? advancedScript : preset}
          </span>{' '}
          <br />
          Date: <span className="pinDate">{time}</span>
          <br />
          {lat && <LocationPanel item={item} />}
        </div>
        {isCompare && (
          <div className={'comparePanel ' + (isOpacity && 'opacity')}>
            <label>{isOpacity ? 'Opacity' : 'Split position'}:</label>
            <RCSlider
              min={0}
              max={1}
              step={0.01}
              range={true}
              value={this.state.range}
              onChange={this.onChange}
            />
            <span>{this.state.opacity}</span>
          </div>
        )}
      </div>
    );
  }
}

const LocationPanel = ({ item }) => {
  const { lat, lng, zoom } = item;
  return (
    <div>
      Lat/Lon: {parseFloat(lat).toFixed(2)}, {parseFloat(lng).toFixed(2)} | Zoom: {zoom}
    </div>
  );
};

export default Pin;
