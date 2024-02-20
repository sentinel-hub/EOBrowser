import React, { Component } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { EOBCCSlider } from '../../junk/EOBCommon/EOBCCSlider/EOBCCSlider';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import {
  CancelToken,
  CRS_EPSG3857,
  CRS_EPSG4326,
  StatisticsProviderType,
  StatisticsUtils,
} from '@sentinel-hub/sentinelhub-js';
import moment from 'moment';
import { XYFrame } from 'semiotic';

import store, { modalSlice } from '../../store';
import { getDatasetLabel } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import {
  getRecommendedResolutionForDatasetId,
  getRequestGeometry,
  getStatisticsLayer,
  handleZipCSVExport,
  handleSingleCSVExport,
} from './FIS.utils';
import { DraggableDialogBox } from '../../components/DraggableDialogBox/DraggableDialogBox';
import { STATISTICS_MANDATORY_OUTPUTS, TABS } from '../../const';

import './FIS.scss';
import { getErrorFetchingDataMsg } from '../../junk/ConstMessages';
import PinPreviewImage from '../../Tools/Pins/PinPreviewImage';
import { constructTimespanString } from '../../Tools/Pins/Pin.utils';
import { NotificationPanel } from '../../Notification/NotificationPanel';
import rectChecked from './checkmark-rec.svg';
import rectUnchecked from './rectangle-uncheck.svg';
import { refetchWithDefaultToken } from '../../utils/fetching.utils';
import { AOI_STRING, POI_STRING } from '../controls.utils';

class FIS extends Component {
  state = {
    fetchingInProgress: true,
    maxCCAllowed: 1.0,
    layersWithNotAvailableStats: [],
    times: { from: {}, to: {} },
    selectedComparedLayerIds: [],
    layersWhichSupportCC: [],
  };
  TIME_INTERVALS = [
    { label: t`5 years`, duration: moment.duration(5, 'year') },
    { label: t`2 years`, duration: moment.duration(2, 'year') },
    { label: t`1 year`, duration: moment.duration(1, 'year') },
    { label: t`6 months`, duration: moment.duration(6, 'month') },
    { label: t`3 months`, duration: moment.duration(3, 'month') },
    { label: t`1 month`, duration: moment.duration(1, 'month') },
  ];
  maxCCAllowed = 1.0;
  MAX_REQUEST_INTERVAL = moment.duration(2, 'month');
  availableData = {
    times: {
      from: {},
      to: {},
    },
    data: {},
    cloudCoverageData: {},
  };

  cancelToken = null;

  componentDidMount() {
    this.cancelToken = new CancelToken();
    const selectedTimeIntervalIndex = this.TIME_INTERVALS.length - 1; // shortest interval by default, then user can request more

    const layers = this.prepareLayers({ hasIntervalChanged: false });

    this.handleMountOrIntervalChange({
      layers,
      hasIntervalChanged: false,
      intervalIndex: selectedTimeIntervalIndex,
    });
  }

  prepareLayers = ({ hasIntervalChanged }) => {
    const {
      selectedTab,
      comparedLayers,
      layerId,
      customSelected,
      evalscript,
      datasetId,
      visualizationUrl,
      toTime: propsToTime,
    } = this.props;

    if (selectedTab === TABS.COMPARE_TAB) {
      return comparedLayers.map((cLayer) => ({
        id: cLayer.id,
        layerId: cLayer.layerId,
        customSelected: !!cLayer.evalscript,
        evalscript: cLayer.evalscript,
        datasetId: cLayer.datasetId,
        visualizationUrl: cLayer.visualizationUrl,
        toTime: moment.utc(cLayer.toTime),
      }));
    }

    const singleLayerId = customSelected ? 'Custom' : layerId;
    return [
      {
        id: singleLayerId,
        layerId,
        customSelected,
        evalscript,
        datasetId,
        visualizationUrl,
        toTime: hasIntervalChanged
          ? this.state.times.to[singleLayerId].clone().utc()
          : propsToTime.clone().utc(),
      },
    ];
  };

