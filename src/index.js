import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import App from './App';
import { initLanguage } from './LanguageSelector/langUtils';
import AuthProvider from './Auth/AuthProvider';
import URLParamsParser from './URLParamsParser/URLParamsParser';
import ThemesProvider from './ThemesProvider/ThemesProvider';
import { DndProvider } from 'react-dnd-multi-backend';
import HTML5toTouch from 'react-dnd-multi-backend/dist/esm/HTML5toTouch';
import { BrowserRouter } from 'react-router-dom';

import './index.scss';

initLanguage();
ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
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
    </BrowserRouter>
  </Provider>,
  document.getElementById('root'),
);
