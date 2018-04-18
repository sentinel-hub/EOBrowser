import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import Store from '../../store';
import { calcBboxFromXY, getCoordsFromBounds } from '../../utils/coords';
import copernicus from '../../assets/copernicus.png';
import SHlogo from '../../assets/shLogo.png';

const http = axios.create({
  timeout: 30000,
  responseType: 'blob',
  adapter: cacheAdapterEnhancer(axios.defaults.adapter, true)
});

const canvas = document.createElement('canvas');

export async function queryDates({ from, to }, maxCount, maxCC) {
  const { mapBounds, selectedResult: { dateService } } = Store.current;
  let boundsGeojson = {
    type: 'Polygon',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::4326'
      }
    },
    coordinates: [getCoordsFromBounds(mapBounds)]
  };
  let fromDate = new Date(from);
  let toDate = new Date(to);
  const payload = {
    queryArea: boundsGeojson,
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    maxCloudCoverage: maxCC / 100
    //  "datasetParameters": < json object, dependant on dataset, currently only used by sentinel 1>
  };
  try {
    const { data } = await axios.post(dateService, payload);
    return data.slice(0, maxCount);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function getActiveInstance(name) {
  return Store.current.instances.find(inst => inst.name === name) || {};
}

export function getCurrentBboxUrl() {
  const {
    lat,
    lng,
    zoom,
    size,
    isEvalUrl,
    selectedResult: {
      name,
      preset,
      layers,
      evalscript,
      evalscripturl,
      gain,
      gamma,
      atmFilter
    }
  } = Store.current;
  const widthOrHeight = Math.min(size[0], size[1]);

  const { baseUrl } = getActiveInstance(name);
  return `${baseUrl}?SERVICE=WMS&REQUEST=GetMap&width=512&height=512&layers=${
    preset === 'CUSTOM' ? layers.r : preset
  }&evalscript=${
    preset !== 'CUSTOM'
      ? ''
      : isEvalUrl ? '' : window.encodeURIComponent(evalscript)
  }&evalscripturl=${isEvalUrl ? evalscripturl : ''}&gain=${
    gain ? gain : ''
  }&gamma=${gamma ? gamma : ''}&atmfilter=${
    atmFilter ? atmFilter : ''
  }&bbox=${calcBboxFromXY({
    lat,
    lng,
    zoom,
    width: widthOrHeight,
    height: widthOrHeight
  })}&CRS=EPSG%3A3857&MAXCC=100&FORMAT=image/jpeg`;
}

export function fetchBlobObjs(imgUrlArr) {
  const promises = imgUrlArr.map(img =>
    http
      .get(img.url, { date: img.date })
      .then(res => {
        if (res.status === 200) {
          return decorateBlob(res.config.date, res.data);
        }
      })
      .catch(err => {
        return {
          uri: err.config.url,
          date: err.config.date,
          success: false
        };
      })
  );

  return Promise.all(promises);
}

function decorateBlob(date, blob) {
  const height = 512;
  const width = 512;
  return new Promise((resolve, reject) => {
    const mainImg = new Image();
    const sh = new Image();
    sh.crossOrigin = '';
    const cpImg = new Image();
    cpImg.crossOrigin = '';
    mainImg.crossOrigin = '';
    canvas.width = width;
    canvas.height = height;
    mainImg.onload = () => {
      try {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(mainImg, 0, 0);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        const dateSize = ctx.measureText(date);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const rightLeftPadding = 5;
        ctx.fillRect(
          canvas.width - dateSize.width - rightLeftPadding * 2,
          0,
          dateSize.width + rightLeftPadding * 4,
          parseInt(ctx.font, 10) + 10
        );
        ctx.textAlign = 'left';
        ctx.fillStyle = '#eee';
        ctx.fillText(
          date,
          canvas.width - dateSize.width - rightLeftPadding,
          16
        );
        //scale
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, canvas.height - 25);
        ctx.lineTo(10, canvas.height - 15);
        ctx.font = '11px Arial';
        const scaleBar = document.querySelector('.leaflet-control-scale-line');
        const scale = scaleBar.offsetWidth; //* width / window.innerWidth;
        ctx.lineTo(scale + 10, canvas.height - 15);
        ctx.lineTo(scale + 10, canvas.height - 25);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.fillText(scaleBar.innerHTML, scale / 2 + 10, canvas.height - 20);

        //sentinel hub logo
        ctx.drawImage(
          sh,
          canvas.width - 120,
          canvas.height - 30,
          sh.width * 0.8,
          sh.height * 0.8
        );

        //copernicus logo
        ctx.drawImage(
          cpImg,
          canvas.width - 220,
          canvas.height - 35,
          cpImg.width * 0.8,
          cpImg.height * 0.8
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(mainImg.src);
        resolve({
          objectUrl: dataUrl,
          date: date,
          success: true
        });
      } catch (e) {
        reject('Error generating image');
      }
    };

    mainImg.onerror = err => {
      reject(err);
    };
    mainImg.src = URL.createObjectURL(blob);
    sh.src = SHlogo;
    cpImg.src = copernicus;
  });
}
