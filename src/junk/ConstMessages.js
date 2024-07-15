import { t } from 'ttag';

export const getLoggedInErrorMsg = () => t`You need to log in to use this function.`;
export const getLayerNotSelectedMsg = () => t`Please select a layer.`;
export const getGeometryNotSetMsg = () => t`Please set a geometry.`;
export const getDateNotSetMsg = () => t`Please set a date.`;
export const getCompareModeErrorMsg = () => t`Downloading image in compare mode is not possible.`;
export const getDatasourceNotSupportedMsg = () => t`This datasource is not supported.`;
export const getNotSupportedIn3DMsg = () => t`Not supported in 3D mode.`;
export const getOnlyBasicImgDownloadAvailableMsg = () =>
  t`Image download in compare mode is currently available only for basic image download.`;
export const getAnalyticalExportNotSupportedMsg = () =>
  t`The current datasource doesn't support analytical exports`;
export const zoomTooLow3DMsg = () => t`Zoom too low. Please zoom in.`;
export const getErrorFetchingDataMsg = () => t`Error fetching data`;
export const getFinishDrawingMsg = () => t`Please finish drawing the area of interest.`;
export const getNotAvailableForErrorMsg = (target) => t`not available for ` + target;
export const getHowToConfigLayersStatInfoMsg = () =>
  t`More info [here](https://www.sentinel-hub.com/faq/how-configure-your-layers-statistical-info-eo-browser/)`;
export const getStatisticalInfoMsg = () => t`Statistical Info`;
