import React, { Component } from 'react';
import { uniquePinId } from '../utils/utils';
import Store from '../store';
import { connect } from 'react-redux';

class AddPin extends Component {
  savePin = () => {
    // if you reference pin from props, reference is linked to selected result in store
    let ds = '';
    const { lat, lng, zoom, selectedResult, pin, presets } = this.props;
    if (pin) {
      ds = pin.datasource;
    }
    const item = pin ? { ...pin, preset: presets[ds][0].id } : selectedResult;
    const savePin = {
      datasource: ds,
      zoom,
      ...item,
      lat: pin ? pin.lat : lat,
      lng: pin ? pin.lng : lng,
      _id: uniquePinId(),
    };
    Store.addPinResult(savePin);
    Store.setTabIndex(3);
  };

  render() {
    return (
      <a
        className="addToPin"
        onClick={() => {
          // this.props.onAddToPin && this.props.onAddToPin();
          this.savePin();
        }}
        title="Pin to your favourite items"
      >
        <i className="fa fa-thumb-tack" />
      </a>
    );
  }
}

export default connect(s => s)(AddPin);
