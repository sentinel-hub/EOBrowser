import Timelapse from '../Controls/Timelapse/Timelapse';
import ImageDownload from '../Controls/ImgDownload/ImageDownload';
import FIS from '../Controls/FIS/FIS';
import PinsStoryBuilder from '../Controls/PinsStoryBuilder/PinsStoryBuilder';
import SharePinsLink from '../Tools/Pins/SharePinsLink';
import TermsAndPrivacyConsentForm from '../TermsAndPrivacyConsent/TermsAndPrivacyConsentForm';
import { ModalId } from '../const';
import SpectralExplorer from '../Controls/SpectralExplorer/SpectralExplorer';
import ElevationProfile from '../Controls/ElevationProfile/ElevationProfile';

export const Modals = {
  [ModalId.ELEVATION_PROFILE]: () => <ElevationProfile />,
  [ModalId.IMG_DOWNLOAD]: () => <ImageDownload />,
  [ModalId.TIMELAPSE]: () => <Timelapse />,
  [ModalId.FIS]: () => <FIS />,
  [ModalId.SHAREPINSLINK]: () => <SharePinsLink />,
  [ModalId.PINS_STORY_BUILDER]: () => <PinsStoryBuilder />,
  [ModalId.PRIVATE_THEMEID_LOGIN]: () => {},
  [ModalId.TERMS_AND_PRIVACY_CONSENT]: () => <TermsAndPrivacyConsentForm />,
  [ModalId.SPECTRAL_EXPLORER]: ({ geometryType }) => <SpectralExplorer geometryType={geometryType} />,
};

export function propsSufficientToRender(props) {
  const {
    visualizationUrl,
    datasetId,
    layerId,
    customSelected,
    pixelBounds,
    modalId,
    is3D,
    terrainViewerId,
  } = props;

  if (modalId === ModalId.TERRAIN_VIEWER) {
    const isDisabled = (!visualizationUrl && !datasetId && !layerId && !customSelected) || !pixelBounds;
    return !isDisabled;
  }
  if (modalId === ModalId.TIMELAPSE) {
    const isDisabled = is3D && !terrainViewerId;
    return !isDisabled;
  }
  return true;
}
