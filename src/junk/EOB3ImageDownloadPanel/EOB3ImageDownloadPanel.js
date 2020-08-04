import React, { Component } from 'react';
import URI from 'urijs';
import Terraform from 'terraformer';
import WKT from 'terraformer-wkt-parser';
import cloneDeep from 'lodash.clonedeep';
import values from 'lodash.values';
import { setAuthToken, ApiType } from '@sentinel-hub/sentinelhub-js';
import 'react-toggle/style.css';
import { t } from 'ttag';

import { getPixelSize, getMapDOMSize, calcBboxFromXY } from '../EOBCommon/utils/coords';
import { EOBButton } from '../EOBCommon/EOBButton/EOBButton';
import { IMAGE_FORMATS } from './utils/IMAGE_FORMATS';
import { AVAILABLE_CRS, RESOLUTION_DIVISORS } from './utils/consts';
import { downloadZipIt, downloadOne, CUSTOM_LAYER_LABEL } from './utils/downloadZip';
import { getBaseUrlsForImageFormat } from './utils/baseUrls';
import { formatTimeInterval } from '../EOBCommon/utils/timespanHelpers';
import { isCustomPreset } from '../EOBCommon/utils/utils';
import { isDataFusionEnabled } from '../../utils';
import AnalyticalForm from './AnalyticalForm';
import BasicForm from './BasicForm';
import PrintForm from './PrintForm';

import './ImageDownloadPanel.scss';

/*
API type of the requests depends on the datasource and image format:
  1. WMS only datasources (Landsat-5, 7, ...):
    - ApiType WMS + basic evalscript: all formats
  2. Datasources that support both WMS and Processing API:
    - ApiType WMS + basic evalscript: TIFF, KMZ (using EOB2 instances with V1/V2 evalscripts)
    - ApiType WMS + dataProduct: when layer has dataProduct, EOB3 determines if layer should use WMS and passes the info to EOB3ImageDownloadPanel
    - ApiType PROCESSING + V3 evalscript: other formats
*/

const TABS = {
  BASIC: 'basic',
  ANALYTICAL: 'analytical',
  PRINT: 'print',
};

const INITIAL_FORM_DATA = {
  showLogo: true,
  showCaptions: true,
  addMapOverlays: true,
  tabSelected: TABS.BASIC,
  imageFormat: IMAGE_FORMATS[0].value,
  resolutionDivisor: RESOLUTION_DIVISORS.find(r => r.text === 'MEDIUM').value,
  selectedCrs: AVAILABLE_CRS[0].value,
  userDescription: '',
  showLegend: false,
  imageWidthInches: 33.1,
  imageHeightInches: 46.8,
  resolutionDpi: 300,
};
// remember the state of form selections even when component is unmounted:
let suggestedFormData = INITIAL_FORM_DATA;

export class EOB3ImageDownloadPanel extends Component {
  constructor(props) {
    super(props);
    const { channels, presets, datasource, preset, instances } = props;
    const mChannels = (channels[datasource] || []).map(obj => ({
      value: obj.name,
      text: obj.name,
    }));
    const mPresets = Object.keys(presets[datasource]).map(key => ({
      value: presets[datasource][key].id,
      text: presets[datasource][key].name,
      apiType: presets[datasource][key].apiType,
    }));
    const activeInstance = instances.find(ins => ins.name === datasource);
    this.state = {
      isDownloading: false,
      layers: [...mChannels, ...mPresets],
      mChannels: mChannels,
      mPresets: mPresets,
      downloadLayers: { [isCustomPreset(preset) ? 'custom' : preset]: true },
      isIPT: activeInstance.baseUrls.WMS.includes('eocloud'),
      formData: suggestedFormData,
      legendData: props.legendDataFromPreset,
    };
    if (isCustomPreset(preset)) {
      this.state.layers.push({ value: 'custom', text: CUSTOM_LAYER_LABEL });
    }
    setAuthToken(this.props.authToken);
  }

  componentDidUpdate(prevProps) {
    if (this.props.authToken !== prevProps.authToken) {
      setAuthToken(this.props.authToken);
    }
  }

  componentWillUnmount() {
    suggestedFormData = this.state.formData;
  }

  getFirstPreset = () => {
    const { presets, datasource } = this.props;
    const first = presets[datasource][0];
    return first.id;
  };

  updateFormData = (key, value) => {
    this.setState(oldState => ({
      formData: {
        ...oldState.formData,
        [key]: value,
      },
    }));
  };

