import { getRawBandsScalingFactor } from './ImageDownload.utils';
import { dataSourceHandlers, S2L1C } from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { DATASOURCES } from '../../const';

const TESTING_BYOC_ID = 'test-byoc_id';

function setupTestBYOC() {
  const byocDsh = dataSourceHandlers.find((d) => d.datasource === DATASOURCES.CUSTOM);
  byocDsh.datasets.push(TESTING_BYOC_ID);
  dataSourceHandlers.push(byocDsh);
}

setupTestBYOC();

describe('Test getRawBandsScalingFactor function', () => {
  test.each([
    [TESTING_BYOC_ID, 'FLOAT32', [{ name: 'B01', sampleType: 'UINT16' }], undefined],
    [TESTING_BYOC_ID, 'UINT16', [{ name: 'B01', sampleType: 'UINT16' }], 1],
    [TESTING_BYOC_ID, 'UINT8', [{ name: 'B01', sampleType: 'UINT16' }], 1 / 257], // (2**16 - 1) / 257 = 255
    [TESTING_BYOC_ID, 'FLOAT32', [{ name: 'B01', sampleType: 'UINT8' }], undefined],
    [TESTING_BYOC_ID, 'UINT16', [{ name: 'B01', sampleType: 'UINT8' }], 257],
    [TESTING_BYOC_ID, 'UINT8', [{ name: 'B01', sampleType: 'UINT8' }], 1],
    [S2L1C, 'FLOAT32', [], undefined],
    [S2L1C, 'UINT16', [], 65535],
    [S2L1C, 'UINT8', [], 255],
  ])('raw bands scaling factor', (datasetId, imageSampleType, bandsInfo, expectedFactor) => {
    const factor = getRawBandsScalingFactor({
      datasetId: datasetId,
      imageSampleType: imageSampleType,
      bandsInfo: bandsInfo,
    });
    expect(factor).toEqual(expectedFactor);
  });
});
