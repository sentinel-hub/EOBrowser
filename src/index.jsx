import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'react-app-polyfill/stable';
import { DndProvider } from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch';
import { BrowserRouter } from 'react-router-dom';

import store from './store';
import App from './App';
import LanguageProvider from './LanguageSelector/LanguageProvider';
import EnsureTermsPrivacy from './TermsAndPrivacyConsent/EnsureTermsPrivacy';
import AuthProvider from './Auth/AuthProvider';
import URLParamsParser from './URLParamsParser/URLParamsParser';
import ThemesProvider from './ThemesProvider/ThemesProvider';
import GoogleAPIProvider from './GoogleAPIProvider/GoogleAPIProvider';
import MetadataCacheProvider from './MetadataCacheProvider/MetadataCacheProvider';

import './index.scss';
import { TutorialProvider } from './Tutorial/TutorialProvider';

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <MetadataCacheProvider>
        <LanguageProvider>
          <DndProvider options={HTML5toTouch}>
            <AuthProvider>
              <URLParamsParser>
                {(themeId, sharedPinsListId) => (
                  <ThemesProvider themeIdFromUrlParams={themeId}>
                    <TutorialProvider themeIdFromUrlParams={themeId}>
                      <GoogleAPIProvider>
                        {({ googleAPI }) => (
                          <App sharedPinsListIdFromUrlParams={sharedPinsListId} googleAPI={googleAPI} />
                        )}
                      </GoogleAPIProvider>
                    </TutorialProvider>
                  </ThemesProvider>
                )}
              </URLParamsParser>
              <EnsureTermsPrivacy></EnsureTermsPrivacy>
            </AuthProvider>
          </DndProvider>
        </LanguageProvider>
      </MetadataCacheProvider>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root'),
);
