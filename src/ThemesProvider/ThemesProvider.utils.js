import axios from 'axios';
import { t } from 'ttag';

import { DEFAULT_MODE, MODES, MODE_THEMES_LIST, URL_THEMES_LIST, EDUCATION_MODE } from '../const';

const DEFAULT_SELECTED_MODE = import.meta.env.VITE_DEFAULT_MODE_ID
  ? MODES.find((mode) => mode.id === import.meta.env.VITE_DEFAULT_MODE_ID)
  : DEFAULT_MODE;

export function guessMode(themeId, userInstancesThemesList, urlThemesList) {
  if (!themeId) {
    return DEFAULT_SELECTED_MODE;
  }
  const isThemeUserInstance = !!userInstancesThemesList.find((t) => t.id === themeId);
  if (isThemeUserInstance) {
    return DEFAULT_SELECTED_MODE;
  }
  const isThemeFromUrl = !!urlThemesList.find((t) => t.id === themeId);
  if (isThemeFromUrl) {
    // themesUrl aren't supported in Education mode
    return DEFAULT_MODE;
  }
  for (let mode of MODES) {
    if (mode.themes.find((t) => t.id === themeId)) {
      return mode;
    }
  }
  return DEFAULT_SELECTED_MODE;
}

export function getSelectedThemeId(selectedMode, urlThemesList, themeIdFromUrlParams, anonToken) {
  if (themeIdFromUrlParams && anonToken) {
    return { selectedThemeId: themeIdFromUrlParams };
  }
  if (urlThemesList.length > 0) {
    return { selectedThemeId: urlThemesList[0].id, selectedThemesListId: URL_THEMES_LIST };
  }
  if (!anonToken) {
    return { selectedThemeId: null, selectedThemesListId: null };
  }
  if (selectedMode === EDUCATION_MODE) {
    return { selectedThemeId: null, selectedThemesListId: MODE_THEMES_LIST };
  }
  return { selectedThemeId: selectedMode.themes[0].id, selectedThemesListId: MODE_THEMES_LIST };
}

export async function getModifiedUserInstances(access_token) {
  const response = await axios.get(`${import.meta.env.VITE_AUTH_BASEURL}configuration/v1/wms/instances`, {
    responseType: 'json',
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  return response.data.map((inst) => ({
    name: () => t`Based on: ` + inst.name,
    id: `${inst.id}`,
    content: [
      {
        service: 'WMS',
        url: `https://services.sentinel-hub.com/ogc/wms/${inst.id}`,
      },
    ],
  }));
}

export async function fetchThemesFromUrl(themesUrl) {
  try {
    const r = await axios.get(themesUrl, { responseType: 'json', timeout: 30000 });
    return { themes: r.data };
  } catch (err) {
    console.error(err);
    return { themes: [], error: err };
  }
}
