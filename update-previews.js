import axios from 'axios';
import moment from 'moment';
import {
  BBox,
  LayersFactory,
  CRS_EPSG4326,
  ApiType,
  MimeTypes,
  requestAuthToken,
  setAuthToken,
  setDebugEnabled,
  DATASET_S5PL2,
} from '@sentinel-hub/sentinelhub-js';
import { DEFAULT_THEMES } from './src/assets/default_themes';
import { EDUCATION_THEMES } from './src/assets/education_themes'
import { filterLayers } from './src/Tools/SearchPanel/dataSourceHandlers/filter';
import md5 from './src/utils/md5';
import dotenv from 'dotenv';
const fs = require('fs');

dotenv.config({ path: './.env' });

const SHADOW_LAYERS_START = '__';

const BBOX_SIZE = 0.03;
const interestingBBoxes = [
  new BBox(CRS_EPSG4326, 15, 45.95, 15 + BBOX_SIZE, 45.95 + BBOX_SIZE),
  new BBox(CRS_EPSG4326, -69, 66.9, -69 + BBOX_SIZE, 66.9 + BBOX_SIZE), // S-1 GRD EW
  new BBox(CRS_EPSG4326, -62, -58.6, -62 + BBOX_SIZE, -58.6 + BBOX_SIZE), // S-1 GRD EW HH
  new BBox(CRS_EPSG4326, 123, 10.5, 123 + BBOX_SIZE, 10.5 + BBOX_SIZE), // S-1 GRD IW VV
];
const forceBBoxForDataset = {
  [DATASET_S5PL2.id]: new BBox(CRS_EPSG4326, 4, 47.5, 4.4, 47.9), // CH4
};
const globalMinDate = new Date(Date.UTC(1980, 1 - 1, 1));
const now = new Date(Date.UTC(2020, 4 - 1, 1, 0, 0, 0));

async function setAuthTokenWithOAuthCredentials() {
  if (!process.env.UPDATE_PREVIEWS_CLIENT_ID || !process.env.UPDATE_PREVIEWS_CLIENT_SECRET) {
    throw new Error('Env vars UPDATE_PREVIEWS_CLIENT_ID and UPDATE_PREVIEWS_CLIENT_SECRET are not set');
  }

  const clientId = process.env.UPDATE_PREVIEWS_CLIENT_ID;
  const clientSecret = process.env.UPDATE_PREVIEWS_CLIENT_SECRET;
  console.log('Requesting auth token with client id from env vars:', clientId);

  const authToken = await requestAuthToken(clientId, clientSecret);
  setAuthToken(authToken);
  console.log('Auth token set.');
}

async function findSomeResults(layer, nResults = 20) {
  const minDateDataset = layer.dataset && layer.dataset.minDate ? layer.dataset.minDate : globalMinDate;
  const maxDate = layer.dataset && layer.dataset.maxDate ? layer.dataset.maxDate : now;
  const minDate = moment.max(minDateDataset, moment.utc(maxDate).subtract(20, 'year'));
  const results = [];
  const bboxes =
    layer.dataset && forceBBoxForDataset[layer.dataset.id]
      ? [forceBBoxForDataset[layer.dataset.id]]
      : interestingBBoxes;
  for (let bbox of bboxes) {
    try {
      const tiles = await layer.findTiles(bbox, minDate, maxDate, 1, 0);
      if (tiles.tiles.length === 0) {
        // nothing found in this bbox, try next:
        continue;
      }
      for (let i = 0; i < tiles.tiles.length && i < nResults; i++) {
        results.push({
          bbox: bbox,
          fromTime: moment.utc(tiles.tiles[i].sensingTime).startOf('day'),
          toTime: moment.utc(tiles.tiles[i].sensingTime).endOf('day'),
        });
      }
      return results;
    } catch (ex) {
      console.warn(ex);
      const dates = await layer.findDatesUTC(bbox, minDate, maxDate);
      if (dates.length === 0) {
        continue;
      }
      for (let i = 1; i < dates.length && i < nResults; i++) {
        results.push({
          bbox: bbox,
          fromTime: moment.utc(dates[i]),
          toTime: moment.utc(dates[i]).add(1, 'day'),
        });
      }
      return results;
    }
  }
  return [];
}

