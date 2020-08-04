import React, { Component } from 'react';
import store, { languageSlice } from '../store';

import { connect } from 'react-redux';
import ReactFlagsSelect from 'react-flags-select';

import { getLanguage, changeLanguage, SUPPORTED_LANGUAGES } from './langUtils';

import 'react-flags-select/scss/react-flags-select.scss';
import './LanguageSelector.scss';

class LanguageSelector extends Component {
  constructor(props) {
    super();
    this.defaultSelection = SUPPORTED_LANGUAGES.find(lang => getLanguage() === lang.langCode);
    this.countries = SUPPORTED_LANGUAGES.map(l => l.flagCode);
    this.labels = SUPPORTED_LANGUAGES.reduce((acc, elem) => {
      acc[elem.flagCode] = elem.text;
      return acc;
    }, {});
    store.dispatch(languageSlice.actions.setLanguage(this.defaultSelection.langCode));
  }

  onSelectFlag = flagCode => {
    const locale = SUPPORTED_LANGUAGES.find(lang => lang.flagCode === flagCode);
    if (!locale) {
      return;
    }
    changeLanguage(locale.langCode);
    store.dispatch(languageSlice.actions.setLanguage(locale.langCode));
  };

  render() {
    return (
      <div className="language-selector">
        <ReactFlagsSelect
          className="menu-flags"
          countries={this.countries}
          customLabels={this.labels}
          defaultCountry={this.defaultSelection ? this.defaultSelection.flagCode : null}
          onSelect={this.onSelectFlag}
          selectedSize={12}
        />
      </div>
    );
  }
}
const mapStoreToProps = store => ({
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(LanguageSelector);