  componentWillUnmount() {
    if (this.cancelToken) {
      this.cancelToken.cancel();
    }
  }

  onClose = () => {
    store.dispatch(modalSlice.actions.removeModal());
  };

  setMaxCCAllowed = (valuePercent) => {
    this.maxCCAllowed = valuePercent / 100.0;
    this.updateStateWithData();
  };

  onIntervalChange(newIntervalIndex) {
    const layers = this.prepareLayers({ hasIntervalChanged: true });

    this.handleMountOrIntervalChange({
      layers,
      hasIntervalChanged: true,
      intervalIndex: newIntervalIndex,
    });
  }

  handleMountOrIntervalChange = ({ layers, hasIntervalChanged, intervalIndex }) => {
    const newSelectedComparedLayerIds = [];
    const newTimes = {
      from: {},
      to: {},
    };

    const allFISData = layers.map((l) => {
      newSelectedComparedLayerIds.push(l.id);
      const toTime = l.toTime.clone().utc();
      const fromTime = toTime
        .clone()
        .utc()
        .subtract(this.TIME_INTERVALS[intervalIndex].duration)
        .startOf('day');

      if (!hasIntervalChanged) {
        this.availableData.times.from[l.id] = toTime; // we don't have any data yet, so from == to
        this.availableData.times.to[l.id] = toTime;
      }

      newTimes.from[l.id] = fromTime;
      newTimes.to[l.id] = toTime;

      return this.fetchFISData(
        fromTime,
        toTime,
        l.id,
        l.layerId,
        l.customSelected,
        l.evalscript,
        l.datasetId,
        l.visualizationUrl,
      );
    });

    this.setState(
      {
        times: newTimes,
        selectedComparedLayerIds: hasIntervalChanged
          ? this.state.selectedComparedLayerIds
          : newSelectedComparedLayerIds,
        selectedTimeIntervalIndex: intervalIndex,
      },
      async () => {
        await Promise.all(allFISData).then(() => {
          this.setState({
            fetchingInProgress: false,
            fetchingBatches: false,
          });
        });
      },
    );
  };

