import React from 'react';
import PropTypes from 'prop-types';
import './Results.scss';
import ResultsInnerPanel from './ResultsInnerPanel';
import get from 'dlv';

class ResultsPanel extends React.Component {
  renderDatasourceResults = (ds, i) => {
    let items = get(this.props.results, ds) || [];
    if (items.length === 0) {
      return null;
    }
    return (
      items.length > 0 && (
        <ResultsInnerPanel
          key={i}
          isSearching={this.props.isSearching}
          datasource={ds}
          searchParams={this.props.searchParams}
          showClear={this.props.showClear}
          onResultClick={this.props.onResultClick}
          onResultHover={this.props.onResultHover}
          onLoadMore={this.props.onLoadMore}
          results={items}
        />
      )
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
        {this.props.datasources &&
          this.props.datasources.map((inst, i) => this.renderDatasourceResults(inst, i))}
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
  isSearching: PropTypes.bool,
  onLoadMore: PropTypes.func,
  onClearData: PropTypes.func,
};

export default ResultsPanel;
