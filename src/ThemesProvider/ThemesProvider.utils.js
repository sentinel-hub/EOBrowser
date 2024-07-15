import axios from 'axios';
import { t } from 'ttag';

import { DEFAULT_MODE, MODES, MODE_THEMES_LIST, URL_THEMES_LIST, EDUCATION_MODE } from '../const';
import { PLANET_SANDBOX_COLLECTIONS } from '../assets/protected_themes';
import { ANALYSIS_READY_PLANETSCOPE } from '../Tools/SearchPanel/dataSourceHandlers/dataSourceConstants';

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

export async function getModifiedUserInstances(access_token, impersonatedAccountId) {
  const url = new URL(`${import.meta.env.VITE_AUTH_BASEURL}configuration/v1/wms/instances`);
  if (impersonatedAccountId) {
    url.searchParams.set('domainAccountId', impersonatedAccountId);
  }

  const response = await axios.get(url.toString(), {
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

const getUserAccessibleCollections = async (access_token, collections) => {
  if (collections?.length === 0) {
    return [];
  }

  try {
    let response = await axios.get(
      `https://services.sentinel-hub.com/api/v1/byoc/global/?ids=${collections.join(',')}`,
      {
        responseType: 'json',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    let validItems = response?.data?.data;
    let validCollections = validItems.map((item) => item.id);

    return validCollections;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const doesUserHaveAccessToPlanetSandboxDataCollections = async (access_token) => {
  // hotfix: https://hello.planet.com/code/sentinel-hub/sentinel-frontend/eo-browser/eobrowser3/-/issues/1402
  const { [ANALYSIS_READY_PLANETSCOPE]: _, ...planetSandboxCollectionsWithoutARPS } =
    PLANET_SANDBOX_COLLECTIONS;

  const accessibleCollections = await getUserAccessibleCollections(
    access_token,
    Object.values(planetSandboxCollectionsWithoutARPS),
  );

  if (!accessibleCollections?.length) {
    return false;
  }

  return true;
};

export async function fetchThemesFromUrl(themesUrl) {
  try {
    const r = await axios.get(themesUrl, { responseType: 'json', timeout: 30000 });
    return { themes: r.data };
  } catch (err) {
    console.error(err);
    return { themes: [], error: err };
  }
}
