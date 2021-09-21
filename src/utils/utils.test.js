import moment from 'moment';

import { parseDataFusion } from './index';
import { S2L2A } from '../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';

const dfString1 =
  '{"enabled":true,"primaryLayerAlias":"S2L2Ajisqiw","supplementalDatasets":{"AWSEU_S1GRD":{"enabled":true,"alias":"S1GRdewD","mosaickingOrder":"leastRecent","isCustomTimespan":true,"timespan":["2020-08-25T20:00:00.000Z","2020-08-26T23:59:59.999Z"]},"AWS_S2L1C":{"enabled":true,"alias":"S2L1Cdewdewd","mosaickingOrder":"leastCC","isCustomTimespan":true,"timespan":["2020-08-05T00:00:00.000Z","2020-08-26T23:59:59.999Z"]}}}';

const expectedDF1 = [
  {
    id: 'AWS_S2L2A',
    alias: 'S2L2Ajisqiw',
  },
  {
    id: 'AWSEU_S1GRD',
    alias: 'S1GRdewD',
    mosaickingOrder: 'leastRecent',
    timespan: [moment.utc('2020-08-25T20:00:00.000Z'), moment.utc('2020-08-26T23:59:59.999Z')],
  },
  {
    id: 'AWS_S2L1C',
    alias: 'S2L1Cdewdewd',
    mosaickingOrder: 'leastCC',
    timespan: [moment.utc('2020-08-05T00:00:00.000Z'), moment.utc('2020-08-26T23:59:59.999Z')],
  },
];

const dfString2 =
  '[{"id":"AWS_S2L2A","alias":"S2L2A","mosaickingOrder":"leastCC"},{"id":"CRE_S3SLSTR","alias":"S3SLSTR","timespan":["2020-08-26T02:00:00.000Z","2020-08-26T21:59:59.999Z"]}]';

const expectedDF2 = [
  {
    id: 'AWS_S2L2A',
    alias: 'S2L2A',
    mosaickingOrder: 'leastCC',
  },
  {
    id: 'CRE_S3SLSTR',
    alias: 'S3SLSTR',
    timespan: [moment.utc('2020-08-26T02:00:00.000Z'), moment.utc('2020-08-26T21:59:59.999Z')],
  },
];

test.each([
  [dfString1, S2L2A, expectedDF1],
  [dfString2, null, expectedDF2],
])('Test if dataFusion url param is parsed correctly', (dataFusionString, datasetId, expectedDataFusion) => {
  const parsedDataFusion = parseDataFusion(dataFusionString, datasetId);
  expect(parsedDataFusion).toEqual(expectedDataFusion);
});
