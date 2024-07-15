import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { shouldDisplayPSDTutorial } from './psdTutorial.utils';
import { tutorialSlice, modalSlice } from '../store';
import {
  getScheduledDateFromLocalStorage,
  isTutorialScheduled,
  migrateEOBTutorialLocalStorage,
  scheduleOpenTutorial,
} from './tutorial.utils';
import {
  EOB_TUTORIAL_ID,
  EOB_TUTORIAL_LOCAL_STORAGE,
  PSD_TUTORIAL_ID,
  PSD_TUTORIAL_LOCAL_STORAGE,
} from './tutorial.const';
import { doesUserHaveAccessToPlanetSandboxDataCollections } from '../ThemesProvider/ThemesProvider.utils';
import { getUrlParams, handleFathomTrackEvent } from '../utils';
import { ModalId, FATHOM_TRACK_EVENT_LIST, PLANET_SANDBOX_THEME_ID } from '../const';
import { doLogin } from '../Auth/authHelpers';

const cleanUp = (effectRan) => {
  effectRan.current = true;
};

export function TutorialProvider({ children, themeIdFromUrlParams }) {
  const auth = useSelector((state) => state.auth);
  const effectRan = useRef(false);
  const dispatch = useDispatch();
  const urlParams = getUrlParams();
  const { tutorialIdToShow } = urlParams;

  const handleTutorialLogic = useCallback(async () => {
    if (!auth.terms_privacy_accepted) {
      return;
    }

    if (tutorialIdToShow === PSD_TUTORIAL_ID) {
      localStorage.setItem(
        PSD_TUTORIAL_LOCAL_STORAGE,
        JSON.stringify({ completed: false, scheduledAt: null }),
      );

      // in case user comes to EOB via deep link, we do not want to show him the EOB tutorial (mark it as completed)
      localStorage.setItem(
        EOB_TUTORIAL_LOCAL_STORAGE,
        JSON.stringify({ completed: true, scheduledAt: null }),
      );

      // logged out - prompt user to login to get access
      if (!auth.user.access_token) {
        // if it is PSD theme, let ThemesProvider.jsx handle the modal with correct logic for setting the theme
        if (themeIdFromUrlParams !== PLANET_SANDBOX_THEME_ID) {
          dispatch(
            modalSlice.actions.addModal({
              modal: ModalId.PRIVATE_PSD_LOGIN,
              params: {
                handlePrivateThemeDecision: async (shouldExecuteLogin) => {
                  if (shouldExecuteLogin) {
                    await doLogin();
                  }
                  dispatch(modalSlice.actions.removeModal());
                },
              },
            }),
          );
        }
        return;
      }

      // logged in - check if user is eligible
      const userHasAccess = await doesUserHaveAccessToPlanetSandboxDataCollections(auth.user.access_token);
      if (!userHasAccess) {
        // show some warning that user is not eligible to see any of the collections
        dispatch(modalSlice.actions.addModal({ modal: ModalId.PSD_NOT_ELIGIBLE_USER }));
        return;
      }
    }

    if (effectRan.current === false) {
      migrateEOBTutorialLocalStorage();
      const displayPSDtutorial = await shouldDisplayPSDTutorial(auth?.user);
      if (displayPSDtutorial) {
        dispatch(tutorialSlice.actions.openTutorial({ id: PSD_TUTORIAL_ID }));
        handleFathomTrackEvent(
          tutorialIdToShow === PSD_TUTORIAL_ID
            ? FATHOM_TRACK_EVENT_LIST.SANDBOX_DATA_SHOW_TUTORIAL_ON_DEEP_LINK
            : FATHOM_TRACK_EVENT_LIST.SANDBOX_DATA_SHOW_TUTORIAL_ON_INITIAL_PROMPTING,
        );
      } else {
        if (isTutorialScheduled(PSD_TUTORIAL_ID, PSD_TUTORIAL_LOCAL_STORAGE, auth?.user)) {
          const scheduledAt = getScheduledDateFromLocalStorage(PSD_TUTORIAL_ID, PSD_TUTORIAL_LOCAL_STORAGE);
          scheduleOpenTutorial(PSD_TUTORIAL_ID, PSD_TUTORIAL_LOCAL_STORAGE, scheduledAt);
        } else if (isTutorialScheduled(EOB_TUTORIAL_ID, EOB_TUTORIAL_LOCAL_STORAGE, auth?.user)) {
          const scheduledAt = getScheduledDateFromLocalStorage(EOB_TUTORIAL_ID, EOB_TUTORIAL_LOCAL_STORAGE);
          scheduleOpenTutorial(EOB_TUTORIAL_ID, EOB_TUTORIAL_LOCAL_STORAGE, scheduledAt);
        } else {
          const tutorialData = JSON.parse(localStorage.getItem(EOB_TUTORIAL_LOCAL_STORAGE));
          if (!tutorialData?.completed) {
            dispatch(tutorialSlice.actions.openTutorial({ id: EOB_TUTORIAL_ID }));
          }
        }
      }

      return cleanUp(effectRan);
    }
  }, [auth.user, auth.terms_privacy_accepted, tutorialIdToShow, themeIdFromUrlParams, dispatch]);

  useEffect(() => {
    handleTutorialLogic();
  }, [auth.user, auth.terms_privacy_accepted, tutorialIdToShow, dispatch, handleTutorialLogic]);

  return children;
}
