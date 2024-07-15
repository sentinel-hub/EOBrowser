import React, { Component } from 'react';
import { withLeaflet, Rectangle, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { t } from 'ttag';

import store, { modalSlice, timelapseSlice } from '../../store';
import { ModalId, FATHOM_TRACK_EVENT_LIST } from '../../const';

import './TimelapseAreaPreview.scss';
import { getTimelapseBounds } from './Timelapse.utils';
import { handleFathomTrackEvent } from '../../utils';

class TimelapseAreaPreview extends Component {
  state = {
    lat: this.props.lat,
    lng: this.props.lng,
    zoom: this.props.zoom,
    mapBounds: this.props.mapBounds,
  };

  // Close the timelapse area preview when clicking on controls buttons or user menu
  handleGlobalClick = (event) => {
    let closeOnParentClasses = [
      'user-panel',
      'fa-power-off',
      'aoi-wrapper',
      'loi-wrapper',
      'poi-wrapper',
      'measure-wrapper',
      'img-download-btn-wrapper',
      'histogram-wrapper',
    ];
    let foundElement = closeOnParentClasses.some((className) => event.target.closest(`.${className}`));
    if (foundElement) {
      store.dispatch(timelapseSlice.actions.setTimelapseAreaPreview(false));
    }
  };

  componentDidMount() {
    this.props.leaflet.map.on('move', this.setMovingMapValues);
    document.addEventListener('click', this.handleGlobalClick);
  }

  componentWillUnmount() {
    this.props.leaflet.map.off('move', this.setMovingMapValues);
    document.removeEventListener('click', this.handleGlobalClick);
  }

  startTimelapse = () => {
    store.dispatch(modalSlice.actions.addModal({ modal: ModalId.TIMELAPSE }));
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.START_TIMELAPSE);
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

  render() {
    const { lat, lng, mapBounds } = this.state;
    return (
      <Rectangle bounds={getTimelapseBounds(mapBounds)} interactive={false}>
        <Marker
          onClick={this.startTimelapse}
          position={[lat, lng]}
          opacity={1}
          icon={L.divIcon({ className: 'fas fa-play-circle timelapse-area-play-icon', iconAnchor: [20, 20] })}
        >
          <Tooltip className="timelapse-area-tooltip" permanent={true} opacity={1.0} direction={'center'}>
            <div className="timelapse-area-tooltip-content">{t`Create a timelapse of this area`}</div>
            <div className="timelapse-area-tooltip-content description">{t`To create a timelapse of a custom area, create AOI first`}</div>
          </Tooltip>
        </Marker>
      </Rectangle>
    );
  }
}

export default withLeaflet(TimelapseAreaPreview);
