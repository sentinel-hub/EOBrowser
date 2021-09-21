import React, { Component } from 'react';
import { withLeaflet, Rectangle, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { t } from 'ttag';

import { createTimelapseBbox } from '../../junk/EOB3TimelapsePanel/timelapseUtils';
import store, { modalSlice, timelapseSlice } from '../../store';
import { ModalId } from '../../Modals/Consts';

import './TimelapseAreaPreview.scss';

class TimelapseAreaPreview extends Component {
  state = {
    lat: this.props.lat,
    lng: this.props.lng,
    zoom: this.props.zoom,
    mapBounds: this.props.mapBounds,
  };

  componentDidMount() {
    this.props.leaflet.map.on('move', this.setMovingMapValues);
  }

  componentWillUnmount() {
    this.props.leaflet.map.off('move', this.setMovingMapValues);
    store.dispatch(timelapseSlice.actions.setTimelapseAreaPreview(false));
  }

  startTimelapse = () => {
    store.dispatch(timelapseSlice.actions.setTimelapseAreaPreview(false));
    store.dispatch(modalSlice.actions.addModal({ modal: ModalId.TIMELAPSE }));
  };

  setMovingMapValues = () => {
    const { lat, lng } = this.props.leaflet.map.getCenter();
    this.setState({
      lat: lat,
      lng: lng,
      zoom: this.props.leaflet.map.getZoom(),
      mapBounds: this.props.leaflet.map.getBounds(),
    });
    // Forces the map to redraw it's content
    // Without it the rectangle won't redraw until moveend
    this.props.leaflet.map.fire('viewreset');
  };

  calculateBounds = (lat, lng, zoom, mapBounds) => {
    const [x1, y1, x2, y2] = createTimelapseBbox(lat, lng, zoom, mapBounds);
    return [L.latLng(y1, x1), L.latLng(y2, x2)];
  };

  render() {
    const { lat, lng, zoom, mapBounds } = this.state;
    return (
      <Rectangle bounds={this.calculateBounds(lat, lng, zoom, mapBounds)} interactive={false}>
        <Marker
          onClick={this.startTimelapse}
          position={[lat, lng]}
          opacity={1}
          icon={L.divIcon({ className: 'fas fa-play-circle timelapse-area-play-icon', iconAnchor: [20, 20] })}
        >
          <Tooltip className="timelapse-area-tooltip" permanent={true} opacity={1.0} direction={'center'}>
            <div className="timelapse-area-tooltip-content">{t`Create a timelapse of this area`}</div>
          </Tooltip>
        </Marker>
      </Rectangle>
    );
  }
}

export default withLeaflet(TimelapseAreaPreview);
