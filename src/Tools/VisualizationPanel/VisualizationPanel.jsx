import React, { Component } from 'react';
import moment from 'moment';
import axios from 'axios';
import { connect } from 'react-redux';
import { EOBEffectsPanel } from '../../junk/EOBEffectsPanel/EOBEffectsPanel';
import EOBAdvancedHolder, {
  CUSTOM_VISUALIZATION_URL_ROUTES,
} from '../../junk/EOBAdvancedHolder/EOBAdvancedHolder';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import {
  LayersFactory,
  BBox,
  CRS_EPSG4326,
  Interpolator,
  BackscatterCoeff,
  DEMInstanceTypeOrthorectification,
} from '@sentinel-hub/sentinelhub-js';
import Rodal from 'rodal';
import { t } from 'ttag';
import { withRouter } from 'react-router-dom';
import proj4 from 'proj4';

import store, {
  mainMapSlice,
  visualizationSlice,
  compareLayersSlice,
  tabsSlice,
  notificationSlice,
} from '../../store';
import Visualizations from './Visualizations';
import Loader from '../../Loader/Loader';
import './VisualizationPanel.scss';
import { sortLayers, haveEffectsChangedFromDefault } from './VisualizationPanel.utils';
import { getDataSourceHandler, getDatasetLabel } from '../SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { VisualizationPanelHeaderActions } from './VisualizationPanelHeaderActions';
import {
  handleFathomTrackEvent,
  constructErrorMessage,
  parseEvalscriptBands,
  parseIndexEvalscript,
  isKnownTheme,
} from '../../utils';
import ZoomInNotification from './ZoomInNotification';
import { getAppropriateAuthToken } from '../../App';
import {
  DATASOURCES,
  EDUCATION_MODE,
  TABS,
  reqConfigMemoryCache,
  FATHOM_TRACK_EVENT_LIST,
} from '../../const';
import { VisualizationTimeSelect } from '../../components/VisualizationTimeSelect/VisualizationTimeSelect';

import VisualizationErrorPanel from './VisualizationErrorPanel';
import planetUtils from '../SearchPanel/dataSourceHandlers/planetNicfi.utils';

class VisualizationPanel extends Component {
  defaultState = {
    currentCustomView: null,
    visualizations: null,
    bands: null,
    selectedLayer: undefined,
    supportsCustom: false,
    sibling: {},
    noSiblingDataModal: false,
    dataFusion: this.props.dataFusion,
    selectedIndexBands: { a: null, b: null },
    displaySocialShareOptions: false,
  };
  state = this.defaultState;

  componentDidUpdate(prevProps) {
    if (!this.props.authToken) {
      return;
    }
    const hasTokenBeenSet = !prevProps.authToken && this.props.authToken;
    if (hasTokenBeenSet && this.props.dataSourcesInitialized && this.props.datasetId) {
      // Handles visualization passed via url - it has to wait for token to be set
      this.createVisualizations();
      this.manageSiblings();
    }
    if (
      this.props.datasetId &&
      prevProps.datasetId !== this.props.datasetId &&
      this.props.dataSourcesInitialized
    ) {
      this.setState({
        ...this.defaultState,
      });
      this.createVisualizations();
      this.manageSiblings();
    }
    if (this.props.datasetId && !prevProps.dataSourcesInitialized && this.props.dataSourcesInitialized) {
      this.createVisualizations();
      this.manageSiblings();
    }

    if (this.props.fromTime !== prevProps.fromTime || this.props.toTime !== prevProps.toTime) {
      this.manageSiblings();
    }

    if (this.props.selectedVisualizationId && this.props.customSelected) {
      store.dispatch(visualizationSlice.actions.setVisualizationParams({ customSelected: false }));
    }

    const dsh = getDataSourceHandler(this.props.datasetId);
    if (
      this.props.datasetId &&
      dsh &&
      dsh.datasource === DATASOURCES.PLANET_NICFI &&
      this.props.selectedDate !== prevProps.selectedDate
    ) {
      this.createPlanetNicfiLayers();
    }
  }

