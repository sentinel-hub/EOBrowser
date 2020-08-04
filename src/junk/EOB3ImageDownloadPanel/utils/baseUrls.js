export function getBaseUrlsForImageFormat(eob3Url, imageFormat) {
  if (imageFormat === 'image/tiff;depth=16' || imageFormat === 'image/tiff;depth=32f') {
    const url = V3AndV12SiblingInstances[eob3Url];
    return url ? url : eob3Url;
  }
  return eob3Url;
}

/* eslint-disable */
// eslint puts urls on separate lines, making it rather unreadable
const V3AndV12SiblingInstances = {
  //Default
  'https://services-uswest2.sentinel-hub.com/ogc/wms/950dce-YOUR-INSTANCEID-HERE':
    'https://services-uswest2.sentinel-hub.com/ogc/wms/5a32b8-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/950dce-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/5a32b8-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/7bced1-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/a38734-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/694b40-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/588786-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/118885-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/4e60d0-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/f2068f-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/bfbfc4-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/42924c-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/bd86bc-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/ed64bf-YOUR-INSTANCEID-HERE',
  'https://creodias.sentinel-hub.com/ogc/wms/786d82-YOUR-INSTANCEID-HERE':
    'https://creodias.sentinel-hub.com/ogc/wms/cf1956-YOUR-INSTANCEID-HERE',
  'https://creodias.sentinel-hub.com/ogc/wms/82f84f-YOUR-INSTANCEID-HERE':
    'https://creodias.sentinel-hub.com/ogc/wms/f74cbf-YOUR-INSTANCEID-HERE',
  'https://creodias.sentinel-hub.com/ogc/wms/2c5dc5-YOUR-INSTANCEID-HERE':
    'https://creodias.sentinel-hub.com/ogc/wms/680f26-YOUR-INSTANCEID-HERE',
  'https://services-uswest2.sentinel-hub.com/ogc/wms/a322e0-YOUR-INSTANCEID-HERE':
    'https://services-uswest2.sentinel-hub.com/ogc/wms/f268e8-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/a322e0-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/f268e8-YOUR-INSTANCEID-HERE',
  //Volcanoes
  'https://services.sentinel-hub.com/ogc/wms/cb8d43-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/d3c584-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/ad8bbb-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/3c739a-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/53f4f3-YOUR-INSTANCEID-HERE':
    'https://services-uswest2.sentinel-hub.com/ogc/wms/e5efe6-YOUR-INSTANCEID-HERE',
  //Wildfires
  'https://services.sentinel-hub.com/ogc/wms/aae187-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/375bc1-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/146ebe-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/8327f7-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/616409-YOUR-INSTANCEID-HERE':
    'https://creodias.sentinel-hub.com/ogc/wms/bc0b9b-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/9acaad-YOUR-INSTANCEID-HERE':
    'https://creodias.sentinel-hub.com/ogc/wms/75a517-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/2c5dc5-YOUR-INSTANCEID-HERE':
    'https://creodias.sentinel-hub.com/ogc/wms/680f26-YOUR-INSTANCEID-HERE',
  //Monitoring Earth from Space
  'https://services.sentinel-hub.com/ogc/wms/4e7f01-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/711962-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/4407ca-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/3ec6cf-YOUR-INSTANCEID-HERE',
  //Agriculture
  'https://services.sentinel-hub.com/ogc/wms/c6c712-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/92c4dd-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/fa8422-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/e1efea-YOUR-INSTANCEID-HERE',
  //Atmosphere and Pollution (instance is the same as in the deafult theme)
  //Change Detection through Time
  'https://services.sentinel-hub.com/ogc/wms/1b882a-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/22c2e1-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/3f2caf-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/e9e1c4-YOUR-INSTANCEID-HERE',
  'https://services-uswest2.sentinel-hub.com/ogc/wms/a2b6e4-YOUR-INSTANCEID-HERE':
    'https://services-uswest2.sentinel-hub.com/ogc/wms/c38705-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/a2b6e4-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/c38705-YOUR-INSTANCEID-HERE',
  //Flooding and Droughts
  'https://services.sentinel-hub.com/ogc/wms/657cf8-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/d42a60-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/9a82b8-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/672cf9-YOUR-INSTANCEID-HERE',
  'https://services-uswest2.sentinel-hub.com/ogc/wms/1f6348-YOUR-INSTANCEID-HERE':
    'https://services-uswest2.sentinel-hub.com/ogc/wms/6c3264-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/1f6348-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/6c3264-YOUR-INSTANCEID-HERE',
  //Geology
  'https://services.sentinel-hub.com/ogc/wms/239b83-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/0368ca-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/18f7c3-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/a0531e-YOUR-INSTANCEID-HERE',
  //Ocean and Water Bodies
  'https://services.sentinel-hub.com/ogc/wms/eac23b-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/d7ea26-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/961331-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/9339c9-YOUR-INSTANCEID-HERE',
  //Snow and Glaciers
  'https://services.sentinel-hub.com/ogc/wms/08bc6d-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/24eea8-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/6ab085-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/1d2ab4-YOUR-INSTANCEID-HERE',
  //Urban
  'https://services.sentinel-hub.com/ogc/wms/bf6e66-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/3d3519-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/02e09c-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/22c5c8-YOUR-INSTANCEID-HERE',
  //Vegetation and Forestry
  'https://services.sentinel-hub.com/ogc/wms/2730da-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/3b2232-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/8d6624-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/3cfc19-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/89b5c4-YOUR-INSTANCEID-HERE':
    'https://creodias.sentinel-hub.com/ogc/wms/618157-YOUR-INSTANCEID-HERE',
  'https://services-uswest2.sentinel-hub.com/ogc/wms/4b077b-YOUR-INSTANCEID-HERE':
    'https://services-uswest2.sentinel-hub.com/ogc/wms/773a11-YOUR-INSTANCEID-HERE',
  'https://services.sentinel-hub.com/ogc/wms/4b077b-YOUR-INSTANCEID-HERE':
    'https://services.sentinel-hub.com/ogc/wms/773a11-YOUR-INSTANCEID-HERE',
};
/* eslint-enable */
