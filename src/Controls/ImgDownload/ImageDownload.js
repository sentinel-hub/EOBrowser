import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Rodal from 'rodal';
import { t } from 'ttag';
import FileSaver from 'file-saver';
import { CancelToken } from '@sentinel-hub/sentinelhub-js';
import JSZip from 'jszip';

import 'rodal/lib/rodal.css';

import store, { modalSlice, notificationSlice } from '../../store';
import { ImageDownloadForms, TABS } from './ImageDownloadForms';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import {
  getMapDimensions,
  getAllBands,
  getAllLayers,
  constructV3Evalscript,
  fetchImageFromParams,
  getSupportedImageFormats,
  getImageDimensionFromBounds,
  constructBasicEvalscript,
} from './ImageDownload.utils';
import { findMatchingLayerMetadata } from '../../Tools/VisualizationPanel/legendUtils';
import { constructSHJSEffects } from '../../Tools/Pins/Pin.utils';
import { IMAGE_FORMATS_INFO } from './consts';
import ImageDownloadErrorPanel from './ImageDownloadErrorPanel';
import { getDataSourceHandler } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { getLoggedInErrorMsg } from '../../junk/ConstMessages';
import { isDataFusionEnabled } from '../../utils';

import './ImageDownload.scss';

function ImageDownload(props) {
  const [selectedTab, setSelectedTab] = useState(TABS.BASIC);
  const [loadingImages, setLoadingImages] = useState(false);
  const [allBands, setAllBands] = useState([]);
  const [allLayers, setAllLayers] = useState([]);
  const [supportedImageFormats, setSupportedImageFormats] = useState([]);
  const [error, setError] = useState(null);

  const { width: defaultWidth, height: defaultHeight } = getImageDimensionFromBounds(
    props.bounds,
    props.datasetId,
  );
  const effects = constructSHJSEffects(props);

  let cancelToken;
  useEffect(cancelToken => {
    return () => {
      if (cancelToken) {
        cancelToken.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setAllBands(getAllBands(props.datasetId));
    const selectedTheme = props.themesLists[props.selectedThemesListId].find(
      t => t.id === props.selectedThemeId,
    );
    getAllLayers(props.visualizationUrl, props.datasetId, selectedTheme).then(allLayers =>
      setAllLayers(allLayers),
    );
    setSupportedImageFormats(getSupportedImageFormats(props.visualizationUrl));
  }, [
    props.visualizationUrl,
    props.datasetId,
    props.themesLists,
    props.selectedThemesListId,
    props.selectedThemeId,
  ]);

  useEffect(() => {
    setError(null);
  }, [selectedTab]);

  async function downloadBasic(formData) {
    setError(null);
    const { pixelBounds, aoiGeometry } = props;
    const { imageFormat } = formData;

    setLoadingImages(true);
    cancelToken = new CancelToken();

    let { width, height } = getMapDimensions(pixelBounds);

    if (aoiGeometry) {
      // defaultWidth and defaultHeight are in this case referring to bounds of the geometry
      // We keep one of the map dimensions and scale the other
      const ratio = defaultWidth / defaultHeight;

      if (ratio >= 1) {
        height = Math.floor(width / ratio);
      } else {
        width = Math.floor(ratio * height);
      }
    }

    const baseParams = {
      cancelToken: cancelToken,
      imageFormat: imageFormat,
      width: width,
      height: height,
      geometry: aoiGeometry,
      effects: effects,
    };
    let image;
    try {
      image = await fetchImageFromParams({ ...props, ...formData, ...baseParams });
    } catch (err) {
      setError(err);
      setLoadingImages(false);
      return;
    }
    const { ext: imageExt } = IMAGE_FORMATS_INFO[imageFormat];
    FileSaver.saveAs(image.blob, `${image.nicename}.${imageExt}`);
    setLoadingImages(false);
  }

  async function downloadAnalytical(formData) {
    setError(null);
    setLoadingImages(true);
    const {
      evalscript,
      evalscripturl,
      visualizationUrl,
      datasetId,
      dataFusion,
      fromTime,
      toTime,
      minQa,
      upsampling,
      downsampling,
      bounds,
      aoiGeometry,
    } = props;
    const {
      resolutionDivisor,
      customSelected,
      selectedBands,
      selectedLayers,
      imageFormat,
      selectedCrs,
      showLogo,
      addDataMask,
    } = formData;
    const width = Math.floor(defaultWidth / resolutionDivisor);
    const height = Math.floor(defaultHeight / resolutionDivisor);

    cancelToken = new CancelToken();

    const requestsParams = [];
    const baseParams = {
      visualizationUrl: visualizationUrl,
      datasetId: datasetId,
      width: width,
      height: height,
      imageFormat: imageFormat,
      selectedCrs: selectedCrs,
      fromTime: fromTime,
      toTime: toTime,
      bounds: bounds,
      geometry: aoiGeometry,
      minQa: minQa,
      upsampling: upsampling,
      downsampling: downsampling,
      cancelToken: cancelToken,
      showLogo: showLogo,
    };

    if (customSelected) {
      requestsParams.push({
        ...baseParams,
        customSelected: true,
        evalscript: evalscript,
        evalscripturl: evalscripturl,
        dataFusion: dataFusion,
        effects: effects,
      });
    }

    const dsh = getDataSourceHandler(datasetId);
    const supportsV3Evalscript = dsh && dsh.supportsV3Evalscript(datasetId);

    for (let band of selectedBands) {
      requestsParams.push({
        ...baseParams,
        customSelected: true,
        evalscript: supportsV3Evalscript
          ? constructV3Evalscript(band, datasetId, imageFormat, allBands, addDataMask)
          : constructBasicEvalscript(band),
        isRawBand: true,
        bandName: band,
      });
    }

    for (let layer of selectedLayers) {
      requestsParams.push({
        ...baseParams,
        layerId: layer,
        effects: effects,
      });
    }

    const images = await Promise.all(
      requestsParams.map(params =>
        fetchImageFromParams(params).catch(err => {
          setError(err);
          return null;
        }),
      ),
    ).then(images => images.filter(img => img !== null));

    const { ext: imageExt } = IMAGE_FORMATS_INFO[imageFormat];

    if (images.length === 1) {
      FileSaver.saveAs(images[0].blob, `${images[0].nicename}.${imageExt}`);
    } else if (images.length > 1) {
      const zip = new JSZip();
      for (let i = 0; i < images.length; i++) {
        zip.file(`${images[i].nicename}.${imageExt}`, images[i].blob);
      }

      if (Object.keys(zip.files).length > 0) {
        const content = await zip.generateAsync({ type: 'blob' });
        const zipFilename = 'EO_Browser_images.zip';
        FileSaver.saveAs(content, zipFilename);
      }
    }
    setLoadingImages(false);
  }

  async function downloadPrint(formData) {
    const { aoiGeometry } = props;
    const {
      imageWidthInches,
      resolutionDpi,
      imageFormat,
      showCaptions,
      showLegend,
      userDescription,
    } = formData;

    setError(null);
    setLoadingImages(true);
    cancelToken = new CancelToken();

    const width = Math.floor(imageWidthInches * resolutionDpi);
    const height = Math.floor(((imageWidthInches * defaultHeight) / defaultWidth) * resolutionDpi);

    const params = {
      showCaptions: showCaptions,
      showLegend: showLegend,
      userDescription: userDescription,
      cancelToken: cancelToken,
      imageFormat: imageFormat,
      width: width,
      height: height,
      geometry: aoiGeometry,
      effects: effects,
    };

    let image;
    try {
      image = await fetchImageFromParams({ ...props, ...params });
    } catch (err) {
      setError(err);
      setLoadingImages(false);
      return;
    }
    const { ext: imageExt } = IMAGE_FORMATS_INFO[imageFormat];
    FileSaver.saveAs(image.blob, `${image.nicename}.${imageExt}`);
    setLoadingImages(false);
  }

  function checkIfCurrentLayerHasLegend() {
    const { layerId, datasetId, selectedThemeId } = props;
    if (layerId) {
      const layer = allLayers.find(l => l.layerId === layerId);
      if (layer) {
        if (layer.legend || layer.legendUrl) {
          return true;
        }
        const predefinedLayerMetadata = findMatchingLayerMetadata(datasetId, layerId, selectedThemeId);
        if (predefinedLayerMetadata && predefinedLayerMetadata.legend) {
          return true;
        }
      }
    }
    return false;
  }

  function displayLogInToAccessMessage() {
    store.dispatch(notificationSlice.actions.displayError(getLoggedInErrorMsg()));
  }

  const hasLegendData = checkIfCurrentLayerHasLegend();
  const isUserLoggedIn = props.user && props.user.userdata;

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
      <div className="image-download">
        <div className="image-download-mode-selection">
          <EOBButton
            text={t`Basic`}
            className={selectedTab === TABS.BASIC ? 'selected' : ''}
            onClick={() => setSelectedTab(TABS.BASIC)}
          />

          <EOBButton
            text={t`Analytical`}
            className={selectedTab === TABS.ANALYTICAL ? 'selected' : ''}
            onClick={() => setSelectedTab(TABS.ANALYTICAL)}
            disabled={!isUserLoggedIn}
            onDisabledClick={displayLogInToAccessMessage}
          />

          <EOBButton
            text={t`High-res print`}
            className={selectedTab === TABS.PRINT ? 'selected' : ''}
            onClick={() => setSelectedTab(TABS.PRINT)}
            disabled={!isUserLoggedIn}
            onDisabledClick={displayLogInToAccessMessage}
          />
        </div>
        <ImageDownloadForms
          selectedTab={selectedTab}
          hasLegendData={hasLegendData}
          onDownloadBasic={downloadBasic}
          onDownloadAnalytical={downloadAnalytical}
          onDownloadPrint={downloadPrint}
          loading={loadingImages}
          allLayers={allLayers}
          allBands={allBands}
          currentLayerId={props.layerId}
          isCurrentLayerCustom={props.customSelected}
          defaultWidth={defaultWidth}
          defaultHeight={defaultHeight}
          supportedImageFormats={supportedImageFormats}
          addingMapOverlaysPossible={!props.aoiGeometry} // applying map overlays currently relies on lat, lng and zoom, which aren't used when geometry is present
          bounds={props.bounds}
          datasetId={props.datasetId}
          isDataFusionEnabled={isDataFusionEnabled(props.dataFusion)}
        />
        <ImageDownloadErrorPanel error={error} />
      </div>
    </Rodal>
  );
}

const mapStoreToProps = store => ({
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  bounds: store.aoi.bounds ? store.aoi.bounds : store.mainMap.bounds,
  pixelBounds: store.mainMap.pixelBounds,
  enabledOverlaysId: store.mainMap.enabledOverlaysId,
  user: store.auth.user,
  aoiGeometry: store.aoi.geometry
    ? store.aoi.geometry.features
      ? store.aoi.geometry.features[0].geometry
      : store.aoi.geometry.geometry
    : null,
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

export default connect(mapStoreToProps, null)(ImageDownload);
