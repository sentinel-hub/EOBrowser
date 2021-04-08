import React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import { t } from 'ttag';

import store, { notificationSlice, themesSlice, visualizationSlice } from '../store';
import {
  prepareDataSourceHandlers,
  initializeDataSourceHandlers,
} from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import {
  MODE_THEMES_LIST,
  URL_THEMES_LIST,
  USER_INSTANCES_THEMES_LIST,
  EDUCATION_MODE,
  DEFAULT_MODE,
  MODES,
  EXPIRED_ACCOUNT_DUMMY_INSTANCE_ID,
} from '../const';

const DEFAULT_SELECTED_MODE = process.env.REACT_APP_DEFAULT_MODE_ID
  ? MODES.find(mode => mode.id === process.env.REACT_APP_DEFAULT_MODE_ID)
  : DEFAULT_MODE;

class ThemesProvider extends React.Component {
  async componentDidMount() {
    const { themeIdFromUrlParams, themesUrl, user } = this.props;
    if (user && user.access_token) {
      // User is an object by default, so if(user) is truthy (probably should be changed)
      await this.fetchUserInstances();
    }
    if (themesUrl) {
      const themesFromThemesUrl = await this.fetchThemesFromUrl(themesUrl);
      if (themesFromThemesUrl) {
        store.dispatch(themesSlice.actions.setUrlThemesList(themesFromThemesUrl));
      }
    }
    const selectedMode = this.guessMode(themeIdFromUrlParams);
    this.setMode(selectedMode);
    this.setSelectedThemeIdFromMode(selectedMode);
  }

  async componentDidUpdate(prevProps) {
    // whenever selectedThemeId changes, we also update the datasourceHandlers:
    if (
      prevProps.selectedThemeId !== this.props.selectedThemeId ||
      prevProps.selectedThemesListId !== this.props.selectedThemesListId
    ) {
      await this.updateDataSourceHandlers(this.props.selectedThemeId);
    }

    if (this.props.user !== prevProps.user) {
      if (this.props.user.access_token) {
        // User logged in
        await this.fetchUserInstances();
      } else {
        // User logged out
        this.setThemesOnLogout();
      }
    }
  }

  setThemesOnLogout = () => {
    const { selectedThemesListId, modeThemesList } = this.props;
    if (selectedThemesListId === USER_INSTANCES_THEMES_LIST) {
      store.dispatch(
        themesSlice.actions.setSelectedThemeId({
          selectedThemeId: modeThemesList[0].id,
          selectedThemesListId: MODE_THEMES_LIST,
        }),
      );
      store.dispatch(visualizationSlice.actions.reset());
    }
    store.dispatch(themesSlice.actions.setUserInstancesThemesList([]));
    store.dispatch(notificationSlice.actions.displayPanelError(null));
  };

