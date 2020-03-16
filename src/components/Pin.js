import React from 'react';
import RCSlider from 'rc-slider';
import Rodal from 'rodal';
import { EOBButton, formatTimeInterval, isTimeInterval } from '@sentinel-hub/eo-components';
import { calcBboxFromXY } from '../utils/coords';
import { getMultipliedLayers } from '../utils/utils';
import { evalSourcesMap } from '../store/config';
import Store from '../store';
import EditableString from './EditableString';

const Range = RCSlider.Range;

class Pin extends React.Component {
  static defaultProps = {
    readOnly: false,
  };
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
        closeOnEsc={true}
      >
        <h3>Delete pin</h3>
        <b>WARNING:</b> You're about to delete a pin. Do you wish to continue? <br />
        <center>
          <EOBButton
            text="Yes"
            onClick={e => {
              this.onRemove(e, index);
              this.closeDialog(modalDialogId);
            }}
            icon="check"
            style={{ marginRight: 10 }}
          />
          <EOBButton text="No" onClick={() => this.closeDialog(modalDialogId)} icon="times" />
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
  handlePinClick = () => {
    if (!this.props.isCompare) {
      this.props.onPinClick(this.props.item);
    }
  };

  saveNewPinTitle = title => {
    Store.setPinProperty(this.props.index, 'pinTitle', title);
  };

  constructImgSrc = item => {
    const { instances, mapBounds, presets } = Store.current;
    const { lat, lng, zoom = 10, datasource, evalscript, preset, time } = item;
    const timeInterval = isTimeInterval(time) ? time : `${time}/${time}`;
    const activeLayer = instances.find(inst => inst.name === datasource);
    if (!activeLayer || !mapBounds || !presets[datasource]) return null;
    const bbox = calcBboxFromXY({ lat, lng, zoom, width: 50, height: 50 }).join(',');
    const baseUrl = activeLayer.baseUrls.WMS;
    const isCustom = preset === 'CUSTOM';
    const Layers = isCustom ? presets[datasource][0].id : preset;
    const evalsource = evalSourcesMap[datasource];
    return `${baseUrl}?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&MAXCC=100&TIME=${timeInterval}&bbox=${bbox}&LAYERS=${Layers}&evalsource=${evalsource}&${
      isCustom ? 'evalscript=' + window.encodeURIComponent(evalscript) : ''
    }&width=50&height=50`;
  };

  render() {
    let {
      item: { time, lat, datasource, preset, layers, evalscript, pinTitle },
      item,
      isCompare,
      index,
      isOpacity,
    } = this.props;
    const { error } = this.state;
    const isCustom = preset === 'CUSTOM';
    const advancedScript =
      evalscript && evalscript !== '' ? 'Custom script' : layers ? getMultipliedLayers(layers) : '';

    const pinTitleText = pinTitle ? pinTitle : `${datasource}: ${isCustom ? advancedScript : preset}`;

    return (
      <div className={isCompare ? 'pinItem compareCursor' : 'pinItem'} data-id={item._id}>
        <div onClick={this.handlePinClick}>
          <div className="pin-dragHandler">
            <i className="fa fa-ellipsis-v" />
            <i className="fa fa-ellipsis-v" />
          </div>
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
          {!this.props.readOnly &&
            !isCompare && (
              <a className="removePin" onClick={e => this.onTrashClick(e, index)} title="Remove pin">
                <i className="fa fa-trash" />
              </a>
            )}
          {!isCompare && (
            <a className="zoomToPin" onClick={e => this.onZoomToPin(e, item)} title="Zoom to pinned location">
              <i className="fa fa-crosshairs" />
              {'\u00A0'}
            </a>
          )}
          {this.props.readOnly ? (
            <span>{pinTitleText}</span>
          ) : (
            <EditableString text={pinTitleText} onEditSave={this.saveNewPinTitle} />
          )}
          <br />
          Date: <span className="pinDate">{formatTimeInterval(time)}</span>
          <br />
          {lat && <LocationPanel item={item} />}
        </div>
        {isCompare && (
          <div className={'comparePanel ' + (isOpacity && 'opacity')}>
            <label>{isOpacity ? 'Opacity' : 'Split position'}:</label>
            <Range min={0} max={1} step={0.01} value={this.state.range} onChange={this.onChange} />
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
