import React, { Component } from 'react';
import EOBPOIPanelButton from '../../junk/EOBPOIPanelButton/EOBPOIPanelButton';
import { connect } from 'react-redux';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

import store, { poiSlice, mainMapSlice, notificationSlice, modalSlice } from '../../store';
import { ModalId } from '../../const';
import pin from './pin.png';
import { generateSelectedResults, POI_STRING } from '../controls.utils';

class POI extends Component {
  state = {
    placingMarker: false,
  };
  POILayerRef = null;

  componentDidMount() {
    L.DomEvent.disableScrollPropagation(this.ref);
    L.DomEvent.disableClickPropagation(this.ref);
    this.props.map.on('pm:create', (e) => {
      if (e.shape && e.shape === 'Marker') {
        this.props.map.removeLayer(e.layer);
        this.props.map.pm.disableDraw('Marker');
        const geometry = this.generateSmallBBoxAroundPOI(e.layer.getLatLng());
        store.dispatch(poiSlice.actions.set({ position: e.layer.getLatLng(), geometry: geometry }));
        this.enableEdit();
      }
    });

    L.Marker.prototype.options.icon = L.icon({
      iconUrl: pin,
      iconAnchor: [13, 40],
    });
  }

  enableEdit = () => {
    this.props.map.eachLayer((l) => {
      if (l.options.id && l.options.id === 'poi-layer') {
        this.POILayerRef = l;
      }
    });
    this.POILayerRef.pm.enable({
      preventMarkerRemoval: true,
    });
    this.POILayerRef.on('pm:edit', (f) => {
      const geometry = this.generateSmallBBoxAroundPOI(f.target.getLatLng());
      store.dispatch(poiSlice.actions.set({ position: f.target.getLatLng(), geometry: geometry }));
    });
  };

  onStartPlacingMarker = () => {
    this.setState({ placingMarker: true });
    this.props.map.pm.enableDraw('Marker', {
      markerStyle: {
        draggable: true,
      },
    });
  };

  resetPOI = () => {
    this.setState({ placingMarker: false });
    this.props.map.pm.disableDraw('Marker');
    store.dispatch(poiSlice.actions.reset());
  };

  generateSmallBBoxAroundPOI(latlng) {
    const { x, y } = this.props.map.latLngToContainerPoint(latlng);
    const { lat: south, lng: west } = this.props.map.containerPointToLatLng(L.point(x - 2, y + 2));
    const { lat: north, lng: east } = this.props.map.containerPointToLatLng(L.point(x + 2, y - 2));
    const lowLeft = [west, south];
    const topLeft = [west, north];
    const topRight = [east, north];
    const lowRight = [east, south];
    return {
      type: 'Polygon',
      coordinates: [[lowLeft, lowRight, topRight, topLeft, lowLeft]],
    };
  }

  centerMapOnMarker = () => {
    if (!this.POILayerRef) {
      return;
    }
    store.dispatch(mainMapSlice.actions.setPosition(this.POILayerRef.getLatLng()));
  };

  openFISPanel = () => {
    store.dispatch(modalSlice.actions.addModal({ modal: ModalId.FIS, params: { poiOrAoi: POI_STRING } }));
  };

  render() {
    return (
      <div
        ref={(r) => {
          this.ref = r;
        }}
        className={`poi-wrapper ${this.props.className}`}
      >
        <EOBPOIPanelButton
          disabled={false}
          drawMarker={this.onStartPlacingMarker}
          deleteMarker={this.resetPOI}
          centerOnFeature={this.centerMapOnMarker}
          poi={this.props.poiPosition}
          openFisPopup={this.openFISPanel}
          selectedResults={generateSelectedResults({ ...this.props, poiOrAoi: POI_STRING })}
          presetLayerName={'True color'} // TO DO
          onErrorMessage={(msg) => store.dispatch(notificationSlice.actions.displayError(msg))}
        />
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  poiPosition: store.poi.position,
  layerId: store.visualization.layerId,
  datasetId: store.visualization.datasetId,
  visualizationUrl: store.visualization.visualizationUrl,
  evalscript: store.visualization.evalscript,
  customSelected: store.visualization.customSelected,
  selectedTab: store.tabs.selectedTabIndex,
  comparedLayers: store.compare.comparedLayers,
});

export default connect(mapStoreToProps, null)(POI);
