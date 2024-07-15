import React, { useMemo } from 'react';
import Joyride from 'react-joyride';
import { FATHOM_TRACK_EVENT_LIST, PLANET_SANDBOX_THEME_ID } from '../const';
import { handleFathomTrackEvent } from '../utils';
import './Tutorial.scss';
import { t } from 'ttag';
import { useSelector } from 'react-redux';
import store, { tutorialSlice } from '../store';
import { getTutorialData, resetClosingTutorialAnimation } from './tutorial.utils';
import { EOB_TUTORIAL_ID, PSD_TUTORIAL_ID } from './tutorial.const';

const Tutorial = ({ popupDisabled }) => {
  const { open, stepIndex, id: tutorialId } = useSelector((state) => state.tutorial);
  const planetSandboxTheme = useSelector((state) => state.themes.themesLists.mode).find(
    (theme) => theme.id === PLANET_SANDBOX_THEME_ID,
  );

  const { component, steps, callback } = useMemo(
    // if there is a theme available, then user is eligible - if theme is available is checked with `doesUserHaveAccessToPlanetSandboxDataCollections` in ThemesProvider.jsx
    () => getTutorialData(tutorialId, !!planetSandboxTheme),
    [tutorialId, planetSandboxTheme],
  );

  const handleStartTutorial = (e) => {
    e.preventDefault();
    resetClosingTutorialAnimation();
    store.dispatch(
      tutorialSlice.actions.openTutorial({
        id: EOB_TUTORIAL_ID,
        stepIndex: tutorialId === EOB_TUTORIAL_ID ? stepIndex : 0,
      }),
    );

    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.SHOW_TUTORIAL_BUTTON);
  };

  return (
    <div>
      <div id="tutorial-animatedinfopanel-button" className="tutorial-panel-button" title={t`Show tutorial`}>
        <span>
          <i className="fa fa-info" />
        </span>
      </div>

      <div
        id="infoButton"
        className="tutorial-infopanel-button tutorial-panel-button"
        title={t`Show tutorial`}
        onClick={handleStartTutorial}
      >
        <span>
          <i className="fa fa-info" />
        </span>
      </div>

      {tutorialId === PSD_TUTORIAL_ID && (
        <div id="psd-tutorial-step3-arrow-wrapper" className={`${stepIndex === 3 ? 'animate' : ''}`}>
          <div id="psd-tutorial-step3-arrow-right" />
        </div>
      )}

      <Joyride
        continuous
        scrollToFirstStep
        steps={steps}
        run={!!tutorialId && open && !popupDisabled}
        callback={callback}
        stepIndex={stepIndex}
        tooltipComponent={component}
        floaterProps={{
          styles: {
            floater: { transition: 'opacity 0.4s ease-in-out' },
            floaterWithAnimation: { transition: 'opacity 0.4s ease-in-out' },
            arrow: {
              length: 32,
              spread: 64,
            },
          },
        }}
        spotlightPadding={tutorialId === PSD_TUTORIAL_ID ? 0 : undefined}
      />
    </div>
  );
};

export default Tutorial;