  fetchFISData = async (
    fromTime,
    toTime,
    id,
    layerId,
    customSelected,
    evalscript,
    datasetId,
    visualizationUrl,
  ) => {
    if (!fromTime.isBefore(this.availableData.times.from[id])) {
      return;
    }

    const { aoiGeometry, poiGeometry, poiOrAoi, selectedTab } = this.props;

    const { supportStatisticalApi, statisticsLayer } = await getStatisticsLayer({
      customSelected,
      datasetId,
      evalscript,
      layerId,
      visualizationUrl,
    });

    if (statisticsLayer === undefined) {
      this.setState({
        layersWithNotAvailableStats: [...this.state.layersWithNotAvailableStats, id],
      });
      return;
    }

    const geometry = poiOrAoi === AOI_STRING ? aoiGeometry : poiGeometry;
    const crs = supportStatisticalApi ? CRS_EPSG3857 : CRS_EPSG4326;

    const recommendedResolution = getRecommendedResolutionForDatasetId(datasetId, geometry);
    const requestGeometry = getRequestGeometry(datasetId, geometry, crs);

    let batchFromTime = moment
      .max(fromTime, this.availableData.times.from[id].clone().subtract(this.MAX_REQUEST_INTERVAL))
      .startOf('day');
    let batchToTime = moment.utc(this.availableData.times.from[id].clone()).add(1, 'day').startOf('day');

    if (!batchFromTime.isSame(fromTime)) {
      this.setState({
        fetchingInProgress: false,
        fetchingBatches: true,
      });
    } else {
      this.setState({ fetchingInProgress: true });
    }

    while (fromTime.isBefore(this.availableData.times.from[id])) {
      const statsParams = {
        geometry: requestGeometry,
        crs: crs,
        fromTime: batchFromTime,
        toTime: batchToTime,
        resolution: recommendedResolution,
        bins: 10,
      };

      if (supportStatisticalApi) {
        statsParams['output'] = STATISTICS_MANDATORY_OUTPUTS[0];
      }

      const statisticsProvider = supportStatisticalApi
        ? StatisticsProviderType.STAPI
        : StatisticsProviderType.FIS;

      let data;
      try {
        data = await refetchWithDefaultToken(
          (reqConfig) => statisticsLayer.getStats(statsParams, reqConfig, statisticsProvider),
          {
            cancelToken: this.cancelToken,
            ...(this.props.userToken ? { authToken: this.props.userToken } : {}),
          },
        );
      } catch (err) {
        this.handleRequestError(err);
      }

      if (!data) {
        break;
      }

      if (statisticsProvider === StatisticsProviderType.STAPI && data.status !== 'OK') {
        const errors = new Set();
        //try to get error message from response
        try {
          if (data.data && data.data.length > 0) {
            data.data.forEach((interval) => {
              if (interval.error) {
                errors.add(interval.error.message);
              }
            });
          }
        } catch (e) {}

        this.handleRequestError(`${getErrorFetchingDataMsg()}. ${Array.from(errors).join(' ')}`);
        break;
      }

      if (statisticsProvider === StatisticsProviderType.STAPI) {
        data = StatisticsUtils.convertToFISResponse(data.data, STATISTICS_MANDATORY_OUTPUTS[0]);
      }

      // if there are more than 2 channels in the data, we are dealing with a custom layer
      // which would mean we also have to display a legend for that layer and it is
      // pretty much impossible to do that in compare mode, as we would need at least 3
      // colors for each layer and we do not have room to display the legend anywhere,
      // it was decided to simply not allow to display these kind of layers
      if (selectedTab === TABS.COMPARE_TAB && Object.keys(data).length > 2) {
        this.setState({
          layersWithNotAvailableStats: [...this.state.layersWithNotAvailableStats, id],
        });
        return;
      }

      this.onDataReceived(batchFromTime, batchToTime, { id: id, data: data }, true);
      batchToTime = batchFromTime.clone();
      batchFromTime = moment
        .max(fromTime, this.availableData.times.from[id].clone().subtract(this.MAX_REQUEST_INTERVAL))
        .startOf('day');
    }
  };

  handleRequestError(err) {
    // try to extract a meaningful error message from response body:
    if (err.response) {
      try {
        const xmlDoc = new DOMParser().parseFromString(err.response.data, 'text/xml');
        const serverErrorMessages = xmlDoc.getElementsByTagName('ServiceException');
        const errorMsg =
          serverErrorMessages.length > 0 ? `Error: ${serverErrorMessages[0].textContent}` : err.message;
        this.setState({
          fetchingInProgress: false,
          errorMsg,
        });
        console.log(errorMsg);
      } catch (e) {
        console.log(err, e);
        this.setState({
          fetchingInProgress: false,
          errorMsg: getErrorFetchingDataMsg(),
        });
      }
    } else {
      console.log(err);
      this.setState({
        fetchingInProgress: false,
        errorMsg: getErrorFetchingDataMsg(),
      });
    }
  }

  exportCSV = () => {
    const { lineData: data, times, isCloudCoverageDataAvailable } = this.state;
    const { comparedLayers, selectedTab, datasetId, layerId, customSelected } = this.props;

    if (selectedTab === TABS.COMPARE_TAB) {
      handleZipCSVExport(data, times, isCloudCoverageDataAvailable, comparedLayers);
    } else {
      handleSingleCSVExport(data, times, isCloudCoverageDataAvailable, datasetId, layerId, customSelected);
    }
  };

