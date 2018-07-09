import React from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { Checkbox, CheckboxGroup } from 'react-checkbox-group';

import { DateUtils } from 'react-day-picker';
import DayPicker from '../DayPicker';

import './SearchForm.scss';
import Store from '../../store';
import Button from '../Button';
import CCSlider from '../CCSlider';
import NotificationPanel from '../NotificationPanel';
import { fetchSearchResultsFromIndexService, loadGetCapabilities } from '../../utils/ajax';
import { DATASOURCES, DATASOURCE_GROUPS, FILTER_CLOUD_COVERAGE_PERCENT } from '../../store/config';

const NO_CONFIGURATION_SELECTED = '-- no user configuration instance --';

const PRESELECTED_DATASOURCES = DATASOURCES.filter(
  ds => ds.search.preselected && DATASOURCE_GROUPS.find(dsg => dsg.id === ds.group).search.preselected,
);

class SearchForm extends React.Component {
  constructor(props) {
    super(props);

    let initialDsgQueryParams = {};
    for (let dsg of DATASOURCE_GROUPS) {
      let qp = {};
      for (let filter in dsg.search.filters || {}) {
        qp[filter] = dsg.search.filters[filter];
      }
      initialDsgQueryParams[dsg.id] = qp;
    }

    this.state = {
      visibleDatasources: DATASOURCES,
      queryParams: {
        cloudCoverPercentage: 100,
        timeFrom: moment().subtract(1, 'months'),
        timeTo: moment(),
        additionalData: '',
      },
      dsgQueryParams: initialDsgQueryParams,
      firstSearch: true,
      selectedDatasources: PRESELECTED_DATASOURCES,
      selectedCheckboxes: [],
    };
    Store.setDatasources(PRESELECTED_DATASOURCES.map(ds => ds.name));
  }

  componentDidMount() {
    this.updateCheckboxes(PRESELECTED_DATASOURCES);
  }

  updateCheckboxes = selectedDatasources => {
    // Checkboxes must be selected for:
    //  - all selected datasources
    //  - the groups these selected datasources are in
    //  - the datasources which are in groups which are NOT selected (so that clicking a group shows pre-populated set of datasources)
    const groupsWithSelectedDatasources = DATASOURCE_GROUPS.filter(
      dsg => !!selectedDatasources.find(ds => ds.group === dsg.id),
    ).map(dsg => `dsg-${dsg.id}`);

    const datasourcesWithinUnselectedGroups = DATASOURCE_GROUPS.reduce((prevValue, dsg) => {
      if (groupsWithSelectedDatasources.includes(`dsg-${dsg.id}`)) {
        return prevValue; // group is selected, do not add its children
      }
      const dsgDatasources = DATASOURCES.filter(ds => ds.group === dsg.id);
      if (dsgDatasources.length <= 1) {
        return prevValue; // only one child datasource, no checkbox for it
      }
      return prevValue.concat(dsgDatasources.filter(ds => ds.search.preselected).map(ds => `ds-${ds.id}`));
    }, []);

    const selectedCheckboxes = selectedDatasources
      .map(ds => `ds-${ds.id}`)
      .concat(groupsWithSelectedDatasources, datasourcesWithinUnselectedGroups);
    this.setState({
      selectedCheckboxes,
    });
  };

