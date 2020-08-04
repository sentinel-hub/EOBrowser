const proposedScaleBarWidth = 50;

export function scalebarPixelWidthAndDistance(metersPerPixel) {
  const roundedMeters = roundScalebarMeters(metersPerPixel * proposedScaleBarWidth);
  const meterOrKilo = getMorKm(roundedMeters);
  const width = roundedMeters / metersPerPixel;
  return {
    widthPx: width,
    label: meterOrKilo,
  };
}

function roundScalebarMeters(distance) {
  const ceilingFactor = getRoundingFactor(distance);
  return Math.round(distance / ceilingFactor) * ceilingFactor;
}

function getRoundingFactor(imageWidthInMeters) {
  const fact = Math.round(Math.log10(imageWidthInMeters)); // 1876 -> log10(1000) = 3
  return Math.pow(10, fact) / 2; // 1000 / 2 = 500;
}

function getMorKm(distance) {
  const divided = distance / 1000;
  if (divided >= 1) {
    return `${divided} km`;
  } else {
    return `${distance} m`;
  }
}
