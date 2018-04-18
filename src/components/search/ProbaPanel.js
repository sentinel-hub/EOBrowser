import React from 'react';
import PropTypes from 'prop-types';
import NotificationPanel from '../NotificationPanel'
import DatePicker from '../DatePicker'
import moment from 'moment'
import Toggle from 'react-toggle'
import last from 'lodash/last'

class ProbaLayer extends React.Component {

  constructor(props) {
    super(props)
    const firstLayer = this.props.probaLayer.wmtsParams.additionalParams.layers[0]
    this.state = {
      open: false,
      show: false,
      zoom: this.props.zoom,
      date: last(this.props.probaLayers[firstLayer].dates),
      activeLayer: firstLayer,
    }
  }

  componentWillReceiveProps(props) {
    if (this.state.zoom !== props.zoom) {
      this.setState({zoom: props.zoom})
    }
  }

  getProbaLayers = () => (
      <select defaultValue={this.state.activeLayer}
              onChange={this.changeDSSelection}>
        {this.props.probaLayer.options.additionalParams.layers.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
  )

  changeDSSelection = (e) => {
    const layer = e.target.value,
          activeLayerDates = this.props.probaLayers[layer].dates,
          date  = activeLayerDates.includes(moment(this.state.date).format("YYYY-MM-DD")) ? this.state.date : last(activeLayerDates)
    this.setState({
      activeLayer: layer,
      date: date
    }, this.update)
  }
  update = () => {
    this.props.onChange && this.props.onChange(this.state)
  }

  changeDate = (e) => {
    this.setState({date: e}, this.update)
  }

  onDay = (props) => {
    if (this.props.probaLayers[this.state.activeLayer].dates.includes(props.dateMoment.format("YYYY-MM-DD"))) {
      props.className += ' hasData'
    }
    return props
  }

  render() {
    let {options} = this.props.probaLayer
    let {[this.state.activeLayer]: {
      dates
    }} = this.props.probaLayers
    return <div className="probaPanel">
      <b>Show Proba-V</b>
      <Toggle
        checked={this.state.show}
        onChange={e => this.setState({show: Boolean(e.target.checked)}, this.update)}
      /><br />
      <label>Layer: </label>{this.getProbaLayers()}<br />
      <label>Date: </label>
      <DatePicker
        noHighlight={true}
        key='dateTo'
        ref='dateTo'
        onNavClick={() => {}}
        onExpand={() => {}}
        minDate={dates[0]}
        maxDate={last(dates)}
        className="inlineDatepicker"
        value={this.state.date}
        defaultValue={this.state.date}
        onDay={this.onDay}
        onSelect={this.changeDate}/>
      {this.state.zoom > options.maxZoom && this.state.show && <NotificationPanel msg="Zoom out to view Proba-V." type="info" />}
    </div>
  }
}
ProbaLayer.PropTypes = {
  zoom: PropTypes.number.isRequired,
  probaLayer: PropTypes.object.isRequired,
  probaLayers: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

export default ProbaLayer