  async getLayersAndBands() {
    const { datasetId, selectedThemeId, selectedThemesListId, themesLists } = this.props;
    const selectedTheme = themesLists[selectedThemesListId].find((t) => t.id === selectedThemeId);
    const datasourceHandler = getDataSourceHandler(datasetId);
    const urls = datasourceHandler.getUrlsForDataset(datasetId);
    const allBands = datasourceHandler.getBands(datasetId);
    const shJsDatasetId = datasourceHandler.getSentinelHubDataset(datasetId)
      ? datasourceHandler.getSentinelHubDataset(datasetId).id
      : null;
    const supportsCustom = datasourceHandler.supportsCustomLayer(datasetId);
    const supportsTimeRange = datasourceHandler.supportsTimeRange();

    let allLayers = [];

    for (let url of urls) {
      const { layersExclude, layersInclude, name } = selectedTheme.content.find((t) => t.url === url);

      let shjsLayers = await LayersFactory.makeLayers(
        url,
        (_, dataset) => (!shJsDatasetId ? true : dataset?.id === shJsDatasetId),
        null,
        reqConfigMemoryCache,
      );
      if (datasourceHandler.updateLayersOnVisualization()) {
        // We have to update layers to get thier legend info and additionally acquisitionMode, polarization for S1. WMS layers don't need updating
        await Promise.all(
          shjsLayers.map(async (l) => {
            await l.updateLayerFromServiceIfNeeded(reqConfigMemoryCache);
          }),
        );
      }
      let layers = datasourceHandler.getLayers(
        shjsLayers,
        datasetId,
        url,
        layersExclude,
        layersInclude,
        this.props.selectedDate,
      );
      for (let layer of layers) {
        if (allLayers.find((l) => l.layerId === layer.layerId)) {
          layer.description += ` (${name})`;
          layer.duplicateLayerId = layer.layerId + ` (${name})`;
        }
      }

      allLayers = [...allLayers, ...layers];
    }

    return { allLayers: sortLayers(allLayers), allBands, supportsCustom, supportsTimeRange };
  }

  generateEvalscript(bands, datasetId, config) {
    const datasourceHandler = getDataSourceHandler(datasetId);
    return datasourceHandler.generateEvalscript(bands, datasetId, config);
  }

