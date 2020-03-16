import React from 'react';
import PropTypes from 'prop-types';
import dragula from 'react-dragula';
import 'react-dragula/dist/dragula.min.css';
import { NotificationPanel } from '@sentinel-hub/eo-components';
import Store from '../store';
import Pin from './Pin';
import { EOBButton } from '@sentinel-hub/eo-components';
import { RadioGroup, Radio } from 'react-radio-group';
import Rodal from 'rodal';
import PinTools from './PinTools';
import UploadPinsJsonFile from './PinTools/UploadPinsJsonFile';

class PinPanel extends React.Component {
  constructor() {
    super();
    this.state = { uploadDialog: false };
  }

  dragulaDecorator = componentBackingInstance => {
    if (componentBackingInstance) {
      dragula([componentBackingInstance], {
        moves: (el, container, handle) => {
          if (handle.classList.contains('pin-dragHandler') || handle.classList.contains('fa-ellipsis-v')) {
            return true;
          }
        },
      }).on('drop', (el, target, source, sibling) => {
        const droppedLocation = this.getIndexInParent(el);
        const oldLocation = this.getIndexInData(el.dataset.id);
        this.changePinOrder(oldLocation, droppedLocation);
      });
    }
  };
  getIndexInParent = el => Array.from(el.parentNode.children).indexOf(el);
  getIndexInData = id => this.props.items.findIndex(e => e._id === id);

  confirmDeleteAllPins = () => {
    const modalDialogId = 'confirm-clear-pins';
    Store.addModalDialog(
      modalDialogId,
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={150}
        onClose={() => this.closeDialog(modalDialogId)}
        closeOnEsc={true}
      >
        <h3>Delete pins</h3>
        <b>WARNING:</b> You're about to delete all pins. Do you wish to continue? <br />
        <center>
          <EOBButton
            text="Yes"
            onClick={() => {
              this.deletePins();
              this.closeDialog(modalDialogId);
            }}
            icon="check"
            style={{ marginRight: 10 }}
          />
          <EOBButton text="No" onClick={() => this.closeDialog(modalDialogId)} icon="times" />
        </center>
      </Rodal>,
    );
  };

  closeDialog = modalDialogId => {
    Store.removeModalDialog(modalDialogId);
  };

  deletePins = () => {
    this.props.onClearPins();
    this.closeDialog();
  };

  changePinOrder = (oldIndex, newIndex) => {
    this.props.pinOrderChange(oldIndex, newIndex);
    Store.changePinOrder(oldIndex, newIndex, this.props.readOnly);
  };

  openUploadPinsJsonFileDialog = () => {
    this.setState({ uploadDialog: true });
  };

  onUpload = (uploadedPins, keepExisting) => {
    if (!keepExisting) {
      this.props.onClearPins();
    }
    let filteredUpload = uploadedPins.filter(upin => !this.props.items.find(pin => pin._id === upin._id));

    filteredUpload.reverse();
    Store.addPins(filteredUpload);
    this.setState({ uploadDialog: false });
    Store.setTabIndex(3);
  };

  safeOnCompare = () => {
    if (this.props.items.length > 0) {
      this.props.onCompare();
    }
  };

  render() {
    let { items, isCompare, isOpacity, onToggleCompareMode, onRemove, loggedIn } = this.props;
    const noPinMsg = `No pins. ${
      this.props.readOnly
        ? 'This theme has no pins stored'
        : 'Go to the Visualization tab to save a pin or upload a JSON file with saved pins'
    }.`;
    const NOT_LOGGED_IN_AND_TEMP_PIN_MSG =
      'Note that the pins will be saved only if you log in. Otherwise, the pins will be lost once the application is closed.';
    return (
      <div className={`pinPanel ${!isCompare && 'normalMode'}`}>
        <div className="comparisonHeader">
          <PinTools
            pins={items}
            confirmDeleteAllPins={this.confirmDeleteAllPins}
            openUploadPinsJsonFileDialog={this.openUploadPinsJsonFileDialog}
          />

          {this.state.uploadDialog && (
            <UploadPinsJsonFile
              onUpload={this.onUpload}
              onClose={() => this.setState({ uploadDialog: false })}
            />
          )}

          <a onClick={this.safeOnCompare} className={items.length === 0 ? 'disabled' : ''}>
            <i className={`fa fa-${isCompare ? 'check-circle-o' : 'exchange'}`} />
            {isCompare ? 'Finish comparison' : 'Compare'}
          </a>
          {isCompare && (
            <div className="compareTogglePanel">
              Split mode:
              <RadioGroup
                className="radioGroup"
                name="compareMode"
                selectedValue={isOpacity ? 'opacity' : 'split'}
                onChange={onToggleCompareMode}
              >
                <label>
                  <Radio value="opacity" />
                  Opacity
                </label>
                <label>
                  <Radio value="split" />
                  Split
                </label>
              </RadioGroup>
            </div>
          )}
        </div>

        <div ref={this.dragulaDecorator}>
          {items.map((item, i) => {
            // if we add pin from results, we have different structure, otherwise we have all the data
            return (
              <Pin
                ref={'pin' + i}
                range={[0, 1]}
                item={item}
                index={i}
                key={item._id}
                isOpacity={isOpacity}
                onRemove={onRemove}
                onZoomToPin={this.props.onZoomToPin}
                isCompare={isCompare}
                onPinClick={this.props.onPinClick}
                onOpacityChange={e => this.props.onOpacityChange(e, i)}
                readOnly={this.props.readOnly}
              />
            );
          })}
          {/* no pins found and not logged in  notification banner */}
          {items.length === 0 && loggedIn && <NotificationPanel type="info" msg={noPinMsg} />}
          {/* not logged in notification banner */}
          {!loggedIn &&
            items.length === 0 && (
              <NotificationPanel type="info" msg={`No pins. ${NOT_LOGGED_IN_AND_TEMP_PIN_MSG}`} />
            )}
          {!loggedIn &&
            items.length > 0 && <NotificationPanel type="info" msg={NOT_LOGGED_IN_AND_TEMP_PIN_MSG} />}
        </div>
      </div>
    );
  }
}

PinPanel.propTypes = {
  zoom: PropTypes.number,
  loggedIn: PropTypes.bool,
  isCompare: PropTypes.bool,
  isOpacity: PropTypes.bool,
  items: PropTypes.array,
  onPinClick: PropTypes.func,
  onRemove: PropTypes.func,
  onCompare: PropTypes.func,
  onClearPins: PropTypes.func,
  onOpacityChange: PropTypes.func,
  onToggleCompareMode: PropTypes.func,
};

export default PinPanel;
