import React, { Component } from 'react';
import moment from 'moment';
import { t } from 'ttag';
import PinPreviewImage from '../../Pins/PinPreviewImage';
import store, { compareLayersSlice } from '../../../store';
import Description from '../../Pins/Description';

import './Highlight.scss';

class Highlight extends Component {
  state = {
    showDescription: false,
  };

  toggleDescription = e => {
    e.stopPropagation();
    this.setState(prevState => ({
      showDescription: !prevState.showDescription,
    }));
  };

  canDisplayDescription = () => {
    const { description } = this.props.pin;

    return description !== '' && description;
  };

  addToCompare = e => {
    e.stopPropagation();
    store.dispatch(compareLayersSlice.actions.addToCompare(this.props.pin));
  };

  render() {
    const { pin, index } = this.props;
    const { description, title, toTime } = pin;
    const { showDescription } = this.state;

    return (
      <div className="highlight-item normal-mode" id={`${index}`}>
        <div className="highlight-content" onClick={this.props.onSelect}>
          <PinPreviewImage pin={pin} />
          <div className="highlight-info">
            <span className="highlight-info-row">
              {title}
              <div className="add-to-compare" title={t`Add to compare`} onClick={this.addToCompare}>
                <i className="fas fa-exchange-alt"></i>
              </div>
            </span>
            <div>
              <label>Date:</label>{' '}
              <span className="highlight-date">{moment(toTime).format('YYYY-MM-DD')}</span>
            </div>
            {this.canDisplayDescription() && (
              <div className="highlight-info-row pin-description-toggle" onClick={this.toggleDescription}>
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
