import React from 'react';
import RCSlider from 'rc-slider';

import 'rc-slider/assets/index.css';
import './EOBCCSlider.scss';

export class EOBCCSlider extends React.Component {
  static defaultProps = {
    sliderWidth: 50,
    cloudCoverPercentage: 100,
    onChange: (value) => {},
    min: 0,
    max: 100,
    showIcons: true,
    unit: '%',
  };

  render() {
    return (
      <div className="cc-slider">
        {this.props.showIcons && <i className="fa fa-sun-o">&nbsp;</i>}
        <div className="rcStyler" style={{ width: this.props.sliderWidth }}>
          <RCSlider
            min={this.props.min}
            max={this.props.max}
            step={1}
            defaultValue={this.props.cloudCoverPercentage}
            onChange={this.props.onChange}
          />
        </div>
        {this.props.showIcons && <i className="fa fa-cloud">&nbsp;</i>}
        <div className="percentage">
          {this.props.cloudCoverPercentage}
          {this.props.unit ? this.props.unit : ''}
        </div>
      </div>
    );
  }
}