  constructV3Evalscript(layer, datasetId, bands) {
    let factor;
    if (datasetId.startsWith('CUSTOM')) {
      // This is a hack to make raw bands for BYOC layers display anything
      // Service stretches values from 0-1 to 0-255, but if our BYOC bands can be UINT8 or UINT16
      // https://docs.sentinel-hub.com/api/latest/#/Evalscript/V3/README?id=sampletype
      const sampleType = bands[datasetId][0].sampleType;
      if (sampleType === 'UINT8') {
        factor = 1.0 / 2 ** 8;
      }
      if (sampleType === 'UINT16') {
        factor = 1.0 / 2 ** 16;
      }
    }
    factor = factor ? `${factor} *` : '';
    return `//VERSION=3
function setup() {
  return {
    input: ["${layer}", "dataMask"],
    output: { bands: 4 }
  };
}

function evaluatePixel(sample) {
  return [${new Array(3).fill(`${factor} sample.` + layer).join(',')}, sample.dataMask ];}`;
  }

  generateImageLink = (
    tabSelected,
    imageFormat,
    resolutionDivisor,
    selectedCrs,
    printImageW,
    printImageH,
  ) => {
    const {
      evalscriptoverrides,
      evalSource,
      datasource,
      preset,
      evalscript,
      evalscripturl,
      atmFilter,
      layers,
      time,
      instances,
      mapBounds,
      aoiBounds,
      presets,
      nativeRes,
    } = this.props;
    const isEvalUrl = Boolean(evalscripturl);
    const imageExt = IMAGE_FORMATS.find(f => f.value === imageFormat).ext;
    const isJp2 = imageFormat.includes('jp2');
    const isKMZ = imageFormat.includes('application');
    const isPngJpg = this.isPngOrJpg(imageFormat);

    const { width: imagePartW, height: imagePartH } = getPixelSize(mapBounds, aoiBounds, nativeRes);
    const isAnalytical = tabSelected === TABS.ANALYTICAL;

    const activeLayer = instances.find(inst => inst.name === datasource);
    // We have to request float32 and uint16 tiffs with old EOB2 instances, as WMS always returns 8-bit when using a basic/V3 evalscript
    // For the rest, we should use instances with V3 evalscript
    const baseUrl = getBaseUrlsForImageFormat(activeLayer.baseUrls.WMS, imageFormat);
    const url = new URI(`${baseUrl}?SERVICE=WMS&REQUEST=GetMap`);
    // build url
    url.addQuery('SHOWLOGO', false);
    url.addQuery('MAXCC', 100);
    url.addQuery('TIME', time.includes('/') ? time : `${time}/${time}`);
    url.addQuery('CRS', selectedCrs);
    url.addQuery('FORMAT', imageFormat);

    if (isAnalytical && aoiBounds) {
      if (selectedCrs === 'EPSG:4326') {
        const wgsGeom = new Terraform.Primitive(cloneDeep(aoiBounds.geometry));
        url.addQuery('GEOMETRY', WKT.convert(wgsGeom));
      } else {
        const mercGeom = new Terraform.Primitive(cloneDeep(aoiBounds.geometry)).toMercator();
        url.addQuery('GEOMETRY', WKT.convert(mercGeom));
      }
    } else {
      url.addQuery('BBOX', this.getBbox(resolutionDivisor, selectedCrs));
    }

    atmFilter && atmFilter !== 'null' && url.addQuery('ATMFILTER', atmFilter);

    url.addQuery('EVALSCRIPTOVERRIDES', btoa(evalscriptoverrides));

    if (isCustomPreset(preset)) {
      if (evalscripturl !== '' && isEvalUrl) {
        url.addQuery('EVALSCRIPTURL', evalscripturl);
        url.removeQuery('EVALSCRIPT');
        url.removeQuery('EVALSCRIPTOVERRIDES');
      } else {
        url.addQuery('EVALSCRIPT', evalscript);
      }
      url.addQuery('EVALSOURCE', evalSource);
    }
    url.addQuery('LAYERS', isCustomPreset(preset) ? presets[datasource][0].id : preset);

    if (datasource.includes('EW') && preset.includes('NON_ORTHO')) {
      url.addQuery('ORTHORECTIFY', false);
    }
    const mapDOMSize = getMapDOMSize();

    let imageSizeW;
    let imageSizeH;
    switch (tabSelected) {
      case TABS.ANALYTICAL:
        imageSizeW = Math.round(imagePartW / resolutionDivisor);
        imageSizeH = Math.round(imagePartH / resolutionDivisor);
        break;
      case TABS.PRINT:
        imageSizeW = printImageW;
        imageSizeH = printImageH;
        break;
      case TABS.BASIC:
      default:
        imageSizeW = mapDOMSize.width;
        imageSizeH = mapDOMSize.height;
        break;
    }

    url.addQuery('WIDTH', imageSizeW);
    url.addQuery('HEIGHT', imageSizeH);
    if (isPngJpg || isKMZ) {
      url.addQuery('NICENAME', `${datasource} from ${formatTimeInterval(time)}.${isKMZ ? 'kmz' : imageExt}`);
      url.addQuery('TRANSPARENT', imageFormat.includes('png') ? 0 : 1);
      url.addQuery('BGCOLOR', '00000000');
    } else {
      url.addQuery('NICENAME', `${datasource} from ${formatTimeInterval(time)}.${isJp2 ? 'jp2' : 'tiff'}`);
      url.addQuery(
        'COVERAGE',
        isCustomPreset(preset[datasource]) ? values(layers[datasource]).join(',') : preset[datasource],
      );
    }
    const finalUrl = url
      .toString()
      .replace(/%2f/gi, '/')
      .replace(/%2c/gi, ',');
    return {
      imgWmsUrl: finalUrl,
      imageW: imageSizeW,
      imageH: imageSizeH,
    };
  };

