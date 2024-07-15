import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import { getSignUpUrl } from '../Auth/authHelpers';
import store, { tutorialSlice } from '../store';
import { PSD_TUTORIAL_ID } from './tutorial.const';
import { localeNames } from './TutorialComponent';
import { handleFathomTrackEvent } from '../utils';
import { FATHOM_TRACK_EVENT_LIST, REACT_MARKDOWN_REHYPE_PLUGINS } from '../const';

export const tutorialStyles = {
  options: {
    zIndex: 10000,
  },
  beacon: {
    display: 'none',
  },
};

const welcomeMd = () => t`# Welcome To EO Browser!

A complete archive of Sentinel-1, Sentinel-2, Sentinel-3, Sentinel-5P, ESA’s  
archive of Landsat 5, 7 and 8, global coverage of Landsat 8, Envisat Meris,  
MODIS, Proba-V and GIBS products in one place.`;

const overviewMd = () => t`#### Quick overview of EO Browser features

EO Browser combines a complete archive of Sentinel-1, Sentinel-2, Sentinel-3, Sentinel-5P, ESA’s archive of Landsat 5, 7 and 8, global coverage of Landsat 8, Envisat Meris, MODIS, Proba-V and GIBS products in one place and makes it possible to browse and compare full resolution images from those sources. You simply go to your area of interest, select data sources, time range and cloud coverage, and inspect the resulting data.

You can continue the tutorial by clicking on the "Next" button or you can close it. By clicking the info icon <span style="background-color: rgb(25, 26, 37); color: rgb(238, 238, 238); padding: 4px 10px;"><i class="fa fa-info"></i></span> in the top right corner you can always resume the tutorial in case you closed it by mistake or because you wanted to try things.
`;

const userAccountMd = () => t`
**Logged-in users** can use their custom themes, save and load pins, create a pin story, measure distances, create a
timelapse and use the advanced image download.

To create a free account simply click [here]()
or within the app on **Login** and then "Sign Up".
`;

const discoverTabMd = () => t`

In the **Discover** tab you can:

 - Select a **Theme.**
 - **Search** for data.
 - View theme **Highlights.**

The **Theme** dropdown offers you different preconfigured themes as well as your own custom configured instances if you are Logged-in. To create an instance, click on
the settings icon <i className="fa fa-cog"></i> and log in with the same credentials as you used for EO Browser.
 
Under **Search** you can set search criteria:
  - Choose from which satellites you want to receive the data by selecting checkboxes.
  - Select additional options where applicable, for example, cloud coverage with the slider.
  - Select the time range by either typing the date or select the date from the calendar.

You can read explanations of satellites by clicking on the question icon
<i className="fa fa-question-circle"></i> next to the data source name.

Once you hit <span class="btn" style="font-size: 12px; padding: 4px 6px 4px 6px">Search</span> you get a list of results. Each result is presented 
with a preview image, and relevant data specific to the datasource. For some data sources, the link icon <i class="fa fa-link"></i> is also visible for each result.
Clicking on it reveals direct links to the raw image of the result on EO Cloud or SciHub. Clicking on the <span class="btn" style="font-size: 12px; padding: 4px 6px 4px 6px">Visualize</span> button will open the **Visualize** tab for the selected result.

Under **Highlight**, you find preselected interesting locations connected to the selected theme.
`;