  async fetchUserInstances() {
    const { access_token } = this.props.user;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_AUTH_BASEURL}configuration/v1/wms/instances`,
        {
          responseType: 'json',
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const modifiedUserInstances = response.data.map(inst => ({
        name: () => t`Based on: ` + inst.name,
        id: `${inst.id}`,
        content: [
          {
            service: 'WMS',
            url: `https://services.sentinel-hub.com/ogc/wms/${inst.id}`,
          },
        ],
      }));

      store.dispatch(themesSlice.actions.setUserInstancesThemesList(modifiedUserInstances));
      store.dispatch(notificationSlice.actions.displayPanelError(null));
    } catch (error) {
      if (error.response && error.response.status === 403) {
        const account_expired_instance = [
          {
            name: () => t`User Instances`,
            id: EXPIRED_ACCOUNT_DUMMY_INSTANCE_ID,
            content: [],
          },
        ];
        store.dispatch(themesSlice.actions.setUserInstancesThemesList(account_expired_instance));
        return;
      }
      let errorMessage =
        t`There was a problem downloading your instances` +
        `${error.response && error.message ? `: ${error.message}` : ''}`;
      let errorLink = null;
      store.dispatch(notificationSlice.actions.displayPanelError({ message: errorMessage, link: errorLink }));
    }
  }

  fetchThemesFromUrl = themesUrl => {
    return axios
      .get(themesUrl, { responseType: 'json', timeout: 30000 })
      .then(r => r.data)
      .catch(err => {
        console.error(err);
        store.dispatch(
          notificationSlice.actions.displayError(
            'Error loading specified theme, see console for more info (common causes: ad blockers, network errors). Using default themes instead.',
          ),
        );
        return [];
      });
  };

  guessMode = themeId => {
    if (!themeId) {
      return DEFAULT_SELECTED_MODE;
    }
    const isThemeUserInstance = !!this.props.userInstancesThemesList.find(t => t.id === themeId);
    if (isThemeUserInstance) {
      return DEFAULT_SELECTED_MODE;
    }
    const isThemeFromUrl = !!this.props.urlThemesList.find(t => t.id === themeId);
    if (isThemeFromUrl) {
      // themesUrl aren't supported in Education mode
      return DEFAULT_MODE;
    }
    for (let mode of MODES) {
      if (mode.themes.find(t => t.id === themeId)) {
        return mode;
      }
    }
    return DEFAULT_SELECTED_MODE;
  };

  setMode = selectedMode => {
    store.dispatch(themesSlice.actions.setSelectedModeId(selectedMode.id));
    store.dispatch(themesSlice.actions.setModeThemesList(selectedMode.themes));
  };

  setSelectedThemeIdFromMode = selectedMode => {
    const { urlThemesList, themeIdFromUrlParams } = this.props;
    if (themeIdFromUrlParams) {
      store.dispatch(themesSlice.actions.setSelectedThemeId({ selectedThemeId: themeIdFromUrlParams }));
    } else {
      if (urlThemesList.length > 0) {
        store.dispatch(
          themesSlice.actions.setSelectedThemeId({
            selectedThemeId: urlThemesList[0].id,
            selectedThemesListId: URL_THEMES_LIST,
          }),
        );
      } else {
        if (selectedMode === EDUCATION_MODE) {
          store.dispatch(
            themesSlice.actions.setSelectedThemeId({
              selectedThemeId: null,
              selectedThemesListId: MODE_THEMES_LIST,
            }),
          );
        } else {
          store.dispatch(
            themesSlice.actions.setSelectedThemeId({
              selectedThemeId: selectedMode.themes[0].id,
              selectedThemesListId: MODE_THEMES_LIST,
            }),
          );
        }
      }
    }
  };

  updateDataSourceHandlers = async themeId => {
    if (!themeId) {
      initializeDataSourceHandlers();
      return;
    }
    const {
      modeThemesList,
      userInstancesThemesList,
      urlThemesList,
      themesLists,
      selectedThemesListId,
    } = this.props;
    // ah yes not sure how to do elegantly this to handle duplicate ids...
    let selectedTheme;

    if (selectedThemesListId) {
      selectedTheme = themesLists[selectedThemesListId].find(t => t.id === themeId);
    } else {
      selectedTheme = [...modeThemesList, ...userInstancesThemesList, ...urlThemesList].find(
        t => t.id === themeId,
      );
    }

    if (!selectedTheme) {
      store.dispatch(notificationSlice.actions.displayError('Selected themeId does not exist!'));
      store.dispatch(themesSlice.actions.setSelectedThemeId({ selectedThemeId: null }));
      initializeDataSourceHandlers();
      return;
    }
    // We still set selected theme for layerInclude/layersExclude etc in Visualization Panel
    store.dispatch(themesSlice.actions.setDataSourcesInitialized(false));
    const failedThemeParts = await prepareDataSourceHandlers(selectedTheme);
    store.dispatch(themesSlice.actions.setFailedThemeParts(failedThemeParts));
  };

  render() {
    return this.props.children;
  }
}

const mapStoreToProps = store => ({
  selectedThemeId: store.themes.selectedThemeId,
  dataSourcesInitialized: store.themes.dataSourcesInitialized,
  themesUrl: store.themes.themesUrl,
  user: store.auth.user,
  modeThemesList: store.themes.themesLists[MODE_THEMES_LIST],
  userInstancesThemesList: store.themes.themesLists[USER_INSTANCES_THEMES_LIST],
  urlThemesList: store.themes.themesLists[URL_THEMES_LIST],
  selectedModeId: store.themes.selectedModeId,
  selectedThemesListId: store.themes.selectedThemesListId,
  themesLists: store.themes.themesLists,
});
export default connect(mapStoreToProps)(ThemesProvider);
