import React, { Component } from 'react';
import { connect } from 'react-redux';
import Rodal from 'rodal';
import { getMapOverlayXYZ, getGlOverlay } from '../../junk/EOBCommon/utils/getMapOverlayXYZ';
import { EOB3ImageDownloadPanel } from '../../junk/EOB3ImageDownloadPanel/EOB3ImageDownloadPanel';
import { LayersFactory, ApiType } from '@sentinel-hub/sentinelhub-js';

import { userCanAccessLockedFunctionality } from '../../utils';
import store, { modalSlice, notificationSlice } from '../../store';
import { overlayTileLayers } from '../../Map/Layers';
import {
  getDataSourceHandler,
  getEvalsource,
} from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { getAppropriateAuthToken } from '../../App';
import { getLegendDefinition } from '../../Tools/VisualizationPanel/legendUtils';
import { createSVGLegend } from './ImgDownload.utils';
import { b64EncodeUnicode } from '../../utils/base64MDN';
import 'rodal/lib/rodal.css';
import './ImgDownload.scss';

export const drawMapOverlaysOnCanvas = async (ctx, lat, lng, zoom, enabledOverlaysId) => {
  const enabledOverlays = overlayTileLayers().filter(overlayTileLayer =>
    enabledOverlaysId.includes(overlayTileLayer.id),
  );
  enabledOverlays.sort((a, b) => a.zIndex - b.zIndex);
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  // currently we have two types of overlays
  // One served as images and the other as vector tiles
  // Vector tiles are drawn by mapbox-gl on to a canvas element
  for (const overlay of enabledOverlays) {
    let overlayCanvas;
    if (overlay.urlType === 'VECTOR') {
      overlayCanvas = await getGlOverlay(overlay.pane);
    } else {
      overlayCanvas = await getMapOverlayXYZ(
        overlay.url,
        lat,
        lng,
        zoom,
        canvasWidth,
        canvasHeight,
        overlay.tileSize,
        overlay.makeReadable,
        overlay.zoomOffset,
      );
    }
    ctx.drawImage(overlayCanvas, 0, 0);
  }
};

export const getScaleBarInfo = () => {
  const scaleBarEl = document.querySelector('.leaflet-control-scale-line');
  const scaleBar = scaleBarEl
    ? {
        text: scaleBarEl.innerHTML,
        width: scaleBarEl.offsetWidth,
      }
    : null;
  return scaleBar;
};

class ImgDownload extends Component {
  state = {
    displayModal: false,
  };
  constructor(props) {
    super(props);
    this.scaleBar = getScaleBarInfo();
  }

  async componentDidMount() {
    let channels = {};
    let presets = {};

    const { datasetId } = this.props;
    const dsh = getDataSourceHandler(datasetId);
    const name = `${dsh.datasource} ${datasetId}`;
    channels[name] = dsh.getBands(datasetId);
    const { layers, defaultApiType, legendUrl, legendDefinition } = await this.getPresets(dsh);
    presets[name] = layers;

    const instance = [
      {
        name,
        baseUrls: {
          WMS: this.props.visualizationUrl,
        },
      },
    ];

    this.setState({
      displayModal: true,
      presets,
      channels,
      name,
      instance,
      defaultApiType,
      legendDefinition,
      legendUrl,
    });
  }

  getPresets = async dsh => {
    const { visualizationUrl, selectedThemeId, selectedThemesListId, themesLists, datasetId } = this.props;
    const selectedTheme = themesLists[selectedThemesListId].find(t => t.id === selectedThemeId);
    const { layersExclude } = selectedTheme.content.find(t => t.url === visualizationUrl);
    const shJsDatasetId = dsh.getSentinelHubDataset(datasetId)
      ? dsh.getSentinelHubDataset(datasetId).id
      : null;
    let data = await LayersFactory.makeLayers(visualizationUrl, (_, dataset) =>
      !shJsDatasetId ? true : dataset.id === shJsDatasetId,
    );
    const defaultApiType = data[0].supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS; // We do that before updating, so that dataProduct doesn't affect the outcome
    await Promise.all(
      data.map(async l => {
        await l.updateLayerFromServiceIfNeeded();
      }),
    );
    const { legendUrl, legendDefinition } = this.getLegendInfo(data);
    return {
      layers: dsh
        .getLayers(data, datasetId, visualizationUrl, layersExclude)
        .map(l => this.constructPreset(l)),
      defaultApiType,
      legendDefinition: legendDefinition,
      legendUrl: legendUrl,
    };
  };

  getLegendInfo = layers => {
    const { datasetId, layerId, selectedThemeId } = this.props;
    if (layerId) {
      const legendDefinition = getLegendDefinition(datasetId, layerId, selectedThemeId);
      if (legendDefinition) {
        return { legendDefinition: legendDefinition };
      }
      const layer = layers.find(l => l.layerId === layerId);
      if (layer && layer.legend) {
        return { legendDefinition: layer.legend };
      }
      if (layer && layer.legendUrl) {
        return { legendUrl: layer.legendUrl };
      }
      return {};
    }
    return {};
  };

  constructPreset = layer => {
    const apiType = layer.supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS;
    return { id: layer.layerId, name: layer.title, apiType: apiType };
  };

