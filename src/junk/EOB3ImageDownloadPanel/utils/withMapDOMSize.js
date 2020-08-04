import React from 'react';
import { getMapDOMSize } from '../../EOBCommon/utils/coords';

export default function withMapDOMSize(WrappedComponent, selectData) {
  return class extends React.Component {
    state = {
      mapWidth: window.innerWidth,
      mapHeight: window.innerHeight,
    };

    componentDidMount() {
      window.addEventListener('resize', this.updateMapSize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.updateMapSize);
    }

    updateMapSize = () => {
      const { width, height } = getMapDOMSize();
      this.setState({
        mapWidth: width,
        mapHeight: height,
      });
    };

    render() {
      const { mapWidth, mapHeight } = this.state;
      return <WrappedComponent mapWidth={mapWidth} mapHeight={mapHeight} {...this.props} />;
    }
  };
}
