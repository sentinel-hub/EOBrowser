import React, { Component } from 'react';
import { t } from 'ttag';
import PinPreviewImage from '../../Pins/PinPreviewImage';
import store, { compareLayersSlice } from '../../../store';
import Description from '../../Pins/Description';

import { constructTimespanString } from '../../Pins/Pin.utils';
import { constructEffectsFromPinOrHighlight } from '../../../utils/effectsUtils';

import './Highlight.scss';

class Highlight extends Component {
  state = {
    showDescription: false,
  };

  toggleDescription = (e) => {
    e.stopPropagation();
    this.setState((prevState) => ({
      showDescription: !prevState.showDescription,
    }));
  };

  canDisplayDescription = () => {
    const { description } = this.props.pin;

    return description !== '' && description;
  };

  addHighlightToCompare = (e) => {
    e.stopPropagation();
    const effects = constructEffectsFromPinOrHighlight(this.props.pin);
    const highlight = { ...this.props.pin, ...effects };
    store.dispatch(compareLayersSlice.actions.addToCompare(highlight));
  };

  render() {
    const { pin, index } = this.props;
    const { description, title } = pin;
    const { showDescription } = this.state;

    const effects = constructEffectsFromPinOrHighlight(pin);
    const highlight = { ...pin, ...effects };

    return (
      <div className="highlight-item normal-mode" id={`${index}`}>
        <div className="highlight-content" onClick={this.props.onSelect}>
          <PinPreviewImage pin={highlight} />
          <div className="highlight-info">
            <span className="highlight-info-row">
              {title}
              <div className="add-to-compare" title={t`Add to compare`} onClick={this.addHighlightToCompare}>
                <i className="fas fa-exchange-alt"></i>
              </div>
            </span>
            <div>
              <label>{t`Date`}:</label> <span className="highlight-date">{constructTimespanString(pin)}</span>
            </div>
            {this.canDisplayDescription() && (
              <div
                className="highlight-info-row pin-description-toggle"
                title={showDescription ? t`Hide description` : t`Show description`}
                onClick={this.toggleDescription}
              >
                <i className={showDescription ? 'fa fa-angle-double-up' : 'fa fa-angle-double-down '} />
              </div>
            )}
          </div>
        </div>
        {this.canDisplayDescription() && (
          <Description canEdit={false} content={description} showContent={showDescription} />
        )}
      </div>
    );
  }
}

export default Highlight;
