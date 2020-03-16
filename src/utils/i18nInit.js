import { addLocale, useLocale } from 'ttag';

// load json file with translations
const locale = 'en';
const translationsObj = require(`../../i18n/${locale}.po.json`);
addLocale(locale, translationsObj);
useLocale(locale);
