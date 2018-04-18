import React, { Component } from 'react'
import request from 'axios'
import { connect } from 'react-redux'
import Store from '../../store'
import './index.css'
import moment from 'moment'
import debounce from 'lodash/debounce'
import zip from 'lodash/zip'
import difference from 'lodash/difference'
import { calcBboxFromXY } from '../../utils/coords'
import DatePanel from './DatePanel'
import { sameDateDay } from './DatePanel'
import { evalSourcesMap } from '../../utils/utils'
import { reflect } from '../../utils/ajax'

const TRESHOLD_ZOOM = 6 // Stop fetching if zoom is too small
const MAX_FEATURES = 100 // Max number of returnes features by WFS
const DEBOUNCE_WAIT = 1000 // 1 second debounce wait on fetching
const NUM_FETCHING_DAYS = 7 // Batch size for fetching to avoid abusing services
const MAX_NUM_FETCHING_DAYS = 31 // Fetch atmost 1 month in past
const DATE_BAR_TOP_OFFSET = 0.35
var SEARCH_FORM_DATE_RANGE = MAX_NUM_FETCHING_DAYS

const NUM_SCENES = 'numScenes'
const WFS_URI = '?SERVICE=WFS&REQUEST=GetFeature&OUTPUTFORMAT=application/json&SRSNAME=EPSG:3857'
var CURRENTLY_FETCHING = false

const SATELITE_COLORS = {
  'Landsat 5 ESA': '#8BC34A',
  'Landsat 7 ESA': '#CDDC39',
  'Landsat 8 ESA': '#ff6407',
  'Sentinel-1 GRD': '#b6bf00',
  'Sentinel-2': '#158dab',
  'Sentinel-2 L1C': '#158dab',
  'Sentinel-2 L2A': '#158dab',
  'Sentinel-3 OLCI': '#0a2e54',
  'Envisat Meris': '#e91e2c'
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1) // deg2rad below
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

function getDataHolder(deltaDays) {
  const dataHolder = []
  for (var i = 0; i <= deltaDays; i++) {
    dataHolder.push(Array())
  }
  return dataHolder
}

function addParams(BASE_URI, params) {
  return Object.entries(params).reduce((previous, pair) => {
    const [key, value] = pair
    return `${previous}&${key}=${value}`
  }, BASE_URI)
}

function addToDate(date, numDays) {
  const newDate = new Date(date.getTime())
  newDate.setDate(date.getDate() + numDays)
  return newDate
}

function getDatesIncluding(fromDate, toDate) {
  var currentDate = new Date(fromDate.getTime())
  const map = new Map()
  while (currentDate < toDate) {
    map.set(moment(new Date(currentDate.getTime())).format(Store.current.dateFormat), 0)
    currentDate = addToDate(currentDate, 1)
  }
  return map
}

function getDatesBetween(fromDate, toDate) {
  var currentDate = moment(fromDate)
    .startOf('day')
    .toDate()
  const dates = []
  while (currentDate <= toDate) {
    dates.push(moment(currentDate).format(Store.current.dateFormat))
    currentDate = addToDate(currentDate, 1)
  }
  return dates
}

class TimeScenePicker extends Component {
  constructor(props) {
    super(props)

    const { dateFrom, dateTo, lat, lng, datasources } = Store.current

    this.fetchScenes = debounce(this.fetchScenes, DEBOUNCE_WAIT, { leading: false, trailing: true })
    this.scenePickerDateChange = this.scenePickerDateChange.bind(this)
    SEARCH_FORM_DATE_RANGE = dateTo.diff(dateFrom, 'days')

    this.state = {
      bars: getDataHolder(MAX_NUM_FETCHING_DAYS),
      toDate: dateTo.toDate(),
      fromDate: dateFrom.toDate(),
      visible: false,
      lastStoreToDate: dateTo.toDate(),
      lastStoreFromDate: dateFrom.toDate(),
      lastFetchZoom: 0,
      lastFetchPoint: [lat, lng],
      lastFetchedDatasources: []
    }
  }

  isZoomedEnough() {
    return Store.current.zoom > TRESHOLD_ZOOM
  }

  didZoomChange() {
    return this.state.lastFetchZoom != Store.current.zoom
  }

  datasourcesChanged(datasources) {
    return datasources != this.state.lastFetchedDatasources
  }

