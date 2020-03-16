import { legacyGetMapFromParams, setAuthToken, ApiType, isAuthTokenSet } from '@sentinel-hub/sentinelhub-js';
export class SentinelHub {
  constructor(baseUrlOldInstance, baseUrlNewInstance, recaptchaAuthToken) {
    this.baseUrlOldInstance = baseUrlOldInstance;
    this.baseUrlNewInstance = baseUrlNewInstance;
    setAuthToken(recaptchaAuthToken);
  }

  async getMapUsingWmsOldInstance(params) {
    return await legacyGetMapFromParams(this.baseUrlOldInstance, params);
  }

  async getMapUsingProcessingNewInstance(params) {
    const adaptedParams = { ...params, upsampling: 'BICUBIC' };
    return await legacyGetMapFromParams(this.baseUrlNewInstance, adaptedParams, ApiType.PROCESSING);
  }

  async getMap(paramsOriginal) {
    let params = {};
    Object.keys(paramsOriginal).forEach(k => {
      params[k.toLowerCase()] = paramsOriginal[k];
    });
    if (!params['preview']) {
      params['preview'] = 2; // this setting allows zoomed-out previews on Processing API, otherwise we get bounds-too-big errors (this parameter was set directly on layers for the old instances)
    }

    /*
      2 options:
      - use WMS with old instance ID (for old layer definitions, when users change just gain + gamma, and
        for custom layer which uses scripts version 1 or 2)
      - use Processing API (for normal layers and for VERSION=3 custom evalscripts)
    */

    if (!isAuthTokenSet() || this.baseUrlNewInstance === undefined) {
      // no choice, we need to use WMS with old instance ID:
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (
      (params.gamma && Number(params.gamma).toFixed(1) !== '1.0') ||
      (params.gain && Number(params.gain).toFixed(1) !== '1.0') ||
      (params.atmfilter && params.atmfilter !== 'none') ||
      params.layers.endsWith(',DATE')
    ) {
      // gain, gamma, atmfilter and "show acquisition dates" are only supported on WMS with old instance ID:
      // (because we need WMS, and it needs the layer definitions, which should then be VERSION 1 or 2)
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (params.evalscripturl) {
      // if evalscripturl is used, we have no idea what version the evalscript is - we just assume
      // it will be WMS:
      return await this.getMapUsingWmsOldInstance(params);
    }

    if (params.evalscript && params.evalsource) {
      const decodedEvalscript = atob(params.evalscript);
      if (decodedEvalscript.startsWith('//VERSION=3')) {
        // the evalscript we have is marked as VERSION 3 - both Processing API and WMS support this,
        // but we prefer Processing API:
        return await this.getMapUsingProcessingNewInstance(params);
      } else {
        // otherwise we try to use the old instance via WMS:
        return await this.getMapUsingWmsOldInstance(params);
      }
    }

    if (params.evalscriptoverrides) {
      // evalscriptoverrides (setting gain, gamma, r,g,b range) is only supported on WMS with old instance ID:

      //decode evalscriptoverrides parameters
      const evalscriptoverridesObj = atob(params.evalscriptoverrides);

      //evalscriptoverrides are in following format: param1=value1;param2=value2;
      const evalscriptParams = evalscriptoverridesObj.split(';');
      let evalscriptParamsObj = {};
      //convert from array to standard object
      evalscriptParams.filter(param => param).forEach(param => {
        const delimiter = param.indexOf('=');
        const key = param.slice(0, delimiter);
        const val = param.slice(delimiter + 1);
        evalscriptParamsObj[key] = val;
      });

      if (
        (evalscriptParamsObj.gainOverride && evalscriptParamsObj.gainOverride !== '1') ||
        (evalscriptParamsObj.gammaOverride && evalscriptParamsObj.gammaOverride !== '1') ||
        (evalscriptParamsObj.rangeOverrides && evalscriptParamsObj.rangeOverrides !== '[[0,1],[0,1],[0,1]]')
      ) {
        return await this.getMapUsingWmsOldInstance(params);
      }
    }

    // by default, use the Processing API:
    return await this.getMapUsingProcessingNewInstance(params);
  }

  updateToken(token) {
    this.recaptchaAuthToken = token;
  }
}
