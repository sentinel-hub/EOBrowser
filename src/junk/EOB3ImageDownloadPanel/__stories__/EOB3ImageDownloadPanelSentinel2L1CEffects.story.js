import React from 'react';
import { storiesOf } from '@storybook/react';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';
import { requestAuthToken, ApiType } from '@sentinel-hub/sentinelhub-js';

import { EOB3ImageDownloadPanel } from '../EOB3ImageDownloadPanel';
import './EOB3ImageDownloadPanel.scss';

const stories = storiesOf('EOB3 - Modal - Image Download + Effects', module);

const clientId = process.env.REACT_APP_CLIENTID;
const clientSecret = process.env.REACT_APP_ANONYMOUS_AUTH_CLIENT_ID;

if (!clientId || !clientSecret) {
  throw new Error('cliendId or clientSecret not present in env file');
}

const effects = {
  gainEffect: 2.0,
  gammaEffect: 2.0,
};

requestAuthToken(clientId, clientSecret).then(authToken => {
  stories.add('Sentinel-2 L1C', ({ state, setState }) => {
    return (
      <div id="story-image-download-panel">
        <EOB3ImageDownloadPanel
          channels={channels}
          presets={presets}
          evalscriptoverrides={null}
          effects={effects}
          evalSource={'S2'}
          instances={instances}
          aoiBounds={undefined}
          mapBounds={mapBounds}
          name={'Sentinel-2 L1C'}
          datasource={'Sentinel-2 L1C'}
          preset={'1_TRUE_COLOR'}
          evalscript={null}
          evalscripturl={null}
          atmFilter={undefined}
          layers={layers}
          time={'2019-12-22'}
          lat={41.9007}
          lng={12.50109}
          zoom={10}
          isLoggedIn={true}
          legendDataFromPreset={undefined}
          drawMapOverlays={drawMapOverlays}
          getLegendImageURL={getLegendImageURL}
          scaleBar={scaleBar}
          onErrorMessage={msg => setState({ errorMsg: msg })}
          authToken={authToken}
        />
      </div>
    );
  });

  stories.add('Sentinel-2 L1C (using Processing API)', ({ state, setState }) => {
    return (
      <div id="story-image-download-panel">
        <EOB3ImageDownloadPanel
          channels={channels}
          presets={presets}
          evalscriptoverrides={null}
          effects={effects}
          evalSource={'S2'}
          instances={instances}
          aoiBounds={undefined}
          mapBounds={mapBounds}
          name={'Sentinel-2 L1C'}
          datasource={'Sentinel-2 L1C'}
          preset={'1_TRUE_COLOR'}
          evalscript={null}
          evalscripturl={null}
          atmFilter={undefined}
          layers={layers}
          time={'2019-12-22'}
          lat={41.9007}
          lng={12.50109}
          zoom={10}
          isLoggedIn={true}
          legendDataFromPreset={undefined}
          drawMapOverlays={drawMapOverlays}
          getLegendImageURL={getLegendImageURL}
          scaleBar={scaleBar}
          onErrorMessage={msg => setState({ errorMsg: msg })}
          apiType={ApiType.PROCESSING}
          authToken={authToken}
        />
      </div>
    );
  });

  stories.add('Sentinel-2 L1C XXL bbox (using Processing API)', ({ state, setState }) => {
    return (
      <div id="story-image-download-panel">
        <EOB3ImageDownloadPanel
          channels={channels}
          presets={presets}
          evalscriptoverrides={null}
          effects={effects}
          evalSource={'S2'}
          instances={instances}
          aoiBounds={undefined}
          mapBounds={mapBoundsXXL}
          name={'Sentinel-2 L1C'}
          datasource={'Sentinel-2 L1C'}
          preset={'1_TRUE_COLOR'}
          evalscript={null}
          evalscripturl={null}
          atmFilter={undefined}
          layers={layers}
          time={'2019-12-22'}
          lat={41.9007}
          lng={12.50109}
          zoom={10}
          isLoggedIn={true}
          legendDataFromPreset={undefined}
          drawMapOverlays={drawMapOverlays}
          getLegendImageURL={getLegendImageURL}
          scaleBar={scaleBar}
          onErrorMessage={msg => setState({ errorMsg: msg })}
          apiType={ApiType.PROCESSING}
          authToken={authToken}
        />
      </div>
    );
  });

  stories.add('Sentinel-2 L1C Custom bands(4,3,2)', ({ state, setState }) => {
    const layers = {
      r: 'B04',
      g: 'B03',
      b: 'B02',
    };

    const evalscript = btoa(
      `//VERSION=3
function setup() {
  return {
    input: ["${Object.values(layers)
      .map(e => e)
      .join('","')}", "dataMask"],
    output: { bands: 4 }
  };
}

function evaluatePixel(sample) {
  return [${Object.values(layers)
    .map(e => '2.5 * sample.' + e)
    .join(',')}, sample.dataMask ];
}`,
    );

    return (
      <div id="story-image-download-panel">
        <EOB3ImageDownloadPanel
          channels={channels}
          presets={presets}
          evalscriptoverrides={null}
          effects={effects}
          evalSource={'S2'}
          instances={instances}
          aoiBounds={undefined}
          mapBounds={mapBounds}
          name={'Sentinel-2 L1C'}
          datasource={'Sentinel-2 L1C'}
          preset={'CUSTOM'}
          evalscript={evalscript}
          evalscripturl={null}
          atmFilter={undefined}
          layers={layers}
          time={'2019-12-22'}
          lat={41.9007}
          lng={12.50109}
          zoom={10}
          isLoggedIn={true}
          legendDataFromPreset={undefined}
          drawMapOverlays={drawMapOverlays}
          getLegendImageURL={getLegendImageURL}
          scaleBar={scaleBar}
          onErrorMessage={msg => setState({ errorMsg: msg })}
          authToken={authToken}
        />
      </div>
    );
  });

  stories.add('Sentinel-2 L1C Custom script (8A,3,2)', ({ state, setState }) => (
    <div id="story-image-download-panel">
      <EOB3ImageDownloadPanel
        channels={channels}
        presets={presets}
        evalscriptoverrides={null}
        effects={effects}
        evalSource={'S2'}
        instances={instances}
        aoiBounds={undefined}
        mapBounds={mapBounds}
        name={'Sentinel-2 L1C'}
        datasource={'Sentinel-2 L1C'}
        preset={'CUSTOM'}
        evalscript="Ly9WRVJTSU9OPTMKZnVuY3Rpb24gc2V0dXAoKSB7CiAgcmV0dXJuIHsKICAgIGlucHV0OiBbIkI4QSIsICJCMDMiLCAiQjAyIiwiZGF0YU1hc2siXSwKICAgIG91dHB1dDogeyBiYW5kczogMyB9CiAgfTsKfQoKZnVuY3Rpb24gZXZhbHVhdGVQaXhlbChzYW1wbGUpIHsKICByZXR1cm4gW3NhbXBsZS5COEEqMi41LHNhbXBsZS5CMDMqMi41LHNhbXBsZS5CMDIqMi41LHNhbXBsZS5kYXRhTWFza107Cn0="
        evalscripturl={null}
        atmFilter={undefined}
        layers={layers}
        time={'2019-12-22'}
        lat={41.9007}
        lng={12.50109}
        zoom={10}
        isLoggedIn={true}
        legendDataFromPreset={undefined}
        drawMapOverlays={drawMapOverlays}
        getLegendImageURL={getLegendImageURL}
        scaleBar={scaleBar}
        onErrorMessage={msg => setState({ errorMsg: msg })}
        authToken={authToken}
      />
    </div>
  ));

  stories.add('Sentinel-2 L1C Custom script url', ({ state, setState }) => (
    <div id="story-image-download-panel">
      <EOB3ImageDownloadPanel
        channels={channels}
        presets={presets}
        evalscriptoverrides={null}
        effects={effects}
        evalSource={'S2'}
        instances={instances}
        aoiBounds={undefined}
        mapBounds={mapBounds}
        name={'Sentinel-2 L1C'}
        datasource={'Sentinel-2 L1C'}
        preset={'CUSTOM'}
        evalscript="Ly9WRVJTSU9OPTMKZnVuY3Rpb24gc2V0dXAoKSB7CiAgcmV0dXJuIHsKICAgIGlucHV0OiBbIkI4QSIsICJCMDMiLCAiQjAyIiwiZGF0YU1hc2siXSwKICAgIG91dHB1dDogeyBiYW5kczogMyB9CiAgfTsKfQoKZnVuY3Rpb24gZXZhbHVhdGVQaXhlbChzYW1wbGUpIHsKICByZXR1cm4gW3NhbXBsZS5COEEqMi41LHNhbXBsZS5CMDMqMi41LHNhbXBsZS5CMDIqMi41LHNhbXBsZS5kYXRhTWFza107Cn0="
        evalscripturl="https://raw.githubusercontent.com/Ardweaden/Custom-scripts/master/script.js"
        atmFilter={undefined}
        layers={layers}
        time={'2019-12-22'}
        lat={41.9007}
        lng={12.50109}
        zoom={10}
        isLoggedIn={true}
        legendDataFromPreset={undefined}
        drawMapOverlays={drawMapOverlays}
        getLegendImageURL={getLegendImageURL}
        scaleBar={scaleBar}
        onErrorMessage={msg => setState({ errorMsg: msg })}
        authToken={authToken}
      />
    </div>
  ));

  stories.add('Data fusion: Sentinel-2 L1C and L2A', ({ state, setState }) => (
    <div id="story-image-download-panel">
      <EOB3ImageDownloadPanel
        channels={channels}
        presets={presets}
        evalscriptoverrides={null}
        effects={effects}
        evalSource={'S2'}
        instances={instances}
        aoiBounds={undefined}
        mapBounds={mapBounds}
        name={'Sentinel-2 L1C'}
        datasource={'Sentinel-2 L1C'}
        preset={'CUSTOM'}
        evalscript="Ly9WRVJTSU9OPTMKdmFyIHNldHVwID0gKCkgPT4gKHsKICBpbnB1dDogWwogICAge2RhdGFzb3VyY2U6ICJzMmwyYSIsIGJhbmRzOlsiQjAyIiwgIkIwMyIsICJCMDQiXSwgdW5pdHM6ICJSRUZMRUNUQU5DRSIsIG1vc2FpY2tpbmc6ICJPUkJJVCJ9LAogICAge2RhdGFzb3VyY2U6ICJzMmwxYyIsIGJhbmRzOlsiQjAyIiwgIkIwMyIsICJCMDQiXSwgdW5pdHM6ICJSRUZMRUNUQU5DRSJ9LAogIF0sCiAgb3V0cHV0OiBbCiAgICB7IGlkOiAiZGVmYXVsdCIsIGJhbmRzOiA0LCBzYW1wbGVUeXBlOiBTYW1wbGVUeXBlLkFVVE8gfSwKICBdLAp9KTsKCmZ1bmN0aW9uIGV2YWx1YXRlUGl4ZWwoc2FtcGxlcywgaW5wdXREYXRhLCBpbnB1dE1ldGFkYXRhLCBjdXN0b21EYXRhLCBvdXRwdXRNZXRhZGF0YSkgewogIHZhciBzYW1wbGUgPSBzYW1wbGVzLnMybDJhWzBdOwogIGlmICghc2FtcGxlKSB7CiAgICByZXR1cm4gewogICAgICBkZWZhdWx0OiBbMCwgMCwgMCwgMC41XSwKICAgIH07CiAgfQogIAogIGxldCB2YWwgPSBbc2FtcGxlLkIwNCwgc2FtcGxlLkIwMywgc2FtcGxlLkIwMiwgMV07CiAgcmV0dXJuIHsKICAgIGRlZmF1bHQ6IHZhbAogIH0KfQo="
        evalscripturl={null}
        dataFusion={{ enabled: true, supplementalDatasets: { AWS_S2L2A: { enabled: true } } }}
        atmFilter={undefined}
        layers={layers}
        time={'2019-12-22'}
        lat={41.9007}
        lng={12.50109}
        zoom={10}
        isLoggedIn={true}
        legendDataFromPreset={undefined}
        drawMapOverlays={drawMapOverlays}
        getLegendImageURL={getLegendImageURL}
        scaleBar={scaleBar}
        onErrorMessage={msg => setState({ errorMsg: msg })}
        authToken={authToken}
      />
    </div>
  ));

  stories.add('Data fusion: Sentinel-2 L1C and L2A - evalscripturl', ({ state, setState }) => (
    <div id="story-image-download-panel">
      <EOB3ImageDownloadPanel
        channels={channels}
        presets={presets}
        evalscriptoverrides={null}
        effects={effects}
        evalSource={'S2'}
        instances={instances}
        aoiBounds={undefined}
        mapBounds={mapBounds}
        name={'Sentinel-2 L1C'}
        datasource={'Sentinel-2 L1C'}
        preset={'CUSTOM'}
        evalscript={null}
        evalscripturl="https://gist.githubusercontent.com/sinergise-anze/33fe78d9b1fd24d656882d7916a83d4d/raw/295b9d9f033c7e3f1e533363322d84846808564c/data-fusion-evalscript.js"
        dataFusion={{ enabled: true, supplementalDatasets: { AWS_S2L2A: { enabled: true } } }}
        atmFilter={undefined}
        layers={layers}
        time={'2019-12-22'}
        lat={41.9007}
        lng={12.50109}
        zoom={10}
        isLoggedIn={true}
        legendDataFromPreset={undefined}
        drawMapOverlays={drawMapOverlays}
        getLegendImageURL={getLegendImageURL}
        scaleBar={scaleBar}
        onErrorMessage={msg => setState({ errorMsg: msg })}
        authToken={authToken}
      />
    </div>
  ));
});

