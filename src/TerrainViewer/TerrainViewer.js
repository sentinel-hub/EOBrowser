import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import { BBox, CRS_EPSG3857, MimeTypes, CancelToken } from '@sentinel-hub/sentinelhub-js';
import proj4 from 'proj4';
import { t } from 'ttag';

import store, { terrainViewerSlice, mainMapSlice, visualizationSlice } from '../store';
import { getLayerFromParams } from '../Controls/ImgDownload/ImageDownload.utils';
import { wgs84ToMercator } from '../junk/EOBCommon/utils/coords';
import {
  getMapTile,
  getPositionString,
  getEyeHeightFromBounds,
  getBoundsFrom3DPosition,
  getZoomFromEyeHeight,
  getEyeHeightFromZoom,
  getHeightFromZoom,
} from './TerrainViewer.utils';
import {
  datasourceForDatasetId,
  getDataSourceHandler,
} from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { getGetMapAuthToken } from '../App';
import { constructGetMapParamsEffects } from '../utils/effectsUtils';
import { DATASOURCES, reqConfigGetMap, reqConfigMemoryCache } from '../const';
import Controls from '../Controls/Controls';
import { constructErrorMessage, isDataFusionEnabled } from '../utils';
import ExternalLink from '../ExternalLink/ExternalLink';

import { ReactComponent as IconSun } from './icons/icon-sun.svg';

import 'rodal/lib/rodal.css';

