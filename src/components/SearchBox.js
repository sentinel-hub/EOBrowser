import React from 'react';
import PropTypes from 'prop-types';
import Geosuggest from 'react-geosuggest';
import onClickOutside from 'react-onclickoutside';

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSearchVisible: false,
    };
  }
  handleClickOutside() {
    this.setState({ isSearchVisible: false });
  }

  handleSearchClick = () => {
    this.setState({ isSearchVisible: !this.state.isSearchVisible });
  };

  render() {
    return (
      <div id="searchBox" className={(this.state.isSearchVisible && 'active') + ' floatItem pull-right'}>
        <i onClick={this.handleSearchClick} className="fa fa-search" />
        <span>
          <Geosuggest onSuggestSelect={this.props.onLocationPicked} className="geoLocation" />
        </span>
      </div>
    );
  }
}

SearchBox.propTypes = {
  onLocationPicked: PropTypes.func,
  toolsVisible: PropTypes.bool,
};

export default onClickOutside(SearchBox);
