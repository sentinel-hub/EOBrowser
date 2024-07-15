export const TERRAIN_VIEWER_IDS = {
  MAIN: 'main-terrain-viewer',
  TIMELAPSE_PREVIEWS: 'timelapse-terrain-viewer-previews',
  TIMELAPSE: 'timelapse-terrain-viewer',
};

export let CURRENT_TERRAIN_VIEWER_ID = TERRAIN_VIEWER_IDS.MAIN;

export function setTerrainViewerId(terrainViewerId) {
  CURRENT_TERRAIN_VIEWER_ID = terrainViewerId;
}

export const TIMELAPSE_3D_MIN_EYE_HEIGHT = 50000;