  didMoveEnough() {
    const { lat, lng, squaresPerMtr } = Store.current
    const { lastFetchPoint } = this.state

    const distance = getDistanceFromLatLonInKm(lat, lng, lastFetchPoint[0], lastFetchPoint[1])
    return distance > (squaresPerMtr[0] + squaresPerMtr[1]) / 1000
  }

  searchFormDateChanged() {
    const { dateFrom, dateTo } = Store.current
    const { lastStoreFromDate, lastStoreToDate } = this.state
    return !sameDateDay(lastStoreFromDate, dateFrom.toDate()) || !sameDateDay(lastStoreToDate, dateTo.toDate())
  }

  shouldFetchNewData() {
    const { datasources } = Store.current
    return (
      this.didZoomChange() ||
      this.didMoveEnough() ||
      this.datasourcesChanged(datasources) ||
      this.searchFormDateChanged()
    )
  }

  scenePickerDateChange(backInTime) {
    const { fromDate, toDate, lastFetchZoom } = this.state
    const { datasources } = Store.current

    var newFromDate = backInTime ? addToDate(fromDate, -SEARCH_FORM_DATE_RANGE) : addToDate(toDate, 0)
    var newToDate = backInTime ? addToDate(fromDate, 0) : addToDate(toDate, SEARCH_FORM_DATE_RANGE)

    if (newToDate > new Date()) {
      newToDate = new Date()
    }

    const deltaDays = moment(newToDate).diff(newFromDate, 'day')
    this.setState(
      {
        fromDate: newFromDate,
        toDate: newToDate
      },
      () => {
        this.fetchScenes(datasources, getDataHolder(deltaDays), newFromDate, newToDate)
      }
    )
  }

  mapToLength(map, dataSource) {
    const lengthArray = new Array()
    map.forEach((count, date, mapOb) => {
      lengthArray.push({
        date: date,
        numScenes: count,
        name: dataSource
      })
    })
    return lengthArray
  }

  handleDataSourceChange() {
    const { datasources } = Store.current
    const { lastFetchedDatasources, toDate, fromDate, bars } = this.state

    const newDataSources = difference(datasources, lastFetchedDatasources)
    const oldDataSources = difference(lastFetchedDatasources, datasources)
    const keppedBars =
      datasources.length > lastFetchedDatasources.length
        ? bars
        : bars.map(dateArray => {
            return dateArray.filter(dataSourceObject => !oldDataSources.includes(dataSourceObject['name']))
          })

    datasources.length >= lastFetchedDatasources.length &&
      this.fetchScenes(newDataSources, keppedBars, fromDate, toDate) // Fetch new datasources
    datasources.length <= lastFetchedDatasources.length &&
      this.setState({
        lastFetchedDatasources: datasources,
        bars: keppedBars
      }) // display kept datasources
  }

  handleSearchFormDateChange() {
    const { dateFrom, dateTo, datasources } = Store.current
    const { fromDate, toDate, bars } = this.state
    SEARCH_FORM_DATE_RANGE =
      dateTo.diff(dateFrom, 'days') > MAX_NUM_FETCHING_DAYS ? MAX_NUM_FETCHING_DAYS : dateTo.diff(dateFrom, 'days')

    const fromDateLimited =
      moment(dateTo).diff(moment(dateFrom), 'day') > MAX_NUM_FETCHING_DAYS
        ? moment(addToDate(dateTo.toDate(), -MAX_NUM_FETCHING_DAYS))
        : dateFrom

    const previousDates = getDatesBetween(fromDate, toDate)
    const newDates = getDatesBetween(fromDateLimited.toDate(), dateTo.toDate())
    const fetchDates = difference(newDates, previousDates)

    const startIndex = previousDates.findIndex(date => date === newDates[0])
    const endIndex = previousDates.findIndex(date => date === newDates[newDates.length - 1])

    const updatedBars =
      startIndex === -1 && endIndex === -1
        ? []
        : bars.slice(startIndex === -1 ? 0 : startIndex, endIndex === -1 ? previousDates.length : endIndex + 1)

    if (fetchDates.length === 0) {
      this.setState({
        lastStoreFromDate: dateFrom.toDate(),
        fromDate: fromDateLimited.toDate(),
        lastStoreToDate: dateTo.toDate(),
        toDate: dateTo.toDate(),
        bars: updatedBars
      })
    } else {
      const fetchFromDate = moment(fetchDates[0], Store.current.dateFormat).toDate()
      const fetchToDate = moment(fetchDates[fetchDates.length - 1], Store.current.dateFormat).toDate()

      const finalBars =
        moment(fetchToDate)
          .startOf('day')
          .toDate() < fromDate
          ? getDataHolder(fetchDates.length - 1).concat(updatedBars) // From date changed -> add empty bars in the beginning
          : updatedBars.concat(getDataHolder(fetchDates.length - 1)) // From date didn't change ->  add empty bars in the end

      this.setState(
        {
          lastStoreFromDate: dateFrom.toDate(),
          fromDate: fromDateLimited.toDate(),
          lastStoreToDate: dateTo.toDate(),
          toDate: dateTo.toDate()
        },
        () => this.fetchScenes(datasources, finalBars, fetchFromDate, fetchToDate)
      )
    }
  }

