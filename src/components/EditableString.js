import React from 'react';

const BLOCKABLE_OUTSIDE_EVENTS = ['click', 'mousedown', 'mouseup', 'touch', 'touchstart', 'touchend'];

class EditableString extends React.Component {
  outerSpanRef = null;

  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      newText: null,
    };
    this.outerSpanRef = React.createRef();
  }

  startEditing() {
    BLOCKABLE_OUTSIDE_EVENTS.forEach(evType => {
      window.addEventListener(evType, this.onOutsideEvent, true);
    });
    this.setState({
      editing: true,
      newText: this.props.text,
    });
  }

  stopEditing(doSave) {
    BLOCKABLE_OUTSIDE_EVENTS.forEach(evType => {
      window.removeEventListener(evType, this.onOutsideEvent, true);
    });
    if (doSave) {
      this.props.onEditSave(this.state.newText);
    }
    this.setState({
      editing: false,
      newText: null,
    });
  }

  onEditClick = ev => {
    ev.stopPropagation();
    this.startEditing();
  };

  onOutsideEvent = ev => {
    if (this.outerSpanRef.current.contains(ev.target)) {
      return; // this is not an outside event, ignore it
    }

    // we want to cancel all "blockable" events:
    ev.stopPropagation();
    ev.preventDefault();

    // Outside click actually triggers a series of events (mousedown, mouseup, click). We want to
    // keep capturing them until the last one, which is 'click' (both for mouse and touch events).
    if (ev.type === 'click') {
      // 'click' is the last event both for mouse and touch events
      this.stopEditing(false);
    }
  };

  onTextChange = ev => {
    this.setState({
      newText: ev.target.value,
    });
  };

  onKeyUp = ev => {
    switch (ev.keyCode) {
      case 13: // Enter
        ev.stopPropagation();
        ev.preventDefault();
        this.stopEditing(true);
        return;
      case 27: // Esc
        ev.stopPropagation();
        ev.preventDefault();
        this.stopEditing(false);
        return;
      default:
        break;
    }
  };

  handleFocus = ev => {
    ev.target.select();
  };

  onSaveClick = ev => {
    ev.stopPropagation();
    ev.preventDefault();
    this.stopEditing(true);
  };

  onCancelClick = ev => {
    ev.stopPropagation();
    ev.preventDefault();
    this.stopEditing(false);
  };

  stopEventPropagationIfEditing = ev => {
    ev.stopPropagation();
  };

  render() {
    return (
      <span ref={this.outerSpanRef} onClick={this.state.editing ? this.stopEventPropagationIfEditing : null}>
        {this.state.editing ? (
          <span>
            <input
              type="text"
              className="clickable"
              value={this.state.newText}
              onChange={this.onTextChange}
              onKeyUp={this.onKeyUp}
              autoFocus={true}
              onFocus={this.handleFocus}
            />
            <span className="editTitle">
              <a className="clickable" onClick={this.onSaveClick}>
                <i className="fa fa-check" />
              </a>
              <a className="clickable" onClick={this.onCancelClick}>
                <i className="fa fa-close" />
              </a>
            </span>
          </span>
        ) : (
          <span>
            {this.state.newText ? this.state.newText : this.props.text}
            <span className="editTitle">
              <a onClick={this.onEditClick}>
                <i className="fa fa-pencil" />
              </a>
            </span>
          </span>
        )}
      </span>
    );
  }
}

export default EditableString;
