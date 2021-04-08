import { parseScript } from 'esprima';
import escodegen from 'escodegen';

export function getEvalscriptSetup(evalscript) {
  const setup = {
    id: 'default',
    sampleType: 'AUTO',
  };
  try {
    const parsed = parseScript(evalscript, { jsx: true, tolerant: true });
    const { input, output } = getSetupObjects(parsed);

    if (input.value.elements[0].type === 'Literal') {
      setup['bands'] = input.value.elements.map(e => e.value);
    } else {
      setup['bands'] = [];
      for (let obj of input.value.elements) {
        const datasource = obj.properties.find(p => p.key.name === 'datasource');
        const bands = obj.properties.find(p => p.key.name === 'bands').value.elements.map(e => e.value);
        setup.bands.push({ datasource: datasource ? datasource.value.value : null, bands: bands });
      }
    }

    const outputObj = output.value.elements ? output.value.elements[0].properties : output.value.properties;

    const id = outputObj.find(p => p.key.name === 'id');
    if (id) {
      setup.id = id.value.value;
    }
    const sampleType = outputObj.find(p => p.key.name === 'sampleType');
    if (sampleType) {
      setup.sampleType = sampleType.value.value;
    }
    setup.nBands = outputObj.find(p => p.key.name === 'bands').value.value;
    return setup;
  } catch (e) {
    return null;
  }
}

export function setEvalscriptSampleType(evalscript, sampleType) {
  try {
    const parsed = parseScript(evalscript, {
      jsx: true,
      tolerant: true,
      range: true,
      tokens: true,
      comment: true,
    });
    escodegen.attachComments(parsed, parsed.comments, parsed.tokens);
    const { output } = getSetupObjects(parsed);

    if (output.value.elements) {
      const _sampleType = output.value.elements[0].properties.find(p => p.key.name === 'sampleType');
      if (_sampleType) {
        _sampleType.value.value = sampleType;
        _sampleType.value.raw = `""${sampleType}""`;
      } else {
        const a = parseScript(`b = {sampleType: "${sampleType}"}`);
        const newProperty = a.body[0].expression.right.properties[0];
        output.value.elements[0].properties.push(newProperty);
      }
    } else {
      const _sampleType = output.value.properties.find(p => p.key.name === 'sampleType');
      if (_sampleType) {
        _sampleType.value.value = sampleType;
        _sampleType.value.raw = `""${sampleType}""`;
      } else {
        const a = parseScript(`b = {sampleType: "${sampleType}"}`);
        const newProperty = a.body[0].expression.right.properties[0];
        output.value.properties.push(newProperty);
      }
    }
    return escodegen.generate(parsed, { comment: true });
  } catch (e) {
    return evalscript;
  }
}

export function setEvalscriptOutputScale(evalscript, scaleFactor) {
  try {
    const parsed = parseScript(evalscript, {
      jsx: true,
      tolerant: true,
      range: true,
      tokens: true,
      comment: true,
    });
    escodegen.attachComments(parsed, parsed.comments, parsed.tokens);
    const evaluatePixelFunction = parsed.body.find(d => d.id && d.id.name === 'evaluatePixel');
    evaluatePixelFunction.id.name = '__noScaleFactor__evaluatePixel';
    const newEvaluatePixel = `
    function evaluatePixel(sample, scene, inputMetadata, customData, outputMetadata) {
      return __noScaleFactor__evaluatePixel(sample, scene, inputMetadata, customData, outputMetadata).map(v => v * ${scaleFactor})
    }
    `;
    const newEvaluatePixelParsed = parseScript(newEvaluatePixel, { jsx: true, tolerant: true });
    parsed.body.push(newEvaluatePixelParsed);
    const newEvalscript = escodegen.generate(parsed, { comment: true });
    return newEvalscript;
  } catch (e) {
    return evalscript;
  }
}

function getSetupObjects(tree) {
  const setupFunction = tree.body.find(d => d.id && d.id.name === 'setup');
  const input = setupFunction.body.body[0].argument.properties.find(p => p.key.name === 'input');
  const output = setupFunction.body.body[0].argument.properties.find(p => p.key.name === 'output');
  return { input: input, output: output };
}

export function setEvalscriptOutputBandNumber(evalscript, nBands) {
  try {
    const parsed = parseScript(evalscript, {
      jsx: true,
      tolerant: true,
      range: true,
      tokens: true,
      comment: true,
    });
    escodegen.attachComments(parsed, parsed.comments, parsed.tokens);
    const { output } = getSetupObjects(parsed);
    if (output.value.elements) {
      const originalNBands = output.value.elements[0].properties.find(p => p.key.name === 'bands');
      originalNBands.value.raw = nBands.toString();
      originalNBands.value.value = nBands;
    } else {
      const originalNBands = output.value.properties.find(p => p.key.name === 'bands');
      originalNBands.value.raw = nBands.toString();
      originalNBands.value.value = nBands;
    }
    return escodegen.generate(parsed, { comment: true });
  } catch (e) {
    return evalscript;
  }
}
