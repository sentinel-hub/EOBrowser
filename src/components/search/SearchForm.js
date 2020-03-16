import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import Store from '../../store';
import { EDUCATION_MODE } from '../../store/config';
import {
  NotificationPanel,
  EOBDatePicker,
  EOBButton,
  EOBFilterSearchByMonths,
} from '@sentinel-hub/eo-components';

import {
  initializeDataSourceHandlers,
  registerHandlers,
  renderDataSourcesInputs,
  currentSearch,
} from '../../datasources';
import {
  loadGetCapabilities,
  REQUEST_TYPE_EOCLOUD_INSTANCE_CONFIG,
  REQUEST_TYPE_GET_CAPABILITIES,
} from '../../utils/ajax';
import { DEFAULT_RESULTS_GROUP } from '../RootMap';

import './SearchForm.scss';

class SearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSourcesInitialized: false,
      selectedThemeIdentifier: 0,
      searchError: null,
      searchInProgress: false,
      fromMoment: moment
        .utc()
        .subtract(1, 'month')
        .startOf('day'),
      toMoment: moment.utc().endOf('day'),
      datepickerIsExpanded: false,
      filterMonths: null,
    };
  }

  componentDidMount() {
    this.changeTheme(this.props.themes[0]);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedTheme !== this.props.selectedTheme) {
      this.changeTheme(this.props.selectedTheme);

      //workaround to update theme select input when theme is
      //changed outside searchForm component

      const selectedThemeIndex = this.props.themes.findIndex(
        theme => theme.name === this.props.selectedTheme.name,
      );

      if (selectedThemeIndex > -1) {
        this.setState({ selectedThemeIdentifier: selectedThemeIndex });
      }
    }
  }

  handleSelectTheme = e => {
    // selectedTheme can be either an index in this.props.themes, or 'u-' + userInstance.id.
    const selectedThemeIdentifier = e.target.value;
    this.setState({
      selectedThemeIdentifier,
    });
    let theme;
    if (selectedThemeIdentifier.startsWith('u-')) {
      // we don't have a theme, but we will create one on-the-fly from user configuration:
      const instanceId = selectedThemeIdentifier.substring('u-'.length);
      theme = this.createFakeThemeFromUserInstance(instanceId);
    } else {
      theme = this.props.themes[parseInt(selectedThemeIdentifier, 10)];
    }
    this.changeTheme(theme);
  };

  createFakeThemeFromUserInstance(instanceId) {
    const instance = this.props.instances.find(inst => inst.id === instanceId);
    return {
      name: instance.name,
      content: [
        {
          service: 'WMS',
          url: `https://services.sentinel-hub.com/ogc/wms/${instance.id}`,
        },
      ],
    };
  }

  changeTheme(theme) {
    Store.setThemePins(theme.pins);
    Store.setSelectedTheme(theme);
    this.setState({
      dataSourcesInitialized: false,
    });
    // before we can ask DataSourceHandlers if they know how to handle the themes entries, we need
    // to fetch GetCapabilities to help them decide (for example user's instances have information
    // about datasets used).
    initializeDataSourceHandlers();
    const getCapabilitiesPromises = theme.content.map(({ service, url }) => {
      const isEOCloudInstance = url.includes('.sentinel-hub.com/v1/');
      if (isEOCloudInstance) {
        const isGetCapabilitiesInJson = false;
        return Promise.all([
          loadGetCapabilities(service, url, isGetCapabilitiesInJson, REQUEST_TYPE_GET_CAPABILITIES),
          loadGetCapabilities(service, url, true, REQUEST_TYPE_EOCLOUD_INSTANCE_CONFIG),
        ])
          .then(([capabilities, instanceConfig]) => ({ capabilities, instanceConfig }))
          .catch(() => null);
      } else {
        const isGetCapabilitiesInJson = url.includes('.sentinel-hub.com/ogc/');
        return loadGetCapabilities(service, url, isGetCapabilitiesInJson, REQUEST_TYPE_GET_CAPABILITIES)
          .then(capabilities => ({ capabilities }))
          .catch(() => null);
      }
    });

    // wait for all GetCapabilities to finish, then distribute the theme entries to datasource handlers:
    let failedThemeParts = [];
    Promise.all(getCapabilitiesPromises)
      .then(configsList => {
        theme.content.forEach(({ service, url, name, preselected }, i) => {
          if (configsList[i] === null) {
            console.error(
              `Error retrieving additional data for ${service} service at ${url} which is included in theme part ${name}, skipping.`,
            );

            // Temporary workaround so that we don't display error for Proba-V - we know it has trouble with
            // CORS headers and they're fixing it, but we don't want to bug users about it. This check
            // should be removed by ~2019-07-01.
            if (name === 'Proba-V') {
              return;
            }

            failedThemeParts.push(name);
            return;
          }
          // try to find a suitable handler for this service+url:
          const isHandled = registerHandlers(service, url, name, configsList[i], preselected);
          if (!isHandled) {
            console.error(
              `Ignoring entry, unsupported service: ${service} (only 'WMS' and 'WMTS' are currently supported) or url: ${url}`,
            );
          }
        });
      })
      .catch(e => {
        console.error(e);
      })
      .then(() => {
        this.setState({
          dataSourcesInitialized: true,
        });

        if (failedThemeParts.length > 0) {
          this.setState({
            searchError: {
              msg: 'Error retrieving additional data!',
              failedThemeParts: failedThemeParts,
            },
          });
        }
      });
  }

  handleDatepickerExpanded = expanded => {
    this.setState({
      datepickerIsExpanded: expanded,
    });
  };
  setTimeFrom = e => {
    const selectedFromMoment = moment(e);
    this.setState(oldState => {
      let newState = {
        fromMoment: selectedFromMoment.startOf('day'),
      };
      if (selectedFromMoment.isAfter(oldState.toMoment)) {
        newState.toMoment = selectedFromMoment
          .clone()
          .add(1, 'month')
          .endOf('day');
      }
      return newState;
    });
  };
  setTimeTo = e => {
    const selectedToMoment = moment(e);
    this.setState(oldState => {
      let newState = {
        toMoment: selectedToMoment.endOf('day'),
      };
      if (selectedToMoment.isBefore(oldState.fromMoment)) {
        newState.fromMoment = selectedToMoment
          .clone()
          .subtract(1, 'month')
          .startOf('day');
      }
      return newState;
    });
  };
  setFilterMonths = filterMonths => {
    this.setState({
      filterMonths: filterMonths,
    });
  };

  doSearch = (fromMoment, toMoment) => {
    this.setState({
      searchError: null,
      searchInProgress: true,
    });

    try {
      currentSearch.prepareNewSearch(fromMoment, toMoment, this.props.mapBounds, this.state.filterMonths);
    } catch (ex) {
      this.setState({
        searchError: { msg: ex },
        searchInProgress: false,
      });
      return;
    }

    currentSearch
      .getNext50Results(Store.current.lat, Store.current.lng)
      .then(finalResults => {
        Store.setSearchResults(finalResults, DEFAULT_RESULTS_GROUP, {});
        if (finalResults.length > 0) {
          Store.setTabIndex(1);
        } else {
          this.setState({
            searchError: {
              msg: 'No results found',
            },
          });
        }
        this.props.onFinishSearch(Store.current.searchResults);
      })
      .catch(errMsg => {
        this.setState({
          searchError: {
            msg: errMsg,
          },
        });
        this.props.onFinishSearch();
      })
      .then(() => {
        this.setState({
          searchInProgress: false,
        });
      });
  };

  renderThemeSelect = (user, userInstances, selectedThemeIdentifier, positionOnTop) => (
    <div className={`themeSelect ${positionOnTop ? 'top' : 'bottom'}`}>
      <div className="topLabel">
        Theme:
        <a
          className="configurationsSettings"
          target="_blank"
          rel="noopener noreferrer"
          href={`${process.env.REACT_APP_CONFIGURATORURL}`}
        >
          <i className="fa fa-cog" title="Manage configuration instances" />
        </a>
      </div>
      {!user && <p>Login to use custom configuration instances.</p>}
      <div>
        <select style={{ width: '100%' }} value={selectedThemeIdentifier} onChange={this.handleSelectTheme}>
          {this.props.themes.map((theme, i) => (
            <option key={i} value={i}>
              {theme.name}
            </option>
          ))}
          {userInstances &&
            userInstances.map(userInstance => (
              <option key={`u-${userInstance.id}`} value={`u-${userInstance.id}`}>
                Based on: {userInstance.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );

  render() {
    const { maxDate, minDate, mode, user, userInstances } = this.props;
    const minDateRange = new Date(minDate);
    const maxDateRange = new Date(maxDate);
    const {
      searchInProgress,
      dataSourcesInitialized,
      selectedThemeIdentifier,
      fromMoment,
      toMoment,
    } = this.state;

    const isEducationModeSelected = mode === EDUCATION_MODE;

    if (!dataSourcesInitialized) {
      return (
        <div style={{ height: '100px', textAlign: 'center' }}>
          <span style={{ position: 'relative', top: '45%' }}>
            <i className="fa fa-spinner fa-spin fa-fw" />
          </span>
        </div>
      );
    }

    return (
      <div className="searchForm">
        {isEducationModeSelected &&
          this.renderThemeSelect(user, userInstances, selectedThemeIdentifier, true)}
        <div>
          <div className="topLabel">
            Data sources:
            <div>
              <div className="checkboxGroup">
                <div className="column" key={selectedThemeIdentifier}>
                  {renderDataSourcesInputs()}
                </div>
              </div>
            </div>
          </div>
          <div className="clear" />
        </div>

        <div className="selectTimeRange">
          <div className="topLabel">Time range:</div>
          <EOBDatePicker
            onSelect={this.setTimeFrom}
            selectedDay={fromMoment}
            searchAvailableDays={false}
            alignment={'lt'}
            onExpandedChange={this.handleDatepickerExpanded}
            minDate={minDateRange}
            maxDate={maxDateRange}
          />

          <span className="datePickerSeparator">-</span>
          <EOBDatePicker
            onSelect={this.setTimeTo}
            selectedDay={toMoment}
            searchAvailableDays={false}
            alignment={'rt'}
            onExpandedChange={this.handleDatepickerExpanded}
            minDate={minDateRange}
            maxDate={maxDateRange}
          />

          <EOBFilterSearchByMonths onChange={this.setFilterMonths} />
        </div>
        <EOBButton
          loading={searchInProgress}
          onClick={() => this.doSearch(fromMoment, toMoment)}
          fluid
          text="Search"
        />

        {!isEducationModeSelected &&
          this.renderThemeSelect(user, userInstances, selectedThemeIdentifier, false)}

        {this.state.searchError ? (
          <NotificationPanel
            msg={
              <div>
                {this.state.searchError.msg}

                {this.state.searchError.failedThemeParts ? (
                  <div>
                    <span>These are theme parts which contain unavailable data sources:</span>
                    <ul style={{ textAlign: 'left' }}>
                      {this.state.searchError.failedThemeParts.map(f => <li>{f}</li>)}
                    </ul>
                  </div>
                ) : (
                  ''
                )}
              </div>
            }
            type="error"
          />
        ) : null}

        {this.state.datepickerIsExpanded && <div style={{ height: 250 }} />}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  instances: store.instances,
  mapBounds: store.mapBounds,
  user: store.user,
  minDate: store.minDate,
  maxDate: store.maxDate,
  mode: store.mode,
  selectedResult: store.selectedResult,
  selectedTheme: store.selectedTheme,
  userInstances: store.userInstances,
});
export default connect(mapStoreToProps)(SearchForm);
