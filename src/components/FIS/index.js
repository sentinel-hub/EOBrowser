import React, { Component } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import request from 'axios';
import Rodal from 'rodal';
import Terraform from 'terraformer';
import WKT from 'terraformer-wkt-parser';
import { XYFrame } from 'semiotic';
import { getRecommendedResolution } from '../../utils/coords';
import './FIS.scss';
import Store from '../../store';
import Button from '../Button';
import CCSlider from '../CCSlider';
import { isCustomPreset } from '../../utils/utils';

const tooltipContent = (dataPoint, drawDistribution) => (
  <div>
    <div>{moment(dataPoint.date).format('ddd, DD. MMM YYYY')}</div>
    <ul>
      <li>mean: {dataPoint.mean.toFixed(2)}</li>
      {drawDistribution && (
        <li>
          P<sub>10</sub> / P<sub>90</sub>: {dataPoint.p10.toFixed(2)} {dataPoint.p90.toFixed(2)}
        </li>
      )}
    </ul>
    {drawDistribution && (
      <div>
        <hr />
        <ul>
          <li>median: {dataPoint.median.toFixed(2)}</li>
          <li>st. dev.: {dataPoint.stDev.toFixed(2)}</li>
          <li>
            min / max: {dataPoint.min.toFixed(2)} {dataPoint.max.toFixed(2)}
          </li>
        </ul>
      </div>
    )}
  </div>
);

