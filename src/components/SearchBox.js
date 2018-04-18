import React from 'react';
import PropTypes from 'prop-types';
import Geosuggest from 'react-geosuggest';
import onClickOutside from 'react-onclickoutside';

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearchVisible: false
    };
  }
  handleClickOutside() {
    this.setState({ isSearchVisible: false });
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize(nextToolsVisible = null) {
    let toolsVisible = null;
    try {
      toolsVisible = this.props.toolsVisible;
    } catch (e) {}

    if (toolsVisible === null) return;

    if (nextToolsVisible !== null) {
      toolsVisible = nextToolsVisible;
    }

    let baseWidth = 180; // bottom equation for width 130 !!!.. non-parametrized :(
    let viewport = window.innerWidth;
    let searchBox = document.querySelector('#searchBox .geosuggest');

    if (searchBox === null) return;

    if (viewport > 700 && viewport < 772 && toolsVisible) {
      // f(x)   = k*x + n
      // f(700) = k*700 + n = 110
      // f(772) = k*772 + n = 180
      // wolframalpha to the rescue :)
      // https://www.wolframalpha.com/input/?i=k*700%2Bn%3D110,+k*772%2Bn%3D180
      // as of 24.03.2017
      // k = 35/36, n = -5135/9
      let newWidth = 35 / 36 * viewport + -5135 / 9;
      newWidth = Math.floor(newWidth);

      searchBox.style.width = newWidth + 'px';
    } else {
      searchBox.style.width = `${baseWidth}px`;
    }
  }

  componentWillUpdate(nextProps, nextSize) {
    let nextToolsVisible = nextProps.toolsVisible;

    if (nextToolsVisible) {
      this.handleResize(nextProps.toolsVisible);
    } else {
      setTimeout(() => {
        this.handleResize();
      }, 700); // transition is of the same speed as #tools
    }
  }

  handleSearchClick = () => {
    this.setState({ isSearchVisible: !this.state.isSearchVisible });
  };

  render() {
    return (
      <div
        id="searchBox"
        className={
          (this.state.isSearchVisible && 'active') + ' floatItem pull-right'
        }
      >
        <i onClick={this.handleSearchClick} className="fa fa-search" />
        <span>
          <Geosuggest
            onSuggestSelect={this.props.onLocationPicked}
            className="geoLocation"
          />
        </span>
      </div>
    );
  }
}

SearchBox.propTypes = {
  onLocationPicked: PropTypes.func,
  toolsVisible: PropTypes.bool
};

export default onClickOutside(SearchBox);
