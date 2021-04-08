import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'react-app-polyfill/stable';

import store from './store';
import App from './App';
import LanguageProvider from './LanguageSelector/LanguageProvider';
import AuthProvider from './Auth/AuthProvider';
import URLParamsParser from './URLParamsParser/URLParamsParser';
import ThemesProvider from './ThemesProvider/ThemesProvider';
import { DndProvider } from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch';
import { BrowserRouter } from 'react-router-dom';

import './index.scss';

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <LanguageProvider>
        <DndProvider options={HTML5toTouch}>
          <AuthProvider>
            <URLParamsParser>
              {(themeId, sharedPinsListId) => (
                <ThemesProvider themeIdFromUrlParams={themeId}>
                  <App sharedPinsListIdFromUrlParams={sharedPinsListId} />
                </ThemesProvider>
              )}
            </URLParamsParser>
          </AuthProvider>
        </DndProvider>
      </LanguageProvider>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root'),
);
