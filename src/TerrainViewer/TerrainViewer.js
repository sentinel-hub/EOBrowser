import React, { Component } from 'react';
import { connect } from 'react-redux';
import Rodal from 'rodal';
import { CancelToken } from '@sentinel-hub/sentinelhub-js';
import FileSaver from 'file-saver';
import { t } from 'ttag';

import store, { modalSlice } from '../store';
import Loader from '../Loader/Loader';
import { getTerrainData, calculateBoundsFromTile } from './TerrainViewer.utils';
import { getMapDimensions } from '../Controls/ImgDownload/ImageDownload.utils';
import {
  addImageOverlays,
  getNicename,
  getTitle,
  SENTINEL_COPYRIGHT_TEXT,
} from '../Controls/ImgDownload/ImageDownload.utils';
import { EOBButton } from '../junk/EOBCommon/EOBButton/EOBButton';
import { TerrainMap } from './TerrainMap';
import { TerrainTile } from './TerrainTile';

import 'rodal/lib/rodal.css';

const TILE_SIZE = 127;
const TILE_OVERLAP = 1;

class TerrainViewer extends Component {
  state = {
    generatingTerrain: true,
    downloadingImage: false,
    minAltitude: Infinity,
    maxAltitude: -Infinity,
  };
  viewerHolder = React.createRef();

  async componentDidMount() {
    this.cancelToken = new CancelToken();
    this.renderTerrain(this.viewerHolder.current);
  }

  componentWillUnmount() {
    this.cancelToken.cancel();
    if (this.map) {
      this.map.stopAnimation();
      this.map = null;
    }
  }

  fetchTiles = async (coordX, coordY, abortToken) => {
    const { zoom, lat, lng } = this.props;

    const mapBounds = calculateBoundsFromTile(coordX, coordY, TILE_SIZE, zoom, lat, lng);

    const params = {
      ...this.props,
      mapBounds: mapBounds,
      imageWidth: TILE_SIZE + TILE_OVERLAP,
      imageHeight: TILE_SIZE + TILE_OVERLAP,
    };

    abortToken.check();

    const { elevationData, textureData, minAltitude, maxAltitude, maxAltitudePixels } = await getTerrainData(
      params,
      abortToken,
    );

    abortToken.check();

    const {
      minAltitude: currentMinAltitude,
      maxAltitude: currentMaxAltitude,
      generatingTerrain,
    } = this.state;

    if (minAltitude < currentMinAltitude) {
      this.setState({ minAltitude: minAltitude });
    }
    if (maxAltitude > currentMaxAltitude) {
      this.setState({ maxAltitude: maxAltitude });
    }
    abortToken.check();

    if (generatingTerrain) {
      this.map.append();
      this.map.camera.position.y = maxAltitudePixels + 500;
      this.setState({ generatingTerrain: false });
    }
    const tile = new TerrainTile(
      TILE_SIZE,
      TILE_SIZE,
      TILE_OVERLAP,
      elevationData,
      textureData,
      coordX,
      coordY,
    );
    await tile.createMesh();
    return {
      tile: tile,
      maxAltitudePixels: maxAltitudePixels,
    };
  };

  renderTerrain = async container => {
    const { pixelBounds } = this.props;
    const { width, height } = getMapDimensions(pixelBounds);
    const rendererHeight = height - 300;
    const rendererWidth = Math.floor((width / height) * rendererHeight);

    this.map = new TerrainMap(
      container,
      rendererWidth,
      rendererHeight,
      this.fetchTiles,
      TILE_SIZE,
      TILE_SIZE,
    );
    this.map.render();
  };

  downloadImage = async () => {
    const { fromTime, toTime, datasetId, layerId, customSelected } = this.props;
    const mimeType = 'image/jpeg';

    this.setState({ downloadingImage: true });
    const imageURL = this.map.renderer.domElement.toDataURL(mimeType);
    const blob = await fetch(imageURL).then(r => r.blob());
    const title = getTitle(fromTime, toTime, datasetId, layerId, customSelected);
    const imageWithOverlays = await addImageOverlays(
      blob,
      this.map.renderer.domElement.width,
      this.map.renderer.domElement.height,
      mimeType,
      null,
      null,
      null,
      false,
      true,
      false,
      false,
      null,
      null,
      null,
      null,
      SENTINEL_COPYRIGHT_TEXT,
      title,
      false,
    );
    const nicename = getNicename(fromTime, toTime, datasetId, layerId, customSelected, false);
    this.setState({ downloadingImage: false });
    FileSaver.saveAs(imageWithOverlays, `${nicename}.jpeg`);
  };

  render() {
    const { generatingTerrain, downloadingImage, minAltitude, maxAltitude } = this.state;
    const { pixelBounds } = this.props;
    const { width } = getMapDimensions(pixelBounds);
    return (
      <Rodal
        animation="slideUp"
        customStyles={{
          height: 'auto',
          bottom: 'auto',
          width: `${width - 100}px`,
          maxWidth: '90vw',
          top: '5vh',
          overflow: 'auto',
        }}
        visible={true}
        onClose={() => store.dispatch(modalSlice.actions.removeModal())}
        closeOnEsc={true}
      >
        <div className="terrain-visualization">
          <div className="title">Terrain Viewer</div>
          {generatingTerrain && <Loader />}
          <div ref={this.viewerHolder} className="canvas-holder" />
          {!generatingTerrain && (
            <>
              <div className="height-info">
                <span>
                  <label>{`Min. altitude:`}</label>
                  {` ${minAltitude} m`}
                </span>
                <span>
                  <label>{`Max. altitude:`}</label>
                  {` ${maxAltitude} m`}
                </span>
              </div>
              <div className="download-button-holder">
                <EOBButton
                  fluid
                  className="download-button"
                  loading={downloadingImage}
                  disabled={false}
                  onClick={this.downloadImage}
                  icon="download"
                  text={t`Download`}
                />
              </div>
            </>
          )}
        </div>
      </Rodal>
    );
  }
}

const mapStoreToProps = store => ({
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  mapBounds: store.mainMap.bounds,
  pixelBounds: store.mainMap.pixelBounds,
  layerId: store.visualization.layerId,
  evalscript: store.visualization.evalscript,
  evalscripturl: store.visualization.evalscripturl,
  dataFusion: store.visualization.dataFusion,
  visualizationUrl: store.visualization.visualizationUrl,
  fromTime: store.visualization.fromTime,
  toTime: store.visualization.toTime,
  datasetId: store.visualization.datasetId,
  customSelected: store.visualization.customSelected,
  gain: store.visualization.gainEffect,
  gamma: store.visualization.gammaEffect,
  redRange: store.visualization.redRangeEffect,
  greenRange: store.visualization.greenRangeEffect,
  blueRange: store.visualization.blueRangeEffect,
  upsampling: store.visualization.upsampling,
  downsampling: store.visualization.downsampling,
  minQa: store.visualization.minQa,
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
  selectedThemeId: store.themes.selectedThemeId,
});

export default connect(mapStoreToProps, null)(TerrainViewer);