  componentWillUpdate() {
    const { datasources } = Store.current
    const { visible, lastFetchZoom, toDate, fromDate } = this.state

    if (datasources.length > 0 && !CURRENTLY_FETCHING && this.isZoomedEnough() && this.shouldFetchNewData()) {
      this.datasourcesChanged(datasources) && this.handleDataSourceChange()

      this.searchFormDateChanged() && this.handleSearchFormDateChange()

      !this.datasourcesChanged(datasources) &&
        !this.searchFormDateChanged() &&
        this.fetchScenes(datasources, getDataHolder(moment(toDate).diff(moment(fromDate), 'day')), fromDate, toDate)
    }
    // If user zooms out of fetch treshold hide scene picker
    if (visible && (!this.isZoomedEnough() || datasources.length == 0)) {
      CURRENTLY_FETCHING = false
      this.setState({
        visible: false,
        lastFetchZoom: 0
      })
    }
  }

  fetchScenes(diffDataSources, dataHolder, fromDate, toDate) {
    CURRENTLY_FETCHING = true
    const { lat, lng, dateFormat, datasources, datasource, zoom } = Store.current

    this.setState({
      lastFetchZoom: zoom,
      lastFetchPoint: [lat, lng],
      lastFetchedDatasources: datasources,
      visible: true,
      bars: dataHolder
    })

    const self = this
    this.getAllScenes(fromDate, toDate, diffDataSources, dataHolder).then(function() {
      const zoomChanged = self.didZoomChange()
      CURRENTLY_FETCHING = false
      !zoomChanged &&
        self.setState({
          visible: true
        })
    })
  }

  // returns all scenes from all datasources in timeScenePicker's [fromDate - toDate]
  async getAllScenes(fromDate, toDate, datasources, datasourceData) {
    if (fromDate > toDate || this.shouldFetchNewData()) return datasourceData

    const tempDate = addToDate(toDate, -NUM_FETCHING_DAYS) // Batching
    const newFromDate = tempDate < fromDate ? fromDate : addToDate(tempDate, 1)
    const self = this
    return await this.getScenesForDatasources(datasources, newFromDate, toDate).then(function(data) {
      zip(...data).forEach(newData => {
        const date = newData.reduce((acc, current) => (current ? current['date'] : acc), '') // extract date
        const fixedData = newData.map(x => (x ? x : { date: date, numScenes: 0, dataSource: '' })) // fix undefined data (server error)
        const dataDate = moment(date, Store.current.dateFormat).startOf('day')
        const ix = dataDate.diff(moment(self.state.fromDate).startOf('day'), 'day')
        datasourceData[ix] = datasourceData[ix].concat(fixedData)
      })
      self.setState({
        bars: datasourceData
      })
      return self.getAllScenes(fromDate, tempDate, datasources, datasourceData)
    })
  }

  // Wrapper for fetching in batches of NUM_FETCHING_DAYS for performance
  async getScenesForDatasources(remove, fromDate, toDate) {
    const { dateFormat, zoom, lat, lng } = Store.current
    const bboxParam = calcBboxFromXY({ lat, lng, zoom })
    const timeParam = `${moment(fromDate).format(dateFormat)}/${moment(toDate).format(dateFormat)}/P1D`
    const { instances, datasources } = Store.current
    const visibleInstances = instances.filter(inst => datasources.includes(inst.name))

    const promises = visibleInstances.map(inst => {
      const wmsUrl = inst.baseUrl
      const WFS_URL = wmsUrl.replace('wms', 'wfs') + WFS_URI
      const scenesURI = addParams(WFS_URL, {
        BBOX: bboxParam,
        TIME: timeParam,
        TYPENAME: evalSourcesMap[inst.name] + '.TILE'
      })
      return this.getScenes(scenesURI, [], 0)
    })

    return await Promise.all(promises.map(reflect)).then(
      obj => {
        let datas = obj.filter(x => x.success).map(x => x.data)
        return datas.map((features, ix) => {
          const map = getDatesIncluding(fromDate, toDate)
          features.forEach(feature => {
            const date = feature['properties']['date']
            map.set(date, (map.get(date) || 0) + 1)
          })
          return this.mapToLength(map, datasources[ix])
        })
      },
      e => {
        return []
      }
    ) // TODO display some error?
  }

