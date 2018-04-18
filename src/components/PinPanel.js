import React from 'react';
import PropTypes from 'prop-types';
import dragula from 'react-dragula';
import 'react-dragula/dist/dragula.min.css';
import NotificationPanel from './NotificationPanel';
import Store from '../store';
import Pin from './Pin';
import Button from './Button';
import { RadioGroup, Radio } from 'react-radio-group';
import Rodal from 'rodal';

class PinPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmClear: false
    };
  }

  dragulaDecorator = componentBackingInstance => {
    if (componentBackingInstance) {
      dragula([componentBackingInstance], {
        moves: (el, container, handle) => {
          if (this.props.isCompare) {
            if (handle.classList.contains('rc-slider-handle')) {
              return false;
            } else {
              return true;
            }
          }
        }
      }).on('drop', (el, target, source, sibling) => {
        const droppedLocation = this.getIndexInParent(el);
        const oldLocation = this.getIndexInData(el.dataset.id);
        this.changePinOrder(oldLocation, droppedLocation);
      });
    }
  };
  getIndexInParent = el => Array.from(el.parentNode.children).indexOf(el);
  getIndexInData = id => this.props.items.findIndex(e => e._id === id);
  closeDialog = () => this.setState({ confirmClear: false });

  changePinOrder = (oldIndex, newIndex) => {
    this.props.pinOrderChange(oldIndex, newIndex);
    Store.changePinOrder(oldIndex, newIndex);
  };

  deletePins = () => {
    this.setState({ confirmClear: false });
    this.props.onClearPins();
  };

  render() {
    const { confirmClear } = this.state;
    let {
      items,
      isCompare,
      isOpacity,
      onToggleCompareMode,
      onRemove,
      onCompare
    } = this.props;
    return (
      <div className={`pinPanel ${!isCompare && 'normalMode'}`}>
        {items.length === 0 ? (
          <NotificationPanel
            type="info"
            msg="No pins. Find your scene and pin it to save it for later."
          />
        ) : (
          <div>
            <div className="comparisonHeader">
              <a
                style={{ float: 'right' }}
                onClick={() => this.setState({ confirmClear: true })}
              >
                <i className="fa fa-trash" />Clear pins
              </a>
              <a onClick={onCompare}>
                <i
                  className={`fa fa-${
                    isCompare ? 'check-circle-o' : 'exchange'
                  }`}
                />
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
                      <Radio value="opacity" />Opacity
                    </label>
                    <label>
                      <Radio value="split" />Split
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
                    onPinClick={() => this.props.onPinClick(item, i, false)}
                    onOpacityChange={e => this.props.onOpacityChange(e, i)}
                  />
                );
              })}
            </div>
          </div>
        )}
        {confirmClear && (
          <Rodal
            animation="slideUp"
            visible={true}
            width={400}
            height={150}
            onClose={this.closeDialog}
          >
            <h3>Delete pins</h3>
            <b>WARNING:</b> You're about to delete all pins. Do you wish to
            continue? <br />
            <center>
              <Button
                text="Yes"
                onClick={this.deletePins}
                icon="check"
                style={{ marginRight: 10 }}
              />
              <Button text="No" onClick={this.closeDialog} icon="times" />
            </center>
          </Rodal>
        )}
      </div>
    );
  }
}

PinPanel.propTypes = {
  zoom: PropTypes.number,
  isCompare: PropTypes.bool,
  isOpacity: PropTypes.bool,
  items: PropTypes.array,
  onPinClick: PropTypes.func,
  onRemove: PropTypes.func,
  onCompare: PropTypes.func,
  onClearPins: PropTypes.func,
  onOpacityChange: PropTypes.func,
  onToggleCompareMode: PropTypes.func
};

export default PinPanel;