  doSearch = (selectedDatasources, timeFrom, timeTo, dsgQueryParams, selectedConfiguration) => {
    Store.setDatasources(selectedDatasources.map(ds => ds.name));
    Store.clearSearchResults();
    Store.setSearchingIsOn(true);
    this.setState({ searchError: null });
    Store.setDate(timeTo);
    Store.setDateFrom(timeFrom);
    const querySources = selectedDatasources.map(ds => {
      const dsQueryParams = {
        ...dsgQueryParams[ds.group],
        timeFrom,
        timeTo,
        firstSearch: true,
        multiplyOffset: 0,
      };
      return fetchSearchResultsFromIndexService(selectedConfiguration || ds.name, ds.name, dsQueryParams);
    });
    Promise.all(querySources)
      .then(obj => {
        this.setState({ loading: false });
        obj.forEach(i => {
          Store.setSearchResults(i.results, i.datasource, i.params);
          if (i.results.length > 0) {
            Store.setTabIndex(1);
          }
        });
        this.setState({
          searchError: '',
          firstSearch: false,
        });
        Store.setSearchingIsOn(false);
        document.getElementById('react-tabs-3').scrollTop = 0; //we need to reset scroll to top once we perform search
        this.props.onFinishSearch(Store.current.searchResults);
      })
      .catch(e => {
        this.setState({ searchError: e.message || e, isSearching: false });
        Store.setSearchingIsOn(false);
        this.props.onFinishSearch();
      });
  };

  componentWillReceiveProps(nextProps) {
    if (this.state.firstSearch !== nextProps.firstSearch) {
      this.setState({ firstSearch: nextProps.firstSearch });
    }
  }

  setTimeFrom(e) {
    this.setState(oldState => {
      let oldTimeTo = oldState.queryParams.timeTo;
      if (DateUtils.isDayAfter(new Date(e), new Date(oldTimeTo))) {
        oldTimeTo = DateUtils.addMonths(new Date(e), 1);
      }
      return {
        queryParams: {
          ...oldState.queryParams,
          timeFrom: moment(e),
          timeTo: moment(oldTimeTo),
        },
      };
    });
  }

  setTimeTo(e) {
    this.setState(oldState => {
      let oldTimeFrom = oldState.queryParams.timeFrom;
      if (DateUtils.isDayBefore(new Date(e), new Date(oldTimeFrom))) {
        oldTimeFrom = DateUtils.addMonths(new Date(e), -1);
      }
      return {
        queryParams: {
          ...oldState.queryParams,
          timeTo: moment(e),
          timeFrom: moment(oldTimeFrom),
        },
      };
    });
  }

  changeSelectedConfiguration = async e => {
    const selectedConfiguration = e.target.value;

    if (selectedConfiguration === NO_CONFIGURATION_SELECTED) {
      this.setState({
        selectedConfiguration: selectedConfiguration,
        visibleDatasources: DATASOURCES,
        selectedDatasources: PRESELECTED_DATASOURCES,
      });
      Store.setDatasources(PRESELECTED_DATASOURCES.map(ds => ds.name));
      this.updateCheckboxes(PRESELECTED_DATASOURCES);
    } else {
      const instance = this.props.instances.find(inst => inst.name === selectedConfiguration);
      const instData = await loadGetCapabilities(instance, true);
      const datasourcesUsedByConfiguration = instData
        ? this.props.instances.filter(inst => instData.datasets.map(ds => ds.name).includes(inst.id))
        : [];
      this.setState(
        {
          selectedConfiguration: selectedConfiguration,
          selectedCheckboxes: datasourcesUsedByConfiguration.map(ds => `ds-${ds.id}`),
          selectedDatasources: datasourcesUsedByConfiguration,
          visibleDatasources: datasourcesUsedByConfiguration,
        },
        Store.setDatasources(datasourcesUsedByConfiguration.map(ds => ds.name)),
      );
      this.updateCheckboxes(datasourcesUsedByConfiguration);
    }
  };

  changeDSSelection = vals => {
    // We are saving two things to state:
    // - which checkboxes are checked (selectedCheckboxes), both for datasources and data source groups
    // - which datasources are selected (they are checked and their data source group is checked)

    const directlySelectedDatasources = DATASOURCES.filter(
      ds => vals.includes(`ds-${ds.id}`) && vals.includes(`dsg-${ds.group}`),
    );
    const selectedDatasourceGroupsWithSingleDS = DATASOURCE_GROUPS.filter(
      dsg => vals.includes(`dsg-${dsg.id}`) && DATASOURCES.filter(ds => ds.group === dsg.id).length === 1,
    );
    const selectedDatasourcesThroughGroups = DATASOURCES.filter(ds =>
      selectedDatasourceGroupsWithSingleDS.find(dsg => dsg.id === ds.group),
    );
    const selectedDatasources = directlySelectedDatasources.concat(selectedDatasourcesThroughGroups);
    this.setState(
      {
        selectedCheckboxes: vals,
        selectedDatasources,
      },
      Store.setDatasources(selectedDatasources.map(ds => ds.name)),
    );
  };

