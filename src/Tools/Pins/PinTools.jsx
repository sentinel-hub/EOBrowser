import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import Rodal from 'rodal';
import { t } from 'ttag';

import { getLoggedInErrorMsg } from '../../junk/ConstMessages';

import './PinTools.scss';

import {
  convertToNewFormat,
  savePinsToSessionStorage,
  savePinsToServer,
  isPinValid,
  formatDeprecatedPins,
  establishCorrectDataFusionFormatInPins,
} from './Pin.utils';

class PinTools extends Component {
  state = {
    displayModal: false,
    keepExisting: true,
  };

  openUploadPinsDialog = () => {
    this.props.cancelSharePins();
    this.setState({
      displayModal: true,
    });
  };

  onCloseModal = () => {
    this.setState({
      error: null,
      displayModal: false,
    });
  };

  toggleKeepExistingPins = () => {
    this.setState((prevState) => ({
      keepExisting: !prevState.keepExisting,
    }));
  };

  onDrop = (files) => {
    this.setState({ error: null });
    if (files.length > 0) {
      const file = files[0];
      const format = this.getFileExtension(file.name);
      const supportedFormats = ['json'];
      try {
        if (!supportedFormats.includes(format)) {
          throw new Error(t`File type not supported`);
        }

        const reader = new FileReader();
        reader.onload = (e) => this.parseFile(e.target.result, format);
        reader.readAsText(file);
      } catch (e) {
        this.setState({ error: e.message });
      }
    }
  };

  parseFile = async (fileContents, format) => {
    try {
      let pins;
      switch (format) {
        case 'json':
          pins = JSON.parse(fileContents);
          break;
        default:
          throw new Error(t`not supported`);
      }

      if (!pins || !pins.length) {
        throw new Error(t`No pins were found.`);
      }
      pins = pins.map((pin) => convertToNewFormat(pin));
      let allErrors = '';
      for (let pin of pins) {
        const { isValid, error } = isPinValid(pin);
        if (!isValid) {
          allErrors += `${error}\n`;
        }
      }
      if (allErrors.length > 0) {
        throw new Error(allErrors);
      }

      pins = formatDeprecatedPins(pins);
      pins = establishCorrectDataFusionFormatInPins(pins);
      const existingIds = this.props.pins.map((pin) => pin._id);
      pins = pins.filter((pin) => !existingIds.includes(pin._id));
      const replaceExisting = !this.state.keepExisting;
      let uniqueId;
      if (this.props.isUserLoggedIn) {
        const { accessToken, impersonatedUserId } = this.props;
        const res = await savePinsToServer(pins, replaceExisting, accessToken, impersonatedUserId);
        uniqueId = res.uniqueId;
      } else {
        uniqueId = savePinsToSessionStorage(pins, replaceExisting);
      }
      this.onCloseModal();
      if (uniqueId) {
        this.props.setLastAddedPin(uniqueId);
      }
      if (replaceExisting) {
        this.props.clearThemePins();
      }

      this.setState({
        displayOptions: false,
        keepExisting: true,
      });
    } catch (e) {
      this.setState({ error: t`Error parsing file:` + e.message });
    }
  };

  getFileExtension = (filename) => filename.toLowerCase().split('.').pop();

  renderModal = () => (
    <Rodal
      animation="slideUp"
      visible={true}
      width={400}
      height={280}
      onClose={this.onCloseModal}
      closeOnEsc={true}
    >
      <div className="file-upload-dialog">
        <h3>{t`File upload`}</h3>
        <p>{t`Upload a JSON file with saved pins.`}</p>
        <Dropzone
          acceptClassName="ok"
          rejectClassName="false"
          className="file-upload-panel"
          multiple={false}
          onDrop={this.onDrop}
        >
          {t`Drop JSON file or search your computer`}
        </Dropzone>

        <p>
          <label className="align-checkbox">
            <input type="checkbox" checked={this.state.keepExisting} onChange={this.toggleKeepExistingPins} />{' '}
            {t`Keep existing pins`}
          </label>
        </p>

        {this.state.error && <pre className="error">{this.state.error}</pre>}
      </div>
    </Rodal>
  );

