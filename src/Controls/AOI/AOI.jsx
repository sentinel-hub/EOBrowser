import React, { Component } from 'react';
import { EOBUploadGeoFile } from '../../junk/EOBUploadGeoFile/EOBUploadGeoFile';

import { EOBAOIPanelButton } from '../../junk/EOBAOIPanelButton/EOBAOIPanelButton';
import { connect } from 'react-redux';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

import { removeAoiWithEmptyCoords } from '../../utils/coords';
import store, { aoiSlice, notificationSlice, modalSlice } from '../../store';
import { ModalId } from '../../const';
import {
  appendPolygon,
  getGeoJSONFromLeafletBounds,
  getLeafletBoundsFromGeoJSON,
} from '../../utils/geojson.utils';
import { generateSelectedResults, AOI_STRING } from '../controls.utils';
import { UPLOAD_GEOMETRY_TYPE } from '../../junk/EOBUploadGeoFile/EOBUploadGeoFile.utils';

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
        let geometry = e.layer.toGeoJSON().geometry;
        if (this.props.aoiGeometry) {
          geometry = appendPolygon(this.props.aoiGeometry, geometry);
        }

        store.dispatch(
          aoiSlice.actions.set({
            geometry: geometry,
            bounds: getLeafletBoundsFromGeoJSON(geometry),
            isPlacingVertex: false,
          }),
        );
        this.props.map.removeLayer(e.layer);
        this.enableEdit();
      }
    });

    // if user starts drawing new shape while placing a vertex, we stop placing a vertex
    map.on('pm:drawstart', (e) => {
      if (e.shape && e.shape !== 'Polygon' && e.shape !== 'Rectangle') {
        store.dispatch(aoiSlice.actions.setisPlacingVertex(false));
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (!!this.props.aoiIsDrawing && !prevProps.aoiIsDrawing) {
      this.onStartDrawingPolygon(this.props.aoiShape);
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
      store.dispatch(
        aoiSlice.actions.set({ geometry: geometry, bounds: getLeafletBoundsFromGeoJSON(geometry) }),
      );
      this.enableEdit();
    });
  };

  onStartDrawingPolygon = (shape) => {
    let map = this.props.map;
    this.setState({
      drawingInProgress: true,
    });
    map.pm.enableDraw(shape, {
      finishOn: 'contextmenu',
      allowSelfIntersection: false,
    });
  };

  onResetAoi = () => {
    this.props.map.pm.disableDraw();
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
    this.enableEdit();
  };

  openFISPanel = () => {
    store.dispatch(modalSlice.actions.addModal({ modal: ModalId.FIS, params: { poiOrAoi: AOI_STRING } }));
  };

  openUploadGeoFileDialog = () => {
    this.setState({ uploadDialog: true });
  };

  render() {
    const selectedBounds =
      this.props.mapBounds && this.state.drawingInProgress
        ? this.props.aoiGeometry
          ? this.props.aoiGeometry
          : getGeoJSONFromLeafletBounds(this.props.mapBounds)
        : null;
    return (
      <div
        ref={(r) => {
          this.ref = r;
        }}
        className={`aoi-wrapper ${this.props.className}`}
      >
        <EOBAOIPanelButton
          disabled={false}
          aoiBounds={selectedBounds}
          aoiGeometry={this.props.aoiGeometry}
          isAoiClip={this.state.drawingInProgress}
          onDrawShape={(shape) => {
            if (this.props.aoiIsDrawing) {
              this.onStartDrawingPolygon(shape);
            }
            store.dispatch(
              aoiSlice.actions.startDrawing({ isDrawing: true, shape: shape, isPlacingVertex: true }),
            );
          }}
          resetAoi={this.onResetAoi}
          centerOnFeature={this.centerMapOnFeature}
          onErrorMessage={(msg) => store.dispatch(notificationSlice.actions.displayError(msg))}
          openUploadGeoFileDialog={this.openUploadGeoFileDialog}
          openFisPopup={this.openFISPanel}
          selectedResults={generateSelectedResults({ ...this.props, poiOrAoi: AOI_STRING })}
          presetLayerName={'True color'} // TO DO
          datasetId={this.props.datasetId}
        />
        {this.state.uploadDialog && (
          <EOBUploadGeoFile
            onUpload={this.onFileUpload}
            onClose={() => this.setState({ uploadDialog: false })}
            type={UPLOAD_GEOMETRY_TYPE.POLYGON}
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
  evalscript: store.visualization.evalscript,
  customSelected: store.visualization.customSelected,
  selectedTab: store.tabs.selectedTabIndex,
  comparedLayers: store.compare.comparedLayers,
});

export default connect(mapStoreToProps, null)(AOI);