  rememberDsgQueryParam(dsgId, parameterName, newValue) {
    this.setState(oldState => {
      const stateUpdate = {
        dsgQueryParams: {
          ...oldState.dsgQueryParams,
        },
      };
      stateUpdate.dsgQueryParams[dsgId][parameterName] = newValue;
      return stateUpdate;
    });
  }

  renderFilter(filter, dsgId) {
    const key = `${dsgId}-${filter}`;
    const currentValue = this.state.dsgQueryParams[dsgId][filter];
    switch (filter) {
      case FILTER_CLOUD_COVERAGE_PERCENT:
        return this.renderCloudCoverageFilter(key, dsgId, filter, currentValue);
      default:
        return <div key={key}>Filter rendering not implemented.</div>;
    }
  }

  renderCloudCoverageFilter(key, dsgId, filter, currentValue) {
    return (
      <div key={key} className="filter cloudCoverage">
        <label>Max. cloud coverage:</label>
        <CCSlider
          sliderWidth={120}
          cloudCoverPercentage={currentValue}
          onChange={value => {
            this.rememberDsgQueryParam(dsgId, filter, value);
          }}
        />
      </div>
    );
  }

  renderDataSourceGroup(dataSourceGroup) {
    const { selectedCheckboxes, visibleDatasources } = this.state;

    const visibleDatasourcesWithinThisGroup = visibleDatasources.filter(
      ds => ds.group === dataSourceGroup.id,
    );
    if (visibleDatasourcesWithinThisGroup.length === 0) {
      return null;
    }

    return (
      <div key={`dsg-${dataSourceGroup.id}`} className="dataSourceGroup">
        <label
          key={`checkbox-${dataSourceGroup.id}`}
          title={
            visibleDatasourcesWithinThisGroup.length === 1
              ? visibleDatasourcesWithinThisGroup[0].search.tooltip
              : ''
          }
        >
          <Checkbox value={`dsg-${dataSourceGroup.id}`} />&nbsp;{dataSourceGroup.label}
        </label>

        {selectedCheckboxes.includes(`dsg-${dataSourceGroup.id}`) && (
          <div>
            {visibleDatasourcesWithinThisGroup.length > 1 && (
              <div className="datasources">
                {visibleDatasourcesWithinThisGroup.map(ds => (
                  <label key={ds.id} title={ds.search.tooltip}>
                    <Checkbox value={`ds-${ds.id}`} />&nbsp;{ds.search.label}
                  </label>
                ))}
              </div>
            )}

            {dataSourceGroup.search.filters && (
              <div className="filters">
                {Object.keys(dataSourceGroup.search.filters).map(filter =>
                  this.renderFilter(filter, dataSourceGroup.id),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  render() {
    let { instances, mapZoom, datasourcesNames, mainLoaded, user, isSearching } = this.props;
    if (!instances) {
      return null;
    }

    const {
      queryParams,
      selectedCheckboxes,
      selectedDatasources,
      firstSearch,
      selectedConfiguration,
      dsgQueryParams,
    } = this.state;
    const userInstances = [{ name: NO_CONFIGURATION_SELECTED }, ...instances.filter(inst => inst.userId)]; //at least on personal instance

    let from = queryParams.timeFrom.format('YYYY-MM-DD');
    let to = queryParams.timeTo.format('YYYY-MM-DD');
    const isAnyDatasourceSelected = selectedDatasources && selectedDatasources.length > 0;
    const searchByArea = selectedDatasources.filter(ds => ds.search.searchableByArea).length > 0;
    let zoomTooSmall = searchByArea && mapZoom < 5;
    let preventSearch = isSearching || zoomTooSmall || !isAnyDatasourceSelected;

    return (
      <div className="searchForm">
        <div>
          {!mainLoaded && (
            <span
              title="Some configuration instances are still loading"
              style={{ float: 'right' }}
              children={<i className="fa fa-spinner fa-spin fa-fw" />}
            />
          )}
          <div className="topLabel">
            Configuration instance:
            <a className="configurationsSettings" href={`${Store.getConfig.configuratorUrl}`}>
              <i className="fa fa-cog" title="Manage configuration instances" />
            </a>
            {user ? (
              <div>
                <select
                  style={{ width: '100%' }}
                  value={selectedConfiguration}
                  onChange={this.changeSelectedConfiguration}
                >
                  {userInstances.map(inst => (
                    <option key={inst.name} value={inst.name}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>Login to use custom configuration instances.</div>
            )}
          </div>
          <div className="topLabel">
            Data sources:
            <div className="searchDatasourceSelect">
              <CheckboxGroup
                className="checkboxGroup"
                name="dataSourceGroups"
                value={selectedCheckboxes}
                onChange={this.changeDSSelection}
              >
                <div className="column">{DATASOURCE_GROUPS.map(dsg => this.renderDataSourceGroup(dsg))}</div>
              </CheckboxGroup>
            </div>
          </div>
          <div className="clear" />
        </div>

        <div className="selectTimeRange">
          <div className="topLabel">Time range:</div>
          <DayPicker
            onSelect={e => this.setTimeFrom(e)}
            selectedDay={from}
            datasource={datasourcesNames[0]}
            searchAvailableDays={false}
            alignment={'lt'}
          />

          <span className="datePickerSeparator">-</span>
          <DayPicker
            onSelect={e => this.setTimeTo(e)}
            selectedDay={to}
            datasource={datasourcesNames[0]}
            searchAvailableDays={false}
            alignment={'rt'}
          />
        </div>

        <Button
          onClick={() => {
            if (preventSearch) return;
            this.setState({ firstSearch: false });
            this.doSearch(
              selectedDatasources,
              queryParams.timeFrom,
              queryParams.timeTo,
              dsgQueryParams,
              selectedConfiguration,
            );
          }}
          disabled={preventSearch}
          loading={isSearching}
          fluid
          text="Search"
        />
        {!isAnyDatasourceSelected ? (
          <NotificationPanel msg={`Select data source`} type="error" />
        ) : zoomTooSmall && !this.props.loading ? (
          <NotificationPanel msg={`Zoom in to query`} type="error" />
        ) : this.props.error ? (
          <NotificationPanel msg={`An error occurred: ${this.props.error}`} type="error" />
        ) : this.state.searchError ? (
          <NotificationPanel msg={`A search error occurred: ${this.state.searchError}`} type="error" />
        ) : zoomTooSmall && !this.props.loading ? (
          <NotificationPanel msg={`Zoom in to query`} type="error" />
        ) : this.props.error ? (
          <NotificationPanel msg={`An error occurred: ${this.props.error}`} type="error" />
        ) : this.state.searchError ? (
          <NotificationPanel msg={`A search error occurred: ${this.state.searchError}`} type="error" />
        ) : (
          this.props.empty &&
          !this.props.loading &&
          !isSearching &&
          !firstSearch &&
          this.props.wasSearchPerformed && (
            <NotificationPanel msg="No results found - try different parameters" type="info" />
          )
        )}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  instances: store.instances,
  datasourcesNames: store.datasources,
  loading: store.loading,
  error: store.error,
  user: store.user,
  mapZoom: store.zoom,
  mainLoaded: store.mainLoaded,
  isSearching: store.isSearching,
  empty: Object.keys(store.searchResults).reduce((prevValue, datasource) => {
    if (!prevValue) {
      return false; // already known to be non-empty
    }
    return store.searchResults[datasource].length === 0;
  }, true),
  wasSearchPerformed: Object.keys(store.searchResults).length > 0,
});
export default connect(mapStoreToProps)(SearchForm);
