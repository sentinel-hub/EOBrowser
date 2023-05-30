import { CancelToken } from '@sentinel-hub/sentinelhub-js';
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';
import moment from 'moment';
import { IMAGE_FORMATS } from './consts';
import {
  fetchAndPatchImagesFromParams,
  fetchImageFromParams,
  getImageDimensionFromBoundsWithCap,
  getMapDimensions,
} from './ImageDownload.utils';
import { getGetMapAuthToken } from '../../App';
import { constructGetMapParamsEffects } from '../../utils/effectsUtils';

import './ImageDownloadPreview.scss';
import { TABS } from './ImageDownloadForms';
import { TABS as MAIN_TABS } from '../../const';
import { CUSTOM_TAG } from './AnalyticalForm';
import Loader from '../../Loader/Loader';

const ImageDownloadPreview = (props) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [canDisplayPreview, setCanDisplayPreview] = useState(true);
  const [fetchingPreviewImage, setFetchingPreviewImage] = useState(false);

  const {
    analyticalFormLayers,
    selectedTab,
    disabledDownload,
    selectedTabIndex,
    comparedLayers,
    hasAoi,
    cropToAoi,
    drawAoiGeoToImg,
    aoiGeometry,
    pixelBounds,
    auth,
    aoiBounds,
    mapBounds,
    datasetId,
    layerId,
    is3D,
  } = props;

  const fetchPreviewImg = async (layerId = null) => {
    setFetchingPreviewImage(true);
    const cancelToken = new CancelToken();
    const effects = constructGetMapParamsEffects(props);
    const getMapAuthToken = getGetMapAuthToken(auth);
    const previewHeight = 200; // height of preview in ImageDownloadPreview.scss in px
    const ratioToAvoidMetersPerPixelLimit = 2;

    let height, width;

    if (hasAoi && cropToAoi) {
      ({ width, height } = getImageDimensionFromBoundsWithCap(aoiBounds, datasetId));
    } else {
      const { width: imgWidth, height: imgHeight } = getMapDimensions(pixelBounds);
      const maxDimension = Math.max(imgWidth, imgHeight);
      const ratioToAvoidMetersPerPixelLimitInFullMap = 2;

      // scale the dimension to the size of preview being displayed
      height = (imgHeight / maxDimension) * previewHeight * ratioToAvoidMetersPerPixelLimitInFullMap;
      width = (imgWidth / maxDimension) * previewHeight * ratioToAvoidMetersPerPixelLimitInFullMap;
    }

    const params = {
      ...props,
      cancelToken,
      effects,
      getMapAuthToken,
      width: width * ratioToAvoidMetersPerPixelLimit,
      height: height * ratioToAvoidMetersPerPixelLimit,
      imageFormat: IMAGE_FORMATS.PNG,
      showCaptions: false,
      showLegend: false,
      showLogo: false,
      addMapOverlays: false,
      drawAoiGeoToImg,
      aoiGeometry,
      geometry: cropToAoi ? aoiGeometry : undefined,
      bounds: cropToAoi ? aoiBounds : mapBounds,
    };

    let blob;

    if (selectedTabIndex === MAIN_TABS.COMPARE_TAB) {
      const response = await fetchAndPatchImagesFromParams(
        {
          ...params,
          comparedLayers: comparedLayers.map((cLayer) => {
            let newCLayer = Object.assign({}, cLayer);
            newCLayer.fromTime = cLayer.fromTime ? moment(cLayer.fromTime) : undefined;
            newCLayer.toTime = cLayer.toTime ? moment(cLayer.toTime) : undefined;
            return newCLayer;
          }),
        },
        () => null,
        () => setCanDisplayPreview(false),
        () => null,
      ).catch((e) => {
        console.warn(e);
      });
      blob = response && response.finalImage;
    } else {
      const response = await fetchImageFromParams({
        ...params,
        layerId: layerId ? layerId : params.layerId,
      }).catch((e) => {
        console.warn(e);
      });
      blob = response && response.blob;
    }

    if (blob) {
      setCanDisplayPreview(true);
      setPreviewUrl(URL.createObjectURL(blob));
    } else {
      setCanDisplayPreview(false);
    }
    setFetchingPreviewImage(false);
  };

  useEffect(() => {
    fetchPreviewImg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPreviewImg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropToAoi, drawAoiGeoToImg]);

  useEffect(() => {
    if (analyticalFormLayers.length > 0 && selectedTab === TABS.ANALYTICAL) {
      const lastSelectedLayer = analyticalFormLayers[analyticalFormLayers.length - 1];
      if (lastSelectedLayer !== CUSTOM_TAG) {
        fetchPreviewImg(lastSelectedLayer);
      } else {
        fetchPreviewImg();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticalFormLayers, selectedTab]);

  useEffect(() => {
    if (selectedTab !== TABS.ANALYTICAL) {
      fetchPreviewImg(layerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  return (
    canDisplayPreview &&
    !disabledDownload &&
    !is3D && (
      <div className="image-download-preview-wrapper">
        <div className="image-download-preview-label">{t`Preview`}</div>
        {fetchingPreviewImage ? (
          <Loader />
        ) : previewUrl ? (
          <img alt="download preview" className="image-download-preview" src={previewUrl} />
        ) : (
          <div className="image-download-preview-placeholder" />
        )}
      </div>
    )
  );
};

const mapStoreToProps = (store) => ({
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  bounds: store.aoi.bounds ? store.aoi.bounds : store.mainMap.bounds,
  pixelBounds: store.mainMap.pixelBounds,
  enabledOverlaysId: store.mainMap.enabledOverlaysId,
  user: store.auth.user,
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
  speckleFilter: store.visualization.speckleFilter,
  orthorectification: store.visualization.orthorectification,
  backscatterCoeff: store.visualization.backscatterCoeff,
  minQa: store.visualization.minQa,
  selectedThemeId: store.themes.selectedThemeId,
  auth: store.auth,
  selectedTabIndex: store.tabs.selectedTabIndex,
  comparedLayers: store.compare.comparedLayers,
  comparedOpacity: store.compare.comparedOpacity,
  comparedClipping: store.compare.comparedClipping,
  aoiBounds: store.aoi.bounds,
  mapBounds: store.mainMap.bounds,
  is3D: store.mainMap.is3D,
});

export default connect(mapStoreToProps, null)(ImageDownloadPreview);
