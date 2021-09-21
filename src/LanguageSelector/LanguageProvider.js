import React from 'react';
import { connect } from 'react-redux';

import store, { languageSlice } from '../store';
import { getLanguage, initLanguages } from './langUtils';

class LanguageProvider extends React.Component {
  componentDidMount() {
    initLanguages();
    const language = getLanguage();
    store.dispatch(languageSlice.actions.setLanguage(language));
  }

  render() {
    return this.props.children;
  }
}

const mapStoreToProps = (store) => ({
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps)(LanguageProvider);
