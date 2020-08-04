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