const drawMapOverlays = (canvasWidth, canvasHeight) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
  ctx.fillRect(100, 100, 200, 200);
  ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
  ctx.fillRect(150, 150, 200, 200);
  ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
  ctx.fillRect(200, 50, 200, 200);
  return canvas;
};

const getLegendImageURL = async legendData => {
  return null;
};

const scaleBar = { text: '2 km', width: 70 };

const mapBounds = {
  _southWest: {
    lat: 41.279870545327114,
    lng: 11.523284912109375,
  },
  _northEast: {
    lat: 42.515638518736665,
    lng: 13.478851318359377,
  },
};

const mapBoundsXXL = {
  _southWest: {
    lat: 40,
    lng: 10,
  },
  _northEast: {
    lat: 50,
    lng: 20,
  },
};

const layers = {
  r: 'B01',
  g: 'B02',
  b: 'B03',
};

const instances = [
  {
    name: 'Sentinel-2 L1C',
    id: 'S2L1C',
    group: 'SENTINEL-2',
    evalsource: 'S2',
    baseUrls: {
      WMS: 'https://services.sentinel-hub.com/ogc/wms/aa5b38-YOUR-INSTANCEID-HERE',
      FIS: 'https://services.sentinel-hub.com/ogc/fis/cd2801-YOUR-INSTANCEID-HERE',
    },
    search: {
      tooltip: 'Global archive from 2016/07 onward',
      label: 'L1C',
      preselected: true,
      searchableByArea: true,
    },
    typename: 'S2.TILE',
    minDate: '2015-01-01',
    shortName: 'L1C',
    siblingDatasourceId: 'S2L2A',
    previewPrefix: 'https://roda.sentinel-hub.com/sentinel-s2-l1c',
    awsLink: 'http://sentinel-s2-l1c.s3-website.eu-central-1.amazonaws.com/',
    indexService: 'https://services.sentinel-hub.com/index/v3/collections/S2L1C/searchIndex',
    resolution: 10,
    minZoom: 5,
    maxZoom: 16,
    allowOverZoomBy: 2,
  },
];

