import React from 'react';
import ReactMarkdown from 'react-markdown';
import { getSignUpUrl } from '../Auth/authHelpers';
import { tutorialStyles } from './EOBTutorialContent';
import { localeNames } from './TutorialComponent';
import { t } from 'ttag';
import { REACT_MARKDOWN_REHYPE_PLUGINS } from '../const';

const slide1 = () =>
  t`Test and experience a substantial amount of [Planet](https://www.planet.com/) data samples made available under a [CC-BY-NC](https://creativecommons.org/licenses/by-nc/4.0/) license to all active Planet users and Sentinel Hub users with a paid subscription. Sandbox Data offers a subset of the [WorldStrat](https://worldstrat.github.io/) locations and dense time-stacks, ranging from 25 to 200 km<sup>2</sup> in size. The locations are spread across the world, assuring a stratified representation of various use cases.`;

const slide2 = () => t`
Planet Sandbox Data is available via **theme selector** and includes 3 Highlights for each of the following data collections.

- **[PlanetScope](https://collections.sentinel-hub.com/planetscope/)** - Powered by hundreds of Dove satellites in orbit, PlanetScope provides a medium-resolution, continuous, and complete view of the world from above, every day.

- **[Analysis-Ready PlanetScope (Beta)](https://collections.sentinel-hub.com/analysis-ready-planetscope/)** - Harmonized, spatially consistent daily stacks of medium resolution imagery based on PlanetScope data, ideal for time-series analysis and machine learning applications.

- **[SkySat](https://collections.sentinel-hub.com/skysat/)** - Planet's extensive archive of very high resolution SkySat imagery is available at 50 cm spatial resolution for images collected on or after June 30, 2020, and at 72 cm spatial resolution for images collected before this date.

- **[Soil Water Content](https://collections.sentinel-hub.com/soil-water-content/)** - Consistent, high-frequency measurements of the amount of water present in a unit volume of the soil, available at 100 m and 1,000 m resolution.

- **[Land Surface Temperature](https://collections.sentinel-hub.com/land-surface-temperature/)** - Consistent, twice daily measurements of land surface temperature available at 100 m and 1,000 m resolution.

- **[Forest Carbon Diligence](https://collections.sentinel-hub.com/forest-carbon-diligence/)** - Annual estimates of the aboveground carbon stored in woody biomass across the landscape, contains data layers measuring: canopy height, canopy cover, and aboveground live carbon with a spatial resolution of 30 m.

- **[Planet Basemaps](https://collections.sentinel-hub.com/planet-basemaps/)** - Visually consistent and scientifically accurate mosaics with complete coverage over broad areas, built from high-frequency PlanetScope imagery.

- **[Road and Building Detection](https://collections.sentinel-hub.com/road-and-building-detection/)** - Globally available land cover maps derived from Planetscope imagery classifying pixels as road, building or neither. Generated on a weekly or monthly basis, these can be used to stay up to date with the latest development around the globe.
`;

const slide3 = () => t`
The Analysis-Ready PlanetScope collection harnesses a proprietary algorithm to create pre-processed, harmonized, and spatially consistent daily stacks of images that enable time-series analysis and machine learning applications. 

Analysis-Ready PlanetScope enhances the monitoring capabilities of PlanetScope daily imagery by adding improved temporal and spatial consistency that is aligned with trusted, third-party data sources (e.g. Landsat, Sentinel-2, MODIS, VIIRS). 
`;

const slide4 = () => t`
With deeper and more extensive pre-processing, the data is not only more precise, but also pre-formatted for time-series analysis and machine learning applications. Test it out yourself by using the **Create Timelapse Animation** feature on the right.
`;

const slide5 = () => t`
Learn more about the [Analysis-Ready PlanetScope collection](https://collections.sentinel-hub.com/analysis-ready-planetscope/sandbox-data.html) and discover all Sandbox Data collections by visiting the [collections library](https://collections.sentinel-hub.com/planet-sandbox-data/), where more areas of interest are available for each collection.

If you have any questions, visit the [Planet Community](https://community.planet.com/).
`;

/* STEPS */
export const PSD_STEPS = () => [
  {
    content: (
      <>
        <div className="logo">
          <img alt="" src="images/tutorial/psd/logo.svg"></img>
        </div>
        <h1 style={{ margin: 0 }}>{t`Introducing Planet Sandbox Data`}</h1>
        <div className="content-div-style first-step">
          <ReactMarkdown
            children={slide1()}
            rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
            linkTarget="_blank"
          />
          <img alt="" style={{ width: '100%' }} src="images/tutorial/psd/step1_image1.png"></img>
        </div>
      </>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Where to Find the Sandbox Data Theme?`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={slide2()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '#SearchTab',
    placement: 'right-start',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Spotlight on Analysis-Ready PlanetScope`,
    content: (
      <div className="content-div-style">
        <div
          className="third-step"
          style={{
            display: 'flex',
          }}
        >
          <div style={{ margin: '1em 1em 1em 0' }}>
            <img alt="" style={{ width: '179px' }} src="images/tutorial/psd/step3_image1.png"></img>
          </div>

          <div
            style={{
              flex: 1,
              flexFlow: 'column',
            }}
          >
            <ReactMarkdown
              children={slide3()}
              rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
              linkTarget="_blank"
              transformLinkUri={() => getSignUpUrl()}
            />
          </div>
        </div>
      </div>
    ),
    target: '.timelapsePanelButton',
    placement: 'left-start',
    disableBeacon: true,
    styles: { ...tutorialStyles, overlay: { backgroundColor: 'transparent' } },
    locale: localeNames,
  },
  {
    title: t`Create Timelapse Animation for Analysis-Ready PlanetScope`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={slide4()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
        <div
          className="fourth-step"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <img className="step4-image" alt="" src="images/tutorial/psd/step4_image1.png"></img>
          <img className="step4-image" alt="" src="images/tutorial/psd/step4_image2.png"></img>
          <img className="step4-image" alt="" src="images/tutorial/psd/step4_image3.png"></img>
          <img className="step4-image" alt="" src="images/tutorial/psd/step4_image4.png"></img>
        </div>
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: { ...tutorialStyles, overlay: { backgroundColor: 'transparent' } },
    locale: localeNames,
  },
  {
    title: t`Planet Sandbox Data - Start Exploring Now!`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={slide5()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: false,
    styles: { ...tutorialStyles, overlay: { backgroundColor: 'transparent' } },
    locale: localeNames,
  },
];
