import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import Rodal from 'rodal';
import styled from 'styled-components';

const Style = styled.div`
  color: #fff;

  .fileUploadPanel {
    border: 2px dashed #aaa;
    cursor: pointer;
    text-align: center;
    padding: 20px;
  }
  .ok {
    box-shadow: 0 0 3px #0c0;
  }
  .false {
    box-shadow: 0 0 3px #c00;
  }
  .error {
    color: #c14444;
  }
`;

export default class UploadPinsJsonFile extends Component {
  state = {
    error: null,
    keepExisting: true,
  };

  onDrop = (ok, noOk) => {
    this.setState({ error: null });
    if (ok.length > 0) {
      const file = ok[0];
      const format = this.getFileExtension(file.name);
      const supportedFormats = ['json'];
      try {
        if (!supportedFormats.includes(format)) {
          throw new Error('File type not supported');
        }

        const reader = new FileReader();
        reader.onload = e => this.parseFile(e.target.result, format);
        reader.readAsText(file);
      } catch (e) {
        this.setState({ error: e.message });
      }
    }
  };

  parseFile = (fileContents, format) => {
    try {
      let pins;
      switch (format) {
        case 'json':
          pins = JSON.parse(fileContents);
          break;
        default:
          throw new Error('not supported');
      }

      if (!pins) {
        throw new Error('No pins were found.');
      }

      this.props.onUpload(pins, this.state.keepExisting);
    } catch (e) {
      this.setState({ error: `Error parsing file: ${e.message}` });
    }
  };

  getFileExtension = filename =>
    filename
      .toLowerCase()
      .split('.')
      .pop();

  updateKeepExistingPins = checked => {
    this.setState({
      keepExisting: checked,
    });
  };

  render() {
    return (
      <Rodal
        animation="slideUp"
        visible={true}
        width={400}
        height={280}
        onClose={this.props.onClose}
        closeOnEsc={true}
      >
        <Style>
          <h3>File upload</h3>
          <p>Upload a JSON file with saved pins.</p>
          <Dropzone
            acceptClassName="ok"
            rejectClassName="false"
            className="fileUploadPanel"
            multiple={false}
            onDrop={this.onDrop}
          >
            Drop JSON file or search your computer
          </Dropzone>

          <p>
            <label className="align-checkbox">
              <input
                type="checkbox"
                checked={this.state.keepExisting}
                onChange={e => this.updateKeepExistingPins(e.target.checked)}
              />{' '}
              Keep existing pins
            </label>
          </p>

          {this.state.error && <p className="error">{this.state.error}</p>}
        </Style>
      </Rodal>
    );
  }
}
