import { useLocale, addLocale } from 'ttag';
import moment from 'moment';

export const LOCAL_STORAGE_KEY = 'eobrowser_lang';
export const DEFAULT_LANG = 'en';
export const SUPPORTED_LANGUAGES = [
  { langCode: 'en', text: 'English', flagCode: 'GB' },
  { langCode: 'da', text: 'Dansk', flagCode: 'DK' },
  { langCode: 'de', text: 'Deutsch', flagCode: 'DE' },
  { langCode: 'et', text: 'Eesti keel', flagCode: 'EE' },
  { langCode: 'es', text: 'español', flagCode: 'ES' },
  { langCode: 'el', text: 'ελληνικά', flagCode: 'GR' },
  { langCode: 'pl', text: 'polski', flagCode: 'PL' },
  { langCode: 'sl', text: 'slovenščina', flagCode: 'SI' },
];

export const changeLanguage = (locale) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLocale(locale);
  saveLang(locale);
  moment.locale(locale);
};

export const getLanguage = () => {
  const storedLang = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!storedLang) {
    saveLang(DEFAULT_LANG);
    return DEFAULT_LANG;
  }
  return storedLang;
};

const saveLang = (locale) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, locale);
};

export const initLanguages = () => {
  SUPPORTED_LANGUAGES.forEach((locale) => {
    if (locale.langCode !== DEFAULT_LANG) {
      require(`moment/locale/${locale.langCode}`);
      const ttagObject = require(`../translations/${locale.langCode}.po.json`);
      if (process.env.REACT_APP_DEBUG_TRANSLATIONS === 'true') {
        makeDebugTranslations(ttagObject);
      }
      addLocale(locale.langCode, ttagObject);
    }
  });
};

function makeDebugTranslations(ttagObject) {
  const translations = ttagObject.translations[''];
  for (let key in translations) {
    if (translations[key].msgid.length === 0) {
      continue;
    }
    translations[key].msgstr = translations[key].msgstr.map((str) =>
      replaceStringWithXs(str === '' ? key : str),
    );
  }
}

function replaceStringWithXs(str) {
  const PERCENTAGE_OF_LENGTH = 80;
  let newStrArr = [];
  const newStrLength = Math.ceil(str.length * (PERCENTAGE_OF_LENGTH / 100));
  for (let i = 0; i <= newStrLength; i++) {
    newStrArr.push('x');
  }
  return newStrArr.join('');
}
