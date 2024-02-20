import { TABS } from '../const';
import {
  datasetHasAnyFISLayer,
  supportsFIS,
  getDatasetLabel,
} from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

const AOI_STRING = 'aoi';
const POI_STRING = 'poi';

function generateSingleResult({ layerId, datasetId, customSelected, visualizationUrl, evalscript }) {
  if (!layerId && !customSelected) {
    return null;
  } else if (!customSelected && !datasetHasAnyFISLayer(datasetId)) {
    return {
      name: getDatasetLabel(datasetId),
      preset: layerId,
      baseUrls: { FIS: false },
      visualizationUrl: visualizationUrl,
      layerId: layerId,
      evalscript: evalscript,
      isCustomSelected: customSelected,
    };
  } else if (!supportsFIS(visualizationUrl, datasetId, layerId, customSelected)) {
    return {
      name: layerId,
      preset: layerId,
      baseUrls: { FIS: false },
      visualizationUrl: visualizationUrl,
      layerId: layerId,
      evalscript: evalscript,
      isCustomSelected: customSelected,
    };
  } else {
    return {
      preset: layerId,
      baseUrls: { FIS: true },
      visualizationUrl: visualizationUrl,
      layerId: layerId,
      evalscript: evalscript,
      isCustomSelected: customSelected,
    };
  }
}

function generateSelectedResults(params) {
  const {
    layerId,
    datasetId,
    visualizationUrl,
    customSelected,
    aoiGeometry,
    evalscript,
    selectedTab,
    comparedLayers,
    poiOrAoi,
  } = params;
  const selectedResult = [];

  if (poiOrAoi === AOI_STRING && !aoiGeometry) {
    selectedResult.push(null);
    return selectedResult;
  }

  if (selectedTab === TABS.COMPARE_TAB && comparedLayers) {
    comparedLayers.forEach((cLayer) => {
      const isComparedLayerCustom = !!cLayer.evalscript;
      const singleResult = generateSingleResult({
        layerId: cLayer.layerId,
        datasetId: cLayer.datasetId,
        customSelected: isComparedLayerCustom,
        visualizationUrl: cLayer.visualizationUrl,
        evalscript: cLayer.evalscript,
      });
      selectedResult.push(singleResult);
    });
  } else {
    const singleResult = generateSingleResult({
      layerId,
      datasetId,
      customSelected,
      visualizationUrl,
      evalscript,
    });
    selectedResult.push(singleResult);
  }
  return selectedResult;
}

export { generateSelectedResults, AOI_STRING, POI_STRING };
