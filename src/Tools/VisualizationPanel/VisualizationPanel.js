import React, { Component } from 'react';
import moment from 'moment';
import axios from 'axios';
import { connect } from 'react-redux';
import { EOBEffectsPanel } from '../../junk/EOBEffectsPanel/EOBEffectsPanel';
import EOBAdvancedHolder, {
  CUSTOM_VISUALIZATION_URL_ROUTES,
} from '../../junk/EOBAdvancedHolder/EOBAdvancedHolder';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { LayersFactory, BBox, CRS_EPSG4326, Interpolator } from '@sentinel-hub/sentinelhub-js';
import Rodal from 'rodal';
import { t } from 'ttag';
//Those 3 needs to be imported for synax highlighting to work properly.
import 'codemirror/mode/javascript/javascript';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import { withRouter } from 'react-router-dom';

import store, { mainMapSlice, visualizationSlice, tabsSlice, compareLayersSlice } from '../../store';
import Visualizations from './Visualizations';
import Loader from '../../Loader/Loader';
import './VisualizationPanel.scss';
import { sortLayers } from './VisualizationPanel.utils';
import {
  getDataSourceHandler,
  S3SLSTR,
  getDatasetLabel,
  S2L1C,
  S2L2A,
  AWS_L8L1C,
  ESA_L8,
} from '../SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { VisualizationPanelHeaderActions } from './VisualizationPanelHeaderActions';
import { parseEvalscriptBands, parseIndexEvalscript } from '../../utils';
import ZoomInNotification from './ZoomInNotification';
import { getAppropriateAuthToken } from '../../App';
import { EDUCATION_MODE } from '../../const';
import { VisualizationTimeSelect } from '../../components/VisualizationTimeSelect/VisualizationTimeSelect';
import VisualizationErrorPanel from './VisualizationErrorPanel';