  onDataReceived(fromTime, toTime, responseData, lastChannelIsCloudCoverage) {
    const { id, data } = responseData; // save available data by id
    // merge newly received data with existing:
    const lastChannelId = Object.keys(data).length > 1 ? `C${Object.keys(data).length - 1}` : null;
    for (let channelId in data) {
      // exception: if there are 2 channels then channel 'C1' is really cloud coverage info:
      if (lastChannelIsCloudCoverage && channelId === lastChannelId) {
        this.availableData.cloudCoverageData[id] = this.availableData.cloudCoverageData[id] || {
          [channelId]: [],
        };
        this.availableData.cloudCoverageData[id][channelId] =
          this.availableData.cloudCoverageData[id][channelId] || [];
        this.availableData.cloudCoverageData[id][channelId].push(...data[channelId]);
      } else {
        this.availableData.data[id] = this.availableData.data[id] || { [channelId]: [] };
        this.availableData.data[id][channelId] = this.availableData.data[id][channelId] || [];
        this.availableData.data[id][channelId].push(...data[channelId]);
      }
    }

    this.availableData.times.from[id] = fromTime;
    this.availableData.times.to[id] = moment.max(toTime, this.availableData.times.to[id]);
    // update state to trigger chart rendering:
    this.updateStateWithData();
  }

  updateStateWithData() {
    const { data } = this.availableData;

    const drawDistribution = this.shouldDrawDistribution();
    let isCloudCoverageDataAvailable = false;
    const layersWhichSupportCC = [];

    // we need to pre-process data as expected by chart lib:
    let lineData = [];
    let areaData = [];
    let allMinY = [];
    let allMaxY = [];
    let seriesIndex = 0; // remember the channel key in each point - you will need it later to colorize the series data
    Object.keys(data).forEach((id) => {
      const isCloudCoverageDataAvailableForLayer =
        this.availableData.cloudCoverageData[id] !== undefined &&
        Object.keys(this.availableData.cloudCoverageData[id]).length > 0;

      isCloudCoverageDataAvailable = isCloudCoverageDataAvailable || isCloudCoverageDataAvailableForLayer;
      if (isCloudCoverageDataAvailableForLayer) {
        layersWhichSupportCC.push(id);
      }

      const cloudCoveragePerDays = isCloudCoverageDataAvailableForLayer
        ? Object.values(this.availableData.cloudCoverageData[id])[0].reduce((partialResult, v) => {
            partialResult[v.date] = v.basicStats.mean;
            return partialResult;
          }, {})
        : {};

      const responseData = data[id];
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (let channelId in responseData) {
        const validStats = responseData[channelId].filter(
          (stat) =>
            stat.basicStats.mean !== 'NaN' &&
            !String(stat.basicStats.min).includes('Infinity') &&
            !String(stat.basicStats.max).includes('Infinity') &&
            (!drawDistribution || stat.histogram.bins.length === 10) &&
            (!isCloudCoverageDataAvailableForLayer || cloudCoveragePerDays[stat.date] <= this.maxCCAllowed),
        );

        // prettier-ignore
        const currentLineData = {
        title: `${id}-${channelId}`,
        seriesIndex,
        coordinates: validStats.map((stat, index) => ({  // eslint-disable-line no-loop-func
          date: stat.date,
          seriesIndex,
          ...stat.basicStats,
          median: drawDistribution ? stat.histogram.bins[5].lowEdge : null,
          p10: drawDistribution ? stat.histogram.bins[1].lowEdge : null,
          p90: drawDistribution ? stat.histogram.bins[9].lowEdge : null,
          cloudCoveragePercent: isCloudCoverageDataAvailableForLayer ? cloudCoveragePerDays[stat.date] * 100 : null
        }))
      }

        if (currentLineData.coordinates.length > 0) {
          lineData.push(currentLineData);
        }

        if (drawDistribution) {
          areaData.push({
            label: `${id}-${channelId}`,
            seriesIndex,
            // to draw an area, you need to supply a list of bottom coordinates + (reversed) list of top coordinates,
            // all in one list:
            coordinates: [
              // area bounds - bottom:
              ...currentLineData.coordinates.map((coord) => ({
                date: coord.date,
                value: coord.p10,
              })),
              // area bounds - top:
              ...currentLineData.coordinates.reverse().map((coord) => ({
                date: coord.date,
                value: coord.p90,
              })),
            ],
          });
        }

        // update min and max value:
        minY = Math.min(
          minY,
          validStats.reduce(
            (prevValue, stat) => Math.min(prevValue, stat.basicStats.min),
            Number.POSITIVE_INFINITY,
          ),
        );
        maxY = Math.max(
          maxY,
          validStats.reduce(
            (prevValue, stat) => Math.max(prevValue, stat.basicStats.max),
            Number.NEGATIVE_INFINITY,
          ),
        );

        allMinY.push({ id: id, value: Math.floor(minY * 100) / 100 });
        allMaxY.push({ id: id, value: Math.ceil(maxY * 100) / 100 });

        seriesIndex += 1;
      }
    });

    this.setState({
      lineData,
      areaData,
      allMinY: allMinY,
      allMaxY: allMaxY,
      dataAvailableFromTime: this.availableData.times.from,
      isCloudCoverageDataAvailable,
      layersWhichSupportCC,
      maxCCAllowed: this.maxCCAllowed,
    });
  }

