import React, { Component } from 'react';
import onClickOutside from 'react-onclickoutside';
import './pintools.css';

class PinTools extends Component {
  state = { displayOptions: false };

  toggleOverlay = () => {
    this.setState(oldState => {
      return { displayOptions: !oldState.displayOptions };
    });
  };

  handleClickOutside = () => {
    this.setState({ displayOptions: false });
  };

  safeConfirmDelete = () => {
    if (this.props.pins.length > 0) {
      this.props.confirmDeleteAllPins();
    }
  };

  renderOptionsOverlay = () => {
    let pins = this.props.pins;
    let data = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pins));

    return (
      <div className={this.state.displayOptions ? 'pin-tools show' : 'pin-tools'}>
        <ul>
          <li className="pins-import">
            <a onClick={this.props.openUploadPinsJsonFileDialog}>
              <i className="fa fa-cloud-upload" />Import pins
            </a>
          </li>

          <li className="pins-export">
            {pins.length === 0 ? (
              <a className="disabled">
                <i className="fa fa-cloud-download" />Export pins
              </a>
            ) : (
              <a href={`data: ${data}`} download="pins.json">
                <i className="fa fa-cloud-download" />Export pins
              </a>
            )}
          </li>

          <li className="pins-delete">
            <a onClick={this.safeConfirmDelete} className={pins.length === 0 ? 'disabled' : ''}>
              <i className="fa fa-trash" />Clear pins
            </a>
          </li>
        </ul>
      </div>
    );
  };

  render() {
    return (
      <div onClick={this.toggleOverlay} className="pintoolsIcon">
        <i className="fa fa-wrench" />
        {this.state.displayOptions && this.renderOptionsOverlay()}
      </div>
    );
  }
}
export default onClickOutside(PinTools);