  preparePinForExport = (pin) => {
    // Orders pin attributes in the format for export
    // Fields "group" and "highResImageUrl" are added here to simplify Pin Library usage
    // It should be removed when adding functionality for them
    const {
      _id,
      title,
      datasetId,
      themeId,
      layerId,
      lat,
      lng,
      zoom,
      fromTime,
      toTime,
      visualizationUrl,
      evalscript,
      evalscripturl,
      dataFusion,
      tag,
      gain,
      gamma,
      redRange,
      greenRange,
      blueRange,
    } = pin;
    return {
      _id: _id,
      title: title,
      group: null,
      highResImageUrl: null,
      datasetId: datasetId,
      themeId: themeId,
      layerId: layerId,
      lat: lat,
      lng: lng,
      zoom: zoom,
      fromTime: fromTime,
      toTime: toTime,
      visualizationUrl: visualizationUrl,
      evalscript: evalscript,
      evalscripturl: evalscripturl,
      dataFusion: dataFusion,
      tag: tag,
      gain: gain,
      gamma: gamma,
      redRange: redRange,
      greenRange: greenRange,
      blueRange: blueRange,
      ...pin,
    };
  };

  getPinsDataURI = (pins) => {
    const pinsForExport = pins.map((pin) => this.preparePinForExport(pin));
    const data =
      'data: text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pinsForExport, null, 4));
    return data;
  };

  render() {
    const { isUserLoggedIn, pins, pinsStoryBuilderEnabled } = this.props;
    const pinsDataURI = this.getPinsDataURI(pins);
    const notLoggedInMsg = getLoggedInErrorMsg();
    const sharePinsTitle = t`Share pins` + (!isUserLoggedIn ? ` \n(${notLoggedInMsg})` : '');
    const animatePinsTitle = t`Create a story from pins` + (!isUserLoggedIn ? ` \n(${notLoggedInMsg})` : '');
    const exportPinsTitle = t`Export pins to the computer`;
    const importPinsTitle = t`Import pins from a saved file`;
    const clearPinsTitle = t`Delete all pins`;

    return (
      <div className="pin-tools">
        {pinsStoryBuilderEnabled && (
          <div
            className={`animate-pins ${isUserLoggedIn && pins.length > 0 ? '' : 'disabled'}`}
            title={animatePinsTitle}
            onClick={this.props.onAnimateClick}
          >
            <i className="fa fa-film" />
            {t`Story`}
          </div>
        )}

        <div
          className={`share-pins ${isUserLoggedIn && pins.length > 0 ? '' : 'disabled'}`}
          title={sharePinsTitle}
          onClick={this.props.onShareClick}
        >
          <i className="fa fa-share-alt" />
          {t`Share`}
        </div>

        {pins.length === 0 ? (
          <div className="pins-export disabled" title={exportPinsTitle}>
            <i className="fa fa-cloud-download" />
            {t`Export`}
          </div>
        ) : (
          <a href={pinsDataURI} download="pins.json" className="pins-export enabled" title={exportPinsTitle}>
            <i className="fa fa-cloud-download" />
            {t`Export`}
          </a>
        )}

        {this.props.importEnabled ? (
          <div className="pins-import" onClick={this.openUploadPinsDialog} title={importPinsTitle}>
            <i className="fa fa-cloud-upload" />
            {t`Import`}
          </div>
        ) : (
          <div className="disabled" title={importPinsTitle}>
            <i className="fa fa-cloud-upload" />
            {t`Import`}
          </div>
        )}

        <div
          onClick={this.props.onDeleteAllPins}
          title={clearPinsTitle}
          className={`pins-delete ${pins.length === 0 ? 'disabled' : 'enabled'}`}
        >
          <i className="fa fa-trash" />
          {t`Clear`}
        </div>
        {this.state.displayModal && this.renderModal()}
      </div>
    );
  }
}
export default PinTools;
