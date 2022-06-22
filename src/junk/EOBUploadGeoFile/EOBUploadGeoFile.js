import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Dropzone from 'react-dropzone';
import Rodal from 'rodal';
import { t } from 'ttag';

import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { parseContent, getFileExtension, loadFileContent } from './EOBUploadGeoFile.utils';

import './EOBUploadGeoFile.scss';

export class EOBUploadGeoFile extends Component {
  state = {
    error: null,
    inputGeometry: null,
  };

  onDrop = (ok, noOk) => {
    this.setState({ error: null });
    if (ok.length > 0) {
      this.setState({ allowedFiles: ok }, async () => {
        const file = ok[0];
        const format = getFileExtension(file.name);
        try {
          const data = await loadFileContent(file, format);
          this.handleParseContent(data, format);
        } catch (e) {
          this.setState({ error: e.message });
        }
      });
    }
  };

  handleParseContent = (content, format = null) => {
    try {
      let area = parseContent(content, format);
      this.props.onUpload(area);
    } catch (e) {
      this.setState({ error: `Error: ${e.message}` });
    }
  };

  render() {
    const fileUploadTitle = t`File upload`;
    const fileUploadText = t`Upload a KML/KMZ, GPX, WKT (in EPSG:4326) or GEOJSON/JSON file to create area of interest. Area will be used for clipping when exporting an image.`;
    const dropAFileString = t`Drop KML/KMZ, GPX, WKT (in EPSG:4326), GEOJSON/JSON file or search your computer`;

    const { inputGeometry } = this.state;
    return ReactDOM.createPortal(
      <Rodal
        animation="slideUp"
        visible={true}
        customStyles={{
          width: 'auto',
          maxWidth: 400,
          height: 'auto',
          bottom: 'auto',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        onClose={this.props.onClose}
        closeOnEsc={true}
      >
        <div className="fileUploadWindow">
          <h3>{fileUploadTitle}</h3>
          <p>{fileUploadText}</p>
          <Dropzone
            acceptClassName="ok"
            rejectClassName="false"
            className="fileUploadPanel"
            multiple={false}
            onDrop={this.onDrop}
          >
            {dropAFileString}
          </Dropzone>

          <div className="geometryInput">
            <textarea
              placeholder="... or paste geometry here "
              rows="12"
              defaultValue={inputGeometry}
              onChange={(e) => this.setState({ inputGeometry: e.target.value })}
            ></textarea>
          </div>
          <EOBButton
            text={t`Upload`}
            className="primary"
            fluid
            disabled={!inputGeometry}
            onClick={() => this.handleParseContent(inputGeometry, null)}
          />

          {this.state.error && <p className="error">{this.state.error}</p>}
        </div>
      </Rodal>,
      document.querySelector('#app'),
    );
  }
}
