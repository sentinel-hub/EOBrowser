import React from 'react';
import moment from 'moment';
import DatePicker from '../DatePicker';
import './SearchForm.scss';
import Store from '../../store';
import Button from '../Button';
import NotificationPanel from '../NotificationPanel';
import ProbaLayer from './ProbaPanel';
import { connect } from 'react-redux';
import {
  queryIndex,
  reflect,
  queryActiveMonth,
  loadGetCapabilities
} from '../../utils/ajax';
import { Checkbox, CheckboxGroup } from 'react-checkbox-group';
import isEmpty from 'lodash/isEmpty';

const DEFAULT_INSTANCE = {
  id: 'DEFAULT_INSTANCE',
  name: 'All EO Browser instances'
};

const DS_CACHE = {};
class SearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleInstances: this.props.instances.filter(inst => !inst.userId),
      query: {
        cloudCoverPercentage: 100,
        timeFrom: moment().subtract(1, 'months'),
        timeTo: moment(),
        additionalData: ''
      },
      firstSearch: true,
      selectedInstances: this.props.datasources
    };
  }

  onSearchFormUpdate = ({ queryParams, datasources, isUserInstance }) => {
    const { timeFrom, timeTo, cloudCoverPercentage } = queryParams;
    Store.setDateFrom(timeFrom);
    Store.setDate(timeTo);
    Store.setMaxcc(cloudCoverPercentage);
  };

  loadMore = ds => {
    Store.setSearchingIsOn(true);
    let query = Store.current.searchParams[ds];
    query.firstSearch = false;
    query.multiplyOffset++;
    queryIndex(false, ds, query).then(
      res => {
        Store.setSearchingIsOn(false);
        Store.setSearchResults(res.results, ds, res.params);
        this.props.onFinishSearch(Store.current.searchResults);
      },
      e => {
        Store.setSearchingIsOn(false);
        console.error(e.message);
      }
    );
  };

  doSearch = queryParams => {
    const {selectedInstances, userInstance} = this.state
    const { queryBounds, timeFrom, timeTo } = queryParams;
    const datasources = !userInstance || userInstance === DEFAULT_INSTANCE.name
                  ? selectedInstances
                  : [userInstance]
    Store.setDatasources(datasources)
    Store.clearSearchResults();
    Store.setSearchingIsOn(true);
    this.setState({ searchError: null });
    Store.setDate(timeTo);
    Store.setDateFrom(timeFrom);
    let query = {
      ...queryParams,
      firstSearch: true,
      multiplyOffset: 0,
      queryBounds
    };
    let querySources = datasources.map(ds => queryIndex(false, ds, query));
    Promise.all(querySources.map(reflect))
      .then(obj => {
        this.setState({ loading: false });
        let success = obj.filter(x => x.success).map(x => x.data);
        success.forEach(i => {
          Store.setSearchResults(i.results, i.datasource, i.params);
          if (i.results.length > 0) {
            Store.setTabIndex(1);
          }
        });
        this.setState({
          queryParams,
          searchError: '',
          firstSearch: false
        });
        Store.setSearchingIsOn(false);
        document.getElementById('react-tabs-3').scrollTop = 0; //we need to reset scroll to top once we perform search
        this.props.onFinishSearch(Store.current.searchResults);
      })
      .catch(e => {
        this.setState({ searchError: e.message, isSearching: false });
        Store.setSearchingIsOn(false);
        this.props.onFinishSearch();
      });
  };

  componentWillUpdate(nextProps, nextState) {
    if (this.props.user && !nextProps.user) {
      this.setState({
        visibleInstances: this.props.instances.filter(inst => !inst.userId)
      });
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.state.datasource !== nextProps.datasource) {
      this.setState({
        datasource: nextProps.datasource
      });
    }
    if (this.state.firstSearch !== nextProps.firstSearch) {
      this.setState({ firstSearch: nextProps.firstSearch });
    }
    if (this.state.mapZoom !== nextProps.mapZoom) {
      this.setState({ mapZoom: nextProps.mapZoom });
    }
  }

  setTimeFrom(e) {
    this.setState({ query: { ...this.state.query, timeFrom: moment(e) } });
  }

  setTimeTo(e) {
    this.setState({ query: { ...this.state.query, timeTo: moment(e) } });
  }

  changeUserInstance = async (e, userId) => {
    const { value } = e.target;
    if (value === DEFAULT_INSTANCE.name) {
      const visibleInstances = this.props.instances.filter(
        inst => !inst.userId
      );
      this.setState({
        userInstance: value,
        visibleInstances
      });
      visibleInstances &&
        Store.setDatasources([
          visibleInstances.find(inst => inst.name.includes('L1C')).name
        ]);
      return;
    }
    const instance = this.props.instances.find(inst => inst.name === value);
    let cachedInstance = DS_CACHE[value];
    if (!cachedInstance) {
      const instData = await loadGetCapabilities(instance, true);
      cachedInstance = instData;
    }
    const visibleInstances = cachedInstance
      ? this.props.instances.filter(inst =>
          cachedInstance.datasets.map(ds => ds.name).includes(inst.id)
        )
      : [];
    this.setState(
      {
        userInstance: value,
        visibleInstances,
        selectedInstances: visibleInstances
          ? visibleInstances.map(ds => ds.name)
          : []
      },
      Store.setDatasources([value])
    );
  };

  changeDSSelection = vals => {
    this.setState({ selectedInstances: vals }, Store.setDatasources(vals));
  };

  render() {
    let {
      instances,
      mapZoom,
      datasources,
      probaLayer,
      probaLayers,
      mainLoaded,
      user,
      isSearching: loading
    } = this.props;
    if (!instances) {
      return null;
    }

    const {
      query,
      selectedInstances,
      firstSearch,
      userInstance,
      visibleInstances
    } = this.state;
    const userInstances = [
      DEFAULT_INSTANCE,
      ...instances.filter(inst => inst.userId)
    ]; //at least on personal instance
    let maxDate = moment();
    let from = query.timeFrom.format('YYYY-MM-DD');
    let to = query.timeTo.format('YYYY-MM-DD');
    let zoomSmall = mapZoom < 5;
    let preventSearch = loading || zoomSmall || selectedInstances.length === 0;

    return (
      <div className="searchForm">
        <div>
          {!mainLoaded && (
            <span
              title="Some configurations are still loading"
              style={{ float: 'right' }}
              children={<i className="fa fa-spinner fa-spin fa-fw" />}
            />
          )}
          <b>Configurations</b>
          {user &&
            userInstances.length > 0 && (
              <div style={{ margin: '0 0 10px' }}>
                <select
                  style={{ width: '100%' }}
                  value={userInstance}
                  onChange={this.changeUserInstance}
                >
                  {userInstances.map(inst => (
                    <option value={inst.name}>{inst.name}</option>
                  ))}
                </select>
              </div>
            )}
          <div className="searchDatasourceSelect">
            <CheckboxGroup
              className="checkboxGroup"
              name="defaultInstances"
              value={selectedInstances}
              onChange={this.changeDSSelection}
            >
              {visibleInstances.map((inst, i) => {
                if (inst === undefined) return null;
                const { name, tooltip = '' } = inst;
                return (
                  <label title={tooltip} key={i}>
                    <Checkbox value={name} />
                    {name}
                  </label>
                );
              })}
            </CheckboxGroup>
          </div>
          <br />
        </div>
        <div>
          <label>Cloud coverage</label>
          <input
            type="number"
            placeholder={20}
            min={0}
            max={100}
            style={{ width: '60px', marginLeft: '5px' }}
            defaultValue={query.cloudCoverPercentage}
            onChange={e =>
              this.setState(
                { query: { ...query, cloudCoverPercentage: e.target.value } },
                this.updateChangeListener
              )
            }
          />{' '}
          % <small>(where available)</small>
          <br />
        </div>
        <label>Select time range</label>
        <DatePicker
          key="dateFrom"
          ref="dateFrom"
          className="inlineDatepicker"
          maxDate={maxDate}
          onNavClick={(from, to) =>
            queryActiveMonth({ from, to, datasource: datasources[0] })
          }
          defaultValue={from}
          onExpand={() => queryActiveMonth({ singleDate: from, datasource: datasources[0] })}
          onSelect={e => this.setTimeFrom(e)}
        />
        <span className="datePickerSeparator">-</span>
        <DatePicker
          key="dateTo"
          ref="dateTo"
          maxDate={maxDate}
          onNavClick={(from, to) =>
            queryActiveMonth({ from, to, datasource: datasources[0] })
          }
          defaulValue={to}
          onExpand={() => queryActiveMonth({ singleDate: to, datasource: datasources[0] })}
          className="inlineDatepicker move"
          onSelect={e => this.setTimeTo(e)}
        />
        <br />
        <Button
          onClick={() => {
            if (preventSearch) return;
            this.setState({ firstSearch: false });
            this.doSearch(
              query
            );
          }}
          disabled={preventSearch}
          loading={loading}
          fluid
          text="Search"
        />
        {zoomSmall &&
          !this.props.loading && (
            <NotificationPanel msg={`Zoom in to query`} type="error" />
          )}
        {this.props.error && (
          <NotificationPanel
            msg={`An error occurred: ${this.props.error}`}
            type="error"
          />
        )}
        {this.props.empty &&
          !this.props.loading &&
          !firstSearch && (
            <NotificationPanel
              msg="No results found. Try with different parameters."
              type="info"
            />
          )}
        {!isEmpty(probaLayers) && (
          <ProbaLayer
            zoom={mapZoom}
            probaLayer={probaLayer}
            probaLayers={probaLayers}
            onChange={Store.setProbaParams}
          />
        )}
      </div>
    );
  }
}

export default connect(store => store)(SearchForm);
