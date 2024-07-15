import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { ModalId, PLANET_SANDBOX_THEME_ID } from '../const';
import store, { notificationSlice, themesSlice, visualizationSlice, modalSlice } from '../store';
import {
  prepareDataSourceHandlers,
  initializeDataSourceHandlers,
} from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import {
  MODE_THEMES_LIST,
  URL_THEMES_LIST,
  USER_INSTANCES_THEMES_LIST,
  EXPIRED_ACCOUNT_DUMMY_INSTANCE_ID,
} from '../const';
import { doLogin } from '../Auth/authHelpers';
import {
  guessMode,
  getSelectedThemeId,
  getModifiedUserInstances,
  fetchThemesFromUrl,
  doesUserHaveAccessToPlanetSandboxDataCollections,
} from './ThemesProvider.utils';
import { PLANET_SANDBOX_THEME } from '../assets/protected_themes';
import { mergeAndReorderThemes } from '../utils';

class ThemesProvider extends React.Component {
  async componentDidMount() {
    const {
      themeIdFromUrlParams,
      themesUrl,
      user,
      termsPrivacyAccepted,
      userInstancesThemesList,
      urlThemesList,
    } = this.props;
    if (!termsPrivacyAccepted) {
      return;
    }
    let additionalThemes = [];
    if (user && user.access_token) {
      // User is an object by default, so if(user) is truthy (probably should be changed)
      additionalThemes = await this.fetchUserInstances();
    }
    if (themesUrl) {
      const { themes: themesFromUrl, error: fetchThemesError } = await fetchThemesFromUrl(themesUrl);
      if (themesFromUrl) {
        store.dispatch(themesSlice.actions.setUrlThemesList(themesFromUrl));
      }
      if (fetchThemesError) {
        store.dispatch(
          notificationSlice.actions.displayError(
            'Error loading specified theme, see console for more info (common causes: ad blockers, network errors). Using default themes instead.',
          ),
        );
      }
    }

    // if themeId in URL and not logged in and themeId not in "default" mode theme list
    const selectedMode = guessMode(themeIdFromUrlParams, userInstancesThemesList, urlThemesList);
    this.setMode(selectedMode, additionalThemes);
    this.setSelectedThemeIdFromMode(selectedMode);
    const isThemeIdInModeThemesList = !!selectedMode.themes.find((t) => t.id === themeIdFromUrlParams);

    if (
      selectedMode.themes.length > 0 &&
      !isThemeIdInModeThemesList &&
      themeIdFromUrlParams &&
      !user.access_token
    ) {
      store.dispatch(
        modalSlice.actions.addModal({
          modal:
            themeIdFromUrlParams === PLANET_SANDBOX_THEME_ID
              ? ModalId.PRIVATE_PSD_LOGIN
              : ModalId.PRIVATE_THEMEID_LOGIN,
          params: {
            handlePrivateThemeDecision: (shouldExecuteLogin) =>
              this.handlePrivateThemeDecision(selectedMode, shouldExecuteLogin),
          },
        }),
      );
    }
  }

  async componentDidUpdate(prevProps) {
    if (this.props.user !== prevProps.user) {
      if (this.props.user.access_token) {
        // User logged in
        let additionalThemes = await this.fetchUserInstances();
        this.setThemesWithDefaultFirst(this.props.modeThemesList, additionalThemes);
      } else {
        // User logged out
        this.setThemesOnLogout();
      }
    }

    // whenever selectedThemeId changes, we also update the datasourceHandlers:
    if (
      prevProps.selectedThemeId !== this.props.selectedThemeId ||
      prevProps.selectedThemesListId !== this.props.selectedThemesListId
    ) {
      await this.updateDataSourceHandlers(this.props.selectedThemeId);
    }
  }

