import React, { Component } from 'react';
import LocationSearchBox from '../junk/LocationSearchBox/LocationSearchBox';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';
import { withLeaflet } from 'react-leaflet';
import L from 'leaflet';
import store, { mainMapSlice } from '../store';
import { t } from 'ttag';

class SearchBox extends Component {
  componentDidMount() {
    L.DomEvent.disableScrollPropagation(this.ref);
    L.DomEvent.disableClickPropagation(this.ref);
  }
  setMapLocation = data => {
    const [lng, lat] = data.location;
    store.dispatch(
      mainMapSlice.actions.setPosition({
        lat: lat,
        lng: lng,
        zoom: this.props.leaflet.map.getZoom(),
      }),
    );
  };
  render() {
    return (
      <div
        ref={r => {
          this.ref = r;
        }}
        className="search-box-wrapper"
      >
        <LocationSearchBox
          googleAccessToken={process.env.REACT_APP_GOOGLE_TOKEN}
          placeholder={t`Go to Place`}
          minChar={4}
          resultsShown={5}
          onSelect={this.setMapLocation}
        />
      </div>
    );
  }
}

export default withLeaflet(SearchBox);
