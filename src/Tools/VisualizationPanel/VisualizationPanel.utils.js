import { defaultEffects } from '../../const';

//Regex for matching True color layers
const TRUE_COLOR_REGEX = /TRUE(\s|-|_)COLOR/i;

//Lets assume layer is True color if layerId or title contains TRUE COLOR
const isTrueColorLayer = (layer) =>
  TRUE_COLOR_REGEX.test(layer.layerId) || TRUE_COLOR_REGEX.test(layer.title);

//True color layers should come first, the rest are sorted by layerId
export const sortLayers = (layers) => {
  const sortedLayers = [
    ...layers.filter((l) => isTrueColorLayer(l)).sort((a, b) => (a.layerId > b.layerId ? 1 : -1)),
    ...layers.filter((l) => !isTrueColorLayer(l)).sort((a, b) => (a.layerId > b.layerId ? 1 : -1)),
  ];

  return sortedLayers;
};

export const haveEffectsChangedFromDefault = (newEffects) => {
  for (let effectName in newEffects) {
    if (
      newEffects[effectName] &&
      JSON.stringify(defaultEffects[effectName]) !== JSON.stringify(newEffects[effectName])
    ) {
      return true;
    }
  }
  return false;
};