  setThemesOnLogout = () => {
    const { selectedThemesListId, modeThemesList } = this.props;
    const haveUserThemes = selectedThemesListId === USER_INSTANCES_THEMES_LIST;
    const haveProtectedThemes = modeThemesList.find((t) => t.id === PLANET_SANDBOX_THEME_ID);

    if (haveUserThemes || haveProtectedThemes) {
      let themes = modeThemesList;

      if (haveProtectedThemes) {
        themes = modeThemesList.filter((t) => t.id !== PLANET_SANDBOX_THEME_ID);
        store.dispatch(themesSlice.actions.setModeThemesList(themes));
      }

      store.dispatch(
        themesSlice.actions.setSelectedThemeId({
          selectedThemeId: themes[0].id,
          selectedThemesListId: MODE_THEMES_LIST,
        }),
      );
      store.dispatch(visualizationSlice.actions.reset());
    }
    store.dispatch(themesSlice.actions.setUserInstancesThemesList([]));
    store.dispatch(notificationSlice.actions.displayPanelError(null));
  };

  setThemesWithDefaultFirst = (newThemes, additionalThemes = []) => {
    let themes = newThemes?.filter((t) => !additionalThemes.includes(t));
    if (themes?.length > 0) {
      store.dispatch(themesSlice.actions.setModeThemesList(mergeAndReorderThemes(themes, additionalThemes)));
    } else {
      store.dispatch(themesSlice.actions.setModeThemesList(additionalThemes));
    }
  };

  async fetchUserInstances() {
    const {
      user: { access_token },
      impersonatedAccountId,
    } = this.props;
    try {
      const modifiedUserInstances = await getModifiedUserInstances(access_token, impersonatedAccountId);

      store.dispatch(themesSlice.actions.setUserInstancesThemesList(modifiedUserInstances));
      store.dispatch(notificationSlice.actions.displayPanelError(null));

      const userHasAccess = await doesUserHaveAccessToPlanetSandboxDataCollections(access_token);
      if (userHasAccess) {
        return PLANET_SANDBOX_THEME;
      }
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
        return [];
      }
      let errorMessage =
        t`There was a problem downloading your instances` +
        `${error.response && error.message ? `: ${error.message}` : ''}`;
      let errorLink = null;
      store.dispatch(notificationSlice.actions.displayPanelError({ message: errorMessage, link: errorLink }));
    }
    return [];
  }

  setMode = (selectedMode, additionalThemes) => {
    store.dispatch(themesSlice.actions.setSelectedModeId(selectedMode.id));
    this.setThemesWithDefaultFirst(selectedMode.themes, additionalThemes);
  };

  setSelectedThemeIdFromMode = (selectedMode) => {
    const { urlThemesList, themeIdFromUrlParams, anonToken } = this.props;
    const themeId = getSelectedThemeId(selectedMode, urlThemesList, themeIdFromUrlParams, anonToken);
    store.dispatch(themesSlice.actions.setSelectedThemeId(themeId));
  };

  updateDataSourceHandlers = async (themeId) => {
    if (!themeId) {
      initializeDataSourceHandlers();
      return;
    }
    const { modeThemesList, userInstancesThemesList, urlThemesList, themesLists, selectedThemesListId } =
      this.props;

    // ah yes not sure how to do elegantly this to handle duplicate ids...
    const themeList = selectedThemesListId
      ? themesLists[selectedThemesListId]
      : [...modeThemesList, ...userInstancesThemesList, ...urlThemesList];
    const selectedTheme = themeList.find((t) => t.id === themeId);

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

  async handlePrivateThemeDecision(selectedMode, shouldExecuteLogin) {
    if (shouldExecuteLogin) {
      await doLogin();
      let additionalThemes = await this.fetchUserInstances();
      this.setMode(selectedMode, additionalThemes);
      this.setSelectedThemeIdFromMode(selectedMode);
    } else {
      store.dispatch(visualizationSlice.actions.reset());
    }
    store.dispatch(modalSlice.actions.removeModal());
  }

  render() {
    return this.props.children;
  }
}

const mapStoreToProps = (store) => ({
  anonToken: store.auth.anonToken,
  termsPrivacyAccepted: store.auth.terms_privacy_accepted,
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
  impersonatedAccountId: store.auth.impersonatedUser.accountId,
});
export default connect(mapStoreToProps)(ThemesProvider);