const visualizationtabMd = () => t`
In the <b>Visualize</b> tab you can select different pre-installed or custom spectral band combinations to visualise data for the selected result.

Some of the common options:
  - **True Color** - Visual interpretation of land cover.
  - **False Color** - Visual interpretation of vegetation.
  - **NDVI** - Vegetation index.
  - **Moisture index** - Moisture index
  - **SWIR** - Shortwave-infrared index.
  - **NDWI** - Normalized Difference Water Index.
  - **NDSI** - Normalized Difference Snow Index.

Most visualizations are given a description and a legend, which you can view by clicking on the expand
icon <i className="fa fa-angle-double-down "></i>.
   
For most data sources the **Custom Script** option is available. Click on it to select custom
band combinations, index combinations or write your own classification script for the visualisation of data. You can also
use custom scripts, which are stored elsewhere, either on Google drive, GitHub or in our [Custom script repository](https://custom-scripts.sentinel-hub.com/). 
Paste the URL of the script into a text box in the advanced script editing panel and click Refresh.
   
You can change the date directly in the <b>Visualize</b> tab, without going back to the **Discover** tab. Type in or select it from the calendar <i className="fa fa-calendar cal-icon-cal"></i>.

Above the visualizations you have on line of additional tools. Note that their avalibilty depends on the data source.
  - **Pin layer** to save it in the application for future use - by clicking on the pin icon <i className="fa fa-thumb-tack"></i>.
  - Select **advanced options** like the sampling method or apply different **effects** such as contrast (gain) and luminance (gamma) - by clicking on the effect sliders icon <i className="fa fa-sliders"></i>.
  - Add a layer to the **Compare** tab for later comparison - by clicking on the compare icon <i ClassName="fas fa-exchange-alt"></i>.
  - **Zoom** to the centre of the tile - by clicking on the crosshair <i className="fa fa-crosshairs"></i>.
  - Toggle **layer visibility** - by clicking on the visibility icon <i className="fa fa-eye-slash"></i>.
  - **Share** your visualization on social media - by clicking on the share icon <i className="fas fa-share-alt"></i>.
`;

const comparetabMd = () => t`

In the **Compare** tab you will find all visualizations that you added via <i ClassName="fas fa-exchange-alt"></i> to **Compare**. 

There are two modes:
  - **Opacity** (Draw opacity slider left or right to fade between compared images)
  - **Split** (Draw split slider left or right to set the boundary between compared images)

You can add all pins to the compare panel using <i className="fa fa-plus-square"></i> **Add all pins** or remove all visualizations
 from the **Compare** tab with the <i className="fa fa-trash"></i> **Remove all** button.
`;

const pinstabMd = () => t`
The **Pins** tab contains your pinned (favourite/saved) items. Pinned items contain information about location, data source and its specific layer, zoom level and time.

For each pin you have several options on how to interact with a single pin:

- Change **order** - by clicking on the move icon <span style="display: inline-flex; padding-top: 0.05em;"><i class="fa fa-ellipsis-v"></i><i class="fa fa-ellipsis-v"></i></span> in the top left corner of the pin and dragging the pin up or down the list.
- **Rename** - by clicking on the pencil icon <i className="fa fa-pencil"></i> next to the pin's name.
- Add to the **Compare** tab - by clicking on the compare icon <i ClassName="fas fa-exchange-alt"></i>
- Enter a **description** - by clicking on the expand icon <i className="fa fa-angle-double-down "></i>.
- **Remove** - by clicking the remove icon <i className="fa fa-trash"></i>.
- **Zoom** to the pin's location - by clicking on the Lat/Lon.

In the line above all pins you have different options that apply for all pins:
 - Create your own story from pins - by clicking on <i class="fa fa-film"></i> **Story**.
 - Share your pins with others via a link - by clicking on <i className="fas fa-share-alt"></i> **Share**.
 - Export pins as a JSON file - by clicking on  <i class="fa fa-cloud-download"></i> **Export**.
 - Import pins from a JSON file - by clicking on  <i class="fa fa-cloud-upload"></i> **Import**.
 - Delete all pins - by clicking on  <i class="fa fa-trash"></i> **Clear**.
`;

const searchPlacesMd =
  () => t` Search for a location either by scrolling the map with a mouse or enter the location in the search
field.`;

const overlaysMd = () => t`
Here you can select which base layer and overlays (roads, borders, labels) are shown on the map.
`;

const tutorialMd = () => t`
You can view the tutorial anytime by clicking on this info icon <span style="background-color: #191a25; color: #eee; padding: 4px 10px"><i className="fa fa-info"></i></span>.
`;

const aoiMd = () => t`
This tool allows you to draw a polygon on the map and display the polygon's size.

All layers that return a single value (such as NDVI, Moisture index, NDWI,…) support viewing the
index for the selected area over time. Clicking the chart icon  <i class="fa fa-bar-chart"></i> will
display the charts. You can remove the polygon by clicking the remove icon <i class="fa fa-close"></i>.

You can also upload a KML/KMZ, GPX, WKT (in EPSG:4326) or GEOJSON/JSON file with a polygon geometry.
 
The two sheets icon <i class="far fa-copy"></i> lets you copy the polygon coordinates as a GEOJSON, the crosshair <i className="fa fa-crosshairs"></i>
centres the map to the drawn polygon.

Exported images will be cropped to the area of interest in analytical downloads.
`;

