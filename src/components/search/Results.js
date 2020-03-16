import React from 'react';
import PropTypes from 'prop-types';
import './Results.scss';
import ResultsInnerPanel from './ResultsInnerPanel';
import Store from '../../store';
import { currentSearch } from '../../datasources';
import { DEFAULT_RESULTS_GROUP } from '../RootMap';
import { NotificationPanel } from '@sentinel-hub/eo-components';

class ResultsPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchError: null,
      searchInProgress: false,
    };
  }

  loadMore = () => {
    this.setState({
      searchError: null,
      searchInProgress: true,
    });

    currentSearch
      .getNext50Results(Store.current.lat, Store.current.lng)
      .then(finalResults => {
        const mergedResults = [...Store.current.searchResults[DEFAULT_RESULTS_GROUP], ...finalResults];
        Store.setSearchResults(mergedResults, DEFAULT_RESULTS_GROUP, {});
        this.props.onFinishSearch(Store.current.searchResults);
      })
      .catch(errMsg => {
        this.setState({
          searchError: errMsg,
        });
        this.props.onFinishSearch();
      })
      .then(() => {
        this.setState({
          searchInProgress: false,
        });
      })
      .catch(e => {
        console.error(e);
      });
  };

  renderDatasourceResults = () => {
    // Why is this.props.results an object with datasource names as keys? Good question. One
    // might also ask why there are datasource and datasources (both, and at all) in props... Anyway. :)
    const {
      results,
      searchParams,
      showClear,
      onResultClick,
      onResultHover,
      allowLoadMoreButton,
    } = this.props;
    const { searchInProgress } = this.state;
    if (!results || Object.keys(results).length === 0) {
      return null;
    }

    let items = Object.values(results)[0];
    if (items.length === 0) {
      return null;
    }
    return (
      <div>
        <ResultsInnerPanel
          searchParams={searchParams}
          showClear={showClear}
          onResultClick={onResultClick}
          onResultHover={onResultHover}
          onLoadMore={this.loadMore}
          showLoadMoreButton={
            allowLoadMoreButton && !this.state.searchInProgress && currentSearch.hasMoreResults()
          }
          results={items}
        />
        {searchInProgress && <NotificationPanel msg="Loading more results ..." type="loading" />}
      </div>
    );
  };

  render() {
    return (
      <div className="resultsPanel">
        <b>Results</b>
        {this.props.showClear && (
          <a style={{ float: 'right' }} onClick={this.props.onClearData}>
            Clear data
          </a>
        )}
        {this.renderDatasourceResults(this.props.results)}
      </div>
    );
  }
}

ResultsPanel.propTypes = {
  results: PropTypes.object,
  datasource: PropTypes.string,
  datasources: PropTypes.array,
  onResultClick: PropTypes.func,
  onResultHover: PropTypes.func,
  searchParams: PropTypes.object,
  showClear: PropTypes.bool,
  onClearData: PropTypes.func,
  onFinishSearch: PropTypes.func,
};

export default ResultsPanel;
