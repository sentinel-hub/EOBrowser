/* eslint-disable */
import React from 'react';
import Autocomplete from 'react-autocomplete';
import axios from 'axios';
import onClickOutside from 'react-onclickoutside';
import debounce from 'lodash.debounce';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import './LocationSearchBox.scss';

class LocationSearchBoxControlled extends React.PureComponent {
  static defaultProps = {
    value: '',
    onChange: value => {},
    onSelect: item => {},
    minChar: 4,
    resultsShown: 5,
    placeholder: 'Search...',
    highlightedBgColor: '#b6bf00',
    menuStyle: {
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
      background: '#3B3D4D',
      color: 'white',
      zIndex: 9999,
      fontSize: '90%',
      position: 'absolute',
      overflow: 'auto',
      maxHeight: '300px',
      top: 39,
      left: 0,
      width: '100%',
    },
    inputWrapperStyle: { position: 'relative', width: '100%' },
  };

  state = {
    locationResults: [],
    isSearchVisible: false,
    showResults: false,
  };

  cancelTokenSource = null;
  input = undefined;

  componentDidMount() {
    this.debouncedOnInputChange = debounce(this.onInputChangeDelayed, 300);

    if (this.props.googleAccessToken) {
      this.loadGoogleMapsScript();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.debouncedOnInputChange(this.props.value);
    }
    // only focus when there are more than 0 characters
    // This fixes behavoiur of having a dropdown appear when the input's characters are removed all at once
    if (this.props.value.length > 0) {
      this.input.focus();
    }
  }

  componentWillUnmount() {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel();
    }
  }

  handleClickOutside = () => {
    this.setState({ isSearchVisible: false, showResults: false });
  };

  handleSearchClick = () => {
    this.setState(prevState => {
      return {
        isSearchVisible: !prevState.isSearchVisible,
      };
    });
  };

  handleInputChange = e => {
    const value = e.target.value;
    this.props.onChange(value);
  };

  isCoordinate = string => {
    const coordRegex = /^[ ]*[+-]?[0-9]{1,2}([.][0-9]+)?[ ]*[,][ ]*[+-]?[0-9]{1,3}([.][0-9]+)?[ ]*$/g;
    return coordRegex.test(string);
  };

  onInputChangeDelayed = async value => {
    if (value.length >= this.props.minChar) {
      if (this.isCoordinate(value)) {
        const [lat, lng] = value.trim().split(',');
        const locations = [
          {
            placeId: 0,
            label: value,
            location: [parseFloat(lng), parseFloat(lat)],
          },
        ];

        this.setState({
          locationResults: locations,
        });
      } else if (this.props.googleAccessToken) {
        this.fetchLocationsGoogle(value);
      } else if (this.props.mapboxAccessToken) {
        try {
          if (this.cancelTokenSource) {
            this.cancelTokenSource.cancel();
          }
          this.cancelTokenSource = axios.CancelToken.source();
          const locations = await this.fetchLocationsMapbox(value);

          this.setState({
            locationResults: locations,
          });

          this.cancelTokenSource = null;
        } catch (e) {
          this.cancelTokenSource = null;
          console.error(e);
        }
      }
    }
    // only empty results, once input value is completely deleted
    if (value.length === 0) {
      this.setState({
        locationResults: [],
      });
    }
  };

  fetchLocationsMapbox = async keyword => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${keyword}.json`;
    const requestParams = {
      params: {
        limit: this.props.resultsShown,
        types: [
          'country',
          'region',
          'postcode',
          'district',
          'place',
          'locality',
          'neighborhood',
          'address',
          'poi',
        ],
        access_token: this.props.mapboxAccessToken,
      },
      cancelToken: this.cancelTokenSource.token,
    };

    const { data } = await axios(url, requestParams);
    const locations = data.features.map(location => ({
      placeId: location.id,
      label: location.matching_place_name || location.place_name,
      location: location.center,
    }));

    return locations;
  };

  loadGoogleMapsScript = () => {
    if (window.google) {
      this.googleAutocompleteService = new window.google.maps.places.AutocompleteService();
      this.googleMapsSessionToken = new window.google.maps.places.AutocompleteSessionToken();
      this.googleGeocoder = new window.google.maps.Geocoder();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.props.googleAccessToken}&libraries=places`;
      script.async = false;
      script.onload = () => {
        this.googleAutocompleteService = new window.google.maps.places.AutocompleteService();
        this.googleMapsSessionToken = new window.google.maps.places.AutocompleteSessionToken();
        this.googleGeocoder = new window.google.maps.Geocoder();
      };
      document.body.appendChild(script);
    }
  };

  fetchLocationsGoogle = async keywords => {
    const options = {
      input: keywords,
      sessionToken: this.googleMapsSessionToken,
    };

    this.googleAutocompleteService.getPlacePredictions(options, suggestions => {
      if (!suggestions) {
        this.setState({
          locationResults: [],
        });
        return;
      }

      const locations = suggestions.map(location => ({
        placeId: location.place_id,
        label: location.description,
        location: null,
      }));

      this.setState({
        locationResults: locations,
      });
    });
  };

  onSelectHandle = (inputValue, item) => {
    this.setState({ locationResults: [item] });
    this.props.onChange(inputValue);

    if (this.isCoordinate(inputValue) || this.props.mapboxAccessToken) {
      this.props.onSelect(item);
    } else if (this.props.googleAccessToken) {
      this.googleGeocoder.geocode({ placeId: item.placeId }, (results, status) => {
        if (status !== window.google.maps.GeocoderStatus.OK) {
          console.error(`Geocoder failed converting placeId to lat/lng, status: ${status}`);
          return;
        }
        if (results.length === 0) {
          console.error('Geocoder: no results found, could not convert placeId to lat/lng');
          return;
        }
        item.location = [results[0].geometry.location.lng(), results[0].geometry.location.lat()];
        this.props.onSelect(item);
      });
    } else {
      console.error('Something is wrong with the selected option.');
    }
  };

  render() {
    if (this.props.mapboxAccessToken && this.props.googleAccessToken) {
      console.error('Too many location search provider access tokens found!');
      return <div>Too many location search provider access tokens found!</div>;
    }

    const { locationResults } = this.state;
    const { value, placeholder, slim, highlightedBgColor, inputStyle, inputWrapperStyle } = this.props;

    const autoComplete = (
      <Autocomplete
        ref={el => (this.input = el)}
        value={value}
        items={locationResults}
        getItemValue={item => item.label}
        onSelect={this.onSelectHandle}
        onChange={this.handleInputChange}
        inputProps={{ placeholder: placeholder, style: inputStyle }}
        renderItem={(item, isHighlighted) => (
          <div
            className="search-item"
            key={item.placeId}
            style={{ backgroundColor: isHighlighted ? highlightedBgColor : '' }}
          >
            {item.label}
          </div>
        )}
        wrapperStyle={inputWrapperStyle}
        menuStyle={this.props.menuStyle}
      />
    );

    if (slim) {
      return autoComplete;
    }

    return (
      <div className="location-search-box" id="location-search-box">
        <FontAwesomeIcon icon={faSearch} className="icon-search" onClick={this.handleSearchClick} />
        <div className={`${this.state.isSearchVisible ? 'open' : 'close'} autocomplete`}>{autoComplete}</div>
      </div>
    );
  }
}

export default onClickOutside(LocationSearchBoxControlled);
