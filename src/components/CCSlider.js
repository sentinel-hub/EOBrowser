import React from 'react';
import RCSlider from 'rc-slider';
import styled from 'styled-components';

const CCSliderStyled = styled.div`
  display: inline-block;

  div.rcStyler {
    margin: 0px 10px 1px 6px;
    display: inline-block;
  }
  div.rc-slider {
    // RCSlider needs to have width defined via CSS. However if it is defined via CSS class, we
    // can't change it via props. So we use 'inherit' here and set width on parent div.rcStyler.
    width: inherit !important;
    margin-bottom: 1px;
  }
  i.fa-sun-o {
    color: #ffff00;
    font-size: 10px;
  }
  i.fa-cloud {
    color: #c0fbff;
    font-size: 10px;
  }
  span.percentage {
    margin-left: 5px;
    display: inline-block;
    width: 30px;
  }
`;

export default class CCSlider extends React.Component {
  defaultProps = {
    sliderWidth: 50,
    cloudCoverPercentage: 100,
    onChange: value => {},
  };

  render() {
    return (
      <CCSliderStyled>
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
      </CCSliderStyled>
    );
  }
}
