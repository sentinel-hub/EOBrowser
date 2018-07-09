import React from 'react';
import Header from './Header';
import PinPanel from './PinPanel';
import ResultsPanel from './search/Results';
import SearchForm from './search/SearchForm';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Store from '../store';
import esaLogo from './esa.png';
import {
  loginAndLoadInstances,
  fetchSearchResultsFromIndexService,
  loadGetCapabilities,
} from '../utils/ajax';
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

class Tools extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      toolsHeight: window.innerHeight,
      searchError: '',
      showEffects: false,
      queryParams: '',
      downloadingTiff: false,
      firstSearch: true,
      resultsFound: false,
    };
    this.onClickResult = this.onClickResult.bind(this);
  }

  handleResize = () => {
    this.setState({
      toolsHeight: window.innerHeight,
    });
  };

  componentWillReceiveProps(nextProps) {
    if (isEmpty(this.props.searchFilterResults) && !isEmpty(nextProps.searchFilterResults)) {
      this.showResultsDialog();
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    if (Store.getTokenFromLC()) {
      // this.doLogin()
      loginAndLoadInstances().catch(({ msg }) => {
        this.setState({ error: msg });
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
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
      >
        <ResultsPanel
          key={2}
          results={Store.current.searchFilterResults}
          datasources={Store.current.datasources}
          searchParams={{}}
          isSearching={false}
          showClear={false}
          inPopup={true}
          onResultClick={this.onClickResult}
          onResultHover={this.onResultHover}
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
    Store.setSearchingIsOn(false);
    this.setState({ firstSearch: true, resultsFound: false });
    this.props.onClearData();
  };

  handleSelect = (index, last) => {
    setTimeout(() => {
      this.handleResize();
    }, 200);
    Store.setTabIndex(index);
    index !== 3 && Store.setCompareMode(false);
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

  onClickResult = async (i, result, zoomto) => {
    if (!result) {
      return;
    }
    if (result.userId) {
      const { instances = [] } = Store.current;
      const { id } = result.activeLayer;
      const selectedInstance = instances.find(inst => inst.id === id);
      if (!selectedInstance) {
        this.setState({ error: "You don't access to this instance." });
        return;
      }
      await loadGetCapabilities(selectedInstance);
    }
    if (result.properties) {
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

  loadMore = ds => {
    Store.setSearchingIsOn(true);
    let query = Store.current.searchParams[ds];
    query.firstSearch = false;
    query.multiplyOffset++;
    fetchSearchResultsFromIndexService(ds, ds, query).then(
      res => {
        Store.setSearchingIsOn(false);
        Store.setSearchResults(res.results, ds, res.params);
        this.props.onFinishSearch(Store.current.searchResults);
      },
      e => {
        console.error(e.message);
        Store.setSearchingIsOn(false);
      },
    );
  };

  onComparePins = () => {
    let isCompare = !Store.current.compareMode;
    Store.setCompareMode(isCompare);
    this.resetPins();
  };
  resetPins = () => {
    const { pinResults } = Store.current;
    pinResults.forEach((pin, index) => {
      Store.setPinOpacity(index, [0, 1]);
    });
  };
  clearPins = () => {
    Store.clearPins();
    Store.setCompareMode(false);
    const selectResult = Store.current.selectedResult;
    Store.setTabIndex(selectResult ? 2 : 3);
  };
  changeComapreMode = e => {
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
              href="https://www.sentinel-hub.com/trial?origin=EOBrowser"
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
      </div>
    );
  }

  render() {
    let tabs = [
      ['search', 'Search'],
      ['list', 'Results'],
      ['paint-brush', 'Visualization'],
      ['pinsPanel', 'Pins'],
    ];
    const {
      datasource,
      datasources,
      zoom,
      searchParams,
      searchResults,
      selectedResult,
      compareMode,
      compareModeType,
      pinResults,
      mainTabIndex,
      isSearching,
    } = Store.current;
    let hasSelectedResult = selectedResult !== null;
    const showResults = !isEmpty(searchResults);
    let panels = [
      <SearchForm onFinishSearch={this.props.onFinishSearch} />,
      <ResultsPanel
        showClear={true}
        {...{ datasource, datasources, isSearching, searchParams }}
        results={searchResults}
        onResultClick={this.onClickResult}
        onResultHover={this.onResultHover}
        onLoadMore={this.loadMore}
        onClearData={this.clearData}
      />,
      <div>{hasSelectedResult && mainTabIndex === 2 && <Visualization />}</div>,
      <PinPanel
        zoom={Number(zoom)}
        isCompare={compareMode}
        isOpacity={compareModeType === 'opacity'}
        onPinClick={(item, i, zoom) => this.onClickResult(i, item, true)}
        onCompare={this.onComparePins}
        onClearPins={this.clearPins}
        onRemove={i => Store.removePin(i)}
        onZoomToPin={this.onZoomToPin}
        onOpacityChange={this.props.onOpacityChange}
        pinOrderChange={this.props.pinOrderChange}
        onToggleCompareMode={e => this.changeComapreMode(e)}
        items={pinResults}
      />,
    ];

    Tabs.setUseDefaultStyles(false);

    return (
      <div
        id="tools"
        className={this.props.className}
        style={{
          height: this.state.toolsHeight,
        }}
      >
        <Header
          showLogin={process.env.REACT_APP_LOGIN === 'yes'}
          user={this.props.user}
          onShowLogin={() => loginAndLoadInstances()}
          onLogout={() => {
            Store.doLogout()
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
          selectedIndex={mainTabIndex}
          onSelect={this.handleSelect}
          forceRenderTabPanel={true}
          ref="tabsPanel"
        >
          <TabList>
            <Tab key={1}>
              <i className={`fa fa-search`} />Search
            </Tab>
            <Tab key={2} style={{ display: showResults ? 'block' : 'none' }}>
              <i className={`fa fa-sliders`} />Results
            </Tab>
            <Tab key={3} style={{ display: hasSelectedResult ? 'block' : 'none' }}>
              <i className={`fa fa-paint-brush`} />Visualization
            </Tab>
            <Tab key={5}>
              <i className={`fa fa-thumb-tack`} />My pins
            </Tab>
          </TabList>
          {panels.map((panel, i) => (
            <TabPanel id={`tabPanel-${i}`} key={i} className={tabs[i][0]}>
              {panel}
            </TabPanel>
          ))}
        </Tabs>

        {this.renderPoweredBy()}
      </div>
    );
  }
}

export default connect(store => store, null, null, { withRef: true })(Tools);
