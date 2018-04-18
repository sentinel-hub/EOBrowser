import React, { Component } from 'react';
import RootMap from './components/Map';
import Tools from './components/Tools';
import SearchBox from './components/SearchBox';
import {
  loadGetCapabilities,
  loadProbaCapabilities,
  reflect,
  loginAndLoadInstances
} from './utils/ajax';
import { getPolyfill } from './utils/utils';
import Rodal from 'rodal';
import 'rodal/lib/rodal.css';
import NotificationPanel from './components/NotificationPanel';
import DummyIcon from './components/DummyIcon';
import Store from './store';
import { connect } from 'react-redux';
import AlertContainer from 'react-alert';
// import TimeScenePicker from "./components/scenes"

import './App.scss';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      toolsVisible: true,
      error: '',
      newLocation: false,
      isCompare: false,
      user: {}
    };
    getPolyfill();
  }
  alertOptions = {
    offset: 14,
    position: 'bottom left',
    theme: 'dark',
    time: 5000,
    transition: 'scale'
  };

  showAlert = () => {
    this.msg.show('Some text or component', {
      time: 2000,
      type: 'success',
      icon: <img src="path/to/some/img/32x32.png" alt="" />
    });
  };

  onResize = () => {
    Store.setSize([window.innerWidth, window.innerHeight]);
  };

  fetchLayers() {
    let promises = [];
    Store.current.instances.forEach(instance => {
      promises.push(loadGetCapabilities(instance));
    });
    Promise.all(promises.map(reflect))
      .then(obj => {
        this.handleNewHash();
        const okInstances = obj.filter(x => x.success);
        const insts = Store.current.instances.filter(inst =>
          okInstances.find(inst2 => inst2.name === inst.data)
        );
        this.setState({ isLoaded: true, isModal: false });
        Store.setInstances(insts);
      })
      .catch(e => {
        this.setState({ error: e.message, isLoaded: true, isModal: false });
      });
    Promise.race(promises).then(instName => {
      this.setState({ isLoaded: true, isModal: false });
    });
  }

  setMapLocation = data => {
    const { lat, lng } = data.location;
    Store.setMapView({ lat, lng, update: true });
  };

  onFinishSearch = res => {
    this._map.refs.wrappedInstance.clearPolygons();
    if (res === undefined || res.length === 0) {
      return;
    }
    this._map.refs.wrappedInstance.showPolygons(res);
    this.setState({ newLocation: false });
  };

  getUrlPosition = () => {
    const { lat, lng, zoom } = this.getUrlParams();
    if (lat || lng) {
      const location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        zoom: parseInt(zoom, 10),
      };
      Store.setMapView({ ...location, update: true });
    }
  };

  getUrlParams() {
    let path = window.location.hash.replace(/^#\/?|\/$/g, '');
    let params = path.split('&');
    const paramMap = {};
    params.forEach(kv => {
      let [key, value] = kv.split('=');
      return (paramMap[key] = window.decodeURIComponent(value));
    });
    return paramMap;
  }

  handleNewHash = async () => {
    const {
      instanceId,
      datasource,
      preset,
      time,
      evalscript = '',
      evalscripturl = '',
      gain,
      gamma,
      atmFilter,
      layers
    } = this.getUrlParams();
    const parsedLayers =
      preset === 'CUSTOM' ? this.parseLayers(layers) : preset;
    const selectedResult = {
      datasource,
      preset,
      time,
      evalscript: window.decodeURIComponent(evalscript),
      evalscripturl,
      gain: gain ? parseFloat(gain) : undefined,
      gamma: gamma ? parseFloat(gamma) : undefined,
      atmFilter,
      layers: parsedLayers
    };
    const instance = Store.current.instances.find(
      inst => inst.name === datasource
    );
    let location = {};
    if (instance) {
      Store.setTabIndex(2);
      Store.setSelectedResult({
        activeLayer: instance,
        ...instance,
        ...selectedResult,
        ...location
      });
    } else if (instanceId) {
      try {
        const userInstances = await loginAndLoadInstances();
        const selectedInstance = userInstances.find(
          inst => inst['@id'] === instanceId
        );
        if (!selectedInstance) {
          this.setState({ error: "You don't access to this instance." });
          return;
        }
        await loadGetCapabilities(selectedInstance);
        Store.setTabIndex(2);
        Store.setDatasources([selectedInstance.name]);
        Store.setSelectedResult({
          activeLayer: selectedInstance,
          ...selectedResult,
          datasource: selectedInstance.name,
          ...location
        });
      } catch (e) {
        this.setState({ error: "You don't access to this instance." });
      }
    }
    this.getUrlPosition();
  };

  parseLayers(value) {
    if (!value) return null;
    const [r, g, b] = value.split(','),
      layers = { r, g, b };
    return layers;
  }

  onHoverTile = i => {
    this._map.refs.wrappedInstance.highlightTile(i);
  };
  onZoomToPin = item => {
    this._map.refs.wrappedInstance.onZoomToPin(item);
  };
  onZoomTo = () => {
    this._map.refs.wrappedInstance.zoomToActivePolygon();
  };
  onCompareChange = isCompare => {
    this.setState({ isCompare: isCompare });
  };
  onOpacityChange = (opacity, index) => {
    Store.setPinOpacity(index, opacity);
    this._map.refs.wrappedInstance.setOverlayParams(opacity, index);
  };
  pinOrderChange = (oldIndex, newIndex) => {
    this._map.refs.wrappedInstance.changeCompareOrder(oldIndex, newIndex);
  };
  onClearData = () => {
    this._map.refs.wrappedInstance.clearPolygons();
  };

  componentWillMount() {
    loadProbaCapabilities();
    this.fetchLayers();
  }

  hideTools() {
    this.setState({ toolsVisible: false });
  }

  getContent() {
    if (this.state.isLoaded) {
      return (
        <div className="eocloudRoot">
          <AlertContainer ref={a => (this.msg = a)} {...this.alertOptions} />
          <RootMap
            ref={e => {
              this._map = e;
            }}
            location={this.state.location}
            mapId="mapId"
          />

          <div id="Controls" className={!this.state.toolsVisible && 'hidden'}>
            <div id="ControlsContent">
              <div className="pull-right full-size">
                <DummyIcon />
                <div className="clear-both-700" />
                <SearchBox
                  onLocationPicked={this.setMapLocation}
                  toolsVisible={this.state.toolsVisible}
                  hideTools={this.hideTools}
                />
              </div>
            </div>
          </div>

          <a
            id="toggleSettings"
            onClick={() =>
              this.setState({ toolsVisible: !this.state.toolsVisible })
            }
            className={this.state.toolsVisible ? '' : 'hidden'}
          >
            <i
              className={
                'fa fa-' + (this.state.toolsVisible ? 'chevron-left' : 'cogs')
              }
            />
          </a>
          <Tools
            onResize={this.onResize}
            className={!this.state.toolsVisible && 'hidden'}
            onFinishSearch={this.onFinishSearch}
            onHoverTile={this.onHoverTile}
            onClearData={this.onClearData}
            selectedTile={this.state.selectedTile}
            onCompareChange={this.onCompareChange}
            onOpacityChange={this.onOpacityChange}
            pinOrderChange={this.pinOrderChange}
            onZoomToPin={this.onZoomToPin}
          />
          {this.state.error && (
            <Rodal
              animation="slideUp"
              visible={this.state.error !== ''}
              width={500}
              height={100}
              onClose={() => this.setState({ error: '' })}
            >
              <NotificationPanel
                msg={`An error occured: ${this.state.error}`}
                type="error"
              />
            </Rodal>
          )}
        </div>
      );
    } else {
      return (
        <div id="loading">
          <i className="fa fa-cog fa-spin fa-3x fa-fw" />Loading ...{' '}
        </div>
      );
    }
  }

  render() {
    return this.getContent();
  }
}

export default connect(store => store)(App);