  getBbox = (factor, selectedCrs) => {
    const { mapBounds, aoiBounds, lat, lng, zoom, nativeRes } = this.props;
    const bbox =
      selectedCrs === 'EPSG:4326'
        ? mapBounds
            .toBBoxString()
            .split(',')
            .reverse()
            .join(',')
        : calcBboxFromXY({ lat, lng, zoom, factor, mapBounds, aoiBounds, nativeRes }).join(',');
    return bbox;
  };

  downloadImage = () => {
    const {
      evalSource,
      name,
      time,
      datasource,
      presetArg,
      presets,
      instances,
      mapBounds,
      drawMapOverlays,
      getLegendImageURL,
      scaleBar,
      defaultApiType,
      aoiBounds,
      dataFusion: dataFusionOriginal,
      effects,
    } = this.props;
    const {
      formData: {
        showLogo,
        tabSelected,
        showCaptions,
        userDescription,
        addMapOverlays,
        showLegend,
        imageWidthInches,
        imageHeightInches,
        resolutionDpi,
        imageFormat,
      },
    } = this.state;

    // dataFusion should only be taken into account if it really is enabled, otherwise we set
    // it to null for easier checks later:
    const dataFusion =
      isCustomPreset(this.props.preset) && isDataFusionEnabled(dataFusionOriginal)
        ? dataFusionOriginal
        : null;

    const { resolutionDivisor, selectedCrs } =
      tabSelected === TABS.ANALYTICAL ? this.state.formData : INITIAL_FORM_DATA;

    // with print mode, the size of the image is already determined via form inputs, so we must pass that information on:
    const printImageW = tabSelected === TABS.PRINT ? Math.round(imageWidthInches * resolutionDpi) : 0;
    const printImageH = tabSelected === TABS.PRINT ? Math.round(imageHeightInches * resolutionDpi) : 0;
    const { imgWmsUrl, imageW, imageH } = this.generateImageLink(
      tabSelected,
      imageFormat,
      resolutionDivisor,
      selectedCrs,
      printImageW,
      printImageH,
    );
    this.setState({ isDownloading: true });
    const layerArr =
      tabSelected === TABS.ANALYTICAL
        ? Object.keys(this.state.downloadLayers).filter(key => this.state.downloadLayers[key])
        : [isCustomPreset(this.props.preset) ? 'custom' : this.props.preset];

    // layerId and raw band name can be the same. This will ensure we fetch both
    let hasDuplicateRawBandBeenCreated = {};

    let layerUrls = layerArr
      .filter(l => l)
      .map(layer => {
        const visualisation =
          layer !== 'custom'
            ? this.state.mPresets.find(l => l.value === layer)
            : this.state.layers.find(l => l.value === layer);
        const rawBand = this.state.mChannels.find(l => l.value === layer);
        let fullLayer,
          isRawBand = false;

        if (visualisation && rawBand) {
          hasDuplicateRawBandBeenCreated[layer] = true;
          fullLayer = rawBand;
          isRawBand = true;
        } else if (rawBand) {
          fullLayer = rawBand;
          isRawBand = true;
        } else if (visualisation) {
          fullLayer = visualisation;
        }

        const oldImgUrl = new URI(imgWmsUrl);
        let rawBandApiType;
        if (isRawBand) {
          if (this.isPngOrJpg(imageFormat)) {
            rawBandApiType = defaultApiType;
          } else {
            // KMZs and TIFFs have to be downloaded with WMS. Processing can only return 8-bit if the value is not set in evalscript
            rawBandApiType = ApiType.WMS;
          }

          oldImgUrl
            .setQuery('LAYERS', this.getFirstPreset())
            .setQuery('EVALSOURCE', evalSource)
            .setQuery(
              'EVALSCRIPT',
              rawBandApiType === ApiType.WMS
                ? btoa(`return [${layer}];`)
                : btoa(this.constructV3Evalscript(layer, this.props.datasource, this.props.channels)),
            );
        } else if (layer !== 'custom') {
          oldImgUrl.setQuery('LAYERS', layer);
          oldImgUrl.removeQuery('EVALSCRIPT');
        }

        const presetName = isRawBand ? `${fullLayer.text} (Raw)` : fullLayer.text;
        const apiType = isRawBand ? rawBandApiType : fullLayer.apiType || defaultApiType;

        return {
          src: oldImgUrl.toString(),
          preset: presetName,
          legendData: this.state.legendData,
          apiType: apiType,
        };
      });

    for (let layerId of Object.keys(hasDuplicateRawBandBeenCreated)) {
      // We add urls for layerIds, which have a raw band with the same name
      if (hasDuplicateRawBandBeenCreated[layerId]) {
        const visualisation = this.state.mPresets.find(l => l.value === layerId);
        const oldImgUrl = new URI(imgWmsUrl);
        layerUrls.push({
          src: oldImgUrl.toString(),
          preset: visualisation.text,
          legendData: this.state.legendData,
        });
      }
    }

    if (tabSelected === TABS.ANALYTICAL) {
      this.setState({ isDownloading: true });
      downloadZipIt(
        layerUrls,
        imageFormat,
        imgWmsUrl,
        imageW,
        imageH,
        name,
        time,
        datasource,
        presetArg,
        presets,
        instances,
        mapBounds,
        aoiBounds,
        dataFusion,
        effects,
        showLogo,
      )
        .then(() => this.setState({ isDownloading: false }))
        .catch(msg => this.setState({ error: msg, isDownloading: false }));
    } else {
      // NOTE: this is *always* true, this check can be removed:
      if (
        showCaptions ||
        addMapOverlays ||
        (this.state.legendData && showLegend) ||
        tabSelected === TABS.PRINT ||
        tabSelected === TABS.BASIC
      ) {
        downloadOne(
          layerUrls[0],
          imageFormat,
          imgWmsUrl,
          imageW,
          imageH,
          userDescription,
          showCaptions,
          addMapOverlays && tabSelected !== TABS.PRINT, // disable map overlays with 'print mode' because it is too slow
          this.state.legendData && showLegend,
          name,
          time,
          datasource,
          presetArg,
          presets,
          instances,
          mapBounds,
          drawMapOverlays,
          getLegendImageURL,
          scaleBar,
          dataFusion,
          effects,
        )
          .then(() => {
            this.setState({ isDownloading: false });
          })
          .catch(err => {
            this.setState({ isDownloading: false });
          });
      }
    }
  };