function TerrainViewer(props) {
  /*
    This component uses icons by https://fontawesome.com/, available under a Creative Commons Licence https://creativecommons.org/licenses/by/4.0/legalcode
    Icons were converted to PNG and resized.
  */
  const [layer, setLayer] = useState();
  const [shadingEnabled, setShadingEnabled] = useState(true);
  const [sunEnabled, setSunEnabled] = useState(false);
  const [disabled, setDisabled] = useState(!props.is3D);
  const [cancelToken, setCancelToken] = useState(new CancelToken());
  const [timeoutId, setTimeoutId] = useState(null);
  const [loader, setLoader] = useState();
  const terrainViewerContainer = useRef();

  const {
    toTime,
    lat,
    lng,
    datasetId,
    locale,
    auth,
    terrainViewerSettings,
    is3D,
    mapBounds,
    dataSourcesInitialized,
    terrainViewerId,
  } = props;
  const isGIBS = datasourceForDatasetId(datasetId) === DATASOURCES.GIBS;
  const fromTime = isGIBS ? null : props.fromTime;

  const { x: defaultX, y: defaultY } = wgs84ToMercator({ lat: lat, lng: lng });
  const {
    x = defaultX,
    y = defaultY,
    z = getEyeHeightFromBounds(mapBounds),
    rotV = 10,
    rotH = 0,
    settings,
    sunTime,
  } = terrainViewerSettings || {};

  let minZoom = 7;
  if (dataSourcesInitialized && datasetId) {
    minZoom = getDataSourceHandler(datasetId).getLeafletZoomConfig(datasetId).min;
  }

  const onResize = useCallback(
    () => setBounds({ x: x, y: y, z: z, rotH: rotH, rotV: rotV }),
    // eslint-disable-next-line
    [],
  );

  useEffect(() => {
    if (is3D && terrainViewerContainer.current) {
      setBounds({ x: x, y: y, z: z, rotH: rotH, rotV: rotV });
    }
    // eslint-disable-next-line
  }, [terrainViewerContainer]);

  useEffect(() => {
    if (props.is3D) {
      setDisabled(false);
      on3DInitialized();
    } else if (terrainViewerId) {
      animateExit().then(() => {
        onClose();
        setDisabled(true);
      });
    }
    // eslint-disable-next-line
  }, [props.is3D]);

  useEffect(() => {
    async function changeLayer(layer) {
      if (
        layer &&
        props.dataSourcesInitialized &&
        props.datasetId &&
        (props.layerId || props.evalscript || props.evalscripturl)
      ) {
        const newLayer = await getLayerFromParams(props);
        if (newLayer) {
          if (!isDataFusionEnabled(props.dataFusion)) {
            await newLayer.updateLayerFromServiceIfNeeded(reqConfigMemoryCache);
          }
          setLayer(newLayer);
          window.reload3DTextures(terrainViewerId);
        }
      }
    }
    changeLayer(layer);
    // eslint-disable-next-line
  }, [
    props.layerId,
    props.evalscript,
    props.evalscripturl,
    // eslint-disable-next-line
    isDataFusionEnabled(props.dataFusion) && props.dataFusion,
    props.visualizationUrl,
    props.fromTime,
    props.toTime,
    props.datasetId,
    props.customSelected,
    props.gainEffect,
    props.gammaEffect,
    props.redRangeEffect,
    props.greenRangeEffect,
    props.blueRangeEffect,
    props.redCurveEffect,
    props.greenCurveEffect,
    props.blueCurveEffect,
    props.upsampling,
    props.downsampling,
    props.minQa,
    props.speckleFilter,
    props.orthorectification,
    props.dataSourcesInitialized,
  ]);

  useEffect(() => {
    if (terrainViewerId) {
      window.set3DLocale(props.locale);
    }
    // eslint-disable-next-line
  }, [props.locale]);

  function set3DLocation(x, y, zoom) {
    const z = getHeightFromZoom(zoom);
    window.set3DPosition(terrainViewerId, x, y, z, 0, 0);
  }

  async function onTileError(error) {
    const message = await constructErrorMessage(error);
    store.dispatch(visualizationSlice.actions.setError(message));
  }

  function get3DMapTileUrl(viewerId, minX, minY, maxX, maxY, width, height, callback) {
    const equatorLen = 40075016.685578488;
    const zoomLevel = Math.max(
      0,
      Math.min(19, 1 + Math.floor(Math.log(equatorLen / ((maxX - minX) * 1.001)) / Math.log(2))),
    );
    const numTiles = 1 << zoomLevel;
    const tileX = Math.floor(((minX + maxX + equatorLen) * numTiles) / (2 * equatorLen));
    const tileY = numTiles - 1 - Math.floor(((minY + maxY + equatorLen) * numTiles) / (2 * equatorLen));
    const mapTilerUrl = `https://api.maptiler.com/maps/streets/256/${zoomLevel}/${tileX}/${tileY}.png?key=${process.env.REACT_APP_MAPTILER_KEY}`;

    if (!layer || zoomLevel <= minZoom) {
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
      tileCoord: {
        x: tileX,
        y: tileY,
        z: zoomLevel,
      },
    };
    const reqConfig = {
      cancelToken: cancelToken,
      authToken: getGetMapAuthToken(auth),
      retries: 0,
      ...reqConfigGetMap,
    };

    function onCallback(url) {
      if (url === null) {
        callback(mapTilerUrl);
      } else {
        callback(url);
      }
    }

    getMapTile(
      layer,
      getMapParams,
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      onCallback,
      reqConfig,
      onTileError,
      mapTilerUrl,
    );
  }

  async function on3DInitialized() {
    if (!is3D) {
      return;
    }
    const layer = await getLayerFromParams(props);
    if (layer && !isDataFusionEnabled(props.dataFusion)) {
      await layer.updateLayerFromServiceIfNeeded(reqConfigMemoryCache);
    }

    window.addEventListener('resize', onResize);

    window.set3DLocale(locale);
    setLayer(layer);
    setCancelToken(new CancelToken());
    const tileSize = 64;
    const maxZoomLevel = 18;
    const demInstance = 'MAPZEN';
    const terrainViewerId = window.create3DViewer(
      'terrain-map-container',
      x,
      y,
      z,
      rotH,
      rotV,
      demInstance,
      tileSize,
      maxZoomLevel,
    );
    store.dispatch(terrainViewerSlice.actions.setTerrainViewerId(terrainViewerId));
    window.set3DSunTime(terrainViewerId, sunTime);
    window.set3DSettings(terrainViewerId, settings);
  }

  function on3DButtonClicked(viewerId, buttonId) {
    if (buttonId === 'center3Dto2D') {
      window.set3DPosition(viewerId, x, y, 8000);
    }
  }

  function on3DPositionChanged(viewerId, x, y, z, rotH, rotV) {
    clearTimeout(timeoutId);
    if (!is3D) {
      return;
    }

    const newTimeoutId = setTimeout(() => {
      const [lng, lat] = proj4('EPSG:3857', 'EPSG:4326', [x, y]);
      const zoom = getZoomFromEyeHeight(x, y, z);
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
      store.dispatch(
        mainMapSlice.actions.setPosition({
          lat: lat,
          lng: lng,
          zoom: zoom,
        }),
      );
      setBounds({ x: x, y: y, z: z, rotH: rotH, rotV: rotV });
    }, 500);
    setTimeoutId(newTimeoutId);
  }

  function on3DLoadingStateChanged(viewerId, isLoading, type) {
    if (type === 'OVERALL') {
      setLoader(isLoading);
    }
  }

  function on3DSettingsChanged(viewerId) {
    store.dispatch(
      terrainViewerSlice.actions.setTerrainViewerSettings({
        ...terrainViewerSettings,
        sunTime: window.get3DSunTime(viewerId),
        settings: window.get3DSettings(viewerId),
      }),
    );
  }

  function on3DShadingClick() {
    if (shadingEnabled) {
      setSunEnabled(false);
      window.enable3DSun(terrainViewerId, false);
    }
    setShadingEnabled(!shadingEnabled);
    window.enable3DShading(terrainViewerId, !shadingEnabled);
  }

  function on3DSunClick() {
    if (!sunEnabled) {
      setShadingEnabled(true);
      window.enable3DShading(terrainViewerId, true);
    }
    setSunEnabled(!sunEnabled);
    window.enable3DSun(terrainViewerId, !sunEnabled);
    window.show3DSunTimeDialog(terrainViewerId, !sunEnabled);
  }

  function setBounds({ x, y, z, rotH, rotV }) {
    const containerWidth = terrainViewerContainer.current.clientWidth;
    const containerHeight = terrainViewerContainer.current.clientHeight;
    const { pixelBounds, bounds } = getBoundsFrom3DPosition({
      x: x,
      y: y,
      z: z,
      rotV: rotV,
      rotH: rotH,
      width: containerWidth,
      height: containerHeight,
    });
    store.dispatch(
      mainMapSlice.actions.setBounds({
        bounds: bounds,
        pixelBounds: pixelBounds,
      }),
    );
  }

  async function animateExit() {
    const z2D = getEyeHeightFromZoom(props.lat, props.zoom, terrainViewerContainer.current.clientWidth);

    window.on3DPositionChanged = () => {};
    window.get3DMapTileUrl = () => {};
    cancelToken.cancel();

    return await new Promise((resolve) => {
      const closingAnimationId = 'exit-animation';
      window.on3DAnimationCompleted = (viewerId, animationId) =>
        viewerId === terrainViewerId && animationId === closingAnimationId && resolve();
      window.animate3D(terrainViewerId, closingAnimationId, {
        isLooping: false,
        frames: [
          { x: x, y: y, z: z, rotH: rotH, rotV: rotV, duration: 0.8 },
          { x: x, y: y, z: z2D, rotH: rotH > 180 ? 360 : 0, rotV: 0, duration: 0.2 },
        ],
      });
    });
  }

  function onClose() {
    cancelToken.cancel();
    window.removeEventListener('resize', onResize);
    window.close3DViewer(terrainViewerId);
    store.dispatch(terrainViewerSlice.actions.resetTerrainViewerSettings());
    store.dispatch(terrainViewerSlice.actions.setTerrainViewerId(null));
  }
  if (is3D) {
    window.get3DMapTileUrl = get3DMapTileUrl;
    window.on3DButtonClicked = on3DButtonClicked;
    window.on3DPositionChanged = on3DPositionChanged;
    window.on3DLoadingStateChanged = on3DLoadingStateChanged;
    window.on3DSettingsChanged = on3DSettingsChanged;
    window.set3DLocation = set3DLocation;
  }

  if (disabled) {
    return null;
  }

  const closingClass = !is3D ? 'closing' : '';

  return (
    <>
      <div id="terrain-map-container" ref={terrainViewerContainer}>
        <div className={`loader-bar ${loader ? '' : 'hidden'}`} />
        <div className="toolbar3d">
          <div
            className={`button3d help`}
            onClick={() => {
              window.show3DHelpDialog(terrainViewerId);
            }}
            title={t`Help`}
          >
            <i className="fa fa-info"></i>
          </div>
          <div
            className={`button3d animated ${closingClass}`}
            onClick={() => {
              window.show3DGeneralSettingsDialog(terrainViewerId, true);
            }}
            title={t`Settings`}
          >
            <i className="fa fa-regular fa-gear"></i>
          </div>
          <div
            className={`button3d animated ${shadingEnabled ? 'enabled' : ''} ${closingClass}`}
            onClick={on3DShadingClick}
            title={t`Shading`}
          >
            <i className="fa fa-regular fa-lightbulb-o"></i>
          </div>
          <div
            className={`button3d animated ${sunEnabled ? 'enabled' : ''} ${closingClass}`}
            onClick={on3DSunClick}
            title={t`Sun`}
          >
            <IconSun className="icon" fill="currentColor" />
          </div>
        </div>
        <div className="info3dcontainer">{getPositionString(lat, lng, z)}</div>
        <div className="attribution">
          <ExternalLink
            className="attribution-link maptiler-attribution"
            href="https://www.maptiler.com/copyright/"
          >
            © MapTiler
          </ExternalLink>
          <ExternalLink
            className="attribution-link osm-attribution"
            href="https://www.openstreetmap.org/copyright"
          >
            © OpenStreetMap contributors
          </ExternalLink>
          <ExternalLink
            className="attribution-link sentinelhub-attribution"
            href="https://www.sentinel-hub.com/"
          >
            © Sentinel Hub
          </ExternalLink>
        </div>
      </div>

      <Controls is3D={true} />
    </>
  );
}

const mapStoreToProps = (store) => ({
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  mapBounds: store.mainMap.bounds,
  pixelBounds: store.mainMap.pixelBounds,
  is3D: store.mainMap.is3D,
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
  dataSourcesInitialized: store.themes.dataSourcesInitialized,
  locale: store.language.selectedLanguage,
  user: store.auth.user,
  auth: store.auth,
  terrainViewerSettings: store.terrainViewer.settings,
  terrainViewerId: store.terrainViewer.id,
});

export default connect(mapStoreToProps, null)(TerrainViewer);