  setSelectedVisualization = async (layer) => {
    const { selectedThemeId, datasetId, selectedModeId } = this.props;

    const layerId = layer.duplicateLayerId ? layer.duplicateLayerId : layer.layerId;

    handleFathomTrackEvent(
      FATHOM_TRACK_EVENT_LIST.VISUALIZATION_LAYER_CHANGED,
      isKnownTheme(selectedThemeId, selectedModeId)
        ? `${layer.title} (Dataset: ${getDatasetLabel(datasetId)})`
        : FATHOM_TRACK_EVENT_LIST.PRIVATE_USER_LAYER,
    );

    this.setState({
      selectedLayer: layerId,
    });
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({
        visualizationUrl: layer.url,
        layerId: layer.layerId,
        customSelected: false,
        visibleOnMap: true,
        dataFusion: [],
      }),
    );
  };

  setCustomVisualization = (evalscript = null) => {
    const params = {
      layerId: null,
      customSelected: true,
      visibleOnMap: true,
      visualizationUrl: this.state.visualizations[0].url,
    };

    if (evalscript) {
      params.evalscript = evalscript;
    }
    store.dispatch(visualizationSlice.actions.setVisualizationParams(params));
  };

  goToCustom = () => {
    const evalscript =
      this.props.evalscript && !this.props.evalscripturl
        ? this.props.evalscript
        : this.generateEvalscript(this.state.selectedBands, this.props.datasetId);

    this.setState({
      evalscript: evalscript,
    });

    this.setCustomVisualization(evalscript);
  };

  onDataFusionChange = (value) => {
    this.setState({
      dataFusion: value,
    });
  };

  onBack = () => {
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({
        customSelected: false,
        visibleOnMap: false,
      }),
    );
    window.location.hash = '';
  };

  toggleValue = (key) => {
    if (key === 'showEffects') {
      this.props.setShowEffects(!this.props.showEffects);
      return;
    }

    this.setState((prevState) => ({
      [key]: !prevState[key],
    }));
  };

  toggleVisible = () => {
    store.dispatch(visualizationSlice.actions.setVisibleOnMap(!this.props.visibleOnMap));
  };

  onZoomToTile = () => {
    const { zoomToTileConfig, is3D } = this.props;
    if (is3D) {
      const [x, y] = proj4('EPSG:4326', 'EPSG:3857', [zoomToTileConfig.lng, zoomToTileConfig.lat]);
      window.set3DLocation(x, y);
    }
    store.dispatch(
      mainMapSlice.actions.setPosition({
        lat: zoomToTileConfig.lat,
        lng: zoomToTileConfig.lng,
        zoom: zoomToTileConfig.zoom,
      }),
    );
  };

  createVisualizations = async () => {
    const { datasetId, selectedVisualizationId, toTime, evalscripturl } = this.props;

    let isDatasetValid = true;

    if (!datasetId) {
      console.error('Cannot create a visualization without a datasetId');
      isDatasetValid = false;
    }
    const dsh = getDataSourceHandler(datasetId);
    if (!dsh) {
      console.error('Invalid datasetId', datasetId);
      isDatasetValid = false;
    }

    if (!isDatasetValid) {
      store.dispatch(visualizationSlice.actions.reset());
      store.dispatch(tabsSlice.actions.setTabIndex(TABS.DISCOVER_TAB));
      store.dispatch(notificationSlice.actions.displayError(t`Selected dataset does not exist!`));
      return;
    }

    this.setState({
      visualizations: null,
    });

    if (dsh.datasource === DATASOURCES.PLANET_NICFI) {
      this.createPlanetNicfiLayers();
      return;
    }
    const { allLayers, allBands, supportsCustom, supportsTimeRange } = await this.getLayersAndBands();

    if (allLayers.length === 0) {
      this.setState({
        visualizations: [],
      });
      return;
    }

    if (!supportsTimeRange) {
      store.dispatch(
        visualizationSlice.actions.setVisualizationTime({
          fromTime: null,
          toTime: toTime,
        }),
      );
    }

    if (supportsCustom) {
      let bands;

      if (this.props.evalscript) {
        // Composite evalscript
        bands = parseEvalscriptBands(this.props.evalscript).filter(
          (band) => !!allBands.find((b) => b.name === band),
        );

        // Index evalscript
        if (window.location.hash === '#custom-index') {
          let parsedData = parseIndexEvalscript(this.props.evalscript);
          if (parsedData !== null) {
            this.setState({ selectedIndexBands: parsedData.bands });
          }
        } else if (bands.length === 0) {
          // probably Custom evalscript
          window.location.hash = '#custom-script';
        }
      }

      if (!bands || bands.length !== 3) {
        // Some datasets might have only 1 or 2 available bands. This assures `bands` always contains exactly 3.
        bands = [...allBands, ...allBands, ...allBands].slice(0, 3).map((b) => b.name);
      }

      const selectedBands = {
        r: bands[0],
        g: bands[1],
        b: bands[2],
      };

      if (evalscripturl) {
        axios
          .get(evalscripturl, { timeout: 10000 })
          .then((r) => {
            this.setState({
              evalscript: r.data,
            });
          })
          .catch();
      }

      this.setState({
        visualizations: allLayers,
        bands: allBands,
        evalscript: this.props.evalscript,
        evalscripturl: evalscripturl,
        selectedBands: selectedBands,
        supportsCustom: true,
        useEvalscriptUrl: evalscripturl && !this.props.evalscript,
      });
    } else {
      this.setState({
        visualizations: allLayers,
        supportsCustom: false,
      });
    }

    if (
      (this.props.location.hash &&
        CUSTOM_VISUALIZATION_URL_ROUTES.indexOf(this.props.location.hash) !== -1) ||
      (supportsCustom && (this.props.evalscript || this.props.evalscripturl))
    ) {
      this.setCustomVisualization();
    } else {
      const selectedLayer = selectedVisualizationId
        ? allLayers.find((l) => l.layerId === selectedVisualizationId)
        : allLayers[0];
      this.setSelectedVisualization(selectedLayer || allLayers[0]);
    }
  };

  // Layers and dates work differently for Planet NICFI than other datasets
  // We do not change the date on a layer, as a layer only has one date(sensing timeTange) for the mosaic
  // If the selected date changes, we need to get all layers that has data for that date
  createPlanetNicfiLayers = async () => {
    const { allLayers } = await this.getLayersAndBands();
    if (allLayers.length === 0) {
      const params = {
        layerId: null,
        visibleOnMap: false,
        visualizationUrl: null,
      };
      const { message } = await constructErrorMessage(t`No layers found for date`);
      store.dispatch(visualizationSlice.actions.setError(message));
      store.dispatch(visualizationSlice.actions.setVisualizationParams(params));
      this.setState({ visualizations: [] });
    }

    if (allLayers.length > 0) {
      const { selectedLayer } = this.state;
      let newSelectedLayer = allLayers[0];

      if (selectedLayer) {
        // If NDVI layer is currently selected and date changes, we will get a new list of layers
        // Find the NDVI from the new list and select this layer as the selected layer
        newSelectedLayer = planetUtils.getNewLayerFromDateChange(allLayers, selectedLayer);
      }

      this.setState(
        {
          visualizations: allLayers,
        },
        () => {
          this.setSelectedVisualization(newSelectedLayer);
        },
      );
    }
  };

  /**
   * Custom visualization rendering, composite mode, on drag n drop change
   * @param {*} bands { r: ... , g: ... , b: ...} bands
   */
  onCompositeChange = (bands) => {
    const evalscript = this.generateEvalscript(bands, this.props.datasetId);
    this.setState({
      selectedBands: bands,
      evalscript: evalscript,
    });
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({ evalscript: evalscript, dataFusion: [] }),
    );

    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.RGB_BANDS_CHANGED);
  };

  /**
   * Custom visualization rendering, index mode, on drag n drop change
   * @param {*} bands { a: ... , b: ...} bands
   * @param {*} config an object representing the eval script configuration, can containt equation formula, ramp/gradient values
   */
  onIndexScriptChange = (bands, config) => {
    if (Object.values(bands).filter((item) => item === null).length > 0) {
      this.setState({
        selectedIndexBands: bands,
      });
    } else {
      const evalscript = this.generateEvalscript(bands, this.props.datasetId, config);
      this.setState({
        selectedIndexBands: bands,
        evalscript: evalscript,
      });
      store.dispatch(
        visualizationSlice.actions.setVisualizationParams({ evalscript: evalscript, dataFusion: [] }),
      );
    }
  };

  /**
   * Used only by the custom script green refresh button
   */
  onVisualizeEvalscript = () => {
    if (this.state.useEvalscriptUrl) {
      store.dispatch(
        visualizationSlice.actions.setVisualizationParams({
          evalscript: null,
          evalscripturl: this.state.evalscripturl,
          dataFusion: this.state.dataFusion,
        }),
      );
    } else {
      store.dispatch(
        visualizationSlice.actions.setVisualizationParams({
          evalscript: this.state.evalscript,
          evalscripturl: null,
          dataFusion: this.state.dataFusion,
        }),
      );

      const bands = parseEvalscriptBands(this.state.evalscript).filter(
        (band) => !!this.state.bands.find((b) => b.name === band),
      );
      if (bands && bands.length === 3) {
        this.setState({
          selectedBands: {
            r: bands[0],
            g: bands[1],
            b: bands[2],
          },
        });
      }
    }
  };

  // this should be probably moved to utils
  getMinMaxDates = (asMoment) => {
    let minDate;
    let maxDate;
    const dsh = getDataSourceHandler(this.props.datasetId);
    if (dsh) {
      const minMaxDates = dsh.getMinMaxDates(this.props.datasetId);
      minDate = minMaxDates.minDate;
      maxDate = minMaxDates.maxDate;
    }
    if (asMoment) {
      minDate = minDate ? minDate : moment.utc('1970-01-01');
      maxDate = maxDate ? maxDate : moment.utc();
    } else {
      minDate = minDate ? minDate.toDate() : new Date('1970-01-01');
      maxDate = maxDate ? maxDate.toDate() : new Date();
    }
    return { minDate, maxDate };
  };

  getLayerAndBBoxSetup = () => {
    const { mapBounds, selectedVisualizationId } = this.props;
    const { visualizations } = this.state;
    const bbox = new BBox(
      CRS_EPSG4326,
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth(),
    );

    // Get layer for selected visualization. If layer is not found (custom layer), just use first layer from list.
    let layer = visualizations.find((l) => l.layerId === selectedVisualizationId);
    if (!layer && visualizations && visualizations.length > 0) {
      layer = visualizations[0];
    }

    return {
      bbox,
      layer,
    };
  };

  onFetchAvailableDates = async (fromMoment, toMoment) => {
    const { bbox, layer } = this.getLayerAndBBoxSetup();
    let dates = [];
    if (layer) {
      dates = await layer.findDatesUTC(bbox, fromMoment.toDate(), toMoment.toDate());
    }
    return dates;
  };

  fetchAvailableFlyovers = async (day) => {
    const monthStart = moment(day).clone().startOf('month');
    const monthEnd = moment(day).clone().endOf('month');
    const { bbox, layer } = this.getLayerAndBBoxSetup();
    let flyovers = [];
    try {
      flyovers = await layer.findFlyovers(bbox, monthStart, monthEnd);
    } catch (err) {
      console.error('Unable to fetch available flyovers!\n', err);
    }
    return flyovers;
  };

  onQueryDatesForActiveMonth = async (day) => {
    const monthStart = day.clone().startOf('month');
    const monthEnd = day.clone().endOf('month');
    let dates = [];
    try {
      dates = await this.onFetchAvailableDates(monthStart, monthEnd);
    } catch (err) {
      console.error('Unable to fetch available dates!\n', err);
    }
    return dates;
  };

  onUpdateScript = (state) => {
    this.setState({
      evalscript: state.evalscript,
      evalscripturl: state.evalscripturl,
      useEvalscriptUrl: state.isEvalUrl,
    });
  };

  updateSelectedTime = (fromTime, toTime) => {
    if (!getDataSourceHandler(this.props.datasetId).supportsTimeRange()) {
      fromTime = null;
    }
    store.dispatch(
      visualizationSlice.actions.setVisualizationTime({
        fromTime: fromTime,
        toTime: toTime,
      }),
    );
  };

  setSibling = async (datasetId) => {
    const isSiblingDataAvailable = await this.searchForSiblingData(datasetId);
    if (!isSiblingDataAvailable) {
      this.setState({
        noSiblingDataModal: true,
      });
      return;
    }
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({
        layerId: undefined,
        visualizationUrl: undefined,
        evalscript: undefined,
        evalscripturl: undefined,
        datasetId: datasetId,
        dataFusion: [],
      }),
    );
    this.setState({
      dataFusion: [],
    });
  };

  searchForSiblingData = async (datasetId, showProgress = true) => {
    const { fromTime, toTime, mapBounds } = this.props;
    if (showProgress) {
      this.setState({
        searchInProgress: true,
      });
    }

    let hasData;
    const datasourceHandler = getDataSourceHandler(datasetId);
    const shJsDataset = datasourceHandler.getSentinelHubDataset(datasetId);
    const url = datasourceHandler.getUrlsForDataset(datasetId)[0];

    if (!url) {
      return false;
    }

    const layers = await LayersFactory.makeLayers(url, null, null, reqConfigMemoryCache);
    const layer = layers.find((l) => l.dataset === shJsDataset);

    const bbox = new BBox(
      CRS_EPSG4326,
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth(),
    );

    const data = await layer.findTiles(bbox, fromTime, toTime, 1, 0);
    hasData = !!data.tiles.length;
    if (showProgress) {
      this.setState({
        searchInProgress: false,
      });
    }
    return hasData;
  };

  manageSiblings = async () => {
    const { datasetId } = this.props;
    const dsh = getDataSourceHandler(datasetId);
    const { siblingShortName, siblingId } = dsh ? dsh.getSibling(datasetId) : {};
    if (!siblingId) {
      return;
    }
    const isSiblingDataAvailable = await this.searchForSiblingData(siblingId, false);
    this.setState({
      sibling: { siblingShortName, siblingId, isSiblingDataAvailable: !!isSiblingDataAvailable },
    });
  };

  renderNoSibling = (datasetId) => {
    const { fromTime, toTime } = this.props;
    return (
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={130}
        onClose={() => this.setState({ noSiblingDataModal: false })}
        closeOnEsc={true}
      >
        <div>
          <h3>{t`No tile found`}</h3>
          {`No ${getDatasetLabel(datasetId)} tiles found from ${fromTime
            .utc()
            .format('YYYY-MM-DD HH:mm:ss')} to ${toTime
            .utc()
            .format('YYYY-MM-DD HH:mm:ss')} for the current view.`}
        </div>
      </Rodal>
    );
  };

  updateGainEffect = (x) => {
    store.dispatch(visualizationSlice.actions.setGainEffect(parseFloat(x)));
  };
  updateGammaEffect = (x) => {
    store.dispatch(visualizationSlice.actions.setGammaEffect(parseFloat(x)));
  };
  updateRedRangeEffect = (range) => {
    store.dispatch(visualizationSlice.actions.setRedRangeEffect(range));
  };
  updateGreenRangeEffect = (range) => {
    store.dispatch(visualizationSlice.actions.setGreenRangeEffect(range));
  };
  updateBlueRangeEffect = (range) => {
    store.dispatch(visualizationSlice.actions.setBlueRangeEffect(range));
  };

  updateRedCurveEffect = (curve) => {
    store.dispatch(visualizationSlice.actions.setRedCurveEffect(curve));
  };
  updateGreenCurveEffect = (curve) => {
    store.dispatch(visualizationSlice.actions.setGreenCurveEffect(curve));
  };
  updateBlueCurveEffect = (curve) => {
    store.dispatch(visualizationSlice.actions.setBlueCurveEffect(curve));
  };

  updateMinQa = (x) => {
    store.dispatch(visualizationSlice.actions.setMinQa(parseInt(x)));
  };

  updateUpsampling = (x) => {
    store.dispatch(visualizationSlice.actions.setUpsampling(x ? x : undefined));
  };

  updateDownsampling = (x) => {
    store.dispatch(visualizationSlice.actions.setDownsampling(x ? x : undefined));
  };

  updateSpeckleFilter = (x) => {
    store.dispatch(visualizationSlice.actions.setSpeckleFilter(x ? x : undefined));
  };

  updateOrthorectification = (x) => {
    store.dispatch(visualizationSlice.actions.setOrthorectification(x ? x : undefined));
  };

  onUpdateBackScatterCoeff = (x) => {
    // set orthorectify to true and demInstance to COPERNICUS10/30, for Radiometric terrian correct (GAMMA)_TERRAIN)
    if (x === BackscatterCoeff.GAMMA0_TERRAIN) {
      store.dispatch(
        visualizationSlice.actions.setOrthorectification(DEMInstanceTypeOrthorectification.COPERNICUS),
      );
    } else {
      store.dispatch(visualizationSlice.actions.setOrthorectification(undefined));
    }

    store.dispatch(visualizationSlice.actions.setBackScatterCoeff(x ? x : undefined));
  };

  updateDemSource3D = (x) => {
    store.dispatch(visualizationSlice.actions.setDemSource3D(x ? x : undefined));
  };

  resetEffects = () => {
    store.dispatch(visualizationSlice.actions.resetEffects());
  };

  resetRgbEffects = () => {
    store.dispatch(visualizationSlice.actions.resetRgbEffects());
  };

  doesDatasetSupportMinQa = (datasetId) => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      return dsh.supportsMinQa();
    }
    return false;
  };

  getDefaultMinQa = (datasetId) => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh && dsh.supportsMinQa()) {
      return dsh.getDefaultMinQa(datasetId);
    }
    return null;
  };

  doesDatasetSupportInterpolation = (datasetId) => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      return dsh.supportsInterpolation();
    }
    return false;
  };

  doesDatasetSupportSpeckleFilter = (datasetId) => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      return dsh.supportsSpeckleFilter(datasetId);
    }
    return false;
  };

  doesDatasetSupportOrthorectification = (datasetId) => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      return dsh.supportsOrthorectification(datasetId);
    }
    return false;
  };

  doesDatasetSupportBackscatterCoeff = (datasetId) => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      return dsh.supportsBackscatterCoeff(datasetId);
    }
    return false;
  };

  toggleSocialSharePanel = () => {
    this.setState((prevState) => ({
      displaySocialShareOptions: !prevState.displaySocialShareOptions,
    }));
  };

  setEvalScriptAndCustomVisualization = async (layerId) => {
    const { allLayers } = await this.getLayersAndBands();
    const layer = allLayers.find((l) => l.layerId === layerId);

    if (layer) {
      store.dispatch(visualizationSlice.actions.setVisualizationParams({ evalscript: layer.evalscript }));
      this.goToCustom();
    }
  };

  addVisualizationToCompare = () => {
    const {
      zoom,
      lat,
      lng,
      fromTime,
      toTime,
      datasetId,
      visualizationUrl,
      selectedVisualizationId: layerId,
      evalscript,
      evalscripturl,
      dataFusion,
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      redCurveEffect,
      greenCurveEffect,
      blueCurveEffect,
      minQa,
      upsampling,
      downsampling,
      speckleFilter,
      orthorectification,
      backscatterCoeff,
      customSelected,
      selectedThemeId,
    } = this.props;

    const title = `${getDatasetLabel(datasetId)}: ${customSelected ? 'Custom' : layerId}`;

    const newCompareLayer = {
      title,
      zoom,
      lat,
      lng,
      fromTime,
      toTime,
      datasetId,
      visualizationUrl,
      layerId,
      evalscript: customSelected ? evalscript : '',
      evalscripturl: customSelected ? evalscripturl : '',
      dataFusion,
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      redCurveEffect,
      greenCurveEffect,
      blueCurveEffect,
      minQa,
      upsampling,
      downsampling,
      speckleFilter,
      backscatterCoeff,
      orthorectification,
      themeId: selectedThemeId,
    };

    store.dispatch(compareLayersSlice.actions.addToCompare(newCompareLayer));
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.ADD_TO_COMPARE_BUTTON);
  };

  renderHeader = () => {
    const { datasetId, selectedModeId, fromTime, toTime, zoom } = this.props;
    const { siblingShortName, siblingId, isSiblingDataAvailable } = this.state.sibling;
    const { minDate, maxDate } = this.getMinMaxDates(true);
    let timespanSupported = false;
    let hasCloudCoverage = false;

    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      const zoomConfiguration = dsh.getLeafletZoomConfig(datasetId);
      const isZoomLevelOk = zoomConfiguration && zoomConfiguration.min && zoom >= zoomConfiguration.min;
      hasCloudCoverage = dsh.tilesHaveCloudCoverage() && isZoomLevelOk;
      timespanSupported = dsh.supportsTimeRange() && selectedModeId !== EDUCATION_MODE.id;
    }
    return (
      <div className="header">
        <div className="dataset-info">
          <div className="title">
            <div className="dataset-label">{t`Dataset`}:</div>
            <div className="dataset-name">{`${getDatasetLabel(datasetId) || ''}`}</div>
            {siblingShortName && (
              <EOBButton
                style={{ marginLeft: 20 }}
                className="small"
                text={t`Show` + ` ${siblingShortName}`}
                disabled={!isSiblingDataAvailable}
                onClick={() => this.setSibling(siblingId)}
                loading={this.state.searchInProgress}
              />
            )}
          </div>
          {this.state.noSiblingDataModal && this.renderNoSibling(siblingId)}
        </div>
        <div className="date-selection">
          {this.props.mapBounds && this.state.visualizations && fromTime !== null && toTime !== null && (
            <VisualizationTimeSelect
              maxDate={maxDate}
              minDate={minDate}
              showNextPrev={true}
              onQueryDatesForActiveMonth={this.onQueryDatesForActiveMonth}
              fromTime={fromTime}
              toTime={toTime}
              hasCloudCoverage={hasCloudCoverage}
              updateSelectedTime={this.updateSelectedTime}
              timespanSupported={timespanSupported}
              onQueryFlyoversForActiveMonth={this.fetchAvailableFlyovers}
            />
          )}
        </div>
      </div>
    );
  };

  _getLegacyActiveLayer = (datasetId) => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh && dsh.groupChannels) {
      return {
        groupChannels: (datasetId) => dsh.groupChannels(datasetId),
      };
    }
    return {};
  };

  render() {
    const { useEvalscriptUrl, visualizations } = this.state;
    const {
      showEffects,
      gainEffect,
      gammaEffect,
      redRangeEffect,
      greenRangeEffect,
      blueRangeEffect,
      redCurveEffect,
      greenCurveEffect,
      blueCurveEffect,
      minQa,
      upsampling,
      downsampling,
      speckleFilter,
      orthorectification,
      backscatterCoeff,
      demSource3D,
      datasetId,
      zoomToTileConfig,
      is3D,
    } = this.props;
    const legacyActiveLayer = {
      ...this._getLegacyActiveLayer(this.props.datasetId),
      datasetId: datasetId,
      baseUrls: {
        WMS: this.props.visualizationUrl,
      },
    };

    const supportedInterpolations = [Interpolator.BILINEAR, Interpolator.BICUBIC, Interpolator.NEAREST];
    const dsh = datasetId && getDataSourceHandler(datasetId);
    const areBandsClasses = dsh && dsh.areBandsClasses(datasetId);
    const supportsIndex = dsh && dsh.supportsIndex(datasetId);
    const supportedSpeckleFilters = dsh && dsh.getSupportedSpeckleFilters(datasetId);
    const canApplySpeckleFilter = dsh && dsh.canApplySpeckleFilter(datasetId, this.props.zoom);
    const newEffects = {
      gainEffect: this.props.gainEffect,
      gammaEffect: this.props.gammaEffect,
      redRangeEffect: this.props.redRangeEffect,
      greenRangeEffect: this.props.greenRangeEffect,
      blueRangeEffect: this.props.blueRangeEffect,
      redCurveEffect: this.props.redCurveEffect,
      greenCurveEffect: this.props.greenCurveEffect,
      blueCurveEffect: this.props.blueCurveEffect,
      minQa: this.props.minQa,
      upsampling: this.props.upsampling,
      downsampling: this.props.downsampling,
      speckleFilter: this.props.speckleFilter,
      orthorectification: this.props.orthorectification,
      backscatterCoeff: this.props.backscatterCoeff,
      demSource3D: this.props.demSource3D,
    };

    return (
      <div key={this.props.datasetId} className="visualization-panel">
        {this.renderHeader()}
        <VisualizationPanelHeaderActions
          onZoomToTile={this.onZoomToTile}
          onSavePin={this.props.onSavePin}
          displayZoomToTile={zoomToTileConfig !== null}
          isSelectedLayerVisible={this.props.visibleOnMap}
          toggleVisible={this.toggleVisible}
          showEffects={this.props.showEffects}
          toggleValue={this.toggleValue}
          addVisualizationToCompare={this.addVisualizationToCompare}
          toggleSocialSharePanel={this.toggleSocialSharePanel}
          displaySocialShareOptions={this.state.displaySocialShareOptions}
          datasetId={datasetId}
          is3D={is3D}
          haveEffectsChanged={haveEffectsChangedFromDefault(newEffects)}
        />
        {showEffects ? (
          <EOBEffectsPanel
            effects={{
              gainEffect: gainEffect,
              gammaEffect: gammaEffect,
              redRangeEffect: redRangeEffect,
              greenRangeEffect: greenRangeEffect,
              blueRangeEffect: blueRangeEffect,
              redCurveEffect: redCurveEffect,
              greenCurveEffect: greenCurveEffect,
              blueCurveEffect: blueCurveEffect,
              minQa: minQa !== undefined ? minQa : this.getDefaultMinQa(datasetId),
              upsampling: upsampling,
              downsampling: downsampling,
              speckleFilter: speckleFilter,
              backscatterCoeff: backscatterCoeff,
              orthorectification: orthorectification,
              demSource3D: demSource3D,
            }}
            is3D={is3D}
            isFISLayer={false}
            defaultMinQaValue={this.getDefaultMinQa(datasetId)}
            doesDatasetSupportMinQa={this.doesDatasetSupportMinQa(datasetId)}
            doesDatasetSupportInterpolation={this.doesDatasetSupportInterpolation(datasetId)}
            doesDatasetSupportSpeckleFilter={this.doesDatasetSupportSpeckleFilter(datasetId)}
            doesDatasetSupportOrthorectification={this.doesDatasetSupportOrthorectification(datasetId)}
            doesDatasetSupportBackscatterCoeff={this.doesDatasetSupportBackscatterCoeff(datasetId)}
            interpolations={supportedInterpolations}
            supportedSpeckleFilters={supportedSpeckleFilters}
            canApplySpeckleFilter={canApplySpeckleFilter}
            onUpdateGainEffect={this.updateGainEffect}
            onUpdateGammaEffect={this.updateGammaEffect}
            onUpdateRedRangeEffect={this.updateRedRangeEffect}
            onUpdateGreenRangeEffect={this.updateGreenRangeEffect}
            onUpdateBlueRangeEffect={this.updateBlueRangeEffect}
            onUpdateRedCurveEffect={this.updateRedCurveEffect}
            onUpdateGreenCurveEffect={this.updateGreenCurveEffect}
            onUpdateBlueCurveEffect={this.updateBlueCurveEffect}
            onUpdateMinQa={this.updateMinQa}
            onUpdateUpsampling={this.updateUpsampling}
            onUpdateDownsampling={this.updateDownsampling}
            onUpdateSpeckleFilter={this.updateSpeckleFilter}
            onUpdateOrthorectification={this.updateOrthorectification}
            onUpdateBackScatterCoeff={this.onUpdateBackScatterCoeff}
            onUpdateDemSource3D={this.updateDemSource3D}
            onResetEffects={this.resetEffects}
            onResetRgbEffects={this.resetRgbEffects}
          />
        ) : (
          <div className="layer-datasource-picker">
            <ZoomInNotification />
            <VisualizationErrorPanel />
            {this.props.datasetId && !this.props.customSelected && (
              <div>
                {!visualizations ? (
                  <Loader />
                ) : (
                  <Visualizations
                    visualizations={visualizations}
                    selectedLayer={this.state.selectedLayer}
                    setSelectedVisualization={this.setSelectedVisualization}
                    setCustomVisualization={this.goToCustom}
                    supportsCustom={this.state.supportsCustom}
                    setEvalScriptAndCustomVisualization={this.setEvalScriptAndCustomVisualization}
                  />
                )}
              </div>
            )}
            {this.props.customSelected && (
              <EOBAdvancedHolder
                channels={this.state.bands}
                evalscripturl={this.state.evalscripturl}
                evalscript={this.state.evalscript}
                dataFusion={this.state.dataFusion}
                initialTimespan={{ fromTime: this.props.fromTime, toTime: this.props.toTime }}
                layers={this.state.selectedBands}
                indexLayers={this.state.selectedIndexBands}
                activeLayer={legacyActiveLayer}
                isEvalUrl={useEvalscriptUrl}
                style={null}
                onUpdateScript={this.onUpdateScript}
                onDataFusionChange={this.onDataFusionChange}
                onBack={this.onBack}
                onEvalscriptRefresh={this.onVisualizeEvalscript}
                onCompositeChange={this.onCompositeChange}
                onIndexScriptChange={this.onIndexScriptChange}
                supportsIndex={supportsIndex}
                areBandsClasses={areBandsClasses}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}

const mapStoreToProps = (store) => ({
  datasetId: store.visualization.datasetId,
  selectedVisualizationId: store.visualization.layerId,
  customSelected: store.visualization.customSelected,
  visibleOnMap: store.visualization.visibleOnMap,
  visualizationUrl: store.visualization.visualizationUrl,
  evalscript: store.visualization.evalscript,
  evalscripturl: store.visualization.evalscripturl,
  dataFusion: store.visualization.dataFusion,
  fromTime: store.visualization.fromTime,
  toTime: store.visualization.toTime,
  dataSourcesInitialized: store.themes.dataSourcesInitialized,
  mapBounds: store.mainMap.bounds,
  is3D: store.mainMap.is3D,
  selectedModeId: store.themes.selectedModeId,
  authToken: getAppropriateAuthToken(store.auth, store.themes.selectedThemeId),
  gainEffect: store.visualization.gainEffect,
  gammaEffect: store.visualization.gammaEffect,
  redRangeEffect: store.visualization.redRangeEffect,
  greenRangeEffect: store.visualization.greenRangeEffect,
  blueRangeEffect: store.visualization.blueRangeEffect,
  redCurveEffect: store.visualization.redCurveEffect,
  greenCurveEffect: store.visualization.greenCurveEffect,
  blueCurveEffect: store.visualization.blueCurveEffect,
  minQa: store.visualization.minQa,
  upsampling: store.visualization.upsampling,
  downsampling: store.visualization.downsampling,
  speckleFilter: store.visualization.speckleFilter,
  orthorectification: store.visualization.orthorectification,
  backscatterCoeff: store.visualization.backscatterCoeff,
  demSource3D: store.visualization.demSource3D,
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
  selectedThemeId: store.themes.selectedThemeId,
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  selectedLanguage: store.language.selectedLanguage,
});

export default withRouter(connect(mapStoreToProps, null)(VisualizationPanel));
