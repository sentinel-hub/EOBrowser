import React, { Component } from 'react';
import { EOBUploadGeoFile } from '../../junk/EOBUploadGeoFile/EOBUploadGeoFile';

import { EOBAOIPanelButton } from '../../junk/EOBAOIPanelButton/EOBAOIPanelButton';
import { connect } from 'react-redux';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

import { removeAoiWithEmptyCoords } from '../../utils/coords';
import store, { aoiSlice, notificationSlice, modalSlice } from '../../store';
import { ModalId } from '../../Modals/Consts';
import {
  supportsFIS,
  datasetHasAnyFISLayer,
  getDatasetLabel,
} from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

function boundsToGeoJSON(bounds) {
  return {
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [bounds._southWest.lng, bounds._southWest.lat],
          [bounds._northEast.lng, bounds._southWest.lat],
          [bounds._northEast.lng, bounds._northEast.lat],
          [bounds._southWest.lng, bounds._northEast.lat],
          [bounds._southWest.lng, bounds._southWest.lat],
        ],
      ],
    },
  };
}

class AOI extends Component {
  state = {
    drawingInProgress: false,
    uploadDialog: false,
  };
  AOILayerRef = null;

  componentDidMount() {
    L.DomEvent.disableScrollPropagation(this.ref);
    L.DomEvent.disableClickPropagation(this.ref);
    const { map } = this.props;
    map.on('pm:create', (e) => {
      if (e.shape && e.shape === this.props.aoiShape) {
        // e.layer.toGeoJSON() is a GeoJSON Feature, we convert it to a GeoJSON geometry type
        const geometry = e.layer.toGeoJSON().geometry;
        store.dispatch(aoiSlice.actions.set({ geometry: geometry, bounds: e.layer.getBounds() }));
        this.props.map.removeLayer(e.layer);
        this.enableEdit();
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (!!this.props.aoiIsDrawing && !prevProps.aoiIsDrawing) {
      this.onStartDrawingPolygon();
    }

    if (!this.props.aoiIsDrawing && prevProps.aoiIsDrawing) {
      this.setState({
        drawingInProgress: false,
      });
    }

    if (this.props.aoiClearMap && !prevProps.aoiClearMap) {
      this.onResetAoi();
      store.dispatch(aoiSlice.actions.clearMap(false));
    }
  }

  enableEdit = () => {
    this.props.map.eachLayer((l) => {
      if (l.options.id && l.options.id === 'aoi-layer') {
        this.AOILayerRef = l;
      }
    });
    this.AOILayerRef.pm.enable({
      allowSelfIntersection: false,
    });
    this.AOILayerRef.on('pm:edit', (f) => {
      const layer = f.target;
      const aoiGeojson = removeAoiWithEmptyCoords(layer.toGeoJSON());
      // in edit we can remove a vertex with a right click
      // when the 2nd last vertex is removed geoman will return an array with undefined
      // leaflet complains about this, and so we just simply remove the aoi.
      if (!aoiGeojson) {
        this.onResetAoi();
        return;
      }

      // aoiGeojson is a GeoJSON Feature or FeatureCollection, we convert it to a GeoJSON geometry type
      const geometry = aoiGeojson.geometry || aoiGeojson.features[0].geometry;
      store.dispatch(aoiSlice.actions.set({ geometry: geometry, bounds: layer.getBounds() }));
      this.enableEdit();
    });
  };

  onStartDrawingPolygon = () => {
    let map = this.props.map;
    this.setState({
      drawingInProgress: true,
    });
    map.pm.enableDraw(this.props.aoiShape, {
      finishOn: 'contextmenu',
      allowSelfIntersection: false,
    });
  };

  onResetAoi = () => {
    this.props.map.pm.disableDraw(this.props.aoiShape);
    if (this.AOILayerRef) {
      this.props.map.removeLayer(this.AOILayerRef);
      this.AOILayerRef = null;
    }
    this.setState({
      drawingInProgress: false,
    });
    store.dispatch(aoiSlice.actions.reset());
  };

  centerMapOnFeature = () => {
    if (!this.AOILayerRef) {
      if (this.props.aoiGeometry) {
        const layer = L.geoJSON(this.props.aoiGeometry);
        this.props.map.fitBounds(layer.getBounds());
      }
      return;
    }
    const featureBounds = this.AOILayerRef.getBounds();
    this.props.map.fitBounds(featureBounds);
  };

  onFileUpload = (geometry) => {
    this.setState({
      drawingInProgress: true,
      uploadDialog: false,
    });

    const layer = L.geoJSON(geometry);
    store.dispatch(aoiSlice.actions.set({ geometry, bounds: layer.getBounds() }));
    this.props.map.fitBounds(layer.getBounds());
  };

  openFISPanel = () => {
    store.dispatch(modalSlice.actions.addModal({ modal: ModalId.FIS, params: { poiOrAoi: 'aoi' } }));
  };

  generateSelectedResult = () => {
    const { layerId, datasetId, visualizationUrl, customSelected, aoiGeometry } = this.props;
    if (!aoiGeometry) {
      return null;
    }
    if (!layerId && !customSelected) {
      return null;
    }
    if (!customSelected && !datasetHasAnyFISLayer(datasetId)) {
      return { name: getDatasetLabel(datasetId), preset: layerId, baseUrls: { FIS: false } };
    }
    if (!supportsFIS(visualizationUrl, datasetId, layerId, customSelected)) {
      return { name: layerId, preset: layerId, baseUrls: { FIS: false } };
    }
    return { preset: layerId, baseUrls: { FIS: true } };
  };

  render() {
    const selectedBounds =
      this.props.mapBounds && this.state.drawingInProgress
        ? this.props.aoiGeometry
          ? this.props.aoiGeometry
          : boundsToGeoJSON(this.props.mapBounds)
        : null;
    return (
      <div
        ref={(r) => {
          this.ref = r;
        }}
        className="aoi-wrapper"
      >
        <EOBAOIPanelButton
          disabled={false}
          aoiBounds={selectedBounds}
          isAoiClip={this.state.drawingInProgress}
          onDrawShape={(shape) =>
            store.dispatch(aoiSlice.actions.startDrawing({ isDrawing: true, shape: shape }))
          }
          resetAoi={this.onResetAoi}
          centerOnFeature={this.centerMapOnFeature}
          onErrorMessage={(msg) => store.dispatch(notificationSlice.actions.displayError(msg))}
          openUploadGeoFileDialog={() => this.setState({ uploadDialog: true })}
          openFisPopup={this.openFISPanel}
          selectedResult={this.generateSelectedResult()}
          presetLayerName={'True color'} // TO DO
          fisShadowLayer={true}
        />
        {this.state.uploadDialog && (
          <EOBUploadGeoFile
            onUpload={this.onFileUpload}
            onClose={() => this.setState({ uploadDialog: false })}
          />
        )}
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  aoiGeometry: store.aoi.geometry,
  aoiIsDrawing: store.aoi.isDrawing,
  aoiShape: store.aoi.shape,
  aoiClearMap: store.aoi.clearMap,
  mapBounds: store.mainMap.bounds,
  layerId: store.visualization.layerId,
  datasetId: store.visualization.datasetId,
  visualizationUrl: store.visualization.visualizationUrl,
  customSelected: store.visualization.customSelected,
});

export default connect(mapStoreToProps, null)(AOI);
