import React, { Component } from 'react';
import store, { languageSlice } from '../store';

import { connect } from 'react-redux';
import ReactFlagsSelect from 'react-flags-select';

import { changeLanguage, SUPPORTED_LANGUAGES } from './langUtils';

import './LanguageSelector.scss';

class LanguageSelector extends Component {
  countries = SUPPORTED_LANGUAGES.map((l) => l.flagCode);
  labels = SUPPORTED_LANGUAGES.reduce((acc, elem) => {
    acc[elem.flagCode] = elem.text;
    return acc;
  }, {});

  onSelectFlag = async (flagCode) => {
    const locale = SUPPORTED_LANGUAGES.find((lang) => lang.flagCode === flagCode);
    if (!locale) {
      return;
    }
    await changeLanguage(locale.langCode);
    store.dispatch(languageSlice.actions.setLanguage(locale.langCode));
  };

  render() {
    const selectedLanguage = SUPPORTED_LANGUAGES.find(
      (lang) => this.props.selectedLanguage === lang.langCode,
    );

    return (
      <div className="language-selector">
        <ReactFlagsSelect
          className="menu-flags"
          countries={this.countries}
          customLabels={this.labels}
          selected={selectedLanguage ? selectedLanguage.flagCode : null}
          onSelect={this.onSelectFlag}
          selectedSize={12}
        />
      </div>
    );
  }
}
const mapStoreToProps = (store) => ({
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(LanguageSelector);
