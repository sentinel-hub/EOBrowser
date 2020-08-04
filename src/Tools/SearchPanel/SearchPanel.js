import React, { Component } from 'react';
import ExternalLink from '../../ExternalLink/ExternalLink';
import Loader from '../../Loader/Loader';

import EOBFilterSearchByMonths from '../../junk/EOBCommon/EOBFilterSearchByMonths/EOBFilterSearchByMonths';
import DatePicker from '../../components/DatePicker/DatePicker';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { NotificationPanel } from '../../junk/NotificationPanel/NotificationPanel';
import moment from 'moment';
import { connect } from 'react-redux';
import { t } from 'ttag';
import { renderDataSourcesInputs } from './dataSourceHandlers/dataSourceHandlers';
import { Query } from './search';
import store, { themesSlice, visualizationSlice, notificationSlice } from '../../store';
import { EDUCATION_MODE } from '../../const';
import { MODE_THEMES_LIST, USER_INSTANCES_THEMES_LIST, URL_THEMES_LIST } from '../../const';
import Results from '../Results/Results';
import Highlights from './Highlights/Highlights';

const NO_THEME = 'no-theme-selected';
const HIGHLIGHTS_TAB = 'highlights';
const SEARCH_TAB = 'search';

class SearchPanel extends Component {
  state = {
    searchError: null,
    fromMoment: moment
      .utc()
      .subtract(1, 'month')
      .startOf('day'),
    toMoment: moment.utc().endOf('day'),
    datepickerIsExpanded: false,
    filterMonths: null,
    searchInProgress: false,
    resultsPanelSelected: false,
    selectedTab: SEARCH_TAB,
  };

  async componentDidUpdate(prevProps) {
    if (
      this.props.failedThemeParts.length > 0 &&
      prevProps.failedThemeParts !== this.props.failedThemeParts
    ) {
      this.setState({
        searchError: {
          msg: t`Error retrieving additional data!`,
          failedThemeParts: this.props.failedThemeParts,
        },
      });
    }

    if (prevProps.selectedModeId !== this.props.selectedModeId) {
      this.setState({
        selectedTab: SEARCH_TAB,
      });
    }
  }

  handleDatepickerExpanded = expanded => {
    this.setState({
      datepickerIsExpanded: expanded,
    });
  };

