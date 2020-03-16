import React from 'react';
import RCSlider from 'rc-slider';

export const tutorialStyles = {
  options: {
    zIndex: 10000,
  },
  beacon: {
    display: 'none',
  },
};

export const localeNames = {
  next: (
    <span title="Next">
      Next <i className="fa fa-angle-double-right" />
    </span>
  ),
  back: (
    <span title="Previous">
      <i className="fa fa-angle-double-left" /> Previous
    </span>
  ),
  last: (
    <span title="End tutorial">
      End tutorial <i className="fa fa-close" />
    </span>
  ),
  skip: (
    <span title="Close">
      Close <i className="fa fa-step-close" />
    </span>
  ),
  close: (
    <span title="Close and don't show again">
      Close and don't show again <i className="fa fa-close" />
    </span>
  ),
};

/* STEPS */
export const TUTORIAL_STEPS = [
  {
    content: (
      <div className="contentDivStyle" style={{ textAlign: 'center', paddingBottom: '40px' }}>
        <h1>Welcome to EO Browser!</h1>
        <p>
          A complete archive of Sentinel-1, Sentinel-2, Sentinel-3, Sentinel-5P, ESA’s <br />
          archive of Landsat 5, 7 and 8, global coverage of Landsat 8, Envisat Meris, <br />
          Proba-V and MODIS and GIBS products in one place.
        </p>
        <br />
        <a href="https://sentinel-hub.com/explore/eobrowser" target="_blank" rel="noopener noreferrer">
          EO Browser presentation page
        </a>
        <br />
        <a
          href="https://sentinel-hub.com/explore/eobrowser/user-guide"
          target="_blank"
          rel="noopener noreferrer"
        >
          EO Browser user guide
        </a>
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },

  {
    title: 'What is EO Browser?',
    content: (
      <div className="contentDivStyle">
        <h4>Quick overview of EO Browser features</h4>
        <p>
          EO Browser combines a complete archive of Sentinel-1, Sentinel-2, Sentinel-3, Sentinel-5P, ESA’s
          archive of Landsat 5, 7 and 8, global coverage of Landsat 8, Envisat Meris, Proba-V and MODIS and
          GIBS products in one place and makes it possible to browse and compare full resolution images from
          those sources. You simply go to your area of interest, select data sources, time range and cloud
          coverage, and inspect the resulting data.
        </p>
        <p>
          You can continue the tutorial by clicking on the "Next" button or you can close it. You can view it
          later by clicking the info icon{' '}
          <span style={{ backgroundColor: '#191a25', color: '#eee', padding: '4px 10px' }}>
            <i className="fa fa-info" />
          </span>{' '}
          in top right corner.
        </p>
        <p>
          You can close the tutorial to try things and when you want to continue, just press the info icon{' '}
          <span style={{ backgroundColor: '#191a25', color: '#eee', padding: '4px 10px' }}>
            <i className="fa fa-info" />
          </span>{' '}
          and the tutorial will open on the step that was displayed before closing. This may also come handy
          if you close the tutorial by mistake.
        </p>

        <h4>Other resources</h4>
        <ul>
          {/* commented until EO Browser changelog is available */}
          {/* <li>
            <a href="" target="_blank" rel="noopener noreferrer">
              EO Browser changelog
            </a>
          </li> */}
          <li>
            <a href="https://sentinel-hub.com/explore/eobrowser" target="_blank" rel="noopener noreferrer">
              EO Browser presentation page
            </a>
          </li>
          <li>
            <a
              href="https://sentinel-hub.com/explore/eobrowser/user-guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              EO Browser user guide
            </a>
          </li>
        </ul>
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'User account',
    content: (
      <div className="contentDivStyle">
        <p>
          <b>Logged-in users</b> can use their custom themes, save pins, draw an area of interest or mark a
          point of interest, measure distances and create a timelapse.
        </p>

        <p>
          Click on the <a className="btn">Login</a> button and then on the "Don't have account yet?" link to
          create a free account.
        </p>
      </div>
    ),
    target: '.userPanel',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Search tab',
    content: (
      <div className="contentDivStyle">
        You can set search criteria in <b>Search</b> tab:
        <ul>
          <li>Choose from which satellites you want to receive the data by selecting checkboxes</li>
          <li>
            Select additional options where applicable, for example cloud coverage with the slider{' '}
            <RCSlider
              min={0}
              max={100}
              step={1}
              defaultValue={50}
              style={{
                width: '50px',
              }}
            />
          </li>
          <li>Select time range by either typing the date or select the date from calendar</li>
        </ul>
        <p>
          You can read explanations of satellites by clicking on the question icon{' '}
          <i className="fa fa-question-circle" /> next to the data source name.
        </p>
        <p>
          Logged-in users can select their own custom configuration instances. To create an instance, click on
          settings icon <i className="fa fa-cog" /> and log in with same credentials as you used for EO
          Browser.
        </p>
      </div>
    ),
    target: '#SearchTabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Results tab',
    content: (
      <div className="contentDivStyle">
        Results for selected criteria are shown on <b>Results</b> tab. Each result is presented with a preview
        image,and relevant data specific to the datasource:
        <ul>
          <li>
            sensing date <i className="fa fa-calendar" />
          </li>
          <li>
            sensing time <i className="fa fa-clock-o" />
          </li>
          <li>
            cloud coverage <i className="fa fa-cloud" />
          </li>
          <li>
            tile crs <i className="fa fa-file-text-o" />
          </li>
          <li>
            MGRS location <i className="fa fa-map-o" />
          </li>
          <li>
            sun elevation <i className="fa fa-sun-o" />
          </li>
        </ul>
        For some data sources the link icon <i className="fa fa-link" /> is also visible for each result.
        Clicking on it reveals direct links to the raw image of the result on EO Cloud or SciHub.
        <br />
        Clicking on the{' '}
        <a className="btn" style={{ fontSize: '12px', padding: '4px 6px 4px 6px' }}>
          Visualize
        </a>{' '}
        button will open the <b>Visualization</b> tab with the selected result.
        <br />
        You can pin the result by clicking on the pin icon <i className="fa fa-thumb-tack" />. Pinned items
        are available at any time in the <b>Pins</b> tab.
      </div>
    ),
    target: '#ResultsTabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Visualization tab',
    content: (
      <div className="contentDivStyle">
        <p>
          In <b>Visualization</b> tab you can select different pre-installed or custom spectral band
          combinations to visualise data for selected result.
        </p>
        Some of the common options:
        <ul>
          <li>
            <b>True Color</b> - Visual interpretation of land cover.
          </li>
          <li>
            <b>False Color</b> - Visual interpretation of vegetation.
          </li>
          <li>
            <b>NDVI</b> - Vegetation index.
          </li>
          <li>
            <b>Moisture index</b> - Moisture index
          </li>
          <li>
            <b>SWIR</b> - Shortwave-infrared index.
          </li>
          <li>
            <b>NDWI</b> - Normalized Difference Water Index.
          </li>
          <li>
            <b>NDSI</b> - Normalized Difference Snow Index.
          </li>
        </ul>
        Some options have legends, which you can view by clicking on the expand icon{' '}
        <i className="fa fa-angle-double-down " />.
        <p>
          For some data sources the <b>Custom Script</b> option is available. Click on it to select custom
          band combinations or write your own classification script for visualisation of data. You can also
          use custom scripts, which are stored elsewhere, either on Google drive, GitHub or in our{' '}
          <a
            href="https://medium.com/sentinel-hub/sharing-remote-sensing-know-how-6d9244b96c48"
            target="_blank"
            rel="noopener noreferrer"
          >
            Custom script repository
          </a>. Paste the URL of the script into a text box in the advanced script editing panel and click
          Refresh.
        </p>
        <p>
          You can change the date directly in visualization tab, without going back to results panel. Type in
          or select it from the calendar <i className="fa fa-calendar cal-icon-cal" />.
        </p>
        In the top right corner of <b>Visualization</b> tab there are additional tools. Note that their
        avalibilty depends on the data source.
        <ul>
          <li>
            <b>Zoom </b>to the centre of the tile - by clicking on the search icon{' '}
            <i className="fa fa-search" />.
          </li>
          <li>
            <b>Pin layer</b> for later comparison (your pins will be stored in application for future use) -
            By clicking on the pin icon <i className="fa fa-thumb-tack" />.
          </li>
          <li>
            Toggle layer visibility - By clicking on the visibility icon <i className="fa fa-eye-slash" />;
          </li>
          <li>
            Apply different effects such as <b>contrast</b> (gain) and <b>luminance</b> (gamma) by clicking on
            the effect sliders icon <i className="fa fa-sliders" />.
          </li>
        </ul>
      </div>
    ),
    target: '#VisualizationTabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Pins tab',
    content: (
      <div className="contentDivStyle">
        <b>Pins</b> tab contains your pinned (favourite / saved) items. Pinned items contain information about
        location, data source and it's specific layer, zoom level and time.
        <br />
        You can change the order of the pins by clicking on the move icon{' '}
        <i class="fa fa-ellipsis-v" style={{ padding: '0.05em' }} />
        <i class="fa fa-ellipsis-v" style={{ padding: '0.05em' }} /> in the top left corner of the pin and
        dragging the pin up or down the list.
        <br />
        A pin can be renamed by clicking on the edit icon <i class="fa fa-pencil" /> next to the name of the
        pin.
        <br />
        Clicking on the crosshairs icon <i className="fa fa-crosshairs" /> inside the pin will zoom to the
        location that is saved in the pin.
        <br />
        You can remove the pin by clicking the remove icon <i className="fa fa-trash" />.
        <br />
        Click on a settings icon <i className="fa fa-wrench" /> reveals settings options for <b>all</b> pins:
        <ul>
          <li>
            You can export pins as a JSON file by clicking on the{' '}
            <b>
              <i className="fa fa-cloud-download" /> Export pins
            </b>{' '}
            option.
          </li>
          <li>
            <b>
              <i className="fa fa-cloud-upload" /> Import pins
            </b>{' '}
            option lets you import saved pins as a JSON file.
          </li>
          <li>
            You can also delete <b>all</b> the pins with a click on the{' '}
            <b>
              <i className="fa fa-trash" /> Clear pins
            </b>{' '}
            option.
          </li>
        </ul>
        The pins can be compared with a click on the Compare button{' '}
        <a>
          <i className="fa fa-exchange" />Compare
        </a>. Comparison has two modes:
        <ul>
          <li>
            <b>Opacity</b> (Draw opacity slider left or right to fade between compared images)
          </li>
          <li>
            <b>Split</b> (Draw split slider left or right to set the boundary between compared images)
          </li>
        </ul>
      </div>
    ),
    target: '#PinsTabButton',
    placement: 'right',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Search places',
    content: (
      <div className="contentDivStyle">
        Search for a location either by scrolling the map with mouse or enter the location in the search
        field.
      </div>
    ),
    target: '#location-search-box',
    placement: 'bottom',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Layers and overlays',
    content: (
      <div className="contentDivStyle">
        Here you can select which base layer and overlays are shown on the map.
      </div>
    ),
    target: '.leaflet-control-layers-toggle',
    placement: 'bottom',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Information and tutorial',
    content: (
      <div className="contentDivStyle">
        You can view the tutorial anytime by clicking on this info icon{' '}
        <span style={{ backgroundColor: '#191a25', color: '#eee', padding: '4px 10px' }}>
          <i className="fa fa-info" />
        </span>
        .
        <br />
        On the first step of the tutorial you will also find links to EO Browser presentation page and user
        guide.
      </div>
    ),
    target: '#infoButton',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Draw Area of interest',
    content: (
      <div className="contentDivStyle">
        This tool allows you to draw a polygon on the map and display the polygon's size.
        <p>
          Some layers (such as NDVI, Moisture index, NDWI,...) support viewing the index for the selected area
          over time. Clicking chart icon <i className="fa fa-bar-chart" /> will display the charts.
          <br />
          You can remove the polygon by clicking the remove icon <i className="fa fa-close" />.
          <br />
          You can also upload a KML/KMZ, GPX or GEOJSON file with a polygon geometry.
        </p>
        Exported images will be cropped to the area of interest in analytical downloads.
      </div>
    ),
    target: '.aoiPanel',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Mark Point of interest',
    content: (
      <div className="contentDivStyle">
        With this tool you can mark a point on the map.
        <p>
          You can also view statistical data for some layers by clicking on the chart icon{' '}
          <i className="fa fa-bar-chart" />.
          <br />
          You can remove the mark by clicking the remove icon <i className="fa fa-close" />.
        </p>
      </div>
    ),
    target: '.poiPanel',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Measure distances',
    content: (
      <div className="contentDivStyle">
        With this tool you can measure distances and areas on the map.
        <p>
          Every mouse click creates a new point on the path. To stop adding points, press <code>Esc</code> key
          or double click on map.
          <br />
          You can remove the measurement by clicking the remove icon <i className="fa fa-close" />.
        </p>
      </div>
    ),
    target: '.measurePanel',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Download image',
    content: (
      <div className="contentDivStyle">
        With this tool you can download an image of visualized data for displayed location. You can choose to
        show captions or not and you can add your own description.
        <p>
          By enabling Analytical mode, you can choose between various image formats, image resolutions and
          coordinate systems. You can also select multiple layers and download them as a <code>.zip</code>{' '}
          file.
        </p>
        <p>
          Click download button{' '}
          <a className="btn" style={{ fontSize: '12px', padding: '4px 6px 4px 6px' }}>
            <i className="fa fa-download" /> Download
          </a>{' '}
          and your image(s) will begin to download. The process can take a few seconds, depending on selected
          resolution and number of selected layers.
        </p>
        <p>
          Before downloading, you can define area of interest (AOI) by clicking on the Area selection tool
          icon{' '}
          <span style={{ backgroundColor: '#191a25', color: '#b6bf00', padding: '7px 6px 4px 6px' }}>
            <i>
              <svg
                height="16px"
                version="1.1"
                viewBox="0 0 16 16"
                width="16px"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs id="defs4" />
                <g id="layer1" transform="translate(0,-1036.3622)">
                  <path
                    d="M 8,0.75 0.75,6.5 4,15.25 l 8,0 3.25,-8.75 z"
                    id="path2985"
                    fill="#b6bf00"
                    transform="translate(0,1036.3622)"
                  />
                </g>
              </svg>
            </i>
          </span>
          . Data will be clipped to match the area.
        </p>
      </div>
    ),
    target: '.screenshotPanelButton',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Create timelapse animation',
    content: (
      <div className="contentDivStyle">
        With this tool you can create a timelapse animation of the visualized layer and displayed location.
        <p>
          First, choose a time range and press search icon. Then select images. You can select all by checking
          the checkbox or filter the images by cloud coverage by moving the slider. Or you can pick images one
          by one by scrolling through the list and selecting them.
        </p>
        <p>
          You can preview the timelapse by pressing play button on the bottom. You can also set the speed
          (frames per second).
        </p>
        <p>
          When you are satisfied with the result, click the download button and the timelapse will be
          downloaded as a <code>.gif</code> file.
        </p>
      </div>
    ),
    target: '.timelapsePanelButton',
    placement: 'left',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
  {
    title: 'Happy browsing!',
    content: (
      <div className="contentDivStyle">
        <p>
          You have reached the end of the tutorial. If you have any other question, feel free to ask us on{' '}
          <a href="https://forum.sentinel-hub.com/" target="_blank" rel="noopener noreferrer">
            forum
          </a>{' '}
          or contact us <a href="mailto:info@sentinel-hub.com?Subject=EO%20Browser%20Feedback">via email</a>.
        </p>

        <p>
          If you want to view tutorial in the future you can always view it by clicking the info icon{' '}
          <span style={{ backgroundColor: '#191a25', color: '#eee', padding: '4px 10px' }}>
            <i className="fa fa-info" />
          </span>{' '}
          in top right corner.
        </p>
      </div>
    ),
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    styles: tutorialStyles,
    locale: localeNames,
  },
];

export const TUTORIAL_STEPS_MOBILE = [
  {
    title: 'Welcome to EO Browser!',
    content: (
      <div className="contentDivStyle">
        <h4>Quick overview of EO Browser features</h4>
        <p>
          If you have a small screen, please go{' '}
          <a
            href="https://sentinel-hub.com/explore/eobrowser/user-guide"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>{' '}
          to view user guide.
        </p>

        <p>
          You can always view this later by clicking the info icon{' '}
          <span style={{ backgroundColor: '#191a25', color: '#eee', padding: '4px 10px' }}>
            <i className="fa fa-info" />
          </span>{' '}
          in top right corner.
        </p>

        <h4>Other resources</h4>
        <ul>
          {/* commented until backlog is prepared */}
          {/* <li>
            <a href="">EO Browser changelog</a>
          </li> */}
          <li>
            <a href="https://sentinel-hub.com/explore/eobrowser" target="_blank" rel="noopener noreferrer">
              EO Browser presentation page
            </a>
          </li>
          <li>
            <a
              href="https://sentinel-hub.com/explore/eobrowser/user-guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              EO Browser user guide
            </a>
          </li>
        </ul>
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
