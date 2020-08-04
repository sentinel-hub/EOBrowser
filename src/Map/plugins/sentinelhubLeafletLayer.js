import L from 'leaflet';
import { GridLayer, withLeaflet } from 'react-leaflet';
import isEqual from 'fast-deep-equal';
import {
  LayersFactory,
  ApiType,
  BBox,
  CRS_EPSG3857,
  MimeTypes,
  S1GRDAWSEULayer,
  S2L1CLayer,
  S2L2ALayer,
  S3SLSTRLayer,
  S3OLCILayer,
  S5PL2Layer,
  Landsat8AWSLayer,
  MODISLayer,
  MosaickingOrder,
  ProcessingDataFusionLayer,
  CancelToken,
  isCancelled,
} from '@sentinel-hub/sentinelhub-js';

import Sentinel1DataSourceHandler from '../../Tools/SearchPanel/dataSourceHandlers/Sentinel1DataSourceHandler';
import {
  S1_AWS_IW_VVVH,
  S1_AWS_IW_VV,
  S1_AWS_EW_HHHV,
  S1_AWS_EW_HH,
  S1_EW_SH,
  S1_EW,
  S1,
  S2L1C,
  S2L2A,
  S3SLSTR,
  S3OLCI,
  S5_O3,
  S5_NO2,
  S5_SO2,
  S5_CO,
  S5_HCHO,
  S5_CH4,
  S5_AER_AI,
  S5_CLOUD,
  S5_OTHER,
  MODIS,
  ESA_L5,
  ESA_L7,
  ESA_L8,
  AWS_L8L1C,
  ENVISAT_MERIS,
  checkIfCustom,
} from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { constructLayerFromDatasetId } from '../../junk/EOBCommon/utils/dataFusion';
import { isDataFusionEnabled } from '../../utils';

class SentinelHubLayer extends L.TileLayer {
  constructor(options) {
    super(options);
    const defaultOptions = {
      tileSize: 512,
      format: MimeTypes.JPEG,
      attribution: '&copy; <a href="https://www.sentinel-hub.com" target="_blank">Sentinel Hub</a>',
      preview: 2,
      transparent: true,
    };
    const {
      url,
      layers,
      evalscript,
      evalscripturl,
      dataFusion,
      fromTime,
      toTime,
      datasetId,
      customSelected,
      minQa,
      upsampling,
      downsampling,
    } = options;

    this.layer = this.createLayer(url, {
      datasetId: datasetId,
      evalscript: evalscript,
      evalscripturl: evalscripturl,
      dataFusion: dataFusion,
      fromTime: fromTime,
      toTime: toTime,
      layer: layers,
      customSelected: customSelected,
      minQa: minQa,
      upsampling: upsampling,
      downsampling: downsampling,
    });

    const mergedOptions = Object.assign(defaultOptions, options);
    L.setOptions(this, mergedOptions);
  }

  onAdd = map => {
    this._initContainer();
    this._crs = this.options.crs || map.options.crs;
    L.TileLayer.prototype.onAdd.call(this, map);
    map.on('move', this.updateClipping, this);
    this.updateClipping();
  };

  updateClipping = () => {
    if (!this._map || !this.clipping) return this;

    const [a, b] = this.clipping;
    const { min, max } = this._map.getPixelBounds();
    let p = { x: a * (max.x - min.x), y: 0 };
    let q = { x: b * (max.x - min.x), y: max.y - min.y };

    p = this._map.containerPointToLayerPoint(p);
    q = this._map.containerPointToLayerPoint(q);

    let e = this.getContainer();
    e.style['overflow'] = 'hidden';
    e.style['left'] = p.x + 'px';
    e.style['top'] = p.y + 'px';
    e.style['width'] = q.x - p.x + 'px';
    e.style['height'] = q.y - p.y + 'px';
    for (let f = e.firstChild; f; f = f.nextSibling) {
      if (f.style) {
        f.style['margin-top'] = -p.y + 'px';
        f.style['margin-left'] = -p.x + 'px';
      }
    }
  };

