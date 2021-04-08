import {
  getEvalscriptSetup,
  setEvalscriptSampleType,
  setEvalscriptOutputScale,
  setEvalscriptOutputBandNumber,
} from './parseEvalscript';

const inputEvalscript1 = `
//VERSION=3
function setup() {
  return {
    input: ["B01","B03","B12", "dataMask"],
    output: { bands: 4 }
  };
}

function evaluatePixel(sample) {
  return [2.5 * sample.B01,2.5 * sample.B03,2.5 * sample.B12, sample.dataMask ];
}
`;
const expectedSetup1 = {
  id: 'default',
  sampleType: 'AUTO',
  bands: ['B01', 'B03', 'B12', 'dataMask'],
  nBands: 4,
};

const inputEvalscript2 = `
//VERSION=3
function setup() {
  return {
    input: ["B01","B03","B12", "dataMask"],
    output: [{id: "some-id", bands: 4, sampleType: "UINT16" }]
  };
}

function evaluatePixel(sample) {
  return [2.5 * sample.B01,2.5 * sample.B03,2.5 * sample.B12, sample.dataMask ];
}
`;
const expectedSetup2 = {
  id: 'some-id',
  sampleType: 'UINT16',
  bands: ['B01', 'B03', 'B12', 'dataMask'],
  nBands: 4,
};

const inputEvalscript3 = `
// VERSION=3
function setup() {
  return {
    input: [{
        datasource: "S2L1C",
        bands: ["B02", "B03", "B04", "CLM", "CLP"]
      },
      {
        datasource: "S1GRD",
        bands: ["VV", "VH"]
      }
    ],
    output: [{
      bands: 3,
    }]
  }
}
function evaluatePixel(samples, inputData, inputMetadata, customData, outputMetadata) {
  var S2L1C = samples.S2L1C[0]
  var S1 = samples.S1GRD[0]
  let WAT = 25 // Water Threshold for SAR
  let CLP = S2L1C.CLP / 2.55 // Cloud Propability
  let CLPT = 70 // Cloud Propabilty Threshold in percent
  if ((CLP > CLPT && S1.VV / S1.VH <= WAT)) {
    return [S1.VV * 3.0, S1.VV * 1.1 + S1.VH * 8.75, S1.VH * 1.75]
  }
  if ((CLP > CLPT && S1.VV / S1.VH > WAT)) {
    return [S1.VV * 1, S1.VV * 8, 0.5 + S1.VV * 3 + S1.VH * 2000]
  }
  let val = [3 * S2L1C.B04, 3 * S2L1C.B03, 3 * S2L1C.B02]
  return val
}
`;
const expectedSetup3 = {
  id: 'default',
  sampleType: 'AUTO',
  bands: [
    { datasource: 'S2L1C', bands: ['B02', 'B03', 'B04', 'CLM', 'CLP'] },
    { datasource: 'S1GRD', bands: ['VV', 'VH'] },
  ],
  nBands: 3,
};

test.each([
  [inputEvalscript1, expectedSetup1],
  [inputEvalscript2, expectedSetup2],
  [inputEvalscript3, expectedSetup3],
])('Test getEvalscriptSetup method', (evalscript, expectedSetup) => {
  const setup = getEvalscriptSetup(evalscript);
  expect(setup).toEqual(expectedSetup);
});

test.each([
  [inputEvalscript1, 'AUTO', 'FLOAT32'],
  [inputEvalscript2, 'UINT16', 'FLOAT32'],
  [inputEvalscript2, 'UINT16', 'UINT16'],
  [inputEvalscript3, 'AUTO', 'UINT8'],
])('Test setEvalscriptSampleType method', (evalscript, initialSampleType, newSampleType) => {
  const { sampleType: actualInitialSampleType } = getEvalscriptSetup(evalscript);
  expect(actualInitialSampleType).toEqual(initialSampleType);
  const newEvalscript = setEvalscriptSampleType(evalscript, newSampleType);
  const { sampleType: actualNewSampleType } = getEvalscriptSetup(newEvalscript);
  expect(actualNewSampleType).toEqual(newSampleType);
});

const getNewEvaluatePixel = (hasDataMask, scaleFactor) =>
  `
function evaluatePixel(sample, scene, inputMetadata, customData, outputMetadata) {
  return __noScaleFactor__evaluatePixel(sample, scene, inputMetadata, customData, outputMetadata).map(
    (v, i, arr) => {
      if (${hasDataMask}) {
        if (i + 1 === arr.length) {
          return v;
        }
      }
      return v * ${scaleFactor};
    }
  );
}
`.replace(/\s/g, '');

test.each([
  [inputEvalscript1, 0.1, true],
  [inputEvalscript2, 2 ** 16, true],
  [inputEvalscript3, 42, false],
])('Test setEvalscriptOutputScale method', (evalscript, scaleFactor, hasDataMask) => {
  const newEvalscript = setEvalscriptOutputScale(evalscript, scaleFactor, hasDataMask).replace(/\s/g, '');
  const newEvaluatePixel = getNewEvaluatePixel(hasDataMask, scaleFactor);
  expect(newEvalscript.endsWith(newEvaluatePixel)).toEqual(true);
});

test.each([
  [inputEvalscript1, 4, 1],
  [inputEvalscript2, 4, 3],
  [inputEvalscript3, 3, 4],
])('Test setEvalscriptOutputBandNumber method', (evalscript, oldNBands, nBands) => {
  const { nBands: actualInitialNBands } = getEvalscriptSetup(evalscript);
  expect(actualInitialNBands).toEqual(oldNBands);
  const newEvalscript = setEvalscriptOutputBandNumber(evalscript, nBands);
  const { nBands: actualNewNBands } = getEvalscriptSetup(newEvalscript);
  expect(actualNewNBands).toEqual(nBands);
});