  // Actualy perform a WFS request with constructed URI
  async getScenes(scenesURI, scenesAcc, offset) {
    const offsetURI = addParams(scenesURI, {
      FEATURE_OFFSET: offset
    })
    const self = this
    return await request
      .get(offsetURI)
      .then(res => {
        const scenes = scenesAcc.concat(res.data.features)
        if (res.data.features.length < MAX_FEATURES || self.shouldFetchNewData()) {
          return scenes
        } else {
          return self.getScenes(scenesURI, scenes, offset + MAX_FEATURES)
        }
      })
      .catch(e => {
        console.error(e)
      })
  }

  render() {
    const { bars, fromDate, toDate, ixHover } = this.state
    const dateCounts = bars.map(l => l.reduce((acc, obj) => acc + obj[NUM_SCENES], 0))
    const dates = getDatesBetween(fromDate, toDate)
    const numDays = bars.length
    const barWidth = 100 / numDays
    const maxNumScenes = Math.max.apply(Math, dateCounts)

    return this.state.visible ? (
      <div>
        <div className="time-slider holder">
          {CURRENTLY_FETCHING ? <i className="loading-wheel fa fa-cog fa-spin fa-2x fa-fw" /> : null}
          {bars.map((x, i) => (
            <DatasourcesStackBar
              totalCount={dateCounts[i]}
              bars={bars[i]}
              height={dateCounts[i] / maxNumScenes * 100}
              width={barWidth}
              ix={i}
              key={i}
            />
          ))}
        </div>
        <DatePanel dates={dates} width={barWidth} dateRange={[fromDate, toDate]} onClick={this.scenePickerDateChange} />
      </div>
    ) : null
  }
}

class DatasourcesStackBar extends Component {
  constructor(props) {
    super(props)

    this.toggleHover = this.toggleHover.bind(this)
    this.state = {
      hover: false
    }
  }

  toggleHover(hover, count, ds) {
    this.setState({
      hover: hover,
      popoverCount: count,
      datasource: ds
    })
  }

  render() {
    const { ix, width, height, totalCount, bars } = this.props
    const { hover, datasource, popoverCount } = this.state

    const leftStart = width / 2 + ix * width - width / 2
    const leftCenter = width > 10 ? (width - 10) / 2 : -(10 - width) / 2

    return (
      <div className="barWrapper" style={{ width: width + '%' }}>
        {this.state.hover && (
          <div className="popover-info" style={{ left: leftStart + leftCenter + '%' }}>
            {datasource} - {popoverCount} scenes
          </div>
        )}

        {bars.map((dataSource, i) => {
          const relativeHeight = dataSource[NUM_SCENES] * height / totalCount || 0

          const inverseBonusHeight = (100 - (height == 0 ? 100 : height)) * 0.12 // Give extra height to tiny bars (so they can be hovered)
          const actualHeight =
            dataSource[NUM_SCENES] == 0 ? 0 : relativeHeight - DATE_BAR_TOP_OFFSET * relativeHeight + inverseBonusHeight

          return (
            <DataSourceBar
              toggleHover={this.toggleHover}
              key={i}
              numScenes={dataSource[NUM_SCENES]}
              dataSource={dataSource['name']}
              height={actualHeight}
            />
          )
        })}
      </div>
    )
  }
}

class DataSourceBar extends Component {
  state = {
    hover: false
  }

  toggleBar(hover) {
    const { dataSource, numScenes, toggleHover } = this.props
    this.setState({
      hover: hover
    })
    toggleHover(hover, numScenes, dataSource)
  }

  render() {
    const { dataSource, y, height, numScenes } = this.props
    const { hover } = this.state

    const rectStyle = {
      background: SATELITE_COLORS[dataSource],
      opacity: hover ? 1 : 0.5,
      height: height + '%'
    }

    return numScenes == 0 ? (
      <div />
    ) : (
      <div
        onMouseEnter={() => this.toggleBar(true)}
        onMouseLeave={() => this.toggleBar(false)}
        className="bar"
        style={rectStyle}
      />
    )
  }
}

export default connect(store => store)(TimeScenePicker)
