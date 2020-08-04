import axios from 'axios';

//draw image blob on canvas
export async function applyBlobToCanvas(context, canvasWidth, canvasHeight, imgBlob) {
  let imgObjectUrl;
  try {
    imgObjectUrl = window.URL.createObjectURL(imgBlob);
    const img = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imgObjectUrl;
    });
    context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
  } finally {
    if (imgObjectUrl) {
      window.URL.revokeObjectURL(imgObjectUrl);
    }
  }
}

//call wms and return blob
async function getOverlayImageBlob(width, height, bbox, overlayLayer) {
  const layerParams = overlayLayer(width, height, bbox);
  const res = await axios.get(layerParams.url, {
    responseType: 'blob',
    params: layerParams.params,
  });
  return new Blob([res.data], { type: 'image/jpeg' });
}

//draw all layers defined in overlayLayers over original image imgBlob
export async function addOverlays(
  imgBlob,
  width,
  height,
  bbox,
  overlayLayers,
  timelapseWidth,
  timelapseHeight,
) {
  try {
    //draw original image on canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = timelapseWidth;
    canvas.height = timelapseHeight;
    await applyBlobToCanvas(context, timelapseWidth, timelapseHeight, imgBlob);

    //get overlay images
    const overlayImages = [];
    await Promise.all(
      overlayLayers.map(async overlayLayer => {
        const overlayImageBlob = await getOverlayImageBlob(width, height, bbox, overlayLayer);
        overlayImages.push({
          idx: overlayLayer.idx,
          imgBlob: overlayImageBlob,
        });
      }),
    );

    //sort images and draw them on canvas
    await Promise.all(
      overlayImages
        .sort((a, b) => a.sortIndex - b.sortIndex)
        .map(async image => await applyBlobToCanvas(context, timelapseWidth, timelapseHeight, image.imgBlob)),
    );

    //export canvas back to blob
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/jpeg');
    });

    return blob;
  } catch (e) {
    //if something goes wrong just return original image
    console.error(e);
    return imgBlob;
  }
}
