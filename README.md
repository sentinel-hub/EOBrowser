## About

The [Earth Observation Browser](https://apps.sentinel-hub.com/eo-browser/) is a search tool for satellite imagery, including Sentinel-1, 2, 3, 5P and Landsat 5, 7, 8. It was released as open-source to bring earth observation imagery closer to its end users.

Some features:

* Search by date, location, source, and cloud coverage
* Tweak imagery rendering parameters and settings on-the-fly, similar to [Sentinel Playground](http://apps.sentinel-hub.com/sentinel-playground/)
* Pin your results and make opacity or split image comparisons
* Use Sentinel username and password (if you don't have any, contact [Sentinel Hub](https://www.sentinel-hub.com/))

Note that because the code relies on a specific SentinelHub clientId which is not available for external deployments, it currently can't be deployed by 3rd parties.

<img src="eobrowser.jpg" />

## Development

* copy `.env.example` file and rename the copied file to `.env`, fill out the needed values
* use your instance ids in `*_themes.js`
* Run `npm install`
* Run `npm start` to run the application locally
* Run `npm run storybook` to run storybook locally for testing components independently
* Run `npm run prettier` to prettify `js`, `json`, `css` and `scss` files
* Run `npm run lint` to lint `js`, `json`, `css` and `scss` files
* Run `npm run build` to build the application sources
* Run `npm run translate` to add strings to the translation files
* Run `npm run debug-translations` to replace all translation strings with "XXXXXX"

## Multilanguage support

Thanks to the effort of various people and institutions you can enjoy EO Browser in your native language.

Your language is missing and you want to help to translate it? Contact us at info@sentinel-hub.com for more details.

- Danish (Main functionality): Carsten Skovgård Andersen (Stjernekammeret, Bellahøj Skole)
- Estonian: ESERO Estonia
- Finnish: [Heureka - The Finnish Science Centre](https://www.heureka.fi/about-heureka/?lang=en)
- French: [CNES](https://cnes.fr/en), ESERO France, ESERO Luxembourg
- German: ESERO Austria/ESERO Germany
- Greek: [GET](https://www.getmap.eu/?lang=en)
- Latvian: Valters Žeižis
- Polish: ESERO Poland
- Slovenian: Krištof Oštir ([Faculty of Civil and Geodetic Engineering](https://www.en.fgg.uni-lj.si/), University of Ljubljana) with financial support from the Slovenian Research Agency research core funding No. P2-0406 Earth observation and geoinformatics
- Spanish: ESERO Spain
- Swedish: [Heureka - The Finnish Science Centre](https://www.heureka.fi/about-heureka/?lang=en)
