import { t } from 'ttag';
import store, { tutorialSlice } from '../store';
import { FATHOM_TRACK_EVENT_LIST } from '../const';
import { executeClosingTutorialAnimation, executeStepAction } from './tutorial.utils';
import { EOB_TUTORIAL_ID, PSD_TUTORIAL_ID, EOB_TUTORIAL_LOCAL_STORAGE } from './tutorial.const';
import { handleFathomTrackEvent } from '../utils';

const tutorialLabels = {
  next: () => t`Next`,
  previous: () => t`Previous`,
  endTutorial: () => t`End tutorial`,
  skip: () => t`Remind me later`,
  close: () => t`Close`,
  dontShowAgain: () => t`Don't show again`,
};

export const localeNames = {
  next: () => (
    <span title={tutorialLabels.next()}>
      <i className="fa fa-angle-right" />
    </span>
  ),
  back: () => (
    <span title={tutorialLabels.previous()}>
      <i className="fa fa-angle-left" />
    </span>
  ),
  last: () => (
    <span title={tutorialLabels.endTutorial()}>
      {tutorialLabels.endTutorial()} <i className="fa fa-close" />
    </span>
  ),
  skip: () => <span title={tutorialLabels.skip()}>{tutorialLabels.skip()}</span>,
  close: () => <span title={tutorialLabels.close()}>{tutorialLabels.close()}</span>,
  dontShowAgain: () => <span title={tutorialLabels.dontShowAgain()}>{tutorialLabels.dontShowAgain()}</span>,
};

function closeTutorialWindow(tutorialId, tutorialLocalStorageKey, index, isLastStep) {
  localStorage.setItem(tutorialLocalStorageKey, JSON.stringify({ completed: true, scheduledAt: null }));

  //also mark EOBTutorial as completed
  if (tutorialId === PSD_TUTORIAL_ID) {
    handleFathomTrackEvent(
      isLastStep
        ? FATHOM_TRACK_EVENT_LIST.PLANETARY_SANDBOX_DATA_TUTORIAL_COMPLETED
        : FATHOM_TRACK_EVENT_LIST.PLANETARY_SANDBOX_DATA_TUTORIAL_DROPPED,
      isLastStep ? null : index + 1,
    );

    localStorage.setItem(EOB_TUTORIAL_LOCAL_STORAGE, JSON.stringify({ completed: true, scheduledAt: null }));
  }

  executeClosingTutorialAnimation();
  store.dispatch(tutorialSlice.actions.closeTutorial());
}

export const createTutorialComponent =
  (actions, tutorialId, tutorialLocalStorageKey, displayEndTutorialOnLastPage = false) =>
  ({ tooltipProps, backProps, closeProps, index, isLastStep, primaryProps, size, skipProps, step }) =>
    (
      <div
        className="tutorial-wrap"
        id={tutorialId === EOB_TUTORIAL_ID ? 'eob-tutorial-wrap' : 'psd-tutorial-wrap'}
        {...tooltipProps}
      >
        <div className="tutorial-body">
          <button
            type="button"
            className="close-cross"
            {...closeProps}
            title={tutorialLabels.close()}
            onClick={() => closeTutorialWindow(tutorialId, tutorialLocalStorageKey, index, isLastStep)}
          >
            <span className="rodal-close" />
          </button>
          <h4 className="tutorial-title">{step.title}</h4>
          <div className="content-wrapper">{step.content}</div>
          <div className={`tutorial-footer ${index === 0 ? 'step0' : ''}`}>
            <div className="tutorial-big-buttons-wrapper">
              {index === 0 && (
                <>
                  <button
                    type="button"
                    className="tutorial-button tutorial-closebutton"
                    {...closeProps}
                    title={tutorialLabels.dontShowAgain()}
                  >
                    {step.locale.dontShowAgain()}
                  </button>

                  <button
                    type="button"
                    className="tutorial-button tutorial-closebutton"
                    {...skipProps}
                    title={tutorialLabels.skip()}
                  >
                    {step.locale.skip()}
                  </button>
                </>
              )}

              {index === size - 1 && size > 1 && (
                <>
                  <button
                    type="button"
                    className="tutorial-button tutorial-closebutton"
                    onClick={() =>
                      closeTutorialWindow(tutorialId, tutorialLocalStorageKey, index, isLastStep)
                    }
                    title={tutorialLabels.close()}
                  >
                    {step.locale.close()}
                  </button>
                  {displayEndTutorialOnLastPage && (
                    <button
                      type="button"
                      className="tutorial-button tutorial-closebutton"
                      {...closeProps}
                      title={tutorialLabels.dontShowAgain()}
                    >
                      {step.locale.dontShowAgain()}
                    </button>
                  )}
                </>
              )}
            </div>

            {size > 1 && (
              <div className="tutorial-buttons">
                <span className="tutorial-page-index">
                  {index + 1} / {size}
                </span>
                <button
                  type="button"
                  className="tutorial-button step"
                  {...backProps}
                  onClick={(e) => {
                    executeStepAction(actions, index - 1);
                    backProps.onClick(e);
                  }}
                  disabled={index <= 0}
                  title={tutorialLabels.previous()}
                >
                  {step.locale.back()}
                </button>

                <button
                  type="button"
                  className="tutorial-button step"
                  {...primaryProps}
                  title={tutorialLabels.next()}
                  disabled={isLastStep}
                  onClick={(e) => {
                    executeStepAction(actions, index + 1);
                    primaryProps.onClick(e);
                  }}
                >
                  {step.locale.next()}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