const poiMd = () => t`
With this tool, you can mark a point on the map.

You can also view statistical data for some layers by clicking on the chart icon <i class="fa fa-bar-chart"></i>. 
You can remove the mark by clicking the remove icon <i class="fa fa-close"></i>.
`;

const loiMd = () => t`
This tool allows you to draw a line on the map and display the line length.

It also includes the **Elevation Profile**, a tool that allows you to create the altitude profile by defining a
line from point A to point B.

You can also upload a KML/KMZ, GPX, WKT (in EPSG:4326) or GEOJSON/JSON file.

The two sheets icon <i class="far fa-copy"></i> lets you copy the line coordinates as a GEOJSON and the crosshair <i className="fa fa-crosshairs"></i> centers the map to the drawn line.
`;

const measurementMd = () => t`
With this tool, you can measure distances and areas on the map.

Every mouse click creates a new point on the path. To stop adding points, press <code>Esc</code>  key or double click on the map.  
You can remove the measurement by clicking the remove icon <i class="fa fa-close"></i>.
`;

const downloadImageMd = () => t`
With this tool, you can download an image of visualized data for the displayed location. You can choose
to show captions and you can add your own description.
By enabling Analytical mode, you can choose between various image formats, image resolutions and
coordinate systems. You can also select multiple layers and download them as a <code>.zip</code>  file.

Click the download button <span class="btn" style="font-size: 12px; padding: 4px 6px 4px 6px"><i className="fa fa-download"></i>Download</span>
and your image(s) will begin to download. The process can take a few seconds, depending on the selected
resolution and the number of selected layers.

Before downloading, you can define an area of interest (AOI) by clicking on the Area selection tool
icon. Your data will be clipped to match this area.
`;

const timelapseMd = () => t`
With this tool, you can create a timelapse animation of the visualised layer and displayed location.

First, choose a time range. You can refine your search results further by filtering them by months
(filter by months checkbox) and/or selecting one image per defined period (orbit, day, week, month,
year).

Then press <span class="btn" style="font-size: 12px; padding: 4px 6px 4px 6px"> <i className="fa fa-search"></i> Search </span> and select your images.
You can select all by checking the checkbox or filter the images by cloud coverage by moving the slider. Or you can pick images one by
one by scrolling through the list and selecting them. Via the **Borders** checkbox, you can enable/disable the borders on your image.

You can preview the timelapse by pressing the play button on the bottom. You can also set the speed
(frames per second).

When you are satisfied with the result, click the download button and the timelapse will be
downloaded as a <code>.gif</code> file.
`;

const threeDMd = () => t`
This tool allows you to navigate and fly through terrain effortlessly.

You can make use of the 3D Feature by utilizing the following tools:
- Use **Vertical Terrain Scaling** to make flatter areas appear more dynamic
- Stimulate the Sun movements and its projected shadows at any time of the day
- Manipulate the **Shadow Parameters**
  - Shadow visibility
  - Shadow rendering distance
  - Shadow map size visibility
- Control the ambient, diffuse and specular factors as well as specular power
- Use the **Anaglyph Stereo Mode** to create two distinct red and blue images to produce a single 3D stereo image
`;

const histogramMd = () => t`
This tool allows you to calculate and display statistical data (the distribution of values) for specific layers.

It is calculated for the data within your AOI (if defined) or otherwise for the whole screen.

You can hover over the bars in the histogram to read the values and determine thresholds to distinguish between different spectral signatures.

This tool currently only works for index layers (e.g., the NDVI).
`;

const happyBrowsingMd = () => t`

You have reached the end of the tutorial. If you have any other questions, feel free to ask us on [the forum](https://forum.sentinel-hub.com/)
or contact us [via email](mailto:info@sentinel-hub.com?Subject=EO%20Browser%20Feedback).


If you want to view the tutorial in the future you can always view it by clicking the info icon <span style="background-color: #191a25; color: #eee; padding: 4px 10px"><i className="fa fa-info"></i></span> in the top right corner.
`;

