import React, { useState } from 'react';
import { CRS_EPSG4326, CRS_EPSG3857 } from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import BasicForm from './BasicForm';
import AnalyticalForm from './AnalyticalForm';
import PrintForm from './PrintForm';
import { IMAGE_FORMATS } from './consts';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { getDimensionsInMeters } from './ImageDownload.utils';
import store, { notificationSlice } from '../../store';

export const TABS = {
  BASIC: 'basic',
  ANALYTICAL: 'analytical',
  PRINT: 'print',
};

export function ImageDownloadForms(props) {
  const [basicFormState, setBasicFormState] = useState({
    showLegend: false,
    showCaptions: true,
    userDescription: '',
    addMapOverlays: true,
    imageFormat: IMAGE_FORMATS.JPG,
  });
  const [analyticalFormState, setAnalyticalFormState] = useState({
    imageFormat: IMAGE_FORMATS.JPG,
    selectedCrs: props.hasAOI ? CRS_EPSG4326.authId : CRS_EPSG3857.authId,
    showLogo: props.allowShowLogoAnalytical,
    resolutionDivisor: 2,
    selectedLayers: props.currentLayerId ? [props.currentLayerId] : [],
    selectedBands: [],
    customSelected: props.isCurrentLayerCustom,
    addDataMask: false,
    clipExtraBandsTiff: true,
  });
  const [printFormState, setPrintFormState] = useState({
    showCaptions: true,
    showLegend: false,
    userDescription: '',
    imageFormat: IMAGE_FORMATS.JPG,
    resolutionDpi: 300,
    imageWidthInches: 33.1,
  });

  function updateSelectedLayers(layers) {
    setAnalyticalFormState({
      ...analyticalFormState,
      selectedLayers: layers,
    });
  }

  function updateSelectedBands(bands) {
    setAnalyticalFormState({
      ...analyticalFormState,
      selectedBands: bands,
    });
  }

  function updateFormData(field, newValue, setState) {
    setState((prevState) => ({
      ...prevState,
      [field]: newValue,
    }));
  }

  function onErrorMessage(message) {
    store.dispatch(notificationSlice.actions.displayError(message));
  }

  function renderImageSize(resolutionDivisor) {
    const { defaultWidth, defaultHeight } = props;
    return `${Math.floor(defaultWidth / resolutionDivisor)} x ${Math.floor(
      defaultHeight / resolutionDivisor,
    )} px`;
  }

  function renderCRSResolution(resolutionDivisor, selectedCrs) {
    const { bounds, defaultWidth, defaultHeight } = props;
    if (selectedCrs === CRS_EPSG4326.authId) {
      const widthDegrees = bounds.getEast() - bounds.getWest();
      const heightDegrees = bounds.getNorth() - bounds.getSouth();
      const resLat = (heightDegrees * resolutionDivisor) / defaultHeight;
      const resLng = (widthDegrees * resolutionDivisor) / defaultWidth;
      const resLatInMinAndSec =
        resLat * 60.0 > 1.0
          ? `${(resLat * 60).toFixed(1)}` + t`min/px`
          : `${(resLat * 3600).toFixed(1)}` + t`sec/px`;
      const resLngInMinAndSec =
        resLng * 60.0 > 1.0
          ? `${(resLng * 60).toFixed(1)}` + t`min/px`
          : `${(resLng * 3600).toFixed(1)}` + t`sec/px`;
      return (
        <div className="wgs84-resolution">
          <div>{t`Resolution`}:</div>
          <div className="lat-lng">
            {t`lat.`}: {resLat.toFixed(7)} {t`deg/px`} ({resLatInMinAndSec})
          </div>
          <div className="lat-lng">
            {t`long.`}: {resLng.toFixed(7)} {t`deg/px`} ({resLngInMinAndSec})
          </div>
        </div>
      );
    }
    const { width } = getDimensionsInMeters(bounds);
    const resolution = (width * resolutionDivisor) / defaultWidth;
    const formattedResolution = resolution >= 2 ? Math.floor(resolution) : resolution.toFixed(1);
    return t`Projected resolution: ${formattedResolution} m/px`;
  }

  function onDownloadImage(selectedTab) {
    if (selectedTab === TABS.BASIC) {
      props.onDownloadBasic(basicFormState);
    }
    if (selectedTab === TABS.ANALYTICAL) {
      props.onDownloadAnalytical(analyticalFormState);
    }
    if (selectedTab === TABS.PRINT) {
      props.onDownloadPrint(printFormState);
    }
  }

  function isKMZ(imageFormat) {
    return imageFormat === IMAGE_FORMATS.KMZ_JPG || imageFormat === IMAGE_FORMATS.KMZ_PNG;
  }

  function isJPGorPNG(imageFormat) {
    return imageFormat === IMAGE_FORMATS.JPG || imageFormat === IMAGE_FORMATS.PNG;
  }

  function displayDataFusionWarning() {
    const { customSelected, imageFormat } = analyticalFormState;
    if (
      selectedTab === TABS.ANALYTICAL &&
      props.isDataFusionEnabled &&
      customSelected &&
      !isJPGorPNG(imageFormat)
    ) {
      if (isKMZ(imageFormat)) {
        return (
          <div className="image-download-warning">
            <i className="fa fa-exclamation-circle" />
            {t`Error: Data fusion does not support KMZ/JPG and KMZ/PNG formats.`}
          </div>
        );
      }
    }
    return null;
  }

  function displayEffectsWarning() {
    const { imageFormat } = analyticalFormState;
    if (selectedTab === TABS.ANALYTICAL && props.areEffectsSet && !isJPGorPNG(imageFormat)) {
      return (
        <div className="image-download-warning">
          <i className="fa fa-exclamation-circle" />
          {t`Error: You can only download visualization with effects in JPEG or PNG formats.`}
        </div>
      );
    }
    return null;
  }

  const {
    selectedTab,
    hasLegendData,
    loading,
    allLayers,
    allBands,
    isCurrentLayerCustom,
    supportedImageFormats,
    addingMapOverlaysPossible,
    defaultWidth,
    defaultHeight,
    isDataFusionEnabled,
    allowShowLogoAnalytical,
    areEffectsSet,
    hasAOI,
  } = props;

  const isAnalyticalModeAndNothingSelected =
    selectedTab === TABS.ANALYTICAL &&
    !analyticalFormState.customSelected &&
    analyticalFormState.selectedLayers.length === 0 &&
    analyticalFormState.selectedBands.length === 0;

  const isAnalyticalModeAndLayersNotLoaded = selectedTab === TABS.ANALYTICAL && allLayers.length === 0;

  const isDataFusionAndKMZSelected =
    selectedTab === TABS.ANALYTICAL &&
    isDataFusionEnabled &&
    analyticalFormState.customSelected &&
    isKMZ(analyticalFormState.imageFormat);

  const areEffectsSetAndFormatNotJpgPng =
    selectedTab === TABS.ANALYTICAL && areEffectsSet && !isJPGorPNG(analyticalFormState.imageFormat);

  return (
    <div className="image-download-forms">
      {displayDataFusionWarning()}
      {displayEffectsWarning()}

      <h3>{t`Image download`}</h3>

      {selectedTab === TABS.BASIC && (
        <BasicForm
          {...basicFormState}
          updateFormData={(field, newValue) => updateFormData(field, newValue, setBasicFormState)}
          addingMapOverlaysPossible={addingMapOverlaysPossible}
          hasLegendData={hasLegendData}
          onErrorMessage={onErrorMessage}
        />
      )}
      {selectedTab === TABS.ANALYTICAL && (
        <AnalyticalForm
          {...analyticalFormState}
          updateFormData={(field, newValue) => updateFormData(field, newValue, setAnalyticalFormState)}
          updateSelectedLayers={updateSelectedLayers}
          updateSelectedBands={updateSelectedBands}
          allLayers={allLayers}
          allBands={allBands}
          isCurrentLayerCustom={isCurrentLayerCustom}
          renderImageSize={renderImageSize}
          renderCRSResolution={renderCRSResolution}
          onErrorMessage={onErrorMessage}
          supportedImageFormats={supportedImageFormats}
          allowShowLogoAnalytical={allowShowLogoAnalytical}
          hasAOI={hasAOI}
        />
      )}
      {selectedTab === TABS.PRINT && (
        <PrintForm
          {...printFormState}
          updateFormData={(field, newValue) => updateFormData(field, newValue, setPrintFormState)}
          addingMapOverlaysPossible={addingMapOverlaysPossible}
          hasLegendData={hasLegendData}
          onErrorMessage={onErrorMessage}
          heightToWidthRatio={defaultHeight / defaultWidth}
        />
      )}
      <EOBButton
        fluid
        loading={loading}
        disabled={
          loading ||
          isAnalyticalModeAndNothingSelected ||
          isDataFusionAndKMZSelected ||
          isAnalyticalModeAndLayersNotLoaded ||
          areEffectsSetAndFormatNotJpgPng
        }
        onClick={() => onDownloadImage(selectedTab)}
        icon="download"
        text={t`Download`}
      />
    </div>
  );
}
