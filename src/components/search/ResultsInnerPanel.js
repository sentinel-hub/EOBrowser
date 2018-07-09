import React from 'react';
import PropTypes from 'prop-types';
import './Results.scss';
import NotificationPanel from '../NotificationPanel';
import ResultItem from './ResultItem';
import get from 'dlv';

const style = { clear: 'both' };
class ResultsInnerPanel extends React.Component {
  renderItems = results => {
    return (
      <div style={style}>
        {results.map((result, i) => {
          return (
            <ResultItem
              key={i}
              result={result}
              onResultClick={this.props.onResultClick}
              onResultHover={this.props.onResultHover}
            />
          );
        })}
      </div>
    );
  };

  renderWaypoint = (ds, isBig) => {
    if (!this.props.isSearching && get(this.props, `searchParams.${ds}.hasMore`)) {
      return (
        <a className={isBig && 'btn'} onClick={() => this.props.onLoadMore(ds)}>
          Load more
        </a>
      );
    }
  };

  renderHeading = (results, datasource) => {
    let { datasource: name } = results[0].tileData; //we read name from first item
    return (
      <div>
        <div className="resultsHeading">
          {name || datasource}: Showing {results.length} {results.length > 1 ? 'results' : 'result'}.
          {this.renderWaypoint(datasource, false)}
          {this.props.isSearching && (
            <a>
              <i className="fa fa-spinner fa-spin fa-fw" />
            </a>
          )}
          <div style={{ clear: 'both' }} />
        </div>
      </div>
    );
  };

  render() {
    let { results, datasource } = this.props;
    if (results.length === 0) return null;
    return (
      <div className="resultsInnerPanel">
        {datasource && this.renderHeading(results, datasource)}
        {this.renderItems(results)}
        {this.renderWaypoint(datasource, true)}
        {this.props.isSearching && <NotificationPanel msg="Loading more results ..." type="loading" />}
      </div>
    );
  }
}

ResultsInnerPanel.propTypes = {
  results: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  onResultClick: PropTypes.func,
  onResultHover: PropTypes.func,
  searchParams: PropTypes.object,
  showClear: PropTypes.bool,
  datasource: PropTypes.string,
  isSearching: PropTypes.bool,
  onLoadMore: PropTypes.func,
};

export default ResultsInnerPanel;
