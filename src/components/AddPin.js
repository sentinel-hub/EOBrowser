import React, { Component } from 'react';
import { connect } from 'react-redux';
import { uniquePinId } from '../utils/utils';
import Store from '../store';

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
      pinTitle: '',
    };
    Store.addPins([savePin]);
    Store.setTabIndex(3);
  };

  render() {
    const title = `Pin to your favourite items`;
    return (
      <a className="addToPin" onClick={this.savePin} title={title}>
        <i className="fa fa-thumb-tack" />
      </a>
    );
  }
}

const mapStoreToProps = store => ({
  lat: store.lat,
  lng: store.lng,
  zoom: store.zoom,
  selectedResult: store.selectedResult,
  presets: store.presets,
  loggedIn: !!store.user,
});
export default connect(mapStoreToProps)(AddPin);