async function updatePreviews(previewsDir, previewsIndexFile) {
  await setAuthTokenWithOAuthCredentials();

  if (!fs.existsSync(previewsDir)) {
    fs.mkdirSync(previewsDir);
  }

  // fetch new previews:
  let previews = [];

  for (let themes of [ DEFAULT_THEMES, EDUCATION_THEMES ]) {
    for (let theme of themes) {
      const themeId = theme.id;
      for (let contentPart of theme.content) {
        // we don't want to download previews for all of the GIBS layers, for now simply skip it:
        if (contentPart.url.includes('gibs.earthdata.nasa.gov')) {
          console.warn('Temporarily skipping GIBS layers - missing filtering information');
          continue;
        }

        const layers = await LayersFactory.makeLayers(contentPart.url, layerId =>
          filterLayers(layerId, contentPart.layersExclude, contentPart.layersInclude),
        );
        if (!layers) {
          console.warn(`No layers for url: ${contentPart.url}`);
          continue;
        }

        // We need something that will help us save previews for the layers with the same name but from different datasets.
        // Ideally, we can use the first few chars of instanceId, otherwise we need to calculate the hash from the URL:
        const urlHash = layers[0].instanceId
          ? layers[0].instanceId.substr(0, 6)
          : md5(contentPart.url).substr(0, 8);

        // We assume that all the layers within the same group will be able to use the same bbox and time from/to:
        const candidates = await findSomeResults(layers[0]);
        if (candidates.length === 0) {
          throw new Error(`No results in the pre-defined areas for: ${contentPart.url} (${contentPart.name})`);
        }

        // for each layer, download its image:
        setDebugEnabled(true);
        for (let layer of layers) {
          const fileName = `${themeId}-${urlHash}-${layer.layerId}.png`;
          const fullFileName = `${previewsDir}/${fileName}`;
          console.log(
            `Working on: ${themeId} / ${contentPart.url} / ${layer.layerId} (${layer.constructor.name}) / ${fileName}`,
          );

          if (fs.existsSync(fullFileName)) {
            console.log('  ...exists, skipping.');
            previews.push(fileName);
            continue;
          }

          const apiType = layer.supportsApiType(ApiType.PROCESSING) ? ApiType.PROCESSING : ApiType.WMS;
          let j;
          for (j = 0; j < candidates.length; j++) {
            const { bbox, fromTime, toTime } = candidates[j];

            const getMapParams = {
              bbox: bbox,
              fromTime: fromTime,
              toTime: toTime,
              width: 50,
              height: 50,
              format: MimeTypes.PNG,
            };
            try {
              const imageBytes = await layer.getMap(getMapParams, apiType);
              fs.writeFileSync(fullFileName, imageBytes);
              // sometimes even the valid dates return transparent images, let's remove them:
              const fileSizeInBytes = fs.statSync(fullFileName).size;
              if (fileSizeInBytes < 200) {
                // exceptions which simply produce small images:
                if (!['TESTING-LAYER', '3-NDVI', 'FALSE_COLOR', 'RED_EDGE_1', 'RED_EDGE_2'].includes(layer.layerId)) {
                  fs.unlinkSync(fullFileName);
                  console.log(`  ...image was empty (size ${fileSizeInBytes}), skipping...`)
                  continue;
                }
              }
              previews.push(fileName);
              console.log('  ...ok.');
              break;
            } catch (err) {
              if (j === candidates.length - 1) {
                console.log('  ...FAILED!');
                throw(err);
              }
              console.log('  ...failed, retrying with another date...', err);
              continue;
            }
          }
          if (j === candidates.length) {
            console.log('  ...FAILED!');
            throw new Error("No image found!");
          }
        }
        setDebugEnabled(false);
      }
    }
  }

  // write an index file so we know (in Playground app) which files exist:
  fs.writeFileSync(previewsIndexFile, JSON.stringify(previews, null, 2));
}

updatePreviews('./public/previews', './src/previews.json')
  .then(() => console.log('DONE.'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