const svgAnnotationRules = params => {
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

export const getFisShadowLayer = (instanceName, originalLayerId) => {
  const { fisShadowLayers } = Store.current;
  if (!fisShadowLayers[instanceName]) {
    return null;
  }
  return fisShadowLayers[instanceName].find(
    l => l.id === `__FIS_${originalLayerId}` || l.name === `__FIS_${originalLayerId}`,
  );
};

export default class FIS extends Component {
  TIME_INTERVALS = [
    { label: '5 years', duration: moment.duration(5, 'year') },
    { label: '2 years', duration: moment.duration(2, 'year') },
    { label: '1 year', duration: moment.duration(1, 'year') },
    { label: '6 months', duration: moment.duration(6, 'month') },
    { label: '3 months', duration: moment.duration(3, 'month') },
    { label: '1 month', duration: moment.duration(1, 'month') },
  ];
  MAX_REQUEST_RETRY = 1; // 0 => do not retry
  MAX_REQUEST_INTERVAL = moment.duration(2, 'month');

  fromDate = null; // currently selected time span
  toDate = null;
  requestInProgress = null;
  availableData = null;
  maxCCAllowed = 1.0;

  constructor(props) {
    super(props);

    const { selectedResult, presets } = Store.current;
    const layerName = isCustomPreset(selectedResult.preset)
      ? 'custom'
      : presets[selectedResult.name].find(layer => layer.id === selectedResult.preset).name;
    const selectedTimeIntervalIndex = this.TIME_INTERVALS.length - 1; // shortest interval by default, then user can request more
    this.toDate = moment(selectedResult.time);
    this.fromDate = this.toDate.clone().subtract(this.TIME_INTERVALS[selectedTimeIntervalIndex].duration);
    this.state = {
      fetching: true,
      title: `${selectedResult.name} - ${layerName}`,
      selectedTimeIntervalIndex,
      fromDate: this.fromDate,
      toDate: this.toDate,
      maxCCAllowed: 1.0,
    };
    this.availableData = {
      fromDate: this.toDate, // we don't have any data yet, so from == to
      toDate: this.toDate,
      data: {},
      cloudCoverageData: [],
    };
  }

  componentWillMount() {
    this.ensureAllDataAvailable();
  }

  onIntervalChange(newIntervalIndex) {
    this.fromDate = this.toDate.clone().subtract(this.TIME_INTERVALS[newIntervalIndex].duration);
    this.setState({
      selectedTimeIntervalIndex: newIntervalIndex,
      fromDate: this.fromDate,
      toDate: this.toDate,
    });
    this.ensureAllDataAvailable();
  }

  ensureAllDataAvailable() {
    // if we are already fetching something, just do nothing and wait until fetch is over; this
    // function will be called again when fetching completes (successfully).
    if (this.requestInProgress !== null) {
      return;
    }

    // check if there is some piece of data missing, and if so, issue a request for it:
    if (this.fromDate.isBefore(this.availableData.fromDate)) {
      // fromDate is lower than what we have - request new data
      this.setState({
        fetching: true,
        errorMsg: null,
      });
      // we don't want to fetch a huge interval all at once - construct a smaller interval to be fetched:
      // (the rest will be fetched in subsequent requests, until all data is available)
      const fetchFromDate = moment.max(
        this.fromDate,
        this.availableData.fromDate.clone().subtract(this.MAX_REQUEST_INTERVAL),
      );
      this.requestFISData(fetchFromDate, this.availableData.fromDate);
      return;
    }

    // all data is available and no request is in progress:
    this.setState({
      fetching: false,
    });
  }

  requestFISData(fromDate, toDate) {
    if (this.requestInProgress === null) {
      // this is the first time we are issuing this request
      const { url, params } = this.constructRequestParameters(fromDate, toDate);
      this.requestInProgress = {
        url,
        params,
        try: 0,
      };
    } else {
      this.requestInProgress.try++; // we have failed on previous fetch, let's try again
    }

    // start request:
    request
      .post(this.requestInProgress.url, this.requestInProgress.params)
      .then(res => {
        const lastChannelIsCloudCoverage =
          !this.requestInProgress.params.evalscript && !this.requestInProgress.params.evalscripturl;
        this.requestInProgress = null;
        this.onDataReceived(fromDate, toDate, res.data, lastChannelIsCloudCoverage);
        this.ensureAllDataAvailable(); // this might not be the last interval needed
      })
      .catch(e => {
        console.log(e);
        if (this.requestInProgress.try < this.MAX_REQUEST_RETRY) {
          console.log('Error fetching data, retrying...', e);
          this.requestFISData(null, null);
        } else {
          this.handleRequestError(e);
        }
      });
  }

  constructRequestParameters(fromDate, toDate) {
    const { poi, aoiBounds, presets, selectedResult } = Store.current;
    const area = this.props.aoiOrPoi === 'aoi' ? aoiBounds : poi.polygon;
    const geom = WKT.convert(new Terraform.Primitive(cloneDeep(area.geometry)));
    const resolution = getRecommendedResolution(area.geometry);

    const url = selectedResult.baseUrls.FIS;
    let layerId;
    const isCustomLayer = isCustomPreset(selectedResult.preset);
    if (isCustomLayer) {
      layerId = presets[selectedResult.name][0].id; // any available layer on this datasource will be fine
    } else {
      // if this layer has its "shadow FIS layer" then we should use it instead of the original layer:
      const originalLayerId = selectedResult.preset;
      const shadowLayerInfo = getFisShadowLayer(selectedResult.name, originalLayerId);
      layerId = shadowLayerInfo ? shadowLayerInfo.id : originalLayerId;
    }

    let params = {
      layer: layerId,
      crs: 'CRS:84',
      time: `${fromDate.format('YYYY-MM-DD')}/${toDate.format('YYYY-MM-DD')}`,
      resolution: `${resolution}m`,
      geometry: geom,
      bins: 10,
      type: 'EQUALFREQUENCY',
      maxcc: 100,
    };
    if (isCustomLayer) {
      if (Store.current.isEvalUrl) {
        params['evalscripturl'] = selectedResult.evalscripturl;
      } else {
        params['evalscript'] = selectedResult.evalscript;
      }
      // note that server doesn't use these for evalscript-ed layers, but let's be consistent with how we do things elsewhere:
      params['gain'] = selectedResult.gain ? selectedResult.gain : '';
      params['gamma'] = selectedResult.gamma ? selectedResult.gamma : '';
      params['atmfilter'] = selectedResult.atmFilter ? selectedResult.atmFilter : '';
    }

    return {
      url,
      params,
    };
  }

  handleRequestError(err) {
    // try to extract a meaningful error message from response body:
    if (err.response) {
      try {
        const xmlDoc = new DOMParser().parseFromString(err.response.data, 'text/xml');
        const serverErrorMessages = xmlDoc.getElementsByTagName('ServiceException');
        const errorMsg =
          serverErrorMessages.length > 0 ? `Error: ${serverErrorMessages[0].textContent}` : err.message;
        this.setState({
          fetching: false,
          errorMsg,
        });
        console.log(errorMsg);
      } catch (e) {
        console.log(err, e);
        this.setState({
          fetching: false,
          errorMsg: 'Error fetching data',
        });
      }
    } else {
      console.log(err);
      this.setState({
        fetching: false,
        errorMsg: 'Error fetching data',
      });
    }
  }

  onDataReceived(fromDate, toDate, responseData, lastChannelIsCloudCoverage) {
    // merge newly received data with existing:
    const lastChannelId =
      Object.keys(responseData).length > 1 ? `C${Object.keys(responseData).length - 1}` : null;
    for (let channelId in responseData) {
      // exception: if there are 2 channels then channel 'C1' is really cloud coverage info:
      if (lastChannelIsCloudCoverage && channelId === lastChannelId) {
        this.availableData.cloudCoverageData.push(...responseData[channelId]);
      } else {
        this.availableData.data[channelId] = this.availableData.data[channelId] || [];
        this.availableData.data[channelId].push(...responseData[channelId]);
      }
    }

    this.availableData.fromDate = fromDate;
    this.availableData.toDate = moment.max(toDate, this.availableData.toDate);
    // update state to trigger chart rendering:
    this.updateStateWithData();
  }

  setMaxCCAlowed = valuePercent => {
    this.maxCCAllowed = valuePercent / 100.0;
    this.updateStateWithData();
  };

  updateStateWithData() {
    const { data: responseData } = this.availableData;

    const isCloudCoverageDataAvailable = this.availableData.cloudCoverageData.length > 0;
    const cloudCoveragePerDays = this.availableData.cloudCoverageData.reduce((partialResult, v) => {
      partialResult[v.date] = v.basicStats.mean;
      return partialResult;
    }, {});

    // we need to pre-process data as expected by chart lib:
    let lineData = [];
    let areaData = [];
    let seriesIndex = 0; // remember the channel key in each point - you will need it later to colorize the series data
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let channelId in responseData) {
      const validStats = responseData[channelId].filter(
        stat =>
          stat.basicStats.mean !== 'NaN' &&
          (!this.props.drawDistribution || stat.histogram.bins.length === 10) &&
          (!isCloudCoverageDataAvailable || cloudCoveragePerDays[stat.date] <= this.maxCCAllowed),
      );

      // prettier-ignore
      const currentLineData = {
        title: channelId,
        coordinates: validStats.map((stat, index) => ({  // eslint-disable-line no-loop-func
          date: stat.date,
          seriesIndex,
          ...stat.basicStats,
          median: this.props.drawDistribution ? stat.histogram.bins[5].lowEdge : null,
          p10: this.props.drawDistribution ? stat.histogram.bins[1].lowEdge : null,
          p90: this.props.drawDistribution ? stat.histogram.bins[9].lowEdge : null,
        }))
      }

      if (currentLineData.coordinates.length > 0) {
        lineData.push(currentLineData);
      }

      if (this.props.drawDistribution) {
        areaData.push({
          label: channelId,
          seriesIndex,
          // to draw an area, you need to supply a list of bottom coordinates + (reversed) list of top coordinates,
          // all in one list:
          coordinates: [
            // area bounds - bottom:
            ...currentLineData.coordinates.map(coord => ({
              date: coord.date,
              value: coord.p10,
            })),
            // area bounds - top:
            ...currentLineData.coordinates.reverse().map(coord => ({
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

      seriesIndex += 1;
    }

    this.setState({
      lineData,
      areaData,
      minY,
      maxY,
      dataAvailableFromDate: this.availableData.fromDate,
      isCloudCoverageDataAvailable,
      maxCCAllowed: this.maxCCAllowed,
    });
  }

  chooseChartSeriesColor(lineIndex, countTotal = 3) {
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

  renderFetching() {
    return (
      <div className="fetching">
        <i className="fa fa-cog fa-spin fa-3x fa-fw" />Loading, please wait
      </div>
    );
  }

  renderIntervalButtons() {
    const { selectedTimeIntervalIndex } = this.state;
    return (
      <div className="interval-buttons">
        {this.TIME_INTERVALS.map((interval, index) => {
          return index === selectedTimeIntervalIndex ? (
            <Button key={`interval-button-${index}`} text={interval.label} className="selected" />
          ) : (
            <Button
              key={`interval-button-${index}`}
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

  renderErrorMessage() {
    const { errorMsg } = this.state;
    return (
      <div>
        <div className="error-message">{errorMsg}</div>
        <Button
          text="Retry"
          icon="refresh"
          onClick={() => {
            this.ensureAllDataAvailable();
          }}
        />
      </div>
    );
  }

  renderChart(drawLegend) {
    const {
      lineData,
      areaData,
      fromDate,
      toDate,
      minY,
      maxY,
      dataAvailableFromDate,
      fetching,
      maxCCAllowed,
    } = this.state;
    // Semiotic handles data changes badly - areas get updated, but lines and points do not (always). The
    // solution is to use React's key property on elements so they are replaced whenever any constraint
    // changes. This is the key that includes all the constraints:
    const chartDataKey = `${fromDate}-${dataAvailableFromDate}-${maxCCAllowed}`;
    const sharedProps = {
      size: [650, 320],
      xAccessor: d => moment(d.date),
      xExtent: [moment(fromDate), moment(toDate)],
      yExtent: [minY, maxY],
      margin: { bottom: 50, left: 50, top: 10, right: 30 }, // otherwise axis labels are clipped on edges
    };
    return (
      <div>
        {Object.keys(lineData).length === 0 ? (
          <span>No data found</span>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute' }}>
              <XYFrame
                key={chartDataKey} // Semiotic chart handles data changes badly - re-render the whole chart
                {...sharedProps}
                areas={areaData}
                yAccessor={'value'}
                areaDataAccessor={d => d.coordinates.filter(v => moment(v.date).isSameOrAfter(fromDate))}
                areaStyle={d => ({
                  fillOpacity: 0.15,
                  fill: this.chooseChartSeriesColor(d.seriesIndex, lineData.length),
                })}
                areaExtent={[0.0, 1.0]}
              />
            </div>
            <div>
              <XYFrame
                key={chartDataKey} // Semiotic chart handles data changes badly - re-render the whole chart
                {...sharedProps}
                lines={lineData}
                yAccessor={'mean'}
                lineDataAccessor={d => d.coordinates.filter(v => moment(v.date).isSameOrAfter(fromDate))}
                lineStyle={d => ({ stroke: this.chooseChartSeriesColor(d.key, lineData.length) })}
                axes={[
                  {
                    orient: 'left',
                  },
                  {
                    orient: 'bottom',
                    tickFormat: d => moment(d).format('D. MMM YY'),
                    ticks: 5,
                  },
                ]}
                showLinePoints={true}
                pointStyle={d => ({
                  fill: this.chooseChartSeriesColor(d.seriesIndex, lineData.length),
                  stroke: this.chooseChartSeriesColor(d.seriesIndex, lineData.length),
                })}
                hoverAnnotation={true}
                tooltipContent={dataPoint => tooltipContent(dataPoint, this.props.drawDistribution)}
                svgAnnotationRules={svgAnnotationRules}
              />
            </div>
            {fetching && (
              <div className="fetching-small" style={{ position: 'absolute' }}>
                <i className="fa fa-cog fa-spin fa-3x fa-fw" />
              </div>
            )}
          </div>
        )}

        {drawLegend && (
          <div>
            <svg width={600} height={50} className="legend">
              {/* Semiotic's Legend only supports vertical placing of elements, so we must construct our own SVG: */}
              {lineData.map((serie, index) => {
                const DIST_HORIZ = 50;
                const DIST_VERT = 20;
                return (
                  <g
                    key={`legendpart-${index}`}
                    transform={`translate(${(DIST_HORIZ * index) % 600}, ${Math.floor(
                      DIST_HORIZ * index / 600,
                    ) * DIST_VERT})`}
                  >
                    <rect
                      x={0}
                      y={0}
                      width={10}
                      height={10}
                      rx={2}
                      ry={2}
                      fill={this.chooseChartSeriesColor(index, lineData.length)}
                    />
                    <text x={20} y={10}>
                      {serie.title}
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

  renderTitleBar() {
    const { title, maxCCAllowed, isCloudCoverageDataAvailable } = this.state;
    if (!isCloudCoverageDataAvailable) {
      return null;
    }
    return (
      <div className="titleBar">
        <h3 className="title">{title}</h3>
        <div className="ccslider">
          <CCSlider
            onChange={this.setMaxCCAlowed}
            cloudCoverPercentage={Math.round(maxCCAllowed * 100)}
            sliderWidth={100}
          />
        </div>
      </div>
    );
  }

  render() {
    const { fetching, errorMsg, lineData } = this.state;
    const drawLegend = lineData && lineData.length > 1;
    return (
      <Rodal
        animation="slideUp"
        visible={true}
        width={700}
        height={460 + (drawLegend ? 30 : 0)}
        onClose={this.props.onClose}
      >
        <div className="fis">
          {this.renderTitleBar()}

          <div className="content">
            {fetching && !lineData ? (
              this.renderFetching()
            ) : (
              <div>
                {this.renderIntervalButtons()}

                {errorMsg ? this.renderErrorMessage() : this.renderChart(drawLegend)}
              </div>
            )}
          </div>
        </div>
      </Rodal>
    );
  }
}