  createTile = (coords, done) => {
    const tile = L.DomUtil.create('img', 'leaflet-tile');
    tile.width = this.options.tileSize;
    tile.height = this.options.tileSize;
    const cancelToken = new CancelToken();
    tile.cancelToken = cancelToken;
    const tileSize = this.options.tileSize;
    const nwPoint = coords.multiplyBy(tileSize);
    const sePoint = nwPoint.add([tileSize, tileSize]);
    const nw = L.CRS.EPSG3857.project(this._map.unproject(nwPoint, coords.z));
    const se = L.CRS.EPSG3857.project(this._map.unproject(sePoint, coords.z));
    const bbox = new BBox(CRS_EPSG3857, nw.x, se.y, se.x, nw.y);

    const individualTileParams = { ...this.options, width: tileSize, height: tileSize };
    individualTileParams.bbox = bbox;

    this.layer.then(async layer => {
      let reqConfig = { cancelToken: cancelToken };

      if (this.options.accessToken) {
        reqConfig.authToken = this.options.accessToken;
      }

      if (!layer.evalscript && !layer.evalscriptUrl) {
        await layer.updateLayerFromServiceIfNeeded(reqConfig);
      }
      const apiType = layer.supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS;
      layer
        .getMap(individualTileParams, apiType, reqConfig)
        .then(blob => {
          tile.onload = function() {
            URL.revokeObjectURL(tile.src);
            done(null, tile);
          };
          const objectURL = URL.createObjectURL(blob);
          tile.src = objectURL;
        })
        .catch(function(error) {
          if (!isCancelled(error)) {
            console.error('There has been a problem with your fetch operation: ', error.message);
          }
          done(error, null);
        });
    });
    return tile;
  };

  setParams = params => {
    this.options = Object.assign(this.options, params);
    const {
      url,
      layers,
      evalscript,
      evalscripturl,
      dataFusion,
      datasetId,
      customSelected,
      minQa,
      upsampling,
      downsampling,
    } = this.options;
    this.layer = this.createLayer(url, {
      datasetId: datasetId,
      evalscript: evalscript,
      evalscripturl: evalscripturl,
      dataFusion: dataFusion,
      layer: layers,
      customSelected: customSelected,
      minQa: minQa,
      upsampling: upsampling,
      downsampling: downsampling,
    });

    this.redraw();
  };

  setClipping = clipping => {
    this.clipping = clipping;
    this.updateClipping();
  };

  createLayer = async (url, options) => {
    const { customSelected, dataFusion } = options;

    if (url && !customSelected) {
      return await this.createLayerFromService(url, options);
    }

    if (isDataFusionEnabled(dataFusion)) {
      return await this.createDataFusionLayer(url, options);
    }
    return await this.createCustomLayer(url, options);
  };

  createLayerFromService = async (url, options) => {
    const { layer: layerId, minQa, upsampling, downsampling } = options;
    let layer = await LayersFactory.makeLayer(url, layerId);
    if (layer.maxCloudCoverPercent !== undefined) {
      layer.maxCloudCoverPercent = 100;
    }
    if (minQa !== undefined) {
      layer.minQa = minQa;
    }
    if (upsampling) {
      layer.upsampling = upsampling;
    }
    if (downsampling) {
      layer.downsampling = downsampling;
    }
    return layer;
  };

