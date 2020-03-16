import React from 'react';
import PinPanel from './PinPanel';
import ResultsPanel from './search/Results';
import SearchForm from './search/SearchForm';
import { Tabs, Tab, EOBHeader } from '@sentinel-hub/eo-components';
import App from '../App';
import Store from '../store';
import { doLogout, doLogin } from '../utils/auth';
import esaLogo from './esa.png';
import { loadGetCapabilitiesAndSaveLayers } from '../utils/ajax';
import Visualization from './Visualization';
import { connect } from 'react-redux';
import isEmpty from 'lodash/isEmpty';
import get from 'dlv';
import Rodal from 'rodal';
import 'react-toggle/style.css';
import 'rc-slider/assets/index.css';
import './Tools.scss';
import { VERSION_INFO } from '../VERSION.js';
import { DATASOURCES } from '../store/config';
// import banner from './eo_browser_banner.jpg';

class Tools extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchError: '',
      showEffects: false,
      queryParams: '',
      downloadingTiff: false,
      firstSearch: true,
      resultsFound: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (isEmpty(this.props.searchFilterResults) && !isEmpty(nextProps.searchFilterResults)) {
      this.showResultsDialog();
    }
  }

  showResultsDialog = () => {
    const modalDialogId = 'search-filtered-results';
    Store.addModalDialog(
      modalDialogId,
      <Rodal
        animation="slideUp"
        visible={true}
        width={600}
        height={400}
        onClose={() => {
          this.clearFilterData();
          this.hideResultsDialog();
        }}
        closeOnEsc={true}
      >
        <ResultsPanel
          key={2}
          results={Store.current.searchFilterResults}
          datasources={Store.current.datasources}
          searchParams={{}}
          showClear={false}
          inPopup={true}
          onResultClick={this.onClickResult}
          onResultHover={this.onResultHover}
          allowLoadMoreButton={false}
        />
      </Rodal>,
    );
  };

  hideResultsDialog = () => {
    const modalDialogId = 'search-filtered-results';
    Store.removeModalDialog(modalDialogId);
  };

  clearData = () => {
    Store.clearSearchResults();
    Store.setSelectedResult(null);
    Store.setTabIndex(0);
    this.setState({ firstSearch: true, resultsFound: false });
    this.props.onClearData();
  };

  handleSelect = index => {
    Store.setTabIndex(index);
    index !== 3 && Store.setCompareMode(false);
  };

  handleErrorMessage = msg => {
    App.displayErrorMessage(msg);
  };

  onZoomToPin = ({ lat, lng, zoom }) => {
    Store.setMapView({ lat, lng, zoom, update: true });
  };

  clearFilterData = () => {
    Store.setFilterResults({});
  };

  onResultHover = (i, datasourceName) => {
    // if the results are not limited by search area (for example MODIS and
    // Proba-V results cover the whole planet) we can't highlight the result tile:
    let datasource = DATASOURCES.find(ds => ds.name === datasourceName);
    if (!datasource) {
      datasource = Store.current.instances.find(inst => inst.name === datasourceName);
    }

    if (datasource.search && !datasource.search.searchableByArea) {
      return;
    }
    this.props.onHoverTile(i);
  };

  onClickResult = async (result, zoomto) => {
    if (!result) {
      return;
    }
    if (
      result.tileData &&
      (result.tileData.activeLayer.userId || result.tileData.isFakedFromDataSourceWithThemeURL)
    ) {
      const { instances = [] } = Store.current;
      const { id } = result.tileData.activeLayer;
      const selectedInstance = instances.find(inst => inst.id === id);
      if (!selectedInstance) {
        this.setState({ error: "You don't access to this instance." });
        return;
      }
      await loadGetCapabilitiesAndSaveLayers(selectedInstance);
      const { datasource } = result.tileData;
      Store.setSelectedResult({
        datasource,
        ...result.tileData,
      });
    } else if (result.properties) {
      const { datasource } = result.tileData;

      const preset = this.props.presets[datasource][0].id;
      Store.setSelectedResult({
        datasource,
        ...result.tileData,
        preset,
      });
    } else {
      const { name, lat, lng, zoom } = result;
      // legacy fallback
      Store.setSelectedResult({ datasource: name, ...result });
      setTimeout(() => Store.setMapView({ lat, lng, zoom, update: zoomto }), 50);
    }
    this.clearFilterData();
    this.hideResultsDialog();
    Store.setTabIndex(2);
    this.setState({ tabIndex: 2, showEffects: false });
  };

  onComparePins = () => {
    let isCompare = !Store.current.compareMode;
    Store.setCompareMode(isCompare);
    this.resetPins();
  };
  resetPins = () => {
    const { userPins } = Store.current;
    userPins.forEach((pin, index) => {
      Store.setPinProperty(index, 'opacity', [0, 1]);
    });
  };
  clearPins = () => {
    Store.clearPins();
    Store.setCompareMode(false);
    const selectResult = Store.current.selectedResult;
    Store.setTabIndex(selectResult ? 2 : 3);
  };
  changeCompareMode = e => {
    this.resetPins();
    Store.setCompareModeType(e);
  };

  renderPoweredBy() {
    return (
      <div className="poweredby">
        {!this.props.user && (
          <p
            style={{
              textAlign: 'center',
              margin: '-3px 0 8px',
              fontSize: '14px',
            }}
          >
            <a
              href={`${process.env.REACT_APP_BASEURL}oauth/subscription?origin=EOBrowser&param_client_id=${
                process.env.REACT_APP_CLIENTID
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Free sign up
            </a>{' '}
            for all features
          </p>
        )}
        Powered by{' '}
        <a href="https://www.sinergise.com" target="_blank" rel="noopener noreferrer">
          Sinergise
        </a>{' '}
        with contributions from the European Space Agency
        <br />
        {VERSION_INFO.tag ? (
          VERSION_INFO.tag
        ) : VERSION_INFO.commit ? (
          <span>
            {VERSION_INFO.branch ? ` ${VERSION_INFO.branch}` : null}
            {VERSION_INFO.commit ? ` [${VERSION_INFO.commit.substring(0, 8)}]` : null}
          </span>
        ) : (
          <span>Local build</span>
        )}
        <a className="esa" href="https://www.esa.int/" target="_blank" rel="noopener noreferrer">
          <img src={esaLogo} alt="ESA" />
        </a>
        {/* <a
          className="contestbanner"
          href="https://www.sentinel-hub.com/contest"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={banner} alt="Sentinel Hub Custom script Contest" className="contestbanner" />
        </a> */}
      </div>
    );
  }

  render() {
    const {
      datasource,
      datasources,
      zoom,
      searchParams,
      searchResults,
      selectedResult,
      compareMode,
      compareModeType,
      userPins,
      themePins,
      mainTabIndex,
    } = this.props;
    let hasSelectedResult = selectedResult !== null;
    const showResults = !isEmpty(searchResults);
    return (
      <div id="tools">
        <EOBHeader
          showLogin={true}
          user={this.props.user}
          onShowLogin={doLogin}
          onLogout={() => {
            doLogout()
              .then(() => {
                try {
                  if (get(Store.current, 'selectedResult.userId')) {
                    Store.setSelectedResult(null);
                  }
                  Store.setUser(null);
                  Store.setUserInstances(undefined);
                  Store.setInstances(Store.current.instances.filter(inst => !inst.userId)); // we remove instances with userId
                } catch (e) {
                  console.log(e);
                }
              })
              .catch(e => {
                Store.setUser(null);
              });
          }}
          onCollapse={this.props.onCollapse}
        />

        <Tabs
          activeIndex={mainTabIndex}
          onSelect={this.handleSelect}
          onErrorMessage={this.handleErrorMessage}
        >
          <Tab title="Search" icon="search" renderKey={0}>
            {this.props.themes ? (
              <SearchForm onFinishSearch={this.props.onFinishSearch} themes={this.props.themes} />
            ) : (
              <i className="fa fa-spinner fa-spin fa-fw" />
            )}
          </Tab>

          <Tab title="Results" icon="list" renderKey={1} enabled={showResults}>
            <ResultsPanel
              showClear={true}
              {...{ datasource, datasources, searchParams }}
              results={searchResults}
              onResultClick={this.onClickResult}
              onResultHover={this.onResultHover}
              onClearData={this.clearData}
              onFinishSearch={this.props.onFinishSearch}
              allowLoadMoreButton={true}
            />
          </Tab>

          <Tab title="Visualization" icon="paint-brush" renderKey={2} enabled={hasSelectedResult}>
            <div>{hasSelectedResult && mainTabIndex === 2 && <Visualization />}</div>
          </Tab>

          <Tab title="Pins" icon="thumb-tack" renderKey={3}>
            <PinPanel
              zoom={Number(zoom)}
              isCompare={compareMode}
              isOpacity={compareModeType === 'opacity'}
              onPinClick={item => this.onClickResult(item, true)}
              onCompare={this.onComparePins}
              onClearPins={this.clearPins}
              onRemove={i => Store.removePin(i)}
              onZoomToPin={this.onZoomToPin}
              onOpacityChange={this.props.onOpacityChange}
              pinOrderChange={this.props.pinOrderChange}
              onToggleCompareMode={e => this.changeCompareMode(e)}
              items={themePins ? themePins : userPins}
              readOnly={!!themePins}
              loggedIn={!!this.props.user}
            />
          </Tab>
        </Tabs>

        {this.renderPoweredBy()}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  datasource: store.datasource,
  datasources: store.datasources,
  compareMode: store.compareMode,
  compareModeType: store.compareModeType,
  mainTabIndex: store.mainTabIndex,
  userPins: store.userPins,
  themePins: store.themePins,
  presets: store.presets,
  searchFilterResults: store.searchFilterResults,
  searchParams: store.searchParams,
  searchResults: store.searchResults,
  selectedResult: store.selectedResult,
  user: store.user,
  zoom: store.zoom,
});
export default connect(mapStoreToProps, null, null, { withRef: true })(Tools);
