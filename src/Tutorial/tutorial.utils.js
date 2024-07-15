import { ACTIONS, EVENTS } from 'react-joyride';
import { TUTORIAL_STEPS, TUTORIAL_STEPS_MOBILE } from './EOBTutorialContent';
import { PSD_STEPS } from './PSDTutorialContent';
import { createTutorialComponent } from './TutorialComponent';
import { psdTutorialStepActions } from './psdTutorial.utils';
import store, { tutorialSlice } from '../store';
import moment from 'moment';
import {
  PSD_TUTORIAL_ID,
  EOB_TUTORIAL_ID,
  EOB_TUTORIAL_LOCAL_STORAGE,
  PSD_TUTORIAL_LOCAL_STORAGE,
  EOB_TUTORIAL_LEGACY_LOCAL_STORAGE,
} from './tutorial.const';
import { handleFathomTrackEvent } from '../utils';
import { FATHOM_TRACK_EVENT_LIST } from '../const';

export function resetClosingTutorialAnimation() {
  document.getElementById('tutorial-animatedinfopanel-button').classList.remove('activate-close-animation');
}

export function executeClosingTutorialAnimation() {
  document.getElementById('tutorial-animatedinfopanel-button').classList.add('activate-close-animation');
}

export function getTutorialData(tutorialId, psdSubscription) {
  switch (tutorialId) {
    case PSD_TUTORIAL_ID:
      return {
        component: createTutorialComponent(
          psdTutorialStepActions,
          PSD_TUTORIAL_ID,
          PSD_TUTORIAL_LOCAL_STORAGE,
          false,
        ),
        steps: PSD_STEPS(),
        callback: handlePSDTutorialJoyrideCallback(),
      };
    default:
      return {
        component: createTutorialComponent(null, EOB_TUTORIAL_ID, EOB_TUTORIAL_LOCAL_STORAGE, true),
        steps:
          window.innerWidth > 900 ? TUTORIAL_STEPS(psdSubscription) : TUTORIAL_STEPS_MOBILE(psdSubscription),
        callback: handleEOBTutorialJoyrideCallback(),
      };
  }
}

export async function executeStepAction(actions, stepIndex) {
  try {
    if (actions?.[stepIndex]) {
      await actions[stepIndex]();
    }
  } catch (e) {
    console.error('Error executing action for stepIndex', stepIndex, e.message);
  }
}

const handleTutorialJoyrideCallback = (tutorialId, tutorialLocalStorageKey) => (data) => {
  const { action, index, type } = data;

  if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type) && action !== ACTIONS.CLOSE) {
    //move to next/prev slide
    const newIndex = index + (action === ACTIONS.PREV ? -1 : 1);
    store.dispatch(tutorialSlice.actions.setStepIndex(newIndex));

    if (tutorialId === PSD_TUTORIAL_ID && newIndex === 1) {
      // resize the spotlight window so it will fit the highlights and remove this functionality after 10s as the highlights will have loaded in the meantime
      const intervalId = setInterval(() => window.dispatchEvent(new Event('resize')), 250);
      setTimeout(() => clearInterval(intervalId), 10000);
    }
  } else if (action === ACTIONS.CLOSE) {
    localStorage.setItem(tutorialLocalStorageKey, JSON.stringify({ completed: true, scheduledAt: null }));
    //also mark EOBTutorial as completed
    if (tutorialId === PSD_TUTORIAL_ID) {
      const isLastStep = index + 1 === PSD_STEPS().length;

      handleFathomTrackEvent(
        isLastStep
          ? FATHOM_TRACK_EVENT_LIST.PLANETARY_SANDBOX_DATA_TUTORIAL_COMPLETED
          : FATHOM_TRACK_EVENT_LIST.PLANETARY_SANDBOX_DATA_TUTORIAL_DROPPED,
        isLastStep ? null : index + 1,
      );

      localStorage.setItem(
        EOB_TUTORIAL_LOCAL_STORAGE,
        JSON.stringify({ completed: true, scheduledAt: null }),
      );
    }

    store.dispatch(tutorialSlice.actions.closeTutorial());
    executeClosingTutorialAnimation();
  } else if (action === ACTIONS.SKIP && index === 0) {
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.PLANETARY_SANDBOX_DATA_TUTORIAL_DROPPED, index + 1);
    //close and schedule reminder if 'Remind me later' is clicked
    scheduleOpenTutorial(tutorialId, tutorialLocalStorageKey);
    store.dispatch(tutorialSlice.actions.setOpen(false));
    executeClosingTutorialAnimation();
  }
};

const handlePSDTutorialJoyrideCallback = () =>
  handleTutorialJoyrideCallback(PSD_TUTORIAL_ID, PSD_TUTORIAL_LOCAL_STORAGE);

const handleEOBTutorialJoyrideCallback = () =>
  handleTutorialJoyrideCallback(EOB_TUTORIAL_ID, EOB_TUTORIAL_LOCAL_STORAGE);

export function getScheduledDateFromLocalStorage(tutorialLocalStorageKey) {
  const tutorialData = JSON.parse(localStorage.getItem(tutorialLocalStorageKey));

  if (!tutorialData || tutorialData.completed) {
    return null;
  }
  return tutorialData?.scheduledAt;
}

export function isTutorialScheduled(tutorialId, tutorialLocalStorageKey, user) {
  if (tutorialId === PSD_TUTORIAL_ID && !user?.userdata) {
    return false;
  }

  return !!getScheduledDateFromLocalStorage(tutorialLocalStorageKey);
}

export function scheduleOpenTutorial(tutorialId, tutorialLocalStorageKey, dateString = null) {
  let nextDate = dateString ? moment.utc(dateString) : moment.utc().add(1, 'day');
  const timeoutDuration = Math.max(nextDate.diff(moment()), 0);
  setTimeout(() => {
    const { user } = store.getState()?.auth;

    if (isTutorialScheduled(tutorialId, tutorialLocalStorageKey, user)) {
      store.dispatch(tutorialSlice.actions.openTutorial({ id: tutorialId }));
      localStorage.setItem(tutorialLocalStorageKey, JSON.stringify({ completed: false, scheduledAt: null }));
    }
  }, timeoutDuration);
  localStorage.setItem(
    tutorialLocalStorageKey,
    JSON.stringify({ completed: false, scheduledAt: nextDate.toISOString() }),
  );
}

export function migrateEOBTutorialLocalStorage() {
  const showTutorial = localStorage.getItem(EOB_TUTORIAL_LEGACY_LOCAL_STORAGE);

  if (showTutorial !== null) {
    localStorage.removeItem(EOB_TUTORIAL_LEGACY_LOCAL_STORAGE);
    if (showTutorial === 'false') {
      localStorage.setItem(
        EOB_TUTORIAL_LOCAL_STORAGE,
        JSON.stringify({ completed: true, scheduledAt: null }),
      );
    }
  }
}