  shouldDrawDistribution = () => {
    const { data: responseData } = this.availableData;
    const { visualizationUrl, customSelected, poiOrAoi } = this.props;
    if (poiOrAoi === POI_STRING) {
      return false;
    }
    if (customSelected) {
      return false;
    }
    // eocloud returns a different result, so we don't draw distribution:
    if (visualizationUrl.includes('://eocloud.sentinel-hub.com/')) {
      return false;
    }

    if (responseData['C0'] && responseData['C0'][0].histogram.bins.length !== 10) {
      return false;
    }

    return true;
  };

  renderFetching() {
    return (
      <div className="fetching">
        <i className="fa fa-cog fa-spin fa-3x fa-fw" />
        {t`Loading, please wait`}
      </div>
    );
  }

  renderIntervalButtons() {
    const { selectedTimeIntervalIndex } = this.state;
    return (
      <div className="interval-buttons">
        {this.TIME_INTERVALS.map((interval, index) => {
          return index === selectedTimeIntervalIndex ? (
            <EOBButton
              key={`interval-button-${index}`}
              text={interval.label}
              className="selected secondary"
            />
          ) : (
            <EOBButton
              key={`interval-button-${index}`}
              className="secondary"
              text={interval.label}
              onClick={() => {
                this.onIntervalChange(index);
              }}
            />
          );
        })}
      </div>
    );
  }