  setTimeFrom = selectedFromMoment => {
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

  setTimeTo = selectedToMoment => {
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

  doSearch = async () => {
    store.dispatch(notificationSlice.actions.displayPanelError(null));
    store.dispatch(visualizationSlice.actions.reset());
    this.setState({
      searchInProgress: true,
      searchError: null,
    });
    let currentQuery = new Query();
    const searchPreparation = currentQuery.prepareNewSearch(
      this.state.fromMoment,
      this.state.toMoment,
      this.props.mapBounds,
      this.state.filterMonths,
    );
    if (!searchPreparation.success) {
      this.setState({
        searchError: { msg: searchPreparation.message },
        searchInProgress: false,
      });
      return;
    }
    const { results } = await currentQuery.getNextNResults(50).catch(err => {
      this.setState({
        searchError: { msg: err.message },
      });
      return { results: [] };
    });

    this.setState(
      {
        resultsPanelSelected: true,
        searchInProgress: false,
      },
      this.props.shouldDisplayTileGeometries(true),
    );

    if (!results.length && this.state.searchError) {
      return;
    } else if (!results.length) {
      this.setState({
        searchError: { msg: t`No results found` },
      });
      return;
    }
    this.props.onSearchFinished(currentQuery);
  };

  backToSearch = () => {
    this.props.resetSearch();
    this.setState(
      prevState => ({
        resultsPanelSelected: false,
      }),
      this.props.shouldDisplayTileGeometries(false),
    );
  };

  setSelectedTab = tab => {
    this.setState({
      selectedTab: tab,
    });
  };

  handleSelectTheme = async (e, themes) => {
    const { id: selectedThemeId, list: selectedThemesListId } = themes[e.target.value];
    this.setState({
      searchError: null,
    });
    store.dispatch(
      themesSlice.actions.setSelectedThemeId({
        selectedThemeId: selectedThemeId,
        selectedThemesListId: selectedThemesListId,
      }),
    );
    store.dispatch(visualizationSlice.actions.reset());
    this.props.resetSearch();
  };

  renderThemeSelect = (isEducationModeSelected = false) => {
    let {
      user,
      modeThemesList,
      userInstancesThemesList,
      urlThemesList,
      selectedThemeId,
      selectedThemesListId,
    } = this.props;
    let themes;
    urlThemesList = urlThemesList.map(t => ({ ...t, list: URL_THEMES_LIST }));
    userInstancesThemesList = userInstancesThemesList.map(t => ({ ...t, list: USER_INSTANCES_THEMES_LIST }));
    modeThemesList = modeThemesList.map(t => ({ ...t, list: MODE_THEMES_LIST }));

    if (isEducationModeSelected) {
      themes = [...modeThemesList, ...userInstancesThemesList];
    } else if (urlThemesList.length) {
      themes = [...urlThemesList, ...userInstancesThemesList];
    } else {
      themes = [...modeThemesList, ...userInstancesThemesList];
    }

    const selectedThemeIndex = themes.findIndex(
      t => t.id === selectedThemeId && t.list === selectedThemesListId,
    );
    return (
      <div className="theme-select top">
        <div className="top-label">
          {t`Theme`}:
          {!isEducationModeSelected && (
            <ExternalLink
              className="configurations-settings"
              href="https://apps.sentinel-hub.com/dashboard/#/configurations"
            >
              <i className="fa fa-cog" title={t`Manage configuration instances`} />
            </ExternalLink>
          )}
        </div>
        {!user && !isEducationModeSelected && <p>{t`Login to use custom configuration instances.`}</p>}
        <div>
          <select
            className="dropdown"
            value={selectedThemeId === null ? NO_THEME : selectedThemeIndex}
            onChange={e => this.handleSelectTheme(e, themes)}
          >
            {selectedThemeId === null && <option value={NO_THEME}>...</option>}
            {themes.map((theme, i) => (
              <option key={i} value={i}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  render() {
    const {
      minDate,
      maxDate,
      dataSourcesInitialized,
      selectedModeId,
      selectedThemeId,
      resultsAvailable,
      themesLists,
      selectedThemesListId,
      error,
    } = this.props;
    const minDateRange = minDate ? minDate : moment.utc('1984-01-01');
    const maxDateRange = maxDate ? maxDate : moment.utc();
    const { fromMoment, toMoment, searchInProgress, resultsPanelSelected, selectedTab } = this.state;
    const isEducationModeSelected = selectedModeId === EDUCATION_MODE.id;
    if (selectedThemeId !== null && !dataSourcesInitialized) {
      return (
        <div className="search-loader">
          <Loader />
        </div>
      );
    }

    const displayingResults = resultsAvailable && resultsPanelSelected;

    const selectedTheme = themesLists[selectedThemesListId].find(t => t.id === selectedThemeId);
    const highlightsAvailable = selectedTheme && selectedTheme.pins && selectedTheme.pins.length > 0;
    const isSearchSelected = selectedTab === SEARCH_TAB;
    const areHighlightsSelected = selectedTab === HIGHLIGHTS_TAB;

    return (
      <>
        {displayingResults && (
          <Results
            query={this.props.query}
            onResultSelected={this.props.onResultSelected}
            setHighlightedTile={this.props.setHighlightedTile}
            selectedTiles={this.props.selectedTiles}
            backToSearch={this.backToSearch}
          />
        )}
        <div className={`search-panel ${displayingResults ? 'hidden' : ''}`}>
          {this.renderThemeSelect(isEducationModeSelected)}

          <ul className="discover-tabs">
            <li
              onClick={() => this.setSelectedTab('search')}
              className={`discover-tab-button ${isSearchSelected ? 'active' : ''}`}
            >
              {t`Search`}
            </li>
            <li
              onClick={() => this.setSelectedTab('highlights')}
              className={`discover-tab-button ${highlightsAvailable ? '' : ''} ${
                areHighlightsSelected ? 'active' : ''
              }`}
            >
              {t`Highlights`}
            </li>
          </ul>

          <div className={`discover-tab ${isSearchSelected ? '' : 'hidden'}`}>
            <div className="top-label">
              {t`Data sources`}:
              <div>
                <div className="checkbox-group">
                  <div className="column" key={selectedThemeId || ''}>
                    {selectedThemeId === null ? (
                      <div className="no-theme-selected">{t`Please select a theme`}</div>
                    ) : (
                      renderDataSourcesInputs()
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="clear" />
            <div className="select-time-range">
              <div className="top-label">{t`Time range [UTC]`}:</div>
              <div className="date-pickers-wrapper">
                <DatePicker
                  id="from-search-datepicker"
                  selectedDay={fromMoment}
                  setSelectedDay={this.setTimeFrom}
                  calendarContainer={this.calendarHolder}
                  minDate={minDateRange}
                  maxDate={maxDateRange}
                />

                <span className="date-picker-separator">-</span>
                <DatePicker
                  id="to-search-datepicker"
                  selectedDay={toMoment}
                  setSelectedDay={this.setTimeTo}
                  calendarContainer={this.calendarHolder}
                  minDate={minDateRange}
                  maxDate={maxDateRange}
                />
                <div className="calendar-holder" ref={e => (this.calendarHolder = e)} />
              </div>
              <EOBFilterSearchByMonths onChange={this.setFilterMonths} />
            </div>
            <EOBButton loading={searchInProgress} onClick={() => this.doSearch()} fluid text={t`Search`} />
          </div>

          <div className={`discover-tab ${areHighlightsSelected ? '' : 'hidden'}`}>
            <Highlights
              isThemeSelected={selectedThemeId !== null}
              highlights={highlightsAvailable ? selectedTheme.pins : []}
              resetSearch={this.props.resetSearch}
              setTimeSpanExpanded={this.props.setTimeSpanExpanded}
              setSelectedHighlight={this.props.setSelectedHighlight}
            />
          </div>

          {error ? (
            <NotificationPanel
              msg={
                <div>
                  <span>{error.message}</span>
                  {error.link ? (
                    <ExternalLink href={error.link}>
                      <i class="fas fa-external-link-alt" />
                    </ExternalLink>
                  ) : null}
                </div>
              }
              type="error"
            />
          ) : null}

          {this.state.searchError ? (
            <NotificationPanel
              msg={
                <div>
                  {this.state.searchError.msg}{' '}
                  {this.state.searchError.failedThemeParts ? (
                    <div>
                      <span>These are theme parts which contain unavailable data sources:</span>
                      <ul style={{ textAlign: 'left' }}>
                        {this.state.searchError.failedThemeParts.map(f => (
                          <li key={f}>{f}</li>
                        ))}
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

          {this.state.datepickerIsExpanded && <div id="datepicker-expansion" />}
        </div>
      </>
    );
  }
}

const mapStoreToProps = store => ({
  dataSourcesInitialized: store.themes.dataSourcesInitialized,
  mapBounds: store.mainMap.bounds,
  user: store.auth.user.userdata,
  selectedModeId: store.themes.selectedModeId,
  selectedThemeId: store.themes.selectedThemeId,
  modeThemesList: store.themes.themesLists[MODE_THEMES_LIST],
  userInstancesThemesList: store.themes.themesLists[USER_INSTANCES_THEMES_LIST],
  urlThemesList: store.themes.themesLists[URL_THEMES_LIST],
  failedThemeParts: store.themes.failedThemeParts,
  themesLists: store.themes.themesLists,
  selectedThemesListId: store.themes.selectedThemesListId,
  selectedLanguage: store.language.selectedLanguage,
  error: store.notification.panelError,
});

export default connect(mapStoreToProps, null)(SearchPanel);
