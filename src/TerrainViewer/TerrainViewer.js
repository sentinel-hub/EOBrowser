import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Rodal from 'rodal';
import FileSaver from 'file-saver';
import { t } from 'ttag';
import { BBox, CRS_EPSG3857, MimeTypes, CancelToken } from '@sentinel-hub/sentinelhub-js';
import { v4 as uuid } from 'uuid';
import Toggle from 'react-toggle';

import store, { modalSlice, terrainViewerSlice } from '../store';
import Loader from '../Loader/Loader';
import { getMapDimensions } from '../Controls/ImgDownload/ImageDownload.utils';
import { addImageOverlays, getNicename, getTitle } from '../Controls/ImgDownload/ImageDownload.utils';
import { EOBButton } from '../junk/EOBCommon/EOBButton/EOBButton';
import { getLayerFromParams } from '../Controls/ImgDownload/ImageDownload.utils';
import { wgs84ToMercator } from '../junk/EOBCommon/utils/coords';
import { getHeightFromZoom, getMapTile } from './TerrainViewer.utils';
import {
  datasourceForDatasetId,
  getDataSourceHandler,
} from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { getGetMapAuthToken } from '../App';
import { savePinsToServer, savePinsToSessionStorage, constructPinFromProps } from '../Tools/Pins/Pin.utils';
import SocialShare from '../components/SocialShare/SocialShare';
import { constructGetMapParamsEffects } from '../utils/effectsUtils';
import { DATASOURCES, reqConfigGetMap, reqConfigMemoryCache } from '../const';

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
  const [activeTerrainViewerComponentId] = useState(uuid());
  const [originalChildren] = useState([...document.head.children]);
  const [showLogoAndCaptions, setShowLogoAndCaptions] = useState(true);
  const [socialSharePanelOpen, setSocialSharePanelOpen] = useState(false);
  const [hasPinBeenSaved, setHasPinBeenSaved] = useState(false);

  const { toTime, lat, lng, zoom, pixelBounds, datasetId, locale, auth, terrainViewerSettings } = props;
  const isGIBS = datasourceForDatasetId(datasetId) === DATASOURCES.GIBS;
  const fromTime = isGIBS ? null : props.fromTime;
  const { width, height } = getMapDimensions(pixelBounds);
  const rendererWidth = Math.floor((width - 80) * 0.85);
  const rendererHeight = Math.floor((height / width) * rendererWidth);
  const { x: defaultX, y: defaultY } = wgs84ToMercator({ lat: lat, lng: lng });
  const {
    x = defaultX,
    y = defaultY,
    z = getHeightFromZoom(zoom),
    rotV = 10,
    rotH = 0,
    settings,
    sunTime,
  } = terrainViewerSettings || {};
  const cancelToken = new CancelToken();
  const minZoom = getDataSourceHandler(datasetId).getLeafletZoomConfig(datasetId).min || 7;

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

    const equatorLen = 40075016.685578488;
    const zoomLevel = Math.max(
      0,
      Math.min(19, 1 + Math.floor(Math.log(equatorLen / ((maxX - minX) * 1.001)) / Math.log(2))),
    );
    const numTiles = 1 << zoomLevel;
    const tileX = Math.floor(((minX + maxX + equatorLen) * numTiles) / (2 * equatorLen));
    const tileY = numTiles - 1 - Math.floor(((minY + maxY + equatorLen) * numTiles) / (2 * equatorLen));
    const mapTilerUrl = `https://api.maptiler.com/maps/streets/256/${zoomLevel}/${tileX}/${tileY}.png?key=${process.env.REACT_APP_MAPTILER_KEY}`;

    if (zoomLevel <= minZoom) {
      callback(mapTilerUrl);
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
      effects: constructGetMapParamsEffects(props),
    };
    const reqConfig = {
      cancelToken: cancelToken,
      authToken: getGetMapAuthToken(auth),
      retries: 0,
      ...reqConfigGetMap,
    };

    getMapTile(layer, getMapParams, minX, minY, maxX, maxY, width, height, callback, reqConfig);
  }

  async function on3DInitialized() {
    const layer = await getLayerFromParams(props);
    await layer.updateLayerFromServiceIfNeeded(reqConfigMemoryCache);

    window.set3DLocale(locale);
    if (
      Object.keys(window.activeTerrainViewers).length === 1 &&
      window.activeTerrainViewers[activeTerrainViewerComponentId] === null
    ) {
      setLayer(layer);

      window.set3DServiceUrl(BACKEND_SERVICE_3D);
      const terrainViewerId = window.create3DViewer('terrain-map-container', x, y, z, rotH, rotV);
      window.activeTerrainViewers[activeTerrainViewerComponentId] = terrainViewerId;
      setTerrainViewerId(terrainViewerId);
      window.set3DSunTime(terrainViewerId, sunTime);
      window.set3DSettings(terrainViewerId, settings);
      setLoadingViewer(false);
    }
  }

  function removeUnnecessaryScripts() {
    // The 3D scripts adds some elements to document.head, which clashes with existing styles. This removes them
    const newChildren = [...document.head.children];
    const elementsToRemove = newChildren.filter((elem) => !originalChildren.includes(elem));
    for (let elem of elementsToRemove) {
      document.head.removeChild(elem);
    }
    return;
  }

  function on3DButtonClicked(viewerId, buttonId) {
    if (buttonId === 'center3Dto2D') {
      window.set3DPosition(viewerId, x, y, 8000);
    }
  }

  function on3DPositionChanged(viewerId, x, y, z, rotH, rotV) {
    setHasPinBeenSaved(false);
    store.dispatch(
      terrainViewerSlice.actions.setTerrainViewerSettings({
        ...terrainViewerSettings,
        x: x,
        y: y,
        z: z,
        rotH: rotH,
        rotV: rotV,
      }),
    );
  }

  function on3DLoadingStateChanged(viewerId, isLoading, type) {}

  function on3DSettingsChanged(viewerId) {
    store.dispatch(
      terrainViewerSlice.actions.setTerrainViewerSettings({
        ...terrainViewerSettings,
        sunTime: window.get3DSunTime(viewerId),
        settings: window.get3DSettings(viewerId),
      }),
    );
  }

  async function savePin() {
    const { user, setLastAddedPin } = props;
    const pin = constructPinFromProps(props);

    if (user.userdata) {
      const { uniqueId } = await savePinsToServer([pin]);
      setLastAddedPin(uniqueId);
    } else {
      const uniqueId = savePinsToSessionStorage([pin]);
      setLastAddedPin(uniqueId);
    }
    setHasPinBeenSaved(true);
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
    const blob = await fetch(imageUrl).then((res) => res.blob());
    const title = showLogoAndCaptions ? getTitle(fromTime, toTime, datasetId, layerId, customSelected) : null;

    const dsh = getDataSourceHandler(datasetId);
    const drawCopernicusLogo = dsh.isCopernicus();
    const addLogos = dsh.isSentinelHub();

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
      showLogoAndCaptions ? dsh.getCopyrightText(datasetId) : null,
      title,
      false,
      addLogos,
      drawCopernicusLogo,
    );
    const nicename = getNicename(fromTime, toTime, datasetId, layerId, customSelected, false);
    FileSaver.saveAs(imageWithOverlays, `${nicename}.png`);
    setDownloadingImage(false);
  }

  function onClose() {
    removeUnnecessaryScripts();
    if (terrainViewerId) {
      window.close3DViewer(terrainViewerId);
    }
    cancelToken.cancel();
    store.dispatch(terrainViewerSlice.actions.resetTerrainViewerSettings());
    store.dispatch(modalSlice.actions.removeModal());
  }

  window.get3DMapTileUrl = get3DMapTileUrl;
  window.on3DButtonClicked = on3DButtonClicked;
  window.on3DInitialized = on3DInitialized;
  window.on3DPositionChanged = on3DPositionChanged;
  window.on3DLoadingStateChanged = on3DLoadingStateChanged;
  window.on3DSettingsChanged = on3DSettingsChanged;

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
            <div className="actions">
              <div
                className={`action-wrapper ${hasPinBeenSaved ? ' pin-saved' : ''}`}
                onClick={savePin}
                title={t`Add to Pins`}
              >
                <i className="fa fa-thumb-tack" />
              </div>
              <div
                className="action-wrapper"
                onClick={() => setSocialSharePanelOpen(!socialSharePanelOpen)}
                title={t`Share`}
              >
                <i className="fas fa-share-alt" />
                <SocialShare
                  displaySocialShareOptions={socialSharePanelOpen}
                  toggleSocialSharePanel={() => setSocialSharePanelOpen(false)}
                  datasetId={datasetId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Rodal>
  );
}

const mapStoreToProps = (store) => ({
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
  gainEffect: store.visualization.gainEffect,
  gammaEffect: store.visualization.gammaEffect,
  redRangeEffect: store.visualization.redRangeEffect,
  greenRangeEffect: store.visualization.greenRangeEffect,
  blueRangeEffect: store.visualization.blueRangeEffect,
  redCurveEffect: store.visualization.redCurveEffect,
  greenCurveEffect: store.visualization.greenCurveEffect,
  blueCurveEffect: store.visualization.blueCurveEffect,
  upsampling: store.visualization.upsampling,
  downsampling: store.visualization.downsampling,
  minQa: store.visualization.minQa,
  speckleFilter: store.visualization.speckleFilter,
  orthorectification: store.visualization.orthorectification,
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
  selectedThemeId: store.themes.selectedThemeId,
  locale: store.language.selectedLanguage,
  user: store.auth.user,
  auth: store.auth,
  terrainViewerSettings: store.terrainViewer.settings,
});

export default connect(mapStoreToProps, null)(TerrainViewer);