  isPngOrJpg = imageFormat => {
    return ['image/png', 'image/jpeg'].includes(imageFormat);
  };

  isAllFalse = () => {
    const { downloadLayers } = this.state;
    return Object.keys(downloadLayers).find(key => this.state.downloadLayers[key]);
  };

  updateLayer = (key, checked) => {
    this.setState({
      downloadLayers: { ...this.state.downloadLayers, [key]: checked },
    });
  };

  renderImageSize = resolutionDivisor => {
    const { mapBounds, aoiBounds, nativeRes } = this.props;
    const { height, width } = getPixelSize(mapBounds, aoiBounds, nativeRes);
    return `${Math.floor(width / resolutionDivisor)} x ${Math.floor(height / resolutionDivisor)} px`;
  };

  renderCRSResolution = (resolutionDivisor, crs) => {
    const { mapBounds, aoiBounds, nativeRes } = this.props;
    const { width, height, res } = getPixelSize(mapBounds, aoiBounds, nativeRes);

    // mercator - display projected resolution in m/px:
    if (crs === 'EPSG:3857') {
      const projectedResolution = res * resolutionDivisor;
      return t`Projected resolution: ${projectedResolution} m/px`;
    }

    // wgs84 - display degrees / px:
    const bounds = aoiBounds ? aoiBounds.bounds : mapBounds;
    const resLat = ((bounds._northEast.lat - bounds._southWest.lat) * resolutionDivisor) / height;
    const resLng = ((bounds._northEast.lng - bounds._southWest.lng) * resolutionDivisor) / width;
    const resLat60 = (resLat * 60).toFixed(1);
    const resLat3600 = (resLat * 3600.0).toFixed(1);
    const resLng60 = (resLng * 60).toFixed(1);
    const resLng3600 = (resLng * 3600.0).toFixed(1);
    const prettyResLat = resLat * 60.0 > 1.0 ? `${resLat60}` + t`min/px` : `${resLat3600}` + t`sec/px`;
    const prettyResLng = resLng * 60.0 > 1.0 ? `${resLng60}` + t`min/px` : `${resLng3600}` + t`sec/px`;
    return (
      <div className="wgs84-resolution">
        <div>{t`Resolution`}:</div>
        <div className="latlng">
          {t`lat.`}: {resLat.toFixed(7)} {t`deg/px`} ({prettyResLat})
        </div>
        <div className="latlng">
          {t`long.`}: {resLng.toFixed(7)} {t`deg/px`} ({prettyResLng})
        </div>
      </div>
    );
  };

