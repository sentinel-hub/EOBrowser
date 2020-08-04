import React from 'react';
import RCSlider from 'rc-slider';

import 'rc-slider/assets/index.css';
import './EOBCCSlider.scss';

export class EOBCCSlider extends React.Component {
  static defaultProps = {
    sliderWidth: 50,
    cloudCoverPercentage: 100,
    onChange: value => {},
  };

  render() {
    return (
      <div className="cc-slider">
        <i className="fa fa-sun-o">&nbsp;</i>
        <div className="rcStyler" style={{ width: this.props.sliderWidth }}>
          <RCSlider
            min={0}
            max={100}
            step={1}
            defaultValue={this.props.cloudCoverPercentage}
            onChange={this.props.onChange}
          />
        </div>
        <i className="fa fa-cloud">&nbsp;</i>
        <span className="percentage">{this.props.cloudCoverPercentage}&nbsp;%</span>
      </div>
    );
  }
}