const channels = {
  'Sentinel-2 L1C': [
    {
      name: 'B01',
      description: 'Band 1 - Coastal aerosol - 443 nm ',
      color: '#4c17e2',
    },
    {
      name: 'B02',
      description: 'Band 2 - Blue - 490 nm ',
      color: '#699aff',
    },
    {
      name: 'B03',
      description: 'Band 3 - Green - 560 nm ',
      color: '#a4d26f',
    },
    {
      name: 'B04',
      description: 'Band 4 - Red - 665 nm ',
      color: '#e47121',
    },
    {
      name: 'B05',
      description: 'Band 5 - Vegetation Red Edge - 705 nm',
      color: '#ba0a0a',
    },
    {
      name: 'B06',
      description: 'Band 6 - Vegetation Red Edge - 740 nm',
      color: '#cc1412',
    },
    {
      name: 'B07',
      description: 'Band 7 - Vegetation Red Edge - 783 nm',
      color: '#c00607',
    },
    {
      name: 'B08',
      description: 'Band 8 - NIR - 842 nm',
      color: '#c31e20',
    },
    {
      name: 'B09',
      description: 'Band 9 - Water vapour - 945 nm',
      color: '#b31a1b',
    },
    {
      name: 'B10',
      description: 'Band 10 - SWIR - Cirrus - 1375 nm',
      color: '#d71234',
    },
    {
      name: 'B11',
      description: 'Band 11 - SWIR - 1610 nm',
      color: '#990134',
    },
    {
      name: 'B12',
      description: 'Band 12 - SWIR - 2190 nm',
      color: '#800000',
    },
    {
      name: 'B8A',
      description: 'Band 8A - Vegetation Red Edge - 865 nm',
      color: '#bc0e10',
    },
  ],
};

