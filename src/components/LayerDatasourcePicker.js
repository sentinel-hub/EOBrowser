import React from 'react';
import AdvancedHolder from './advanced/AdvancedHolder';
import WMSImage from './WMSImage';
import { isCustomPreset } from '../utils/utils';

class LayerDatasourcePicker extends React.Component {
  getSimpleHolder() {
    let { presets = [], channels = [], activePreset, userId, supportsCustom } = this.props;
    return (
      <div className="layerDatasourcePicker">
        {supportsCustom &&
          channels.length > 0 && (
            <a
              key={0}
              onClick={() => {
                this.props.onActivate('CUSTOM');
              }}
              className={isCustomPreset(activePreset) && 'active'}
            >
              <i className="icon fa fa-paint-brush" />Custom<small>Create custom rendering</small>
            </a>
          )}

        {presets.map((preset, key) => {
          const { name, description, id, image } = preset;
          return (
            <a
              key={key}
              onClick={() => {
                this.props.onActivate(id);
              }}
              className={activePreset === id ? 'active' : ''}
            >
              <WMSImage alt={name} src={userId ? image : `images/presets/${id}.jpg`} />
              {name}
              <small>{description}</small>
            </a>
          );
        })}
      </div>
    );
  }

  render() {
    let { isCustomSelected } = this.props;
    return <div>{isCustomSelected ? <AdvancedHolder /> : this.getSimpleHolder()}</div>;
  }
}

export default LayerDatasourcePicker;
