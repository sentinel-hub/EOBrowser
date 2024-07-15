import React from 'react';
import { connect } from 'react-redux';
import Slider, { Range } from 'rc-slider';
import { t } from 'ttag';

import store, { mainMapSlice, compareLayersSlice } from '../../store';
import { parsePosition } from '../../utils';
import { COMPARE_SPLIT, COMPARE_OPACITY } from './compareConstants';
import PinPreviewImage from '../Pins/PinPreviewImage';
import { constructTimespanString } from '../Pins/Pin.utils';
import { useDragPin } from '../Pins/useDragPin';

const ComparedLayer = ({ layer, compareMode, opacity, clipping, index, onDrop }) => {
  const { ref, previewRef, isDragging } = useDragPin({
    id: layer.id,
    index: index,
    itemType: 'COMPARED_LAYER',
    moveItem: onDrop,
  });

  function zoomToPin() {
    const { zoom, lat, lng } = layer;
    const { lat: parsedLat, lng: parsedLng, zoom: parsedZoom } = parsePosition(lat, lng, zoom);
    store.dispatch(
      mainMapSlice.actions.setPosition({
        lat: parsedLat,
        lng: parsedLng,
        zoom: parsedZoom,
      }),
    );
  }

  function onChange(e) {
    if (compareMode === 'opacity') {
      store.dispatch(compareLayersSlice.actions.updateOpacity({ index: index, value: e }));
    } else {
      store.dispatch(compareLayersSlice.actions.updateClipping({ index: index, value: e }));
    }
  }

  function removeLayer() {
    store.dispatch(compareLayersSlice.actions.removeFromCompare(index));
  }

  const { title, lat, lng, zoom } = layer;
  return (
    <div ref={previewRef} className={`compare-layer normal-mode ${isDragging ? 'dragging' : ''}`} id={index}>
      <div className="order-layers">
        <div className="compare-drag-handler" ref={ref}>
          <i className="fa fa-ellipsis-v compare-drag-handler-icon" />
          <i className="fa fa-ellipsis-v compare-drag-handler-icon" />
        </div>
      </div>
      <div className="compare-layer-content">
        <PinPreviewImage pin={layer} />
        <div className="compare-layer-info">
          <span>{title}</span>
          <div>
            <label>{t`Date`}:</label> <span className="pin-date">{constructTimespanString(layer)}</span>
          </div>
          <div>
            <label>{t`Lat/Lon`}:</label> {parseFloat(lat).toFixed(2)}, {parseFloat(lng).toFixed(2)} |{' '}
            <label>{t`Zoom`}:</label> {zoom}
          </div>
        </div>
      </div>
      <div className="compare-layer-actions">
        <div
          className="zoom-to-layer"
          title={t`Zoom to location`}
          onClick={(e) => {
            e.stopPropagation();
            zoomToPin();
          }}
        >
          <i className="fa fa-crosshairs" />
        </div>
        <div
          className="remove-layer"
          onClick={(e) => {
            e.stopPropagation();
            removeLayer();
          }}
          title={t`Remove layer`}
        >
          <i className="fa fa-trash" />
        </div>
      </div>
      {compareMode === COMPARE_OPACITY && (
        <div className="compare-panel-slider opacity">
          <label>{t`Opacity`}:</label>
          <Slider min={0} max={1} step={0.01} value={opacity != null ? opacity : 1.0} onChange={onChange} />
          <span>{opacity != null ? opacity : 1.0}</span>
        </div>
      )}
      {compareMode === COMPARE_SPLIT && (
        <div className="compare-panel-slider split">
          <label>{t`Split position`}:</label>
          <Range min={0} max={1} step={0.01} value={clipping ? clipping : [0, 1]} onChange={onChange} />
        </div>
      )}
    </div>
  );
};

const mapStoreToProps = (store) => ({
  anonToken: store.auth.anonToken,
  authToken: store.auth.user.access_token,
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(ComparedLayer);
