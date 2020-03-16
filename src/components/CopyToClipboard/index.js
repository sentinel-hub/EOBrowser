import React, { Component } from 'react';
import './copyToClipboard.scss';

export default class extends Component {
  state = {
    copied: false,
  };

  inputRef = React.createRef();
  copyPath = ev => {
    const copyText = this.inputRef.current.value;
    const textField = document.createElement('textarea');
    textField.innerText = copyText;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
    this.setState({ copied: true });
  };

  setCopiedToFalse = () => {
    setTimeout(() => {
      this.setState({ copied: false });
    }, 200);
  };

  selectAllText = () => {
    this.inputRef.current.select();
  };

  render() {
    return (
      <div className="copy-wrapper">
        <input
          ref={this.inputRef}
          className="copy-input"
          defaultValue={this.props.defaultValue}
          readOnly={this.props.readOnly}
          onFocus={this.selectAllText}
        />
        <a
          className={this.state.copied ? 'copy-btn tooltipped tooltipped-n' : 'copy-btn'}
          onClick={this.copyPath}
          onMouseLeave={this.setCopiedToFalse}
          aria-label={this.state.copied ? 'Copied' : 'Copy to clipboard'}
          title="Copy to clipboard"
        >
          <i className="fa fa-copy" />
        </a>
      </div>
    );
  }
}
