import { isPlanetHarmonizationSupported } from './CommercialDataPanel';
import { formatNumberAsRoundedUnit } from './commercialData.utils';
import { PlanetItemType, PlanetProductBundle } from '@sentinel-hub/sentinelhub-js';

test.each([
  [PlanetItemType.PSScene, PlanetProductBundle.ANALYTIC_SR_UDM2, true],
  [PlanetItemType.PSScene, PlanetProductBundle.ANALYTIC_UDM2, false],
  [PlanetItemType.PSScene, PlanetProductBundle.ANALYTIC_8B_UDM2, false],
  [PlanetItemType.PSScene, PlanetProductBundle.ANALYTIC_8B_SR_UDM2, true],
  [PlanetItemType.PSScene, PlanetProductBundle.ANALYTIC, false],
  [PlanetItemType.PSScene, PlanetProductBundle.ANALYTIC_SR, false],
  [PlanetItemType.PSScene4Band, PlanetProductBundle.ANALYTIC, true],
  [PlanetItemType.PSScene4Band, PlanetProductBundle.ANALYTIC_UDM2, true],
  [PlanetItemType.PSScene4Band, PlanetProductBundle.ANALYTIC_SR, false],
  [PlanetItemType.PSScene4Band, PlanetProductBundle.ANALYTIC_SR_UDM2, false],
  [PlanetItemType.PSScene4Band, PlanetProductBundle.ANALYTIC_8B_UDM2, false],
  [PlanetItemType.PSScene4Band, PlanetProductBundle.ANALYTIC_8B_SR_UDM2, false],
])('Test isPlanetHarmonizationSupported method', (itemType, productBundle, expectedResult) => {
  expect(isPlanetHarmonizationSupported(itemType, productBundle)).toEqual(expectedResult);
});

describe('Test formatNumberAsRoundedUnit function', () => {
  test.each([
    [1.2345, 3, 'm', 'N/A', '1.235m'],
    [0, 2, '', undefined, '0'],
    [null, 2, '', undefined, ''],
    [undefined, 2, '', undefined, ''],
    ['not a number', 2, '', undefined, ''],
    [0, 2, '', 'N/A', '0'],
    [null, 2, '', 'N/A', 'N/A'],
    [undefined, 2, '', 'N/A', 'N/A'],
    ['not a number', 2, 'N/A', '', ''],
    [0, 2, '', '', '0'],
    [null, 2, '', '', ''],
    [undefined, 2, '', '', ''],
    ['not a number', 2, '', '', ''],
  ])('display null values', (value, precision, unit, nullValueLabel, expectedResult) => {
    expect(formatNumberAsRoundedUnit(value, precision, unit, nullValueLabel)).toEqual(expectedResult);
  });
});
