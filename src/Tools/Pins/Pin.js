import React, { Component } from 'react';
import { t } from 'ttag';

import store, { mainMapSlice, compareLayersSlice } from '../../store';
import EditableString from './EditableString';
import Description from './Description';
import { parsePosition } from '../../utils';
import PinPreviewImage from './PinPreviewImage';
import { constructTimespanString, isPinValid } from './Pin.utils';
import { constructEffectsFromPinOrHighlight } from '../../utils/effectsUtils';
import InvalidPin from './InvalidPin';

export default class Pin extends Component {
  state = { showDescription: false };

  zoomToPin = event => {
    event.stopPropagation();
    const { zoom, lat, lng } = this.props.item;
    const { lat: parsedLat, lng: parsedLng, zoom: parsedZoom } = parsePosition(lat, lng, zoom);
    store.dispatch(
      mainMapSlice.actions.setPosition({
        lat: parsedLat,
        lng: parsedLng,
        zoom: parsedZoom,
      }),
    );
  };

  toggleDescription = event => {
    event.stopPropagation();
    this.setState({
      showDescription: !this.state.showDescription,
    });
  };

  addPinToCompare = e => {
    e.stopPropagation();
    const effects = constructEffectsFromPinOrHighlight(this.props.item);
    const pin = { ...this.props.item, ...effects };
    store.dispatch(compareLayersSlice.actions.addToCompare(pin));
  };

  render() {
    const { allowRemove, arePinsSelectable, index, item, pinType, selectedForSharing } = this.props;
    const { description, title, lat, lng, zoom } = item;
    const { isValid, error } = isPinValid(item);

    if (!isValid) {
      return <InvalidPin index={index} error={error} item={item} onRemovePin={this.props.onRemovePin} />;
    }

    const effects = constructEffectsFromPinOrHighlight(item);
    const pinItem = { ...item, ...effects };

    return (
      <div className={`pin-item normal-mode ${pinType}`} id={`${index}`}>
        <div className="pin-top-container" onClick={this.props.onPinSelect}>
          <div className="pin-left-controls-container">
            <div className="pin-drag-handler">
              <i className="fa fa-ellipsis-v" />
              <i className="fa fa-ellipsis-v" />
            </div>
            {allowRemove && (
              <div
                className="remove-pin"
                onClick={e => {
                  e.stopPropagation();
                  this.props.onRemovePin(index);
                }}
                title={t`Remove pin`}
              >
                <i className="fa fa-trash" />
              </div>
            )}
          </div>

          <div className="preview-image">
            {arePinsSelectable && item && (
              <span id={index} className={`pin-selector ${selectedForSharing ? 'selected' : ''}`} />
            )}
            <PinPreviewImage pin={pinItem} />
          </div>
          <div className="pin-info">
            <div className="pin-info-row pin-info-title">
              {!this.props.allowRemove ? (
                <span>{title}</span>
              ) : (
                <EditableString
                  text={title}
                  onEditSave={title => this.props.savePinProperty(index, 'title', title)}
                />
              )}
            </div>
            <div className="pin-info-row pin-date">
              <label>{t`Date`}:</label> <span className="pin-date">{constructTimespanString(item)}</span>
              <div className="add-to-compare" title={t`Add to compare`} onClick={this.addPinToCompare}>
                <i className="fas fa-exchange-alt"></i>
              </div>
            </div>
            <div className="pin-info-row pin-location" title={t`Zoom to pinned location`}>
              <label>{t`Lat/Lon`}:&nbsp;</label>
              <span className="pin-lat-lng-link" onClick={this.zoomToPin}>
                {parseFloat(lat).toFixed(2)}, {parseFloat(lng).toFixed(2)}
                &nbsp;|&nbsp;{t`Zoom`}:&nbsp;{zoom}
              </span>
              <div
                className="pin-description-toggle"
                title={this.state.showDescription ? t`Hide description` : t`Show description`}
                onClick={this.toggleDescription}
              >
                <i
                  className={
                    this.state.showDescription ? 'fa fa-angle-double-up' : 'fa fa-angle-double-down '
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pin-bottom-container">
          <Description
            canEdit={true}
            content={description}
            showContent={this.state.showDescription}
            onDescriptionConfirm={description =>
              this.props.savePinProperty(index, 'description', description)
            }
          />
        </div>
      </div>
    );
  }
}