  renderChart(drawLegend) {
    const {
      lineData,
      areaData,
      times,
      allMinY,
      allMaxY,
      dataAvailableFromTime,
      fetchingBatches,
      maxCCAllowed,
      selectedComparedLayerIds,
    } = this.state;
    // Semiotic handles data changes badly - areas get updated, but lines and points do not (always). The
    // solution is to use React's key property on elements so they are replaced whenever any constraint
    // changes. This is the key that includes all the constraints:
    const fromTime = moment.min(Object.values(times.from));
    const toTime = moment.max(Object.values(times.to));
    const chartDataKey = `${fromTime}-${Object.values(dataAvailableFromTime ?? {})
      .map((momObject) => momObject.toISOString())
      .join(',')}-${maxCCAllowed}`;

    const minY = Math.min(
      ...(allMinY ?? [])
        .filter((minYData) => selectedComparedLayerIds.some((id) => minYData.id === id))
        .map((minYData) => minYData.value),
    );
    const maxY = Math.max(
      ...(allMaxY ?? [])
        .filter((maxYData) => selectedComparedLayerIds.some((id) => maxYData.id === id))
        .map((maxYData) => maxYData.value),
    );

    const sharedProps = {
      baseMarkProps: {
        transitionDuration: { default: 0, fill: 0, stroke: 0 },
      },
      size: [650, 320],
      xAccessor: (d) => moment(d.date),
      xExtent: [fromTime, toTime],
      yExtent: [minY, maxY],
      margin: { bottom: 50, left: 50, top: 10, right: 30 }, // otherwise axis labels are clipped on edges
    };

    const lineDataToUse = (lineData ?? []).filter((lData) =>
      selectedComparedLayerIds.some((id) => lData.title.includes(id)),
    );
    const areaDataToUse = (areaData ?? []).filter((aData) =>
      selectedComparedLayerIds.some((id) => aData.label.includes(id)),
    );

    return (
      <div>
        {(lineData ?? []).length === 0 ? (
          <span>No data found</span>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute' }}>
              <XYFrame
                key={chartDataKey} // Semiotic chart handles data changes badly - re-render the whole chart
                {...sharedProps}
                areas={areaDataToUse}
                yAccessor={'value'}
                areaDataAccessor={(d) => d.coordinates.filter((v) => moment(v.date).isSameOrAfter(fromTime))}
                areaStyle={(d) => {
                  const originalAreaData = areaData.find((aData) => aData.label === d.label);
                  return {
                    fillOpacity: 0.15,
                    fill: chooseChartSeriesColor(originalAreaData.seriesIndex, areaData.length),
                  };
                }}
              />
            </div>
            <div>
              <XYFrame
                key={chartDataKey} // Semiotic chart handles data changes badly - re-render the whole chart
                {...sharedProps}
                lines={lineDataToUse}
                yAccessor={'mean'}
                lineDataAccessor={(d) => d.coordinates.filter((v) => moment(v.date).isSameOrAfter(fromTime))}
                lineStyle={(d) => {
                  const originalLineData = lineData.find((lData) => lData.title === d.title);
                  return { stroke: chooseChartSeriesColor(originalLineData.seriesIndex, lineData.length) };
                }}
                axes={[
                  {
                    orient: 'left',
                  },
                  {
                    orient: 'bottom',
                    tickFormat: (d) => moment(d).format('D. MMM YY'),
                    ticks: 5,
                  },
                ]}
                showLinePoints={true}
                pointStyle={(d) => {
                  const originalLineData = lineData.find((lData) => lData.title === d.parentLine.title);
                  return {
                    fill: chooseChartSeriesColor(originalLineData.seriesIndex, lineData.length),
                    stroke: chooseChartSeriesColor(originalLineData.seriesIndex, lineData.length),
                  };
                }}
                hoverAnnotation={true}
                tooltipContent={(dataPoint) =>
                  this.getTooltipContent(dataPoint, this.shouldDrawDistribution())
                }
                svgAnnotationRules={svgAnnotationRules}
              />
            </div>
            {fetchingBatches && (
              <div className="fetching-small" style={{ position: 'absolute' }}>
                <i className="fa fa-cog fa-spin fa-3x fa-fw" />
              </div>
            )}
          </div>
        )}

        {drawLegend && (
          <div>
            <svg width={600} height={30} className="legend">
              {/* Semiotic's Legend only supports vertical placing of elements, so we must construct our own SVG: */}
              {lineData.map((serie, index) => {
                const DIST_HORIZ = 50;
                const DIST_VERT = 20;
                return (
                  <g
                    key={`legendpart-${index}`}
                    transform={`translate(${(DIST_HORIZ * index) % 600}, ${
                      Math.floor((DIST_HORIZ * index) / 600) * DIST_VERT
                    })`}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={10}
                      height={10}
                      rx={2}
                      ry={2}
                      fill={chooseChartSeriesColor(index, lineData.length)}
                    />
                    <text x={20} y={10}>
                      {serie.title.split('-').at(-1)}{' '}
                      {/* get last element of string which is the channel name (C0, C1, C2) */}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    );
  }

  getTooltipContent(dataPoint, drawDistribution) {
    return (
      <div>
        <div>{moment(dataPoint.date).format('ddd, DD. MMM YYYY')}</div>
        <ul>
          <li>
            {t`mean`}: {dataPoint.mean.toFixed(2)}
          </li>
          <li>
            P<sub>10</sub> - P<sub>90</sub>: {dataPoint.p10 ? dataPoint.p10.toFixed(2) : '/'}
            {' - '}
            {dataPoint.p90 ? dataPoint.p90.toFixed(2) : '/'}
          </li>
        </ul>

        <div>
          <hr />
          <ul>
            <li>
              {t`median`}: {dataPoint.median ? dataPoint.median.toFixed(2) : '/'}
            </li>
            <li>
              {' '}
              {t`st. dev.`}: {dataPoint.stDev ? dataPoint.stDev.toFixed(2) : '/'}
            </li>
            <li>
              {t`min / max`}: {dataPoint.min ? dataPoint.min.toFixed(2) : '/'} {' - '}
              {dataPoint.max ? dataPoint.max.toFixed(2) : '/'}
            </li>
          </ul>
        </div>
      </div>
    );
  }

  renderErrorMessage = () => {
    const { errorMsg, intervalIndex } = this.state;
    return (
      <div className="error-container">
        <div className="error-message">{errorMsg}</div>
        <EOBButton
          text={t`Retry`}
          icon="refresh"
          onClick={() => {
            this.onIntervalChange(intervalIndex ?? this.TIME_INTERVALS.length - 1); // fetch again with the same interval or the default one
          }}
        />
      </div>
    );
  };

  renderCCSlider = () => {
    const { customSelected, selectedTab } = this.props;
    const {
      maxCCAllowed,
      isCloudCoverageDataAvailable,
      layersWithNotAvailableStats,
      layersWhichSupportCC,
      selectedComparedLayerIds,
    } = this.state;
    const allSelectedLayersSupportCloudCoverage = selectedComparedLayerIds
      .filter((id) => !layersWithNotAvailableStats.includes(id))
      .every((id) => layersWhichSupportCC.includes(id));

    if (!isCloudCoverageDataAvailable) {
      return null;
    }

    return (
      <div
        className={`ccslider ${
          isCloudCoverageDataAvailable && !allSelectedLayersSupportCloudCoverage ? 'disabled' : ''
        }`}
      >
        <EOBCCSlider
          onChange={this.setMaxCCAllowed}
          cloudCoverPercentage={Math.round(maxCCAllowed * 100)}
          sliderWidth={100}
        />
        {isCloudCoverageDataAvailable && !allSelectedLayersSupportCloudCoverage && (
          <div className="not-all-layers-support-cc">{t`Not all selected layers support CC filtering.`}</div>
        )}
        {customSelected && selectedTab !== TABS.COMPARE_TAB && (
          <div className="last-band-msg">{t`Based on the last band of the custom script.`}</div>
        )}
      </div>
    );
  };

  toggleSelectComparedLayer = (comparedLayerId) => {
    const { selectedComparedLayerIds } = this.state;
    let newSelectedComparedLayerIds = [...selectedComparedLayerIds];

    if (selectedComparedLayerIds.includes(comparedLayerId)) {
      newSelectedComparedLayerIds = newSelectedComparedLayerIds.filter((id) => id !== comparedLayerId);
    } else {
      newSelectedComparedLayerIds.push(comparedLayerId);
    }
    this.setState({
      selectedComparedLayerIds: newSelectedComparedLayerIds,
    });
  };

  renderComparedLayers = () => {
    const { layersWithNotAvailableStats, selectedComparedLayerIds, lineData } = this.state;
    const { comparedLayers } = this.props;

    const layersToShow = comparedLayers.filter(
      (comparedLayer) => !layersWithNotAvailableStats.includes(comparedLayer.id),
    );

    return (
      <div className="compared-layers-wrapper">
        {lineData !== undefined &&
          layersToShow.map((comparedLayer) => {
            const idx = lineData.findIndex(({ title }) => title.includes(comparedLayer.id));
            const comparedLayerColor = chooseChartSeriesColor(idx, lineData.length);
            return (
              <div className="compared-layer" key={comparedLayer.id}>
                <div
                  style={{ borderBottom: `3px solid ${comparedLayerColor}`, cursor: 'pointer' }}
                  onClick={() => this.toggleSelectComparedLayer(comparedLayer.id)}
                >
                  {selectedComparedLayerIds.includes(comparedLayer.id) ? (
                    <img src={rectChecked} alt="checked" />
                  ) : (
                    <img src={rectUnchecked} alt="unchecked" />
                  )}
                </div>
                <PinPreviewImage pin={comparedLayer} />
                <div className="compared-layer-info">
                  <div>{comparedLayer.title}</div>
                  <div>
                    {t`Date`}: {constructTimespanString(comparedLayer)}
                  </div>
                  <div>
                    {t`Lat/Lon`}: {parseFloat(comparedLayer.lat).toFixed(2)},{' '}
                    {parseFloat(comparedLayer.lng).toFixed(2)} | {t`Zoom`}: {comparedLayer.zoom}
                  </div>
                </div>
              </div>
            );
          })}
        {layersWithNotAvailableStats.length > 0 && (
          <NotificationPanel
            type="info"
            msg={t`Only layers with one output channel (index) are supported in this view.`}
            className="statistics-info-notice"
          />
        )}
      </div>
    );
  };

  render() {
    const { fetchingInProgress, fetchingBatches, lineData, errorMsg } = this.state;
    const { datasetId, layerId, customSelected, selectedTab } = this.props;

    const drawLegend = selectedTab !== TABS.COMPARE_TAB && lineData && lineData.length > 1;
    return (
      <DraggableDialogBox
        className="fis"
        width={700 + (selectedTab === TABS.COMPARE_TAB ? 300 : 0)}
        height={520 + (drawLegend ? 30 : 0)}
        onClose={this.onClose}
        title={
          selectedTab === TABS.COMPARE_TAB
            ? t`Multiple layers`
            : `${getDatasetLabel(datasetId)} - ${customSelected ? 'Custom' : layerId}`
        }
        modal={true}
      >
        {this.renderCCSlider()}

        <div className="fis-content">
          {fetchingInProgress ? (
            this.renderFetching()
          ) : (
            <div className="fis-content-inner-wrapper">
              {selectedTab === TABS.COMPARE_TAB && this.renderComparedLayers()}
              <div>
                {this.renderIntervalButtons()}

                {errorMsg ? this.renderErrorMessage() : this.renderChart(drawLegend)}
              </div>
            </div>
          )}
        </div>
        {!fetchingInProgress && !fetchingBatches && !errorMsg && (lineData ?? []).length > 0 && (
          <EOBButton
            text={t`Export CSV`}
            icon="download"
            className="export-csv-button"
            onClick={this.exportCSV}
          />
        )}
      </DraggableDialogBox>
    );
  }
}

const mapStoreToProps = (store) => ({
  layerId: store.visualization.layerId,
  datasetId: store.visualization.datasetId,
  visualizationUrl: store.visualization.visualizationUrl,
  evalscript: store.visualization.evalscript,
  customSelected: store.visualization.customSelected,
  toTime: store.visualization.toTime,
  aoiGeometry: store.aoi.geometry,
  poiGeometry: store.poi.geometry,
  poiOrAoi: store.modal.params ? store.modal.params.poiOrAoi : null,
  selectedTab: store.tabs.selectedTabIndex,
  comparedLayers: store.compare.comparedLayers,
  userToken: store.auth.user.access_token,
});

export default connect(mapStoreToProps, null)(FIS);

const svgAnnotationRules = (params) => {
  const { d, xScale, yScale } = params;
  if (d.type !== 'frame-hover') {
    return null;
  }
  return (
    <circle
      key="annotation-circle"
      r={3}
      style={{ fill: 'white', stroke: 'none' }}
      cx={xScale(d.x)}
      cy={yScale(d.y)}
    />
  );
};

function chooseChartSeriesColor(lineIndex, countTotal = 3) {
  switch (lineIndex) {
    case 0:
      return countTotal === 1 ? '#ffffff' : '#ee0000';
    case 1:
      return '#00ee00';
    case 2:
      return '#0000ee';
    default:
      // note: Semiotic chart lib has problems if saturation & level are set to 100%
      let hue = 30 + lineIndex * 60;
      return `hsl(${hue}, 70%, 70%)`;
  }
}
