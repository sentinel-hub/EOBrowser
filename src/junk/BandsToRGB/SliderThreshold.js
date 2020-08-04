import React, { Component } from 'react';
import { Slider, Rail, Handles, Tracks } from 'react-compound-slider';
import { SliderRail, KeyboardHandle, Track } from './SliderComponents';

const sliderStyle = {
  position: 'relative',
  width: '100%',
};

// if slider step is below 1, bugs appear https://github.com/sghall/react-compound-slider/issues/93
// that is why we offset incoming/outgoing values
const SLIDER_BUG_OFFSET = 100;

export class SliderThreshold extends Component {
  onUpdate = update => {
    this.props.onSliderUpdate(this.divideWithOffset(update));
  };

  onChange = values => {
    this.props.onSliderChange(this.divideWithOffset(values));
  };

  divideWithOffset = values => {
    return values.map(item => item / SLIDER_BUG_OFFSET);
  };

  multiplyWithOffset = values => {
    return values.map(item => item * SLIDER_BUG_OFFSET);
  };

  render() {
    const { values, colors, domain, gradient, invalidMinMax } = this.props;

    // because of lib bug read above
    const fixedValues = this.multiplyWithOffset(values);
    let fixedDomain = domain;

    if (!isNaN(domain[0]) && !isNaN(domain[1])) {
      fixedDomain = [domain[0] * SLIDER_BUG_OFFSET, domain[1] * SLIDER_BUG_OFFSET];
    }

    const gradientStyle = `linear-gradient(90deg, ${gradient.map(item => item.replace('0x', '#'))} 100%)`;

    return (
      <div className="slider">
        <Slider
          domain={fixedDomain}
          mode={3}
          onChange={this.onChange}
          onUpdate={this.onUpdate}
          rootStyle={sliderStyle}
          step={1}
          values={fixedValues}
        >
          <Rail>
            {({ getRailProps }) => <SliderRail getRailProps={getRailProps} gradient={gradientStyle} />}
          </Rail>
          <Handles>
            {({ handles, getHandleProps }) => (
              <div className="slider-handles">
                {!invalidMinMax() &&
                  handles.map((handle, index) => (
                    <KeyboardHandle
                      key={handle.id}
                      handle={handle}
                      domain={fixedDomain}
                      rampValue={values[index]}
                      getHandleProps={getHandleProps}
                      pointingToColor={colors && colors[index]}
                    />
                  ))}
              </div>
            )}
          </Handles>
          <Tracks left={false} right={false}>
            {({ tracks, getTrackProps }) => (
              <div className="slider-tracks">
                {tracks.map(({ id, source, target }, index) => (
                  <Track
                    key={id}
                    source={source}
                    target={target}
                    getTrackProps={getTrackProps}
                    first={index === 0}
                    last={index === tracks.length - 1}
                  />
                ))}
              </div>
            )}
          </Tracks>
        </Slider>
      </div>
    );
  }
}