const presets = {
  'Sentinel-2 L1C': [
    {
      id: '1_TRUE_COLOR',
      name: 'True color',
      description: 'Based on bands 4,3,2',
      dataset: 'S2L1C',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=1_TRUE_COLOR&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl: null,
    },
    {
      id: '2_FALSE_COLOR',
      name: 'False color',
      description: 'Based on bands 8,4,3',
      dataset: 'S2L1C',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=2_FALSE_COLOR&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl: null,
    },
    {
      id: '4-FALSE-COLOR-URBAN',
      name: 'False color (urban)',
      description: 'Based on bands 12,11,4',
      dataset: 'S2L1C',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=4-FALSE-COLOR-URBAN&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl: null,
    },
    {
      id: '3_NDVI',
      name: 'NDVI',
      description: 'Based on combination of bands (B8 - B4)/(B8 + B4)',
      dataset: 'S2L1C',
      legendUrl:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?request=GetLegendGraphic&service=WMS&layer=3_NDVI&style=default',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=3_NDVI&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?request=GetLegendGraphic&service=WMS&layer=3_NDVI&style=default&format=application/json',
    },
    {
      id: '5-MOISTURE-INDEX1',
      name: 'Moisture index',
      description: 'Based on combination of bands (B8A - B11)/(B8A + B11)',
      dataset: 'S2L1C',
      legendUrl:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?request=GetLegendGraphic&service=WMS&layer=5-MOISTURE-INDEX1&style=default',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=5-MOISTURE-INDEX1&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?request=GetLegendGraphic&service=WMS&layer=5-MOISTURE-INDEX1&style=default&format=application/json',
    },
    {
      id: '6-SWIR',
      name: 'SWIR',
      description: 'Based on bands 12,8A,4',
      dataset: 'S2L1C',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=6-SWIR&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl: null,
    },
    {
      id: '7-NDWI',
      name: 'NDWI',
      description: 'Based on combination of bands (B3 - B8)/(B3 + B8)',
      dataset: 'S2L1C',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=7-NDWI&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl: null,
    },
    {
      id: '8-NDSI',
      name: 'NDSI',
      description:
        'Based on combination of bands (B3 - B11)/(B3 + B11); values above 0.42 are regarded as snowy',
      dataset: 'S2L1C',
      legendUrl:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?request=GetLegendGraphic&service=WMS&layer=8-NDSI&style=default',
      image:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?showLogo=false&SERVICE=WMS&REQUEST=GetMap&LAYERS=8-NDSI&BBOX=-19482,6718451,-18718,6719216&MAXCC=10&WIDTH=40&HEIGHT=40&FORMAT=image/jpeg&bgcolor=00000000&transparent=1&TIME=2015-01-01/2019-12-24',
      legendDefinitionJsonUrl:
        'https://services.sentinel-hub.com/ogc/wms/cd2801-YOUR-INSTANCEID-HERE?request=GetLegendGraphic&service=WMS&layer=8-NDSI&style=default&format=application/json',
    },
  ],
};