  createDataFusionLayer = async (
    url,
    { datasetId, dataFusion, evalscript, evalscripturl, fromTime, toTime },
  ) => {
    // supplementary layers:
    const enabledDatasetsIds = Object.keys(dataFusion.supplementalDatasets).filter(
      supDatasetId => dataFusion.supplementalDatasets[supDatasetId].enabled,
    );
    const supplementalLayers = enabledDatasetsIds.map(supDatasetId => {
      const settings = dataFusion.supplementalDatasets[supDatasetId];
      const mosaickingOrder =
        settings && settings.mosaickingOrder ? settings.mosaickingOrder : MosaickingOrder.MOST_RECENT;
      const layer = constructLayerFromDatasetId(supDatasetId, mosaickingOrder);
      const timespan =
        settings.isCustomTimespan && settings.timespan ? settings.timespan : [fromTime, toTime];
      return {
        layer: layer,
        id: layer.dataset.shProcessingApiDatasourceAbbreviation.toLowerCase(),
        fromTime: timespan[0],
        toTime: timespan[1],
      };
    });

    // primary layer:
    const primaryLayer = await this.createCustomLayer(url, { datasetId, evalscript: '//VERSION=3 ---' });

    const dataFusionLayer = new ProcessingDataFusionLayer({
      evalscript: evalscript,
      evalscriptUrl: evalscripturl,
      layers: [
        {
          layer: primaryLayer,
          id: primaryLayer.dataset.shProcessingApiDatasourceAbbreviation.toLowerCase(),
          fromTime: fromTime,
          toTime: toTime,
        },
        ...supplementalLayers,
      ],
    });
    return dataFusionLayer;
  };

  createCustomLayer = async (
    url,
    { datasetId, evalscript, evalscripturl, minQa, upsampling, downsampling },
  ) => {
    switch (datasetId) {
      case S1_AWS_IW_VVVH:
      case S1_AWS_IW_VV:
      case S1_AWS_EW_HHHV:
      case S1_AWS_EW_HH:
        const { polarization, acquisitionMode, resolution } = Sentinel1DataSourceHandler.getDatasetParams(
          datasetId,
        );
        return await new S1GRDAWSEULayer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          polarization: polarization,
          acquisitionMode: acquisitionMode,
          resolution: resolution,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case S1:
      case S1_EW:
      case S1_EW_SH:
        return await this.createSH12Layer(url, evalscript, evalscripturl, upsampling, downsampling);
      case S2L1C:
        return await new S2L1CLayer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case S2L2A:
        return await new S2L2ALayer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case S3SLSTR:
        return await new S3SLSTRLayer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case S3OLCI:
        return await new S3OLCILayer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case S5_O3:
      case S5_NO2:
      case S5_SO2:
      case S5_CO:
      case S5_HCHO:
      case S5_CH4:
      case S5_AER_AI:
      case S5_CLOUD:
      case S5_OTHER:
        return await new S5PL2Layer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          minQa: minQa,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case ESA_L5:
      case ESA_L7:
      case ESA_L8:
        return await this.createSH12Layer(url, evalscript, evalscripturl, upsampling, downsampling);
      case AWS_L8L1C:
        return await new Landsat8AWSLayer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case MODIS:
        return await new MODISLayer({
          evalscript: evalscript,
          evalscriptUrl: evalscripturl,
          upsampling: upsampling,
          downsampling: downsampling,
        });
      case ENVISAT_MERIS:
        return await this.createSH12Layer(url, evalscript, evalscripturl, upsampling, downsampling);
      default:
        const isBYOC = !!checkIfCustom(datasetId);
        if (isBYOC) {
          return await this.createBYOCLayer(url, datasetId, evalscript, evalscripturl);
        }
        throw new Error("Dataset doesn't support evalscript");
    }
  };

  createBYOCLayer = (url, datasetId, evalscript, evalscripturl, upsampling, downsampling) => {
    return LayersFactory.makeLayers(url).then(async layers => {
      for (let layer of layers) {
        await layer.updateLayerFromServiceIfNeeded();
        if (layer.collectionId === datasetId) {
          layer.evalscript = evalscript;
          layer.evalscripturl = evalscripturl;
          layer.upsampling = upsampling;
          layer.downsampling = downsampling;
          return layer;
        }
      }
      return layers[0];
    });
  };

  createSH12Layer = (url, evalscript, evalscripturl, upsampling, downsampling) => {
    // BUG: we assume that there is only one dataset used within the instance
    return LayersFactory.makeLayers(url).then(layers => {
      let layer = layers[0];
      layer.evalscript = evalscript;
      layer.evalscripturl = evalscripturl;
      layer.upsampling = upsampling;
      layer.downsampling = downsampling;
      return layer;
    });
  };
}

