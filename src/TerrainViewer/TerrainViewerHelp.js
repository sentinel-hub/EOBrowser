import React, { Component } from 'react';
import Rodal from 'rodal';
import { t } from 'ttag';

import leftButton from './assets/mLeft.png';
import rightButton from './assets/mRight.png';
import scrollWheel from './assets/mCenter.png';
import arrowKeys from './assets/arrows.png';
import shiftKey from './assets/shift.png';
import pageUpDown from './assets/pgUp.png';
import panConsole from './assets/panS.png';
import cameraConsole from './assets/rotateS.png';
import zoomButtons from './assets/zoomS.png';

class TerrainViewerHelp extends Component {
  render() {
    const { setShowHelp } = this.props;
    return (
      <Rodal
        onClose={() => setShowHelp(false)}
        animation="slideUp"
        customStyles={{
          width: '50%',
          height: '80%',
          bottom: 'auto',
          top: '30%',
          transform: 'translateY(-30%)',
          zIndex: 9999,
        }}
        closeOnEsc={false}
        visible={true}
        className="terrain-viewer-help-modal"
      >
        <div className="terrain-viewer-help">
          <div className="help-group-wrapper">
            <div className="help-controls">
              <h2>{t`Mouse navigation`}</h2>
              <div>
                <div className="image">
                  <img src={leftButton} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Left button`}</h3>
                  {t`Click and drag using the left mouse button to move across the map at a fixed height. Use SHIFT + left button to rotate.`}
                </div>
              </div>
              <div>
                <div className="image">
                  <img src={rightButton} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Right button`}</h3>
                  {t`Right click and drag up/down to change the elevation of the camera. Right click and
                  drag left/right to rotate the camera's view.`}
                </div>
              </div>
              <div>
                <div className="image">
                  <img src={scrollWheel} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Middle button/wheel`}</h3>
                  {t`Use the scroll wheel to change the elevation of the camera (same as right click + drag
                  up/down). Click and drag the wheel button to change the angle of the camera.`}
                </div>
              </div>
            </div>
          </div>
          <div className="help-group-wrapper">
            <div className="help-controls">
              <h2>{t`Keyboard navigation`}</h2>
              <div>
                <div className="image">
                  <img src={arrowKeys} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Arrow keys`}</h3>
                  {t`Use the arrow keys to move across the map at a fixed height.`}
                </div>
              </div>
              <div>
                <div className="image">
                  <img src={shiftKey} className="right-img" alt="" />
                </div>
                <div>
                  <div className="text">
                    <h3>{t`SHIFT + arrow keys`}</h3>
                    {t`Hold the SHIFT key while pressing the arrow keys to change the camera's view.`}
                  </div>
                </div>
              </div>
              <div>
                <div className="image">
                  <img src={pageUpDown} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Page up/Page down`}</h3>
                  {t`Use the PG UP or PG DN keys to change the elevation of the camera.`}
                </div>
              </div>
            </div>
          </div>
          <div className="help-group-wrapper">
            <div className="help-controls">
              <h2>{t`Map navigation`}</h2>
              <div>
                <div className="image">
                  <img src={panConsole} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Pan console`}</h3>
                  {t`The pan console allows you to move across the map at a fixed height. Click and drag to move
                  continuously. The farther you drag from the center, the faster you will move.`}
                </div>
              </div>
              <div>
                <div className="image">
                  <img src={cameraConsole} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Camera console`}</h3>
                  {t`The camera console moves the camera's view only. Click and drag to change the camera's view.
                  The farther you drag from the center, the faster you will change the view.`}
                </div>
              </div>
              <div>
                <div className="image">
                  <img src={zoomButtons} className="right-img" alt="" />
                </div>
                <div className="text">
                  <h3>{t`Zoom buttons`}</h3>
                  {t`Clicking them will change the elevation of the camera. The plus button will move the camera
                  closer to the earth, the minus button will move the camera further away.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Rodal>
    );
  }
}

export default TerrainViewerHelp;
