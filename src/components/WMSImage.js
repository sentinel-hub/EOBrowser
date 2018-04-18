import React from 'react';

class WMSImage extends React.Component {
  render() {
    return (
      <img
        className="icon"
        crossOrigin="Anonymous"
        src={this.props.src}
        alt=""
      />
    );
  }
}
export default WMSImage;
