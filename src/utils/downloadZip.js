import JSZip from 'jszip';
import JSZipUtils from 'jszip-utils';
import FileSaver from 'file-saver';
import copernicus from '../assets/copernicus.png';
import SHlogo from '../assets/shLogo.png';
import Store from '../store';
import { getMapDOMSize } from './coords';

const canvas = document.createElement('canvas');

export function createCanvasBlob(obj) {
  const { width, height, url, title } = obj;
  const { imageFormat } = Store.current;
  return new Promise((resolve, reject) => {
    var mainImg = document.createElement('img');
    var sh = document.createElement('img');
    sh.crossOrigin = 'Anonymous';
    sh.src = SHlogo;
    var cpImg = document.createElement('img');
    cpImg.src = copernicus;
    cpImg.crossOrigin = 'Anonymous';
    mainImg.crossOrigin = 'Anonymous';
    mainImg.src = url;
    canvas.width = width;
    canvas.height = height;
    mainImg.onload = () => {
      try {
        const ctx = canvas.getContext('2d');
        ctx.drawImage(mainImg, 0, 0);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        const titleSize = ctx.measureText(title);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, titleSize.width + 10, parseInt(ctx.font, 10) + 10);
        ctx.fillStyle = '#fff';
        ctx.fillText(title, 5, 16);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, canvas.height - 40);
        ctx.lineTo(10, canvas.height - 20);
        ctx.font = '11px Arial';
        const scaleBar = document.querySelector('.leaflet-control-scale-line');
        const mapDOMSize = getMapDOMSize();
        const scale = scaleBar.offsetWidth * width / mapDOMSize.width;
        ctx.lineTo(scale + 10, canvas.height - 20);
        ctx.lineTo(scale + 10, canvas.height - 40);
        ctx.stroke();
        ctx.fillText(scaleBar.innerHTML, 20, canvas.height - 30);
        ctx.drawImage(sh, canvas.width - 140, canvas.height - 40);
        ctx.drawImage(cpImg, canvas.width - 240, canvas.height - 45);
        const dataurl = canvas.toDataURL(imageFormat);
        const urlBlob = dataURLtoBlob(dataurl);
        resolve(urlBlob);
      } catch (e) {
        reject('Error generating image');
      }
    };
    mainImg.onerror = err => {
      reject(err);
    };
  });
}
function getImgObject(customObject = {}) {
  const { name, time, datasource } = Store.current.selectedResult;
  const preset = customObject.preset || Store.current.selectedResult.preset;
  const { imageW, imageH, imgWmsUrl, imageExt, presets } = Store.current;

  const { name: cName, preset: cPreset, time: cTime, url: cUrl } = customObject;
  const presetName = presets[datasource].find(p => p.id === (cPreset || preset));
  const title = `${cName || name}, ${presetName ? presetName.name : cPreset || preset} on ${cTime || time}`;
  // use custom object or default for rendering image
  return {
    url: cUrl || imgWmsUrl,
    title,
    width: imageW,
    height: imageH,
    imageExt,
  };
}
export async function downloadCanvas(customObj) {
  return new Promise((resolve, reject) => {
    const obj = getImgObject(customObj);
    createCanvasBlob(obj)
      .then(blob => {
        let element = document.createElement('a');
        element.setAttribute('href', URL.createObjectURL(blob));
        element.setAttribute('download', `${obj.title}.${obj.imageExt}`);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        let clickHandler;
        element.addEventListener(
          'click',
          (clickHandler = function() {
            // ..and to wait a frame
            requestAnimationFrame(function() {
              URL.revokeObjectURL(element.href);
            });

            element.removeAttribute('href');
            element.removeEventListener('click', clickHandler);
          }),
        );
        document.body.removeChild(element);
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}
function dataURLtoBlob(dataurl) {
  var parts = dataurl.split(','),
    mime = parts[0].match(/:(.*?);/)[1];
  if (parts[0].indexOf('base64') !== -1) {
    var bstr = atob(parts[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  } else {
    var raw = decodeURIComponent(parts[1]);
    return new Blob([raw], { type: mime });
  }
}
export function downloadOne(layerUrl) {
  return new Promise((resolve, reject) => {
    const { imageExt } = Store.current;
    const { preset, src } = layerUrl[0];
    if (['png', 'jpg'].includes(imageExt)) {
      downloadCanvas({ url: src, preset })
        .then(blob => {
          resolve();
        })
        .catch(err => {
          reject(`Could not download files: ${err.message}`);
        });
    }
  });
}
export function downloadZipIt(layerUrls) {
  const zip = new JSZip();
  let count = 0;
  const { imageExt } = Store.current;
  const zipFilename = 'EO_Browser_images.zip';
  return new Promise((resolve, reject) => {
    layerUrls.forEach((layer, index) => {
      //new
      const { preset, src } = layer;
      if (['png', 'jpg'].includes(imageExt)) {
        const defaultObj = getImgObject({ url: src, preset });
        createCanvasBlob(defaultObj).then(blob => {
          zip.file(`${defaultObj.title}.${defaultObj.imageExt}`, blob, {
            binary: true,
          });
          count++;
          if (count === layerUrls.length) {
            zip
              .generateAsync({ type: 'blob' })
              .then(content => {
                FileSaver.saveAs(content, zipFilename);
                resolve();
              })
              .catch(err => {
                reject(`Could not ZIP files: ${err.message}`);
              });
          }
        });
      } else {
        JSZipUtils.getBinaryContent(src, (err, data) => {
          if (err) {
            reject(`There was a problem downloading image`);
            //  throw err; // or handle the error
          }
          if (!err) {
            const defaultObj = getImgObject({ url: src, preset });
            zip.file(`${defaultObj.title}.${imageExt}`, data, {
              binary: true,
            });
            count++;
            if (count === layerUrls.length) {
              zip
                .generateAsync({ type: 'blob' })
                .then(content => {
                  FileSaver.saveAs(content, zipFilename);
                  resolve('yay');
                })
                .catch(err => {
                  reject(`Could not ZIP files: ${err.message}`);
                });
            }
          }
        });
      }

      // loading a file and add it in a zip file
    });
  });
}
