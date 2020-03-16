import React, { Component } from 'react';
import Joyride from 'react-joyride';
import { ACTIONS, EVENTS } from 'react-joyride/es/constants';
import { TUTORIAL_STEPS, TUTORIAL_STEPS_MOBILE } from './TutorialContent';
import './Tutorial.scss';

const SHOW_TUTORIAL_LC = 'eobrowser_show_tutorial';

class Tutorial extends Component {
  static defaultProps = {
    joyride: {},
  };

  TutorialComponent = ({
    content,
    continuous,
    backProps,
    closeProps,
    index,
    isLastStep,
    locale,
    primaryProps,
    setTooltipRef,
    size,
    skipProps,
    title,
  }) => (
    <div className="tutorialWrap">
      <div className="tutorialBody">
        <button type="button" title="Close" className="closeCross" {...closeProps}>
          <span className="rodal-close" />
        </button>

        <h4 className="tutorialTitle">{title}</h4>
        <div className="contentWrapper">{content}</div>

        {(index > 0 || size === 1) && (
          <div className="tutorialFooter">
            <div>
              <button type="button" className="tutorialButton" {...skipProps} title="Close">
                {locale.skip}
              </button>
              <button
                type="button"
                className="tutorialButton"
                {...closeProps}
                title="Close and don't show again"
              >
                {locale.close}
              </button>
            </div>

            {size > 1 && (
              <div>
                <button
                  type="button"
                  className="tutorialButton"
                  {...backProps}
                  disabled={index <= 0 ? 'disabled' : ''}
                  title="Previous"
                >
                  {locale.back}
                </button>

                <span>
                  {' '}
                  [ {index + 1} / {size} ]{' '}
                </span>

                {isLastStep ? (
                  <button type="button" className="tutorialButton" {...primaryProps} title="End tutorial">
                    {locale.last}
                  </button>
                ) : (
                  <button type="button" className="tutorialButton" {...primaryProps} title="Next">
                    {locale.next}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {index === 0 &&
          size > 1 && (
            <div className="firstTutorialFooter">
              <button
                type="button"
                className="tutorialButton firstTutorialNextButton"
                {...primaryProps}
                title="Continue with tutorial"
              >
                Continue with tutorial
              </button>

              <button
                type="button"
                className="tutorialButton firstTutorialCloseButton"
                title="Close and don't show again"
                onClick={this.handleCloseFirstStep}
              >
                Don't show again
              </button>
            </div>
          )}
      </div>
    </div>
  );

  constructor(props) {
    super(props);
    this.state = {
      run: false,
      stepIndex: 0, // a controlled tutorial
    };
  }

  componentDidMount() {
    const showTutorialVal = window.localStorage.getItem(SHOW_TUTORIAL_LC);
    const showTutorialBool = showTutorialVal ? showTutorialVal === 'true' : true;
    if (showTutorialBool) {
      this.setState({ run: true });
    }
    this.chooseBigSmallTutorial();
  }

  chooseBigSmallTutorial() {
    // tools are visible only above width=900px (App.js)
    this.setState({ steps: window.innerWidth > 900 ? TUTORIAL_STEPS : TUTORIAL_STEPS_MOBILE });
  }

  resetClosingTutorialAnimation() {
    document.getElementById('tutorialAnimatedInfoPanelButton').classList.remove('activateCloseAnimation');
  }
  executeClosingTutorialAnimation() {
    document.getElementById('tutorialAnimatedInfoPanelButton').classList.add('activateCloseAnimation');
  }

  callback = tour => {
    const { action, index, size, type } = tour;

    // controlled tutorial
    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type) && action !== ACTIONS.CLOSE) {
      // go forward or backward
      this.setState({ stepIndex: index + (action === ACTIONS.PREV ? -1 : 1) });
    } else if (
      (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) ||
      (action === ACTIONS.SKIP && type === EVENTS.TOUR_END)
    ) {
      // [x] or 'skip' (close) clicked, stay on same step
      this.executeClosingTutorialAnimation();
      this.setState({ run: false });
    } else if (action === ACTIONS.NEXT && type === EVENTS.TOUR_END) {
      // 'end tutorial' clicked, reset to step 0
      this.executeClosingTutorialAnimation();
      this.setState({ run: false, stepIndex: 0 });
    }

    if (
      ((action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) ||
        (action === ACTIONS.NEXT && type === EVENTS.TOUR_END)) &&
      (index !== 0 || size === 1)
    ) {
      window.localStorage.setItem(SHOW_TUTORIAL_LC, false);
    } else if (action === ACTIONS.SKIP && type === EVENTS.TOUR_END) {
      window.localStorage.setItem(SHOW_TUTORIAL_LC, true);
    }
  };

  handleStartTutorial = e => {
    e.preventDefault();
    this.resetClosingTutorialAnimation();
    this.setState({ run: true });
  };

  handleCloseFirstStep = e => {
    e.preventDefault();
    this.executeClosingTutorialAnimation();
    this.setState({ run: false });
    window.localStorage.setItem(SHOW_TUTORIAL_LC, false);
  };

  render() {
    return (
      <div>
        <div id="tutorialAnimatedInfoPanelButton" className="tutorialPanelButton floatItem" title="Show info">
          <span className="drawGeometry">
            <i className="fa fa-info" />
          </span>
        </div>

        <div
          id="infoButton"
          className="tutorialInfoPanelButton tutorialPanelButton floatItem"
          title="Show info"
          onClick={ev => {
            this.handleStartTutorial(ev);
          }}
        >
          <span className="drawGeometry">
            <i className="fa fa-info" />
          </span>
        </div>

        <Joyride
          continuous
          scrollToFirstStep
          steps={this.state.steps}
          run={this.state.run}
          callback={this.callback}
          stepIndex={this.state.stepIndex}
          tooltipComponent={this.TutorialComponent}
          floaterProps={{
            styles: {
              floater: { transition: 'opacity 0.4s ease-in-out' },
              floaterWithAnimation: { transition: 'opacity 0.4s ease-in-out' },
            },
          }}
        />
      </div>
    );
  }
}

export default Tutorial;
