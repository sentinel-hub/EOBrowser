import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import { useSelector } from 'react-redux';

import store, { modalSlice, themesSlice } from '../store';
import { DraggableDialogBox } from '../components/DraggableDialogBox/DraggableDialogBox';
import { EOBButton } from '../junk/EOBCommon/EOBButton/EOBButton';
import { FATHOM_TRACK_EVENT_LIST, DEFAULT_MODE } from '../const';
import { handleFathomTrackEvent } from '../utils';
import { DEFAULT_THEME_ID, NORMAL_MODE_SUFFIX } from '../assets/default_themes';
import { generateCopernicusBrowserUrl } from './EducationModeRedirect.utils';

import copernicusBrowserPreview from './copernicus_browser_preview.png';
import './EducationModeRedirect.scss';

const title = t`## Try the new Copernicus Browser for education!`;
const description = t`Copernicus Browser offers a tailored educational experience as an [ESA](https://www.esa.int/) and [European Union](https://european-union.europa.eu/) operated utility. Explore the powerful Sentinel-2 Quarterly Cloudless Mosaics and a whole range of new features for teaching and learning about Earth Observation data.`;
const popupWidthPx = 900;
const popupHeightPx = 730;

export default function EducationModeRedirect() {
  const { selectedThemeId, selectedThemesListId } = useSelector((state) => state.themes);

  const onModalClose = () => {
    store.dispatch(modalSlice.actions.removeModal());
    store.dispatch(
      themesSlice.actions.setSelectedThemeIdAndModeId({
        selectedThemeId: selectedThemeId ? `${selectedThemeId}${NORMAL_MODE_SUFFIX}` : DEFAULT_THEME_ID,
        selectedModeId: DEFAULT_MODE.id,
        selectedThemesListId: selectedThemesListId,
      }),
    );
  };

  const openCopernicusBrowser = () => {
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.EDUCATION_MODE_COPERNICUS_BROWSER);
    const copernicusBrowserUrl = generateCopernicusBrowserUrl();
    window.open(copernicusBrowserUrl, '_blank', 'noopener, noreferrer');
  };

  const backToDefaultMode = () => {
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.EDUCATION_MODE_CANCELED);
    onModalClose();
  };

  return (
    <DraggableDialogBox
      width={popupWidthPx}
      height={popupHeightPx}
      modal={true}
      onClose={backToDefaultMode}
      className={'white-background'}
    >
      <div className="educationmode-redirect-content">
        <ReactMarkdown className="text" linkTarget="_blank" children={title} />

        <img
          src={copernicusBrowserPreview}
          alt="preview of Copernicus Browser"
          className="preview-image"
          width={`${popupWidthPx - 100}px`}
          onClick={openCopernicusBrowser}
        />

        <ReactMarkdown className="text" linkTarget="_blank" children={description} />

        <div className="buttons">
          <div className="dark-background-for-btn">
            <EOBButton text={t`Discover Copernicus Browser`} onClick={openCopernicusBrowser} />
          </div>
        </div>
      </div>
    </DraggableDialogBox>
  );
}
