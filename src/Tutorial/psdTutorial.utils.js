import moment from 'moment';
import { getDataSourceHandler } from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import {
  SEARCH_PANEL_TABS,
  SEARCH_PANEL_TABS_HASH,
  TABS,
  MODE_THEMES_LIST,
  PLANET_SANDBOX_THEME_ID,
} from '../const';
import store, { mainMapSlice, tabsSlice, themesSlice, visualizationSlice } from '../store';
import { parsePosition } from '../utils';
import { PSD_TUTORIAL_LOCAL_STORAGE } from './tutorial.const';
import { PLANET_SANDBOX_THEME } from '../assets/protected_themes';
import { doesUserHaveAccessToPlanetSandboxDataCollections } from '../ThemesProvider/ThemesProvider.utils';

export async function shouldDisplayPSDTutorial(user) {
  if (!user.access_token) {
    return false;
  }

  const userHasAccess = await doesUserHaveAccessToPlanetSandboxDataCollections(user.access_token);
  if (!userHasAccess) {
    return false;
  }

  const psdTutorialData = JSON.parse(localStorage.getItem(PSD_TUTORIAL_LOCAL_STORAGE));

  if (psdTutorialData?.completed) {
    return false;
  }

  if (psdTutorialData?.scheduledAt) {
    return false;
  }

  return true;
}

function selectTheme() {
  store.dispatch(
    themesSlice.actions.setSelectedThemeId({
      selectedThemeId: PLANET_SANDBOX_THEME_ID,
      selectedThemesListId: MODE_THEMES_LIST,
    }),
  );

  store.dispatch(
    tabsSlice.actions.setTabParams({
      selectedTabIndex: TABS.DISCOVER_TAB,
      selectedTabSearchPanelIndex: SEARCH_PANEL_TABS.HIGHLIGHTS_TAB,
    }),
  );
  window.location.hash = SEARCH_PANEL_TABS_HASH[SEARCH_PANEL_TABS.HIGHLIGHTS_TAB];
}

async function visualizeLocation({
  zoom,
  lat,
  lng,
  fromTime,
  toTime,
  datasetId,
  visualizationUrl,
  evalscript,
  evalscripturl,
  layerId,
}) {
  const dataSourceHandler = getDataSourceHandler(datasetId);
  if (dataSourceHandler === null) {
    console.error('Could not find data source handler for datasetId', datasetId);
    return;
  }

  const { lat: parsedLat, lng: parsedLng, zoom: parsedZoom } = parsePosition(lat, lng, zoom);
  store.dispatch(visualizationSlice.actions.reset());
  store.dispatch(
    mainMapSlice.actions.setPosition({
      lat: parsedLat,
      lng: parsedLng,
      zoom: parsedZoom,
    }),
  );

  const fromTimeToUse = fromTime ? moment.utc(fromTime) : moment.utc(toTime).startOf('day');
  const toTimeToUse = fromTime ? moment.utc(toTime) : moment.utc(toTime).endOf('day');

  let visualizationParams = {
    datasetId: datasetId,
    visualizationUrl: visualizationUrl,
    fromTime: fromTimeToUse,
    toTime: toTimeToUse,
    visibleOnMap: true,
  };

  if (evalscript || evalscripturl) {
    visualizationParams.evalscript = evalscript;
    visualizationParams.evalscripturl = evalscripturl;
    visualizationParams.customSelected = true;
  } else {
    visualizationParams.layerId = layerId;
  }

  store.dispatch(visualizationSlice.actions.setVisualizationParams(visualizationParams));
  store.dispatch(tabsSlice.actions.setTabIndex(SEARCH_PANEL_TABS.HIGHLIGHTS_TAB));
}

export const psdTutorialStepActions = {
  1: () => selectTheme(),
  2: () => {
    visualizeLocation(PLANET_SANDBOX_THEME[0].pins.at(0)); // Nebraska, United States (Analysis-Ready PlanetScope)
  },
  4: () => selectTheme(),
};