  render() {
    const {
      isIPT,
      mChannels,
      mPresets,
      downloadLayers,
      error,
      isDownloading,
      formData: {
        showLogo,
        showCaptions,
        addMapOverlays,
        tabSelected,
        imageFormat,
        resolutionDivisor,
        selectedCrs,
        userDescription,
        showLegend,
        imageWidthInches,
        imageHeightInches,
        resolutionDpi,
      },
      legendData,
    } = this.state;

    const { onErrorMessage, isLoggedIn, preset } = this.props;

    return (
      <div className="image-download-panel">
        <div className="modeSelection">
          <EOBButton
            text={t`Basic`}
            className={`secondary ${tabSelected === TABS.BASIC ? 'selected' : ''}`}
            onClick={() => this.updateFormData('tabSelected', TABS.BASIC)}
          />

          <EOBButton
            text={t`Analytical`}
            className={`secondary ${tabSelected === TABS.ANALYTICAL ? 'selected' : ''}`}
            onClick={() => {
              if (!isLoggedIn) {
                onErrorMessage(t`Please log in to use this feature`);
                return;
              }
              this.updateFormData('tabSelected', TABS.ANALYTICAL);
            }}
          />

          <EOBButton
            text={t`High-res print`}
            className={`secondary ${tabSelected === TABS.PRINT ? 'selected ' : ''}`}
            onClick={() => {
              if (!isLoggedIn) {
                onErrorMessage('Please log in to use this feature');
                return;
              }
              this.updateFormData('tabSelected', TABS.PRINT);
            }}
          />
        </div>
        <h3>{t`Image download`}</h3>
        <div style={{ clear: 'both', height: 10 }} />
        {tabSelected === TABS.ANALYTICAL ? (
          <AnalyticalForm
            imageFormat={imageFormat}
            downloadLayers={downloadLayers}
            isIPT={isIPT}
            resolutionDivisor={resolutionDivisor}
            selectedCrs={selectedCrs}
            mPresets={mPresets}
            mChannels={mChannels}
            willGeneratePngOrJpg={this.isPngOrJpg(imageFormat)}
            showLogo={showLogo}
            renderImageSize={this.renderImageSize}
            updateFormData={this.updateFormData}
            renderCRSResolution={this.renderCRSResolution}
            updateLayer={this.updateLayer}
            resolutions={RESOLUTION_DIVISORS}
            availableCrs={AVAILABLE_CRS}
            onErrorMessage={onErrorMessage}
            preset={preset}
          />
        ) : tabSelected === TABS.PRINT ? (
          <PrintForm
            addMapOverlays={addMapOverlays}
            updateFormData={this.updateFormData}
            hasLegendData={Boolean(legendData)}
            showCaptions={showCaptions}
            showLegend={showLegend}
            userDescription={userDescription}
            imageWidthInches={imageWidthInches}
            imageHeightInches={imageHeightInches}
            resolutionDpi={resolutionDpi}
            imageFormat={imageFormat}
            onErrorMessage={onErrorMessage}
          />
        ) : (
          <BasicForm
            addingMapOverlaysPossible={true}
            addMapOverlays={addMapOverlays}
            updateFormData={this.updateFormData}
            hasLegendData={Boolean(legendData)}
            showCaptions={showCaptions}
            showLegend={showLegend}
            userDescription={userDescription}
            onErrorMessage={onErrorMessage}
            imageFormat={imageFormat}
          />
        )}
        <div className="submit-btn">
          <EOBButton
            fluid
            loading={isDownloading}
            disabled={isDownloading || (!this.isAllFalse() && tabSelected === TABS.ANALYTICAL)}
            onClick={this.downloadImage}
            icon="download"
            text={t`Download`}
          />
        </div>

        {error ? <p style={{ color: '#b72c2c' }}>{error.toString()}</p> : null}
      </div>
    );
  }
}
