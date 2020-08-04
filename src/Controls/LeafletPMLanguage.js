import { Component } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';
import 'leaflet.pm';

class LeafletPMLanguage extends Component {
  // Sets the language for leaflet.pm, which is used in POI and AOI components
  // https://www.npmjs.com/package/leaflet.pm#customize-language

  componentDidMount() {
    this.setLanguage(this.props.selectedLanguage);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selectedLanguage !== this.props.selectedLanguage) {
      this.setLanguage(this.props.selectedLanguage);
    }
  }

  setLanguage = selectedLanguage => {
    const translation = {
      tooltips: {
        placeMarker: t`Click to place marker`,
        firstVertex: t`Click to place first vertex`,
        continueLine: t`Click to continue drawing`,
        finishPoly: t`Click first marker to finish`,
      },
    };
    this.props.map.pm.setLang(selectedLanguage, translation, 'en');
  };

  render() {
    return null;
  }
}

const mapStoreToProps = store => ({
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(LeafletPMLanguage);
