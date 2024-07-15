import { configureStore, combineReducers, createSlice, getDefaultMiddleware } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import moment from 'moment';

import {
  MODES,
  MODE_THEMES_LIST,
  USER_INSTANCES_THEMES_LIST,
  URL_THEMES_LIST,
  EDUCATION_MODE,
  DEFAULT_LAT_LNG,
  EXPORT_FORMAT,
  SEARCH_PANEL_TABS,
} from './const';
import { PLANET_SANDBOX_THEME } from './assets/protected_themes';
import { DEMInstanceType } from '@sentinel-hub/sentinelhub-js';
import { COMPARE_SPLIT } from './Tools/ComparePanel/compareConstants';
import { mergeAndReorderThemes } from './utils';

export const aoiSlice = createSlice({
  name: 'aoi',
  initialState: {},
  reducers: {
    set: (state, action) => {
      state.geometry = action.payload.geometry;
      state.bounds = action.payload.bounds;
      state.lastEdited = new Date().toISOString();
      state.isPlacingVertex = action.payload.isPlacingVertex;
    },
    setisPlacingVertex: (state, action) => {
      state.isPlacingVertex = action.payload;
    },
    reset: (state) => {
      state.geometry = null;
      state.bounds = null;
      state.lastEdited = new Date().toISOString();
      state.isDrawing = false;
      state.shape = null;
      state.isPlacingVertex = false;
    },
    startDrawing: (state, action) => {
      state.isDrawing = action.payload.isDrawing;
      state.shape = action.payload.shape;
      state.isPlacingVertex = true;
    },
    clearMap: (state, action) => {
      state.clearMap = action.payload;
    },
  },
});

export const loiSlice = createSlice({
  name: 'loi',
  initialState: {
    geometry: null,
    bounds: null,
    lastEdited: null,
  },
  reducers: {
    set: (state, action) => {
      state.geometry = action.payload.geometry;
      state.bounds = action.payload.bounds;
      state.lastEdited = new Date().toISOString();
    },
    reset: (state) => {
      state.geometry = null;
      state.bounds = null;
      state.lastEdited = null;
    },
  },
});

export const poiSlice = createSlice({
  name: 'poi',
  initialState: {},
  reducers: {
    set: (state, action) => {
      state.position = action.payload.position;
      state.geometry = action.payload.geometry;
      state.lastEdited = new Date().toISOString();
    },
    reset: (state) => {
      state.position = null;
      state.geometry = null;
      state.lastEdited = new Date().toISOString();
    },
  },
});

export const mainMapSlice = createSlice({
  name: 'mainMap',
  initialState: {
    lat: DEFAULT_LAT_LNG.lat,
    lng: DEFAULT_LAT_LNG.lng,
    zoom: 10,
    enabledOverlaysId: ['labels'],
    is3D: false,
  },
  reducers: {
    setPosition: (state, action) => {
      const { lat, lng, zoom } = action.payload;
      if (lat !== undefined && lng !== undefined) {
        state.lat = lat;
        state.lng = lng;
      }
      if (zoom !== undefined) {
        state.zoom = zoom;
      }
    },
    setViewport: (state, action) => {
      const {
        center: [lat, lng],
        zoom,
      } = action.payload;
      state.lat = lat;
      state.lng = lng;
      state.zoom = zoom;
    },
    setBounds: (state, action) => {
      const { bounds, pixelBounds } = action.payload;
      state.bounds = bounds;
      state.pixelBounds = pixelBounds;
    },
    addOverlay: (state, action) => {
      state.enabledOverlaysId.push(action.payload);
    },
    removeOverlay: (state, action) => {
      const overlayIndex = state.enabledOverlaysId.indexOf(action.payload);
      if (overlayIndex !== -1) {
        state.enabledOverlaysId.splice(overlayIndex, 1);
      }
    },
    setIs3D: (state, action) => {
      state.is3D = action.payload;
    },
  },
});