class VisualizationPanel extends Component {
  defaultState = {
    currentCustomView: null,
    visualizations: null,
    bands: null,
    selectedLayer: undefined,
    supportsCustom: true,
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
      store.dispatch(
        visualizationSlice.actions.setVisualizationParams({
          customSelected: false,
        }),
      );
    }
  }

  async getLayersAndBands() {
    const { datasetId, selectedThemeId, selectedThemesListId, themesLists } = this.props;
    const selectedTheme = themesLists[selectedThemesListId].find(t => t.id === selectedThemeId);

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
      const { layersExclude, layersInclude, name } = selectedTheme.content.find(t => t.url === url);

      let shjsLayers = await LayersFactory.makeLayers(url, (_, dataset) =>
        !shJsDatasetId ? true : dataset.id === shJsDatasetId,
      );
      if (datasourceHandler.updateLayersOnVisualization()) {
        // We have to update layers to get thier legend info and additionally acquisitionMode, polarization for S1. WMS layers don't need updating
        await Promise.all(
          shjsLayers.map(async l => {
            await l.updateLayerFromServiceIfNeeded();
          }),
        );
      }
      let layers = datasourceHandler.getLayers(shjsLayers, datasetId, url, layersExclude, layersInclude);
      for (let layer of layers) {
        if (allLayers.find(l => l.layerId === layer.layerId)) {
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

  setSelectedVisualization = layer => {
    const layerId = layer.duplicateLayerId ? layer.duplicateLayerId : layer.layerId;
    this.setState({
      selectedLayer: layerId,
    });
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({
        visualizationUrl: layer.url,
        layerId: layer.layerId,
        customSelected: false,
        visibleOnMap: true,
      }),
    );
  };

  setCustomVisualization = () => {
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({
        layerId: null,
        customSelected: true,
        visibleOnMap: true,
        visualizationUrl: this.state.visualizations[0].url,
      }),
    );
  };

  goToCustom = () => {
    const evalscript =
      this.props.evalscript && !this.props.evalscripturl
        ? this.props.evalscript
        : this.generateEvalscript(this.state.selectedBands, this.props.datasetId);

    store.dispatch(visualizationSlice.actions.setEvalscript(evalscript));
    this.setCustomVisualization();
  };

  onDataFusionChange = value => {
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

  toggleValue = key => {
    if (key === 'showEffects') {
      this.props.setShowEffects(!this.props.showEffects);
      return;
    }

    this.setState(prevState => ({
      [key]: !prevState[key],
    }));
  };

  toggleVisible = () => {
    store.dispatch(visualizationSlice.actions.setVisibleOnMap(!this.props.visibleOnMap));
  };

  onZoomToTile = () => {
    const { zoomToTileConfig } = this.props;
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
    if (!datasetId) {
      console.error('Cannot create a visualization without a datasetId');
      return;
    }

    this.setState({
      visualizations: null,
    });
    store.dispatch(tabsSlice.actions.setTabIndex(2));

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
          band => !!allBands.find(b => b.name === band),
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
        bands = [...allBands, ...allBands, ...allBands].slice(0, 3).map(b => b.name);
      }

      const selectedBands = {
        r: bands[0],
        g: bands[1],
        b: bands[2],
      };

      if (evalscripturl) {
        axios
          .get(evalscripturl, { timeout: 10000 })
          .then(r => {
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
      (supportsCustom && this.props.evalscript)
    ) {
      this.setCustomVisualization();
    } else {
      const selectedLayer = selectedVisualizationId
        ? allLayers.find(l => l.layerId === selectedVisualizationId)
        : allLayers[0];
      this.setSelectedVisualization(selectedLayer || allLayers[0]);
    }
  };

  /**
   * Custom visualization rendering, composite mode, on drag n drop change
   * @param {*} bands { r: ... , g: ... , b: ...} bands
   */
  onCompositeChange = bands => {
    const evalscript = this.generateEvalscript(bands, this.props.datasetId);

    this.setState({
      selectedBands: bands,
      evalscript: evalscript,
    });
    store.dispatch(
      visualizationSlice.actions.setVisualizationParams({ evalscript: evalscript, dataFusion: [] }),
    );
  };

  /**
   * Custom visualization rendering, index mode, on drag n drop change
   * @param {*} bands { a: ... , b: ...} bands
   * @param {*} config an object representing the eval script configuration, can containt equation formula, ramp/gradient values
   */
  onIndexScriptChange = (bands, config) => {
    if (Object.values(bands).filter(item => item === null).length > 0) {
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
        band => !!this.state.bands.find(b => b.name === band),
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
  getMinMaxDates = asMoment => {
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

  onFetchAvailableDates = async (fromMoment, toMoment) => {
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
    let layer = visualizations.find(l => l.layerId === selectedVisualizationId);
    if (!layer && visualizations && visualizations.length > 0) {
      layer = visualizations[0];
    }
    let dates = [];
    if (layer) {
      dates = await layer.findDatesUTC(bbox, fromMoment.toDate(), toMoment.toDate());
    }
    return dates;
  };

  onQueryDatesForActiveMonth = async day => {
    const monthStart = day.clone().startOf('month');
    const monthEnd = day.clone().endOf('month');
    const dates = await this.onFetchAvailableDates(monthStart, monthEnd);
    return dates;
  };

  onUpdateScript = state => {
    this.setState({
      evalscript: state.evalscript,
      evalscripturl: state.evalscripturl,
      useEvalscriptUrl: state.isEvalUrl,
    });
  };

  onGetAndSetNextPrev = async (direction, currentDay) => {
    const { minDate, maxDate } = this.getMinMaxDates(true);
    let newSelectedDay;
    const NO_DATES_FOUND = 'No dates found';

    if (direction === 'prev') {
      const start = minDate.utc().startOf('day');
      const startDates = [
        moment
          .utc(currentDay)
          .subtract(3, 'months')
          .startOf('day'),
        moment
          .utc(currentDay)
          .subtract(1, 'year')
          .startOf('day'),
        start,
      ].filter(date => date.isSameOrAfter(start));
      const end = currentDay
        .clone()
        .subtract(1, 'day')
        .endOf('day');
      let dates = [];
      try {
        for (const startDate of startDates) {
          dates = await this.onFetchAvailableDates(startDate, end);
          if (dates.length > 0) {
            break;
          }
        }
      } catch (e) {
        console.error(e);
        throw NO_DATES_FOUND;
      }

      if (dates.length < 1) {
        throw NO_DATES_FOUND;
      }

      newSelectedDay = dates[0];
    }

    if (direction === 'next') {
      const start = currentDay
        .clone()
        .utc()
        .add(1, 'day')
        .startOf('day');
      const end = maxDate.utc();
      const endDates = [
        moment
          .utc(currentDay)
          .add(3, 'months')
          .endOf('day'),
        moment
          .utc(currentDay)
          .add(1, 'year')
          .endOf('day'),
        end,
      ].filter(date => date.isSameOrBefore(end));

      let dates = [];
      try {
        for (const endDate of endDates) {
          dates = await this.onFetchAvailableDates(start, endDate);
          if (dates.length > 0) {
            break;
          }
        }
      } catch (e) {
        console.error(e);
        throw NO_DATES_FOUND;
      }

      // if no future date is found throw no dates found
      if (dates.length < 1) {
        throw NO_DATES_FOUND;
      }

      newSelectedDay = dates[dates.length - 1];
    }

    this.updateSelectedTime(
      moment.utc(newSelectedDay).startOf('day'),
      moment.utc(newSelectedDay).endOf('day'),
    );
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

  getSibling = datasetId => {
    switch (datasetId) {
      case S2L2A:
        return { siblingId: S2L1C, siblingShortName: 'L1C' };
      case S2L1C:
        return { siblingId: S2L2A, siblingShortName: 'L2A' };
      default:
        return {};
    }
  };

  setSibling = async datasetId => {
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

    const layers = await LayersFactory.makeLayers(url);
    const layer = layers.find(l => l.dataset === shJsDataset);

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
    const { siblingShortName, siblingId } = this.getSibling(datasetId);
    if (!siblingId) {
      return;
    }
    const isSiblingDataAvailable = await this.searchForSiblingData(siblingId, false);
    this.setState({
      sibling: { siblingShortName, siblingId, isSiblingDataAvailable: !!isSiblingDataAvailable },
    });
  };

  renderNoSibling = datasetId => {
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

  updateGainEffect = x => {
    store.dispatch(visualizationSlice.actions.setGainEffect(parseFloat(x)));
  };
  updateGammaEffect = x => {
    store.dispatch(visualizationSlice.actions.setGammaEffect(parseFloat(x)));
  };
  updateRedRangeEffect = range => {
    store.dispatch(visualizationSlice.actions.setRedRangeEffect(range));
  };
  updateGreenRangeEffect = range => {
    store.dispatch(visualizationSlice.actions.setGreenRangeEffect(range));
  };
  updateBlueRangeEffect = range => {
    store.dispatch(visualizationSlice.actions.setBlueRangeEffect(range));
  };

  updateRedCurveEffect = curve => {
    store.dispatch(visualizationSlice.actions.setRedCurveEffect(curve));
  };
  updateGreenCurveEffect = curve => {
    store.dispatch(visualizationSlice.actions.setGreenCurveEffect(curve));
  };
  updateBlueCurveEffect = curve => {
    store.dispatch(visualizationSlice.actions.setBlueCurveEffect(curve));
  };

  updateMinQa = x => {
    store.dispatch(visualizationSlice.actions.setMinQa(parseInt(x)));
  };

  updateUpsampling = x => {
    store.dispatch(visualizationSlice.actions.setUpsampling(x ? x : undefined));
  };

  updateDownsampling = x => {
    store.dispatch(visualizationSlice.actions.setDownsampling(x ? x : undefined));
  };

  resetEffects = () => {
    store.dispatch(visualizationSlice.actions.resetEffects());
  };

  resetRgbEffects = () => {
    store.dispatch(visualizationSlice.actions.resetRgbEffects());
  };

  doesDatasetSupportMinQa = datasetId => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      return dsh.supportsMinQa();
    }
    return false;
  };

  getDefaultMinQa = datasetId => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh && dsh.supportsMinQa()) {
      return dsh.getDefaultMinQa(datasetId);
    }
    return null;
  };

  doesDatasetSupportInterpolation = datasetId => {
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      return dsh.supportsInterpolation();
    }
    return false;
  };

  toggleSocialSharePanel = () => {
    this.setState(prevState => ({
      displaySocialShareOptions: !prevState.displaySocialShareOptions,
    }));
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
      themeId: selectedThemeId,
    };

    store.dispatch(compareLayersSlice.actions.addToCompare(newCompareLayer));
  };

  renderHeader = () => {
    const { datasetId, selectedModeId, fromTime, toTime } = this.props;
    const { siblingShortName, siblingId, isSiblingDataAvailable } = this.state.sibling;
    const { minDate, maxDate } = this.getMinMaxDates(true);
    let timespanSupported = false;
    const dsh = getDataSourceHandler(datasetId);
    if (dsh) {
      timespanSupported = dsh.supportsTimeRange() && selectedModeId !== EDUCATION_MODE.id;
    }
    return (
      <div className="header">
        <div className="dataset-info">
          <div className="title">
            <b>{t`Dataset`}: </b>
            <div className="dataset-name">{`${getDatasetLabel(datasetId)}`}</div>
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
          <VisualizationTimeSelect
            maxDate={maxDate}
            minDate={minDate}
            showNextPrev={true}
            getAndSetNextPrevDate={this.onGetAndSetNextPrev}
            onQueryDatesForActiveMonth={this.onQueryDatesForActiveMonth}
            fromTime={fromTime}
            toTime={toTime}
            updateSelectedTime={this.updateSelectedTime}
            timespanSupported={timespanSupported}
          />
        </div>
      </div>
    );
  };

  _getLegacyActiveLayer = datasetId => {
    if (datasetId !== S3SLSTR && datasetId !== AWS_L8L1C && datasetId !== ESA_L8) {
      return {};
    }
    return {
      groupChannels: channels => getDataSourceHandler(datasetId).groupChannels(channels),
    };
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
      datasetId,
      zoomToTileConfig,
    } = this.props;

    const legacyActiveLayer = {
      ...this._getLegacyActiveLayer(this.props.datasetId),
      baseUrls: {
        WMS: this.props.visualizationUrl,
      },
    };

    const supportedInterpolations = [Interpolator.BILINEAR, Interpolator.BICUBIC, Interpolator.NEAREST];
    const dsh = datasetId && getDataSourceHandler(datasetId);
    const areBandsClasses = dsh && dsh.areBandsClasses(datasetId);
    const supportsIndex = dsh && dsh.supportsIndex(datasetId);

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
            }}
            isFISLayer={false}
            defaultMinQaValue={this.getDefaultMinQa(datasetId)}
            doesDatasetSupportMinQa={this.doesDatasetSupportMinQa(datasetId)}
            doesDatasetSupportInterpolation={this.doesDatasetSupportInterpolation(datasetId)}
            interpolations={supportedInterpolations}
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
                onCodeMirrorRefresh={this.onVisualizeEvalscript}
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

const mapStoreToProps = store => ({
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
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
  selectedThemeId: store.themes.selectedThemeId,
  lat: store.mainMap.lat,
  lng: store.mainMap.lng,
  zoom: store.mainMap.zoom,
  selectedLanguage: store.language.selectedLanguage,
});

export default withRouter(connect(mapStoreToProps, null)(VisualizationPanel));
