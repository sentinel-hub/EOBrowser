## About

The Earth Observation Browser is a search tool for Sentinel-1, -2, -3, Landsat 5, 7, 8, MODIS and Envisat Meris satellite imagery. It was released as open-source to bring earth observation imagery closer to its end users.

Some features:

* Search by date, location, source, and cloud coverage
* Tweak imagery rendering parameters and settings on-the-fly, similar to [Sentinel Playground](http://apps.sentinel-hub.com/sentinel-playground/)
* Pin your results and make opacity or split image comparisons of pinned tiles

<img src="eobrowser.jpg" />

## Usage

* Run `npm install`
* Run `npm start`

IMPORTANT: By default, application will start at `http://localhost:3000/`. It is important to keep this address, otherwise login to [Sentinel Hub](https://sentinel-hub.com) will not work because of OAuth security considerations.