export const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    type: null,
    msg: null,
    panelError: null,
  },
  reducers: {
    displayPanelError: (state, action) => {
      state.panelError = action.payload;
    },
    displayError: (state, action) => {
      state.type = 'error';
      state.msg = action.payload;
    },
    displayWarning: (state, action) => {
      state.type = 'warning';
      state.msg = action.payload;
    },
    displayInfo: (state, action) => {
      state.type = 'info';
      state.msg = action.payload;
    },
    removeNotification: (state, action) => {
      state.type = null;
      state.msg = null;
    },
  },
});

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: {
      userdata: null,
      token_expiration: null,
      access_token: null,
      terms_privacy_accepted: false,
      tokenRefreshInProgress: false,
    },
    impersonatedUser: {
      userId: null,
      accountId: null,
      name: null,
    },
    anonToken: null,
    kc_idp_hint: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user.userdata = action.payload.userdata;
      state.user.access_token = action.payload.access_token;
      state.user.token_expiration = action.payload.token_expiration;
    },
    resetUser: (state, action) => {
      state.user.userdata = null;
      state.user.access_token = null;
      state.user.token_expiration = null;
    },
    setAnonToken: (state, action) => {
      state.anonToken = action.payload;
    },
    setImpersonatedName: (state, action) => {
      state.impersonatedUser.name = action.payload;
    },
    setImpersonatedIds: (state, action) => {
      const { impersonatedAccountId, impersonatedUserId } = action.payload;

      if (impersonatedAccountId) {
        state.impersonatedUser.accountId = impersonatedAccountId;
      }

      if (impersonatedUserId) {
        state.impersonatedUser.userId = impersonatedUserId;
      }
    },
    setTermsPrivacyAccepted: (state, action) => {
      state.terms_privacy_accepted = action.payload;
    },
    setKcIdpHint: (state, action) => {
      state.kc_idp_hint = action.payload;
    },
    setUserTokenRefreshInProgress: (state, action) => {
      state.user.tokenRefreshInProgress = action.payload;
    },
  },
});

export const themesSlice = createSlice({
  name: 'themes',
  initialState: {
    themesUrl: null,
    themesLists: {
      [MODE_THEMES_LIST]: [],
      [USER_INSTANCES_THEMES_LIST]: [],
      [URL_THEMES_LIST]: [],
    },
    selectedThemesListId: null,
    dataSourcesInitialized: false,
    selectedThemeId: undefined,
    selectedModeId: undefined,
    failedThemeParts: [],
  },
  reducers: {
    setSelectedModeId: (state, action) => {
      state.selectedModeId = action.payload;
    },
    setSelectedModeIdAndDefaultTheme: (state, action) => {
      const { modeId, userHasAccess } = action.payload;

      state.selectedModeId = modeId;
      const modeThemes = MODES.find((mode) => mode.id === state.selectedModeId).themes;

      if (userHasAccess && modeId !== EDUCATION_MODE.id) {
        state.themesLists[MODE_THEMES_LIST] = mergeAndReorderThemes(modeThemes, PLANET_SANDBOX_THEME);
      } else {
        state.themesLists[MODE_THEMES_LIST] = modeThemes;
      }

      if (state.selectedModeId === EDUCATION_MODE.id) {
        state.selectedThemeId = null;
        state.selectedThemesListId = MODE_THEMES_LIST;
      } else if (state.themesLists[URL_THEMES_LIST].length > 0) {
        const firstThemeIdInList = state.themesLists[URL_THEMES_LIST][0].id;
        state.selectedThemeId = firstThemeIdInList;
        state.selectedThemesListId = URL_THEMES_LIST;
      } else {
        const firstThemeIdInList = modeThemes[0].id;
        state.selectedThemeId = firstThemeIdInList;
        state.selectedThemesListId = MODE_THEMES_LIST;
      }
    },
    setDataSourcesInitialized: (state, action) => {
      state.dataSourcesInitialized = action.payload;
    },
    setThemesUrl: (state, action) => {
      state.themesUrl = action.payload;
    },
    setModeThemesList: (state, action) => {
      state.themesLists[MODE_THEMES_LIST] = action.payload;
    },
    setUserInstancesThemesList: (state, action) => {
      state.themesLists[USER_INSTANCES_THEMES_LIST] = action.payload;
    },
    setUrlThemesList: (state, action) => {
      state.themesLists[URL_THEMES_LIST] = action.payload;
    },
    setSelectedThemeId: (state, action) => {
      // - if selectedThemesList is supplied, check the combination and set both selectedThemesList and selectedThemeId
      // - else, find the theme with themeId and set selectedTheme according to this
      const { selectedThemeId, selectedThemesListId } = action.payload;

      if (selectedThemesListId) {
        state.selectedThemeId = selectedThemeId;
        state.selectedThemesListId = selectedThemesListId;
      } else {
        if (state.themesLists[USER_INSTANCES_THEMES_LIST].find((t) => t.id === selectedThemeId)) {
          state.selectedThemesListId = USER_INSTANCES_THEMES_LIST;
          state.selectedThemeId = selectedThemeId;
        } else {
          const isThemeInUrlThemesList = !!state.themesLists[URL_THEMES_LIST].find(
            (t) => t.id === selectedThemeId,
          );
          const isThemeInModeThemesList = !!state.themesLists[MODE_THEMES_LIST].find(
            (t) => t.id === selectedThemeId,
          );
          const isEducationMode = state.selectedModeId === EDUCATION_MODE.id;

          if (state.themesLists[URL_THEMES_LIST].length && !isEducationMode) {
            if (isThemeInUrlThemesList) {
              state.selectedThemesListId = URL_THEMES_LIST;
              state.selectedThemeId = selectedThemeId;
            } else {
              state.selectedThemesListId = URL_THEMES_LIST;
              state.selectedThemeId = null;
            }
          } else if (isThemeInModeThemesList) {
            state.selectedThemesListId = MODE_THEMES_LIST;
            state.selectedThemeId = selectedThemeId;
          } else {
            state.selectedThemesListId = MODE_THEMES_LIST;
            state.selectedThemeId = null;
          }
        }
      }
      state.failedThemeParts = [];
    },
    setFailedThemeParts: (state, action) => {
      state.failedThemeParts = action.payload;
    },
    setSelectedThemeIdAndModeId: (state, action) => {
      const { selectedThemeId, selectedModeId, selectedThemesListId } = action.payload;
      state.dataSourcesInitialized =
        selectedModeId === state.selectedModeId && selectedThemeId === state.selectedThemeId;
      state.selectedThemeId = selectedThemeId;
      const modeThemes = MODES.find((mode) => mode.id === selectedModeId).themes;
      state.themesLists[MODE_THEMES_LIST] = modeThemes;
      state.selectedModeId = selectedModeId;
      state.selectedThemesListId = selectedThemesListId;
    },
  },
});

export const modalSlice = createSlice({
  name: 'modal',
  initialState: {
    id: null,
  },
  reducers: {
    addModal: (state, action) => {
      state.id = action.payload.modal;
      state.params = action.payload.params;
    },
    removeModal: (state, action) => {
      state.id = null;
      state.params = null;
    },
  },
});

export const visualizationSlice = createSlice({
  name: 'visualization',
  initialState: {
    fromTime: undefined,
    toTime: undefined,
    datasetId: undefined,
    visualizationUrl: undefined,
    visibleOnMap: false,
    layerId: undefined,
    customSelected: false,
    evalscript: undefined,
    evalscripturl: undefined,
    dataFusion: [],
    gainEffect: 1,
    gammaEffect: 1,
    redRangeEffect: [0, 1],
    greenRangeEffect: [0, 1],
    blueRangeEffect: [0, 1],
    redCurveEffect: undefined,
    greenCurveEffect: undefined,
    blueCurveEffect: undefined,
    minQa: undefined,
    upsampling: undefined,
    downsampling: undefined,
    speckleFilter: undefined,
    orthorectification: undefined,
    backscatterCoeff: undefined,
    demSource3D: DEMInstanceType.MAPZEN,
    error: undefined,
    errorCode: undefined,
    selectedTile: undefined,
  },
  reducers: {
    setVisualizationTime: (state, action) => {
      state.fromTime = action.payload.fromTime;
      state.toTime = action.payload.toTime;
    },
    setDataset: (state, action) => {
      state.datasetId = action.payload;
    },
    setLayerId: (state, action) => {
      state.layerId = action.payload;
    },
    setVisualizationUrl: (state, action) => {
      state.visualizationUrl = action.payload;
    },
    setCustomSelected: (state, action) => {
      state.customSelected = action.payload;
    },
    setEvalscript: (state, action) => {
      state.evalscript = action.payload;
    },

    setEvalscripturl: (state, action) => {
      state.evalscripturl = action.payload;
    },
    setDataFusion: (state, action) => {
      state.dataFusion = action.payload;
    },
    setVisibleOnMap: (state, action) => {
      state.visibleOnMap = action.payload;
    },
    setGainEffect: (state, action) => {
      if (action.payload !== undefined) {
        state.gainEffect = action.payload;
      }
    },
    setGammaEffect: (state, action) => {
      if (action.payload !== undefined) {
        state.gammaEffect = action.payload;
      }
    },
    setRedRangeEffect: (state, action) => {
      if (action.payload !== undefined) {
        state.redRangeEffect = action.payload;
      }
    },
    setGreenRangeEffect: (state, action) => {
      if (action.payload !== undefined) {
        state.greenRangeEffect = action.payload;
      }
    },
    setBlueRangeEffect: (state, action) => {
      if (action.payload !== undefined) {
        state.blueRangeEffect = action.payload;
      }
    },
    setRedCurveEffect: (state, action) => {
      state.redCurveEffect = action.payload;
    },
    setGreenCurveEffect: (state, action) => {
      state.greenCurveEffect = action.payload;
    },
    setBlueCurveEffect: (state, action) => {
      state.blueCurveEffect = action.payload;
    },
    setMinQa: (state, action) => {
      if (action.payload !== undefined) {
        state.minQa = action.payload;
      }
    },
    setUpsampling: (state, action) => {
      state.upsampling = action.payload;
    },
    setDownsampling: (state, action) => {
      state.downsampling = action.payload;
    },
    setSpeckleFilter: (state, action) => {
      state.speckleFilter = action.payload;
    },
    setOrthorectification: (state, action) => {
      state.orthorectification = action.payload;
    },
    setBackScatterCoeff: (state, action) => {
      state.backscatterCoeff = action.payload;
    },
    setDemSource3D: (state, action) => {
      state.demSource3D = action.payload;
    },
    setSelectedTile: (state, action) => {
      state.selectedTile = action.payload;
    },
    setEffects: (state, action) => {
      if (action.payload.gainEffect !== undefined) {
        state.gainEffect = action.payload.gainEffect;
      }
      if (action.payload.gammaEffect !== undefined) {
        state.gammaEffect = action.payload.gammaEffect;
      }
      if (action.payload.redRangeEffect !== undefined) {
        state.redRangeEffect = action.payload.redRangeEffect;
      }
      if (action.payload.greenRangeEffect !== undefined) {
        state.greenRangeEffect = action.payload.greenRangeEffect;
      }
      if (action.payload.blueRangeEffect !== undefined) {
        state.blueRangeEffect = action.payload.blueRangeEffect;
      }
      if (action.payload.redCurveEffect !== undefined) {
        state.redCurveEffect = action.payload.redCurveEffect;
      }
      if (action.payload.greenCurveEffect !== undefined) {
        state.greenCurveEffect = action.payload.greenCurveEffect;
      }
      if (action.payload.blueCurveEffect !== undefined) {
        state.blueCurveEffect = action.payload.blueCurveEffect;
      }
      if (action.payload.minQa !== undefined) {
        state.minQa = action.payload.minQa;
      }
      if (action.payload.upsampling !== undefined) {
        state.upsampling = action.payload.upsampling;
      }
      if (action.payload.downsampling !== undefined) {
        state.downsampling = action.payload.downsampling;
      }
      if (action.payload.speckleFilter !== undefined) {
        state.speckleFilter = action.payload.speckleFilter;
      }
      if (action.payload.orthorectification !== undefined) {
        state.orthorectification = action.payload.orthorectification;
      }
      if (action.payload.demSource3D !== undefined) {
        state.demSource3D = action.payload.demSource3D;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setErrorCode: (state, action) => {
      state.errorCode = action.payload;
    },
    setErrorAndErrorCode: (state, action) => {
      state.error = action.payload.error;
      state.errorCode = action.payload.errorCode;
    },
    resetEffects: (state) => {
      state.gainEffect = 1;
      state.gammaEffect = 1;
      state.redRangeEffect = [0, 1];
      state.greenRangeEffect = [0, 1];
      state.blueRangeEffect = [0, 1];
      state.redCurveEffect = undefined;
      state.greenCurveEffect = undefined;
      state.blueCurveEffect = undefined;
      state.minQa = undefined;
      state.upsampling = undefined;
      state.downsampling = undefined;
      state.speckleFilter = undefined;
      state.orthorectification = undefined;
      state.backscatterCoeff = undefined;
      state.demSource3D = DEMInstanceType.MAPZEN;
    },
    resetRgbEffects: (state) => {
      state.redRangeEffect = [0, 1];
      state.greenRangeEffect = [0, 1];
      state.blueRangeEffect = [0, 1];
      state.redCurveEffect = undefined;
      state.greenCurveEffect = undefined;
      state.blueCurveEffect = undefined;
    },
    setVisualizationParams: (state, action) => {
      if (action.payload.fromTime !== undefined) {
        state.fromTime = action.payload.fromTime;
      }
      if (action.payload.toTime !== undefined) {
        state.toTime = action.payload.toTime;
      }
      if (action.payload.datasetId !== undefined) {
        state.datasetId = action.payload.datasetId;
      }
      if (action.payload.layerId !== undefined) {
        state.layerId = action.payload.layerId;
      }
      if (action.payload.visualizationUrl !== undefined) {
        state.visualizationUrl = action.payload.visualizationUrl;
      }
      if (action.payload.customSelected !== undefined) {
        state.customSelected = action.payload.customSelected;
      }
      if (action.payload.evalscript !== undefined) {
        state.evalscript = action.payload.evalscript;
      }
      if (action.payload.evalscripturl !== undefined) {
        state.evalscripturl = action.payload.evalscripturl;
      }
      if (action.payload.dataFusion !== undefined) {
        state.dataFusion = action.payload.dataFusion;
      }
      if (action.payload.visibleOnMap !== undefined) {
        state.visibleOnMap = action.payload.visibleOnMap;
      }
      if (action.payload.gainEffect !== undefined) {
        state.gainEffect = action.payload.gainEffect;
      }
      if (action.payload.gammaEffect !== undefined) {
        state.gammaEffect = action.payload.gammaEffect;
      }
      if (action.payload.redRangeEffect !== undefined) {
        state.redRangeEffect = action.payload.redRangeEffect;
      }
      if (action.payload.greenRangeEffect !== undefined) {
        state.greenRangeEffect = action.payload.greenRangeEffect;
      }
      if (action.payload.blueRangeEffect !== undefined) {
        state.blueRangeEffect = action.payload.blueRangeEffect;
      }
      if (action.payload.redCurveEffect !== undefined) {
        state.redCurveEffect = action.payload.redCurveEffect;
      }
      if (action.payload.greenCurveEffect !== undefined) {
        state.greenCurveEffect = action.payload.greenCurveEffect;
      }
      if (action.payload.blueCurveEffect !== undefined) {
        state.blueCurveEffect = action.payload.blueCurveEffect;
      }
      if (action.payload.minQa !== undefined) {
        state.minQa = action.payload.minQa;
      }
      if (action.payload.upsampling !== undefined) {
        state.upsampling = action.payload.upsampling;
      }
      if (action.payload.downsampling !== undefined) {
        state.downsampling = action.payload.downsampling;
      }
      if (action.payload.speckleFilter !== undefined) {
        state.speckleFilter = action.payload.speckleFilter;
      }
      if (action.payload.orthorectification !== undefined) {
        state.orthorectification = action.payload.orthorectification;
      }
      if (action.payload.demSource3D !== undefined) {
        state.demSource3D = action.payload.demSource3D;
      }
      if (action.payload.backscatterCoeff !== undefined) {
        state.backscatterCoeff = action.payload.backscatterCoeff;
      }
      if (action.payload.selectedTile !== undefined) {
        state.selectedTile = action.payload.selectedTile;
      }
    },
    reset: (state) => {
      state.fromTime = undefined;
      state.toTime = undefined;
      state.datasetId = undefined;
      state.visualizationUrl = undefined;
      state.layerId = undefined;
      state.customSelected = false;
      state.evalscript = undefined;
      state.evalscripturl = undefined;
      state.dataFusion = [];
      state.visibleOnMap = false;
      state.gainEffect = 1;
      state.gammaEffect = 1;
      state.redRangeEffect = [0, 1];
      state.greenRangeEffect = [0, 1];
      state.blueRangeEffect = [0, 1];
      state.redCurveEffect = undefined;
      state.greenCurveEffect = undefined;
      state.blueCurveEffect = undefined;
      state.minQa = undefined;
      state.upsampling = undefined;
      state.downsampling = undefined;
      state.speckleFilter = undefined;
      state.orthorectification = undefined;
      state.backscatterCoeff = undefined;
      state.demSource3D = DEMInstanceType.MAPZEN;
      state.selectedTile = undefined;
    },
  },
});

export const tabsSlice = createSlice({
  name: 'tabs',
  initialState: {
    selectedTabIndex: 0,
    selectedTabSearchPanelIndex: SEARCH_PANEL_TABS.SEARCH_TAB,
  },
  reducers: {
    setTabIndex: (state, action) => {
      state.selectedTabIndex = action.payload;
    },

    setSelectedTabSearchPanelIndex: (state, action) => {
      state.selectedTabSearchPanelIndex = action.payload;
    },

    setTabParams: (state, action) => {
      state.selectedTabIndex = action.payload.selectedTabIndex;
      state.selectedTabSearchPanelIndex = action.payload.selectedTabSearchPanelIndex;
    },
  },
});

export const compareLayersSlice = createSlice({
  name: 'compare',
  initialState: {
    compareMode: COMPARE_SPLIT,
    comparedLayers: [],
    comparedOpacity: [],
    comparedClipping: [],
    newCompareLayersCount: 0,
  },
  reducers: {
    addToCompare: (state, action) => {
      const newLayer = { id: uuid(), ...action.payload };
      state.comparedLayers = [newLayer, ...state.comparedLayers];
      state.newCompareLayersCount = state.newCompareLayersCount + 1;
      state.comparedOpacity = [1.0, ...state.comparedOpacity];
      state.comparedClipping = [[0, 1], ...state.comparedClipping];
    },
    setCompareMode: (state, action) => {
      state.compareMode = action.payload;
    },
    setComparedLayers: (state, action) => {
      state.comparedLayers = action.payload;
      state.comparedOpacity = new Array(action.payload.length).fill(1.0);
      state.comparedClipping = new Array(action.payload.length).fill([0, 1]);
    },
    addComparedLayers: (state, action) => {
      const layers = action.payload.map((l) => ({ id: uuid(), ...l }));
      state.comparedLayers = [...layers, ...state.comparedLayers];
      state.comparedOpacity = [...new Array(action.payload.length).fill(1.0), ...state.comparedOpacity];
      state.comparedClipping = [...new Array(action.payload.length).fill([0, 1]), ...state.comparedClipping];
    },
    setNewCompareLayersCount: (state, action) => {
      state.newCompareLayersCount = action.payload;
    },
    updateOpacity: (state, action) => {
      const { index, value } = action.payload;
      const newState = [...state.comparedOpacity];
      newState[index] = value;
      state.comparedOpacity = newState;
    },
    updateClipping: (state, action) => {
      const { index, value } = action.payload;
      const newState = [...state.comparedClipping];
      newState[index] = value;
      state.comparedClipping[index] = value;
    },
    resetOpacityAndClipping: (state, action) => {
      state.comparedOpacity = new Array(state.comparedLayers.length).fill(1.0);
      state.comparedClipping = new Array(state.comparedLayers.length).fill([0, 1]);
    },
    updateOrder: (state, action) => {
      const { oldIndex, newIndex } = action.payload;

      const newComparedLayers = [...state.comparedLayers];
      const layer = newComparedLayers.splice(oldIndex, 1)[0];
      newComparedLayers.splice(newIndex, 0, layer);
      state.comparedLayers = newComparedLayers;

      const newComparedOpacity = [...state.comparedOpacity];
      const opacity = newComparedOpacity.splice(oldIndex, 1)[0];
      newComparedOpacity.splice(newIndex, 0, opacity);
      state.comparedOpacity = newComparedOpacity;

      const newComparedClipping = [...state.comparedClipping];
      const clipping = newComparedClipping.splice(oldIndex, 1)[0];
      newComparedClipping.splice(newIndex, 0, clipping);
      state.comparedClipping = newComparedClipping;
    },
    removeFromCompare: (state, action) => {
      const index = action.payload;
      const newComparedLayers = [...state.comparedLayers];
      newComparedLayers.splice(index, 1);
      state.comparedLayers = newComparedLayers;

      const newComparedOpacity = [...state.comparedOpacity];
      newComparedOpacity.splice(index, 1);
      state.comparedOpacity = newComparedOpacity;

      const newComparedClipping = [...state.comparedClipping];
      newComparedClipping.splice(index, 1);
      state.comparedClipping = newComparedClipping;
    },
    restoreComparedLayers: (state, action) => {
      state.comparedLayers = action.payload.layers.map((l) => ({ id: uuid(), ...l }));
      state.compareMode = action.payload.compareMode;
      state.comparedOpacity = action.payload.comparedOpacity;
      state.comparedClipping = action.payload.comparedClipping;
    },
  },
});

export const languageSlice = createSlice({
  name: 'language',
  initialState: {
    selectedLanguage: null,
  },
  reducers: {
    setLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
    },
  },
});

const modeSlice = createSlice({
  name: 'modes',
  initialState: {
    selectedMode: undefined,
  },
  reducers: {
    setMode: (state, action) => {
      state.selectedMode = action.payload;
    },
  },
});

export const pinsSlice = createSlice({
  name: 'pins',
  initialState: {
    items: [],
  },
  reducers: {
    updateItems: (state, action) => {
      state.items = action.payload;
    },
    updatePinsByType: (state, action) => {
      const { pins, pinType } = action.payload;
      state.items = [
        // remove any existing pin items of this type:
        ...state.items.filter((item) => item.type !== pinType),
        // add the pin items for each of the pins:
        ...pins.map((pin) => ({
          type: pinType,
          item: pin, // misnomer - instead of "item" it should be "pin"
          opacity: 1.0,
          clipping: [0, 1],
        })),
      ];
    },
    clearByType: (state, action) => {
      const pinType = action.payload;
      state.items = state.items.filter((item) => item.type !== pinType);
    },
    removeItem: (state, action) => {
      const index = action.payload;
      const pinItems = [...state.items];
      pinItems.splice(index, 1);
      state.items = pinItems;
    },
  },
});

export const timelapseSlice = createSlice({
  name: 'timelapse',
  initialState: {
    displayTimelapseAreaPreview: false,
    fromTime: null,
    toTime: null,
    filterMonths: null,
    selectedPeriod: 'day',
    minCoverageAllowed: 0,
    maxCCPercentAllowed: 100,
    isSelectAllChecked: true,
    showBorders: false,
    timelapseFPS: 1,
    transition: 'none',
    pins: [],
    timelapseSharePreviewMode: false,
    previewFileUrl: null,
    size: null,
    format: EXPORT_FORMAT.gif,
    fadeDuration: 0.5,
    delayLastFrame: false,
  },
  reducers: {
    set: (state, action) => {
      Object.keys(action.payload).forEach((key) => {
        state[key] = ['fromTime', 'toTime'].includes(key)
          ? moment.utc(action.payload[key])
          : action.payload[key];
      });
    },
    reset: (state) => {
      state.displayTimelapseAreaPreview = false;
      state.fromTime = null;
      state.toTime = null;
      state.filterMonths = null;
      state.selectedPeriod = 'day';
      state.minCoverageAllowed = 0;
      state.maxCCPercentAllowed = 100;
      state.isSelectAllChecked = true;
      state.showBorders = false;
      state.timelapseFPS = 1;
      state.transition = 'none';
      state.pins = [];
      state.timelapseSharePreviewMode = false;
      state.previewFileUrl = null;
      state.size = null;
      state.format = EXPORT_FORMAT.gif;
      state.fadeDuration = 0.5;
      state.delayLastFrame = false;
    },
    toggleTimelapseAreaPreview: (state) => {
      state.displayTimelapseAreaPreview = !state.displayTimelapseAreaPreview;
    },
    setTimelapseAreaPreview: (state, action) => {
      state.displayTimelapseAreaPreview = action.payload;
    },
    setInitialTime: (state, action) => {
      state.fromTime = action.payload.time.clone().subtract(1, action.payload.interval);
      state.toTime = action.payload.time.clone();
    },
    setFromTime: (state, action) => {
      state.fromTime = action.payload;
    },
    setToTime: (state, action) => {
      state.toTime = action.payload;
    },
    setFilterMonths: (state, action) => {
      state.filterMonths = action.payload;
    },
    setSelectedPeriod: (state, action) => {
      state.selectedPeriod = action.payload;
    },
    setMinCoverageAllowed: (state, action) => {
      state.minCoverageAllowed = action.payload;
    },
    setMaxCCPercentAllowed: (state, action) => {
      state.maxCCPercentAllowed = action.payload;
    },
    setIsSelectAllChecked: (state, action) => {
      state.isSelectAllChecked = action.payload;
    },
    setShowBorders: (state, action) => {
      state.showBorders = action.payload;
    },
    setTimelapseSharePreviewMode: (state, action) => {
      state.timelapseSharePreviewMode = action.payload;
    },
    setPreviewFileUrl: (state, action) => {
      state.previewFileUrl = action.payload;
    },
    setTimelapseFPS: (state, action) => {
      state.timelapseFPS = action.payload;
    },
    setTransition: (state, action) => {
      state.transition = action.payload;
    },
    addPin: (state, action) => {
      state.pins = [...state.pins, action.payload];
    },
    removePin: (state, action) => {
      if (action.payload > -1) {
        state.pins = state.pins.filter((p, i) => i !== action.payload);
      }
    },
    setSize: (state, action) => {
      state.size = action.payload;
    },
    setFormat: (state, action) => {
      state.format = action.payload;
    },
    setFadeDuration: (state, action) => {
      state.fadeDuration = action.payload;
    },
    setDelayLastFrame: (state, action) => {
      state.delayLastFrame = action.payload;
    },
  },
});

export const indexSlice = createSlice({
  name: 'index',
  initialState: {
    handlePositions: null,
    gradient: null,
  },
  reducers: {
    setHandlePositions: (state, action) => {
      state.handlePositions = action.payload;
    },
    setGradient: (state, action) => {
      state.gradient = action.payload;
    },
  },
});

export const terrainViewerSlice = createSlice({
  name: 'terrainViewer',
  initialState: {
    settings: null,
    id: null,
  },
  reducers: {
    setTerrainViewerSettings: (state, action) => {
      state.settings = action.payload;
    },
    resetTerrainViewerSettings: (state, action) => {
      state.settings = null;
    },
    setTerrainViewerId: (state, action) => {
      state.id = action.payload;
    },
  },
});

export const commercialDataSlice = createSlice({
  name: 'commercialData',
  initialState: {
    searchResults: [],
    displaySearchResults: false,
    location: null,
    highlightedResult: null,
    selectedOrder: null,
  },
  reducers: {
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
      state.displaySearchResults = action.payload.length > 0;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setHighlightedResult: (state, action) => {
      state.highlightedResult = action.payload;
    },
    setDisplaySearchResults: (state, action) => {
      state.displaySearchResults = action.payload;
    },
    setSelectedOrder: (state, action) => {
      state.selectedOrder = action.payload;
    },
    reset: (state, action) => {
      state.highlightedResult = null;
      state.searchResults = [];
      state.location = null;
      state.displaySearchResults = false;
      state.selectedOrder = null;
    },
  },
});

export const spectralExplorerSlice = createSlice({
  name: 'spectralExplorer',
  initialState: {
    selectedSeries: {},
  },
  reducers: {
    setSelectedSeries: (state, action) => {
      const { datasetId, series } = action.payload;
      state.selectedSeries = { ...state.selectedSeries, [datasetId]: series };
    },
    reset: (state) => {
      state.series = {};
    },
  },
});

export const elevationProfileSlice = createSlice({
  name: 'elevationProfile',
  initialState: {
    highlightedPoint: null,
  },
  reducers: {
    setHighlightedPoint: (state, action) => {
      state.highlightedPoint = action.payload.geometry;
    },
    reset: (state) => {
      state.highlightedPoint = null;
    },
  },
});

export const tutorialSlice = createSlice({
  name: 'tutorial',
  initialState: {
    id: null,
    open: false,
    stepIndex: 0,
    tutorialIdToShowUrl: null,
  },
  reducers: {
    setStepIndex: (state, action) => {
      state.stepIndex = action.payload;
    },

    setOpen: (state, action) => {
      state.open = action.payload;
    },

    setTutorialId: (state, action) => {
      if (state.id !== action.payload) {
        state.stepIndex = 0;
      }
      state.id = action.payload;
    },

    setTutorialIdToShowUrl: (state, action) => {
      state.tutorialIdToShowUrl = action.payload;
    },

    openTutorial: (state, action) => {
      const { id, stepIndex } = action.payload;

      state.id = id;
      state.stepIndex = stepIndex || 0;
      state.open = true;
    },

    closeTutorial: (state) => {
      state.id = null;
      state.stepIndex = 0;
      state.open = false;
      state.tutorialIdToShowUrl = null;
    },

    reset: (state) => {
      state.id = null;
      state.open = false;
      state.stepIndex = 0;
      state.tutorialIdToShowUrl = null;
    },
  },
});

const reducers = combineReducers({
  aoi: aoiSlice.reducer,
  loi: loiSlice.reducer,
  poi: poiSlice.reducer,
  mainMap: mainMapSlice.reducer,
  notification: notificationSlice.reducer,
  auth: authSlice.reducer,
  themes: themesSlice.reducer,
  modal: modalSlice.reducer,
  visualization: visualizationSlice.reducer,
  tabs: tabsSlice.reducer,
  compare: compareLayersSlice.reducer,
  language: languageSlice.reducer,
  modes: modeSlice.reducer,
  pins: pinsSlice.reducer,
  timelapse: timelapseSlice.reducer,
  index: indexSlice.reducer,
  terrainViewer: terrainViewerSlice.reducer,
  commercialData: commercialDataSlice.reducer,
  spectralExplorer: spectralExplorerSlice.reducer,
  elevationProfile: elevationProfileSlice.reducer,
  tutorial: tutorialSlice.reducer,
});

const store = configureStore({
  reducer: reducers,
  middleware: getDefaultMiddleware({
    serializableCheck: false,
  }),
}); // Due to "A non-serializable value was detected in an action" => https://github.com/rt2zz/redux-persist/issues/988
export default store;