class SentinelHubLayerComponent extends GridLayer {
  createLeafletElement(props) {
    const { progress, ...params } = props;
    const { leaflet: _l, ...options } = this.getOptions(params);
    const layer = new SentinelHubLayer(options);
    if (progress) {
      layer.on('loading', function() {
        progress.start();
        progress.inc();
      });

      layer.on('load', function() {
        progress.done();
      });
    }
    layer.on('tileunload', function(e) {
      e.tile.cancelToken.cancel();
    });
    return layer;
  }

  updateLeafletElement(fromProps, toProps) {
    super.updateLeafletElement(fromProps, toProps);
    const { ...prevProps } = fromProps;
    const { ...prevParams } = this.getOptions(prevProps);
    const { ...props } = toProps;
    const { ...params } = this.getOptions(props);

    if (!isEqual(params, prevParams)) {
      this.leafletElement.setParams(params);
    }
    if (fromProps.opacity !== toProps.opacity) {
      this.leafletElement.setOpacity(toProps.opacity);
    }
    if (fromProps.clipping !== toProps.clipping) {
      this.leafletElement.setClipping(toProps.clipping);
    }
  }

  getOptions(params) {
    let options = {};

    if (params.url) {
      options.url = params.url;
    }
    if (params.datasetId) {
      options.datasetId = params.datasetId;
    }
    if (params.layers) {
      options.layers = params.layers;
    }
    if (params.fromTime) {
      options.fromTime = params.fromTime;
    } else {
      options.fromTime = null;
    }
    if (params.toTime) {
      options.toTime = params.toTime;
    }
    if (params.tileSize) {
      options.tileSize = params.tileSize;
    }
    if (params.format) {
      options.format = MimeTypes[params.format];
    }
    if (params.customSelected && (params.evalscript || params.evalscripturl)) {
      options.customSelected = true;
      if (params.evalscript) {
        options.evalscript = params.evalscript;
        options.evalscripturl = null;
      }
      if (params.evalscripturl) {
        options.evalscript = null;
        options.evalscripturl = params.evalscripturl;
      }
      if (params.dataFusion) {
        options.dataFusion = params.dataFusion;
      }
    } else {
      options.customSelected = false;
    }

    if (params.minZoom) {
      options.minZoom = params.minZoom;
    }
    if (params.maxZoom && params.allowOverZoomBy) {
      options.maxNativeZoom = params.maxZoom;
      options.maxZoom = params.maxZoom + params.allowOverZoomBy;
    } else if (params.maxZoom) {
      options.maxNativeZoom = params.maxZoom;
      options.maxZoom = params.maxZoom;
    }

    if (params.pane || params.leaflet.pane) {
      options.pane = params.pane || params.leaflet.pane;
    }

    const effects = {};
    if (params.gainEffect !== undefined) {
      effects.gain = params.gainEffect;
    }
    if (params.gammaEffect !== undefined) {
      effects.gamma = params.gammaEffect;
    }
    if (params.redRangeEffect !== undefined) {
      effects.redRange = { from: params.redRangeEffect[0], to: params.redRangeEffect[1] };
    }
    if (params.greenRangeEffect !== undefined) {
      effects.greenRange = { from: params.greenRangeEffect[0], to: params.greenRangeEffect[1] };
    }
    if (params.blueRangeEffect !== undefined) {
      effects.blueRange = { from: params.blueRangeEffect[0], to: params.blueRangeEffect[1] };
    }
    if (Object.keys(effects).length) {
      options.effects = effects;
    }

    if (params.minQa !== undefined) {
      options.minQa = params.minQa;
    } else {
      options.minQa = null;
    }

    if (params.upsampling) {
      options.upsampling = params.upsampling;
    } else {
      options.upsampling = null;
    }

    if (params.downsampling) {
      options.downsampling = params.downsampling;
    } else {
      options.downsampling = null;
    }

    if (params.showlogo !== undefined) {
      options.showlogo = params.showlogo;
    } else {
      options.showlogo = false;
    }

    if (params.accessToken) {
      options.accessToken = params.accessToken;
    }

    return options;
  }
}
export default withLeaflet(SentinelHubLayerComponent);
