import React, { Component } from 'react';
import Rodal from 'rodal';
import { t, ngettext, msgid } from 'ttag';

import ResultItem from './ResultItem';
import { NotificationPanel } from '../../junk/NotificationPanel/NotificationPanel';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import './Results.scss';

class Results extends Component {
  state = {
    results: [],
    loadingMore: false,
    displayModal: false,
    selectedTiles: null,
  };

  componentDidUpdate(prevProps) {
    if (this.props.query && this.props.query !== prevProps.query) {
      this.setState({
        results: [...this.props.query.allResults],
      });
    }
    if (this.props.selectedTiles && prevProps.selectedTiles !== this.props.selectedTiles) {
      this.setState((prevState) => ({
        displayModal: true,
        selectedTiles: this.props.selectedTiles,
      }));
    }
  }

  loadMore = async () => {
    this.setState({
      loadingMore: true,
    });
    const { results } = await this.props.query.getNextNResults();
    this.setState((prevState) => ({
      results: [...prevState.results, ...results],
      loadingMore: false,
    }));
  };

  onResultHover = (tile) => {
    this.props.setHighlightedTile(tile);
  };

  onResultStopHover = () => {
    this.props.setHighlightedTile(null);
  };

  onResultSelected = (result) => {
    this.setState({ displayModal: false });
    this.props.onResultSelected(result);
  };

  render() {
    return !this.props.query ? null : (
      <div className="results">
        <div className="results-heading">
          <EOBButton
            text={t`Back to search`}
            onClick={this.props.backToSearch}
            className="small back-to-search"
            icon="arrow-left"
          />
          <div className="showing-n-results">
            {ngettext(
              msgid`Showing ${this.state.results.length} result`,
              `Showing ${this.state.results.length} results`,
              this.state.results.length,
            )}
          </div>
        </div>
        <div className="results-panel">
          <div className="results-list">
            {this.state.results &&
              this.state.results.map((r, i) => (
                <ResultItem
                  key={`${this.props.query.queryId}-${i}`}
                  onHover={this.onResultHover}
                  onStopHover={this.onResultStopHover}
                  tile={r}
                  onResultSelected={this.props.onResultSelected}
                />
              ))}
          </div>
          {this.props.query.hasMore && !this.state.loadingMore ? (
            <div className="btn" onClick={this.loadMore}>
              {t`Load more`}
            </div>
          ) : null}
          {this.state.loadingMore && <NotificationPanel msg={t`Loading more results ...`} type="loading" />}

          {this.state.displayModal ? (
            <Rodal
              animation="slideUp"
              visible={true}
              width={600}
              height={400}
              onClose={() => this.setState({ displayModal: false })}
              closeOnEsc={true}
            >
              <div className="results-panel">
                <b>{t`Results`}</b>
                <div className="results-heading">
                  {ngettext(
                    msgid`Showing ${this.state.selectedTiles.length} result.`,
                    `Showing ${this.state.selectedTiles.length} results.`,
                    this.state.selectedTiles.length,
                  )}
                  <div style={{ clear: 'both' }} />
                </div>
                {this.state.selectedTiles.map((tile, i) => (
                  <ResultItem
                    key={`selected-layer-${i}`}
                    tile={tile}
                    onHover={this.onResultHover}
                    onStopHover={this.onResultStopHover}
                    onResultSelected={this.onResultSelected}
                  />
                ))}
              </div>
            </Rodal>
          ) : null}
        </div>
      </div>
    );
  }
}

export default Results;