const mobileMd = () => t`
#### Quick overview of EO Browser features

If you have a small screen, please go [here](https://www.sentinel-hub.com/explore/eobrowser/user-guide/) to view our user guide.

You can always view this info again by clicking the info icon
<span style="background-color: #191a25, color: #eee, padding: 4px 10px">
  <i class="fa fa-info"></i>
</span>
in the top right corner.

#### Other resources`;

const FirstStepLinks = ({ showPsdTutorialLink }) => {
  const handleOnClickActions = () => {
    store.dispatch(tutorialSlice.actions.openTutorial({ id: PSD_TUTORIAL_ID }));
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.SANDBOX_DATA_SHOW_TUTORIAL_ON_USER_CLICK);
  };

  return (
    <div className="links">
      <a
        className="link"
        href="https://www.sentinel-hub.com/explore/eobrowser/"
        target="_blank"
        rel="noopener noreferrer"
        title={t`EO Browser presentation page`}
      >
        {t`EO Browser presentation page`}
      </a>
      <a
        className="link"
        href="https://www.sentinel-hub.com/explore/eobrowser/user-guide/"
        target="_blank"
        rel="noopener noreferrer"
        title={t`EO Browser user guide`}
      >
        {t`EO Browser user guide`}
      </a>
      {showPsdTutorialLink && (
        <div className="link" onClick={() => handleOnClickActions()}>
          {t`Planet Sandbox Data tutorial`}
        </div>
      )}
    </div>
  );
};

/* STEPS */
export const TUTORIAL_STEPS = (showPsdTutorialLink) => [
  {
    content: (
      <div className="content-div-style first-step">
        <ReactMarkdown
          children={welcomeMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
        <FirstStepLinks showPsdTutorialLink={showPsdTutorialLink} />
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },

  {
    title: t`What Is EO Browser?`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={overviewMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`User Account`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={userAccountMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
          transformLinkUri={() => getSignUpUrl()}
        />
      </div>
    ),
    target: '.user-panel',
    placement: 'auto',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Discover Tab`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={discoverTabMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '#SearchTabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Visualize Tab`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={visualizationtabMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '#visualization-tabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Compare Tab`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={comparetabMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '#CompareTabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Pins Tab`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={pinstabMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '#pins-tabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Search Places`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={searchPlacesMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '#location-search-box',
    placement: 'bottom',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },

  {
    title: t`Layers And Overlays`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={overlaysMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '.leaflet-control-layers-toggle',
    placement: 'bottom',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Information And Tutorial`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={tutorialMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '#infoButton',
    placement: 'bottom',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Draw Area Of Interest`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown children={aoiMd()} rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS} linkTarget="_blank" />
      </div>
    ),
    target: '.aoiPanel',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Draw a Line`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown children={loiMd()} rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS} linkTarget="_blank" />
      </div>
    ),
    target: '.loiPanel',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Mark Point Of Interest`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown children={poiMd()} rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS} linkTarget="_blank" />
      </div>
    ),
    target: '.poiPanel',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Measure Distances`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={measurementMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '.measurePanel',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Download Image`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={downloadImageMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '.img-download-btn-wrapper',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Create Timelapse Animation`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={timelapseMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '.timelapsePanelButton',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Visualize Terrain in 3D`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={threeDMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '.terrain-viewer-button',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Histogram`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={histogramMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: '.histogram-button-wrapper',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: t`Happy Browsing!`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={happyBrowsingMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
];

export const TUTORIAL_STEPS_MOBILE = (showPsdTutorialLink) => [
  {
    title: t`Welcome To EO Browser!`,
    content: (
      <div className="content-div-style">
        <ReactMarkdown
          children={mobileMd()}
          rehypePlugins={REACT_MARKDOWN_REHYPE_PLUGINS}
          linkTarget="_blank"
        />
        <FirstStepLinks showPsdTutorialLink={showPsdTutorialLink} />
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: {
      options: {
        zIndex: 10000,
      },
      tooltipTitle: {
        paddingBottom: '0',
      },
      tooltipContent: {
        paddingTop: '0',
      },
    },
    locale: localeNames,
  },
];
