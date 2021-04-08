import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Rodal from 'rodal';
import FileSaver from 'file-saver';
import { t } from 'ttag';
import { BBox, CRS_EPSG3857, MimeTypes, CancelToken } from '@sentinel-hub/sentinelhub-js';
import uuid from 'uuid';
import Toggle from 'react-toggle';

import store, { modalSlice } from '../store';
import Loader from '../Loader/Loader';
import { getMapDimensions } from '../Controls/ImgDownload/ImageDownload.utils';
import {
  addImageOverlays,
  getNicename,
  getTitle,
  SENTINEL_COPYRIGHT_TEXT,
} from '../Controls/ImgDownload/ImageDownload.utils';
import { EOBButton } from '../junk/EOBCommon/EOBButton/EOBButton';
import { getLayerFromParams } from '../Controls/ImgDownload/ImageDownload.utils';
import { wgs84ToMercator } from '../junk/EOBCommon/utils/coords';
import { getHeightFromZoom, getMapTile } from './TerrainViewer.utils';
import TerrainViewerHelp from './TerrainViewerHelp';
import { datasourceForDatasetId } from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

import 'rodal/lib/rodal.css';

const DEFAULT_IMAGE_SIZE = 3000;
const BACKEND_SERVICE_3D = 'https://www.geopedia.world/map3d';
const EOB3D_SCRIPT_SRC = `${process.env.REACT_APP_ROOT_URL}eob3d/eob3d.nocache.js`;
window.activeTerrainViewers = {};

