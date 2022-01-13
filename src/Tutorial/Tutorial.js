import React, { Component } from 'react';
import Joyride from 'react-joyride';
import { ACTIONS, EVENTS } from 'react-joyride/es/constants';
import { TUTORIAL_STEPS, TUTORIAL_STEPS_MOBILE } from './TutorialContent';
import './Tutorial.scss';
import { t } from 'ttag';

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
    popupDisabled,
  }) => (
    <div className="tutorial-wrap">
      <div className="tutorial-body">
        <button type="button" className="close-cross" {...closeProps} title={t`Close`}>
          <span className="rodal-close" />
        </button>

        <h4 className="tutorial-title">{title}</h4>
        <div className="content-wrapper">{content}</div>

        {(index > 0 || size === 1) && (
          <div className="tutorial-footer">
            <div>
              <button type="button" className="tutorial-button" {...skipProps} title={t`Close`}>
                {locale.skip()}
              </button>
              <button
                type="button"
                className="tutorial-button"
                {...closeProps}
                title={t`Close and don't show again`}
              >
                {locale.close()}
              </button>
            </div>

            {size > 1 && (
              <div>
                <button
                  type="button"
                  className="tutorial-button"
                  {...backProps}
                  disabled={index <= 0 ? 'disabled' : ''}
                  title={t`Previous`}
                >
                  {locale.back()}
                </button>

                <span>
                  {' '}
                  [ {index + 1} / {size} ]{' '}
                </span>

                {isLastStep ? (
                  <button type="button" className="tutorial-button" {...primaryProps} title={t`End tutorial`}>
                    {locale.last()}
                  </button>
                ) : (
                  <button type="button" className="tutorial-button" {...primaryProps} title={t`Next`}>
                    {locale.next()}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {index === 0 && size > 1 && (
          <div className="tutorial-firstpage-footer">
            <button
              type="button"
              className="tutorial-button tutorial-firstpage-nextbutton"
              {...primaryProps}
              title={t`Continue with tutorial`}
            >
              {t`Continue with tutorial`}
            </button>

            <button
              type="button"
              className="tutorial-button tutorial-firstpage-closebutton"
              title={t`Close and don't show again`}
              onClick={this.handleCloseFirstStep}
            >
              {t`Don't show again`}
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
    if (showTutorialBool && !this.props.popupDisabled) {
      this.setState({ run: true });
    }
    this.setTutorialContent();
  }

  componentDidUpdate(prevProps) {
    if (this.props.selectedLanguage !== prevProps.selectedLanguage) {
      this.setTutorialContent();
    }
  }

  setTutorialContent() {
    this.chooseBigSmallTutorial();
  }

  chooseBigSmallTutorial() {
    // tools are visible only above width=900px (App.js)
    this.setState({ steps: window.innerWidth > 900 ? TUTORIAL_STEPS() : TUTORIAL_STEPS_MOBILE() });
  }

  resetClosingTutorialAnimation() {
    document.getElementById('tutorial-animatedinfopanel-button').classList.remove('activate-close-animation');
  }
  executeClosingTutorialAnimation() {
    document.getElementById('tutorial-animatedinfopanel-button').classList.add('activate-close-animation');
  }

  callback = (tour) => {
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

  handleStartTutorial = (e) => {
    e.preventDefault();
    this.resetClosingTutorialAnimation();
    this.setState({ run: true });
  };

  handleCloseFirstStep = (e) => {
    e.preventDefault();
    this.executeClosingTutorialAnimation();
    this.setState({ run: false });
    window.localStorage.setItem(SHOW_TUTORIAL_LC, false);
  };

  render() {
    return (
      <div>
        <div id="tutorial-animatedinfopanel-button" className="tutorial-panel-button" title={t`Show info`}>
          <span>
            <i className="fa fa-info" />
          </span>
        </div>

        <div
          id="infoButton"
          className="tutorial-infopanel-button tutorial-panel-button"
          title={t`Show info`}
          onClick={(ev) => {
            this.handleStartTutorial(ev);
          }}
        >
          <span>
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