  getMapOverlays = async (canvasWidth, canvasHeight) => {
    const { lat, lng, zoom, enabledOverlaysId } = this.props;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    await drawMapOverlaysOnCanvas(ctx, lat, lng, zoom, enabledOverlaysId);
    return canvas;
  };

  getNativeRes = () => {
    const { datasetId } = this.props;
    const dsh = getDataSourceHandler(datasetId);
    const { resolution } = dsh.getResolutionLimits();
    //Image download should always use at least 10m resoulution
    return Math.min(resolution || 10, 10);
  };

  getLegendImageURL = async () => {
    const { legendUrl, legendDefinition } = this.state;
    if (legendUrl) {
      return legendUrl;
    }
    if (legendDefinition) {
      return 'data:image/svg+xml;base64,' + b64EncodeUnicode(createSVGLegend(legendDefinition));
    }
  };

  render() {
    const {
      lat,
      lng,
      zoom,
      bounds,
      user,
      aoiBounds,
      aoiGeometry,
      layerId,
      evalscript,
      evalscripturl,
      dataFusion,
      fromTime,
      toTime,
      customSelected,
      datasetId,
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      upsampling,
      downsampling,
      minQa,
      selectedThemeId,
      selectedThemesListId,
      themesLists,
    } = this.props;

    let aoi;
    if (aoiBounds && aoiGeometry) {
      const geometry = aoiGeometry.features ? aoiGeometry.features[0].geometry : aoiGeometry.geometry;
      aoi = { geometry, bounds: aoiBounds };
    } else {
      aoi = null;
    }

    const selectedTheme = themesLists[selectedThemesListId].find(t => t.id === selectedThemeId);

    let effects = {
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      upsampling,
      downsampling,
      minQa,
    };

    let time;
    if (!fromTime) {
      time = toTime.format('YYYY-MM-DD');
    } else {
      time = `${fromTime.toISOString()}/${toTime.toISOString()}`;
    }

    if (!this.state.displayModal) {
      return null;
    } else {
      return (
        <Rodal
          animation="slideUp"
          customStyles={{
            height: 'auto',
            maxHeight: '80vh',
            bottom: 'auto',
            width: '800px',
            maxWidth: '90vw',
            top: '5vh',
            overflow: 'auto',
          }}
          visible={true}
          onClose={() => store.dispatch(modalSlice.actions.removeModal())}
          closeOnEsc={true}
        >
          <div className="img-download">
            <EOB3ImageDownloadPanel
              aoiBounds={aoi}
              mapBounds={bounds}
              lat={lat}
              lng={lng}
              zoom={zoom}
              scaleBar={this.scaleBar}
              drawMapOverlays={this.getMapOverlays}
              isLoggedIn={userCanAccessLockedFunctionality(user ? user.userdata : null, selectedTheme)}
              onErrorMessage={msg => store.dispatch(notificationSlice.actions.displayError(msg))}
              preset={customSelected ? 'CUSTOM' : layerId}
              evalscript={evalscript && customSelected ? btoa(evalscript) : null}
              evalscripturl={evalscripturl}
              dataFusion={dataFusion}
              time={time}
              channels={this.state.channels}
              datasource={this.state.name}
              name={this.state.name}
              presets={this.state.presets}
              instances={this.state.instance}
              defaultApiType={this.state.defaultApiType}
              evalSource={getEvalsource(datasetId)}
              authToken={this.props.authToken}
              nativeRes={this.getNativeRes()}
              legendDataFromPreset={this.state.legendUrl || this.state.legendDefinition}
              getLegendImageURL={this.getLegendImageURL}
              // TO DO
              layers={mockBandsForCustomLayer}
              atmFilter={null}
              evalscriptoverrides={''}
              effects={effects}
              isEvalUrl={false}
            />
          </div>
        </Rodal>
      );
    }
  }
}

const mapStoreToProps = store => ({
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  bounds: store.mainMap.bounds,
  enabledOverlaysId: store.mainMap.enabledOverlaysId,
  user: store.auth.user,
  aoiBounds: store.aoi.bounds,
  aoiGeometry: store.aoi.geometry,
  layerId: store.visualization.layerId,
  evalscript: store.visualization.evalscript,
  evalscripturl: store.visualization.evalscripturl,
  dataFusion: store.visualization.dataFusion,
  visualizationUrl: store.visualization.visualizationUrl,
  fromTime: store.visualization.fromTime,
  toTime: store.visualization.toTime,
  datasetId: store.visualization.datasetId,
  customSelected: store.visualization.customSelected,
  authToken: getAppropriateAuthToken(store.auth, store.themes.selectedThemeId),
  gainEffect: store.visualization.gainEffect,
  gammaEffect: store.visualization.gammaEffect,
  redRangeEffect: store.visualization.redRangeEffect,
  greenRangeEffect: store.visualization.greenRangeEffect,
  blueRangeEffect: store.visualization.blueRangeEffect,
  upsampling: store.visualization.upsampling,
  downsampling: store.visualization.downsampling,
  minQa: store.visualization.minQa,
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
  selectedThemeId: store.themes.selectedThemeId,
});

export default connect(mapStoreToProps, null)(ImgDownload);

// TO DO - TEMPORARY MOCKS
const mockBandsForCustomLayer = {
  r: 'B01',
  g: 'B02',
  b: 'B03',
};
