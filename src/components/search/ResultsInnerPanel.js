import React from 'react';
import { t, ngettext, msgid } from 'ttag';
import PropTypes from 'prop-types';
import './Results.scss';
import ResultItem from './ResultItem';

const style = { clear: 'both' };
class ResultsInnerPanel extends React.Component {
  renderItems = results => {
    return (
      <div style={style}>
        {results.map((result, i) => (
          <ResultItem
            key={`${result.tileData.datasource}.${result.tileData.id ? result.tileData.id : i}`}
            result={result}
            onResultClick={this.props.onResultClick}
            onResultHover={this.props.onResultHover}
          />
        ))}
      </div>
    );
  };

  renderLoadMoreButton = () => {
    // we only display first 50 results, but the 51st result tells us that there would be more available if we wanted them:
    if (this.props.showLoadMoreButton) {
      return (
        <a className="btn" onClick={() => this.props.onLoadMore()}>
          {t`Load more`}
        </a>
      );
    }
  };

  renderHeading = results => {
    return (
      <div>
        <div className="resultsHeading">
          {ngettext(
            msgid`Showing ${results.length} result`,
            `Showing ${results.length} results`,
            results.length,
          )}.
          <div style={{ clear: 'both' }} />
        </div>
      </div>
    );
  };

  render() {
    let { results } = this.props;
    if (results.length === 0) {
      return null;
    }
    return (
      <div className="resultsInnerPanel">
        {this.renderHeading(results)}
        {this.renderItems(results)}
        {this.renderLoadMoreButton()}
        {/* {isSearching && <NotificationPanel msg="Loading more results ..." type="loading" />} */}
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
  onLoadMore: PropTypes.func,
  showLoadMoreButton: PropTypes.bool,
};

export default ResultsInnerPanel;