function TerrainViewer(props) {
  /*
    This component uses icons by https://fontawesome.com/, available under a Creative Commons Licence https://creativecommons.org/licenses/by/4.0/legalcode
    Icons were converted to PNG and resized.
  */
  const [loadingViewer, setLoadingViewer] = useState(true);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [layer, setLayer] = useState();
  const [terrainViewerId, setTerrainViewerId] = useState();
  const [showHelp, setShowHelp] = useState(false);
  const [activeTerrainViewerComponentId] = useState(uuid());
  const [originalChildren] = useState([...document.head.children]);
  const [showLogoAndCaptions, setShowLogoAndCaptions] = useState(true);

  const { toTime, lat, lng, pixelBounds, datasetId, locale } = props;
  const isGIBS = datasourceForDatasetId(datasetId) === 'GIBS';
  const fromTime = isGIBS ? null : props.fromTime;
  const { x, y } = wgs84ToMercator({ lat: lat, lng: lng });
  const { width, height } = getMapDimensions(pixelBounds);
  const rendererWidth = Math.floor((width - 80) * 0.85);
  const rendererHeight = Math.floor((height / width) * rendererWidth);
  const startAngle = 10;
  const cancelToken = new CancelToken();

  useEffect(() => {
    window.activeTerrainViewers[activeTerrainViewerComponentId] = null;
    const script = document.createElement('script');
    script.src = EOB3D_SCRIPT_SRC;
    document.body.appendChild(script);

    return () => {
      delete window.activeTerrainViewers[activeTerrainViewerComponentId];
      window.on3DInitialized = () => {};
      window.get3DMapTileUrl = null;
      window.on3DButtonClicked = null;
      document.body.removeChild(script);
    };
    // eslint-disable-next-line
  }, []);

  function get3DMapTileUrl(viewerId, minX, minY, maxX, maxY, width, height, callback) {
    if (!layer) {
      return;
    }

    const getMapParams = {
      bbox: new BBox(CRS_EPSG3857, minX, minY, maxX, maxY),
      format: MimeTypes.JPEG,
      width: width,
      height: height,
      fromTime: fromTime && fromTime.toDate(),
      toTime: toTime.toDate(),
      preview: 2,
    };
    const reqConfig = { cancelToken: cancelToken };
    getMapTile(layer, getMapParams, minX, minY, maxX, maxY, width, height, callback, reqConfig);
  }

  async function on3DInitialized() {
    const { zoom } = props;
    const layer = await getLayerFromParams(props);

    window.set3DLocale(locale);

    if (
      Object.keys(window.activeTerrainViewers).length === 1 &&
      window.activeTerrainViewers[activeTerrainViewerComponentId] === null
    ) {
      setLayer(layer);
      const height = getHeightFromZoom(zoom);
      window.set3DServiceUrl(BACKEND_SERVICE_3D);
      const terrainViewerId = window.create3DViewer('terrain-map-container', x, y, height, 0, startAngle);
      window.activeTerrainViewers[activeTerrainViewerComponentId] = terrainViewerId;
      setTerrainViewerId(terrainViewerId);
      setLoadingViewer(false);
    }
    removeUnnecessaryScripts();
  }

  function removeUnnecessaryScripts() {
    // The 3D scripts adds some elements to document.head, which clashes with existing styles. This removes them
    const newChildren = [...document.head.children];
    const elementsToRemove = newChildren.filter(elem => !originalChildren.includes(elem));
    for (let elem of elementsToRemove) {
      document.head.removeChild(elem);
    }
  }

  function on3DButtonClicked(viewerId, buttonId) {
    if (buttonId === 'center3Dto2D') {
      window.set3DPosition(viewerId, x, y, 8000);
    }

    if (buttonId === 'help') {
      setShowHelp(true);
    }
  }

  async function downloadImage() {
    setDownloadingImage(true);
    const { fromTime, toTime, datasetId, layerId, customSelected } = props;
    const mimeType = 'image/png';
    let width, height;
    if (rendererWidth > rendererHeight) {
      width = DEFAULT_IMAGE_SIZE;
      height = Math.floor((width * rendererHeight) / rendererWidth);
    } else {
      height = DEFAULT_IMAGE_SIZE;
      width = Math.floor((height * rendererWidth) / rendererHeight);
    }
    const imageUrl = await window.print3D(terrainViewerId, width, height);
    const blob = await fetch(imageUrl).then(res => res.blob());
    const title = showLogoAndCaptions ? getTitle(fromTime, toTime, datasetId, layerId, customSelected) : null;
    const imageWithOverlays = await addImageOverlays(
      blob,
      width,
      height,
      mimeType,
      null,
      null,
      null,
      false,
      showLogoAndCaptions,
      false,
      false,
      null,
      null,
      null,
      null,
      showLogoAndCaptions ? SENTINEL_COPYRIGHT_TEXT : null,
      title,
      false,
    );
    const nicename = getNicename(fromTime, toTime, datasetId, layerId, customSelected, false);
    FileSaver.saveAs(imageWithOverlays, `${nicename}.png`);
    setDownloadingImage(false);
  }

  function onClose() {
    if (terrainViewerId) {
      window.close3DViewer(terrainViewerId);
    }
    cancelToken.cancel();
    store.dispatch(modalSlice.actions.removeModal());
  }

  window.get3DMapTileUrl = get3DMapTileUrl;
  window.on3DButtonClicked = on3DButtonClicked;
  window.on3DInitialized = on3DInitialized;

  const isUserLoggedIn = props.user && props.user.userdata;

  return (
    <Rodal
      animation="slideUp"
      customStyles={{
        height: 'auto',
        bottom: 'auto',
        width: `${width - 80}px`,
        maxWidth: '90vw',
        top: '1vh',
        overflow: 'auto',
      }}
      visible={true}
      onClose={onClose}
      closeOnEsc={true}
    >
      <div className="terrain-visualization">
        <div className="title">{t`Terrain Viewer`}</div>
        {loadingViewer && <Loader />}
        <div id="terrain-map-container" style={{ height: rendererHeight }} />
        {!loadingViewer && (
          <div className="download-button-holder">
            <EOBButton
              fluid
              className="download-button"
              loading={downloadingImage}
              disabled={false}
              onClick={downloadImage}
              icon="download"
              text={t`Download`}
            />
            {isUserLoggedIn && (
              <div className="toggle-captions">
                <Toggle
                  checked={showLogoAndCaptions}
                  icons={false}
                  onChange={() => setShowLogoAndCaptions(!showLogoAndCaptions)}
                />
                <label>{t`Show captions`}</label>
              </div>
            )}
          </div>
        )}
      </div>
      {showHelp && <TerrainViewerHelp setShowHelp={setShowHelp} />}
    </Rodal>
  );
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
  locale: store.language.selectedLanguage,
  user: store.auth.user,
});

export default connect(mapStoreToProps, null)(TerrainViewer);
