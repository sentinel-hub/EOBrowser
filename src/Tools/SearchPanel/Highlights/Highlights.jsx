import React, { Component } from 'react';
import moment from 'moment';
import { t } from 'ttag';

import Highlight from './Highlight';
import { FATHOM_TRACK_EVENT_LIST } from '../../../const';
import store, { visualizationSlice, mainMapSlice, tabsSlice } from '../../../store';
import { getDataSourceHandler } from '../../SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { handleFathomTrackEvent, parsePosition } from '../../../utils';
import { NotificationPanel } from '../../../junk/NotificationPanel/NotificationPanel';
import { constructEffectsFromPinOrHighlight } from '../../../utils/effectsUtils';
import { setTerrainViewerFromPin } from '../../../TerrainViewer/TerrainViewer.utils';

import './Highlights.scss';

class Highlights extends Component {
  onPinSelect = async (pin, comparingPins, sharePins) => {
    const {
      zoom,
      lat,
      lng,
      fromTime,
      toTime,
      datasetId,
      visualizationUrl,
      layerId,
      evalscript,
      evalscripturl,
      dataFusion,
      terrainViewerSettings,
      title,
    } = pin;
    if (comparingPins || sharePins) {
      return;
    }

    const dataSourceHandler = getDataSourceHandler(datasetId);
    if (dataSourceHandler === null) {
      console.error('a valid dataset was not found for the clicked pin.');
      return;
    }

    const { lat: parsedLat, lng: parsedLng, zoom: parsedZoom } = parsePosition(lat, lng, zoom);
    store.dispatch(visualizationSlice.actions.reset());
    store.dispatch(
      mainMapSlice.actions.setPosition({
        lat: parsedLat,
        lng: parsedLng,
        zoom: parsedZoom,
      }),
    );

    let pinTimeFrom, pinTimeTo;

    if (dataSourceHandler.supportsTimeRange()) {
      pinTimeFrom = fromTime ? moment.utc(fromTime) : moment.utc(toTime).startOf('day');
      pinTimeTo = fromTime ? moment.utc(toTime) : moment.utc(toTime).endOf('day');
    } else {
      pinTimeTo = moment.utc(toTime);
    }

    let visualizationParams = {
      datasetId: datasetId,
      visualizationUrl: visualizationUrl,
      fromTime: pinTimeFrom,
      toTime: pinTimeTo,
      visibleOnMap: true,
      dataFusion: dataFusion,
    };

    if (evalscript || evalscripturl) {
      visualizationParams.evalscript = evalscript;
      visualizationParams.evalscripturl = evalscripturl;
      visualizationParams.customSelected = true;
    } else {
      visualizationParams.layerId = layerId;
    }

    const effects = constructEffectsFromPinOrHighlight(pin);
    visualizationParams = { ...visualizationParams, ...effects };

    store.dispatch(visualizationSlice.actions.setVisualizationParams(visualizationParams));
    this.props.setSelectedHighlight(this.props.item);
    store.dispatch(tabsSlice.actions.setTabIndex(2));

    setTerrainViewerFromPin({
      lat: parsedLat,
      lng: parsedLng,
      zoom: parsedZoom,
      terrainViewerSettings: terrainViewerSettings,
      is3D: this.props.is3D,
      terrainViewerId: this.props.terrainViewerId,
    });

    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.HIGHLIGHT_OPTION_SELECTED, title);
  };

  render() {
    const { highlights, isThemeSelected, is3D } = this.props;
    const noHighlightsInThemeMsg = t`This theme has no highlights.`;
    const noThemeSelected = t`Please select a theme.`;

    return (
      <div className="highlights-panel">
        {!isThemeSelected && (
          <div className="highlights-notifications">
            <NotificationPanel type="info" msg={noThemeSelected} />
          </div>
        )}

        {isThemeSelected && !highlights.length && (
          <div className="highlights-notifications">
            <NotificationPanel type="info" msg={noHighlightsInThemeMsg} />
          </div>
        )}
        <div className="highlights-container">
          {highlights.map((pin, index) => (
            <Highlight
              pin={pin}
              key={`${index}-${pin.title}-${pin._id}`}
              index={index}
              onSelect={() => this.onPinSelect(pin)}
              canAddToCompare={!is3D}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default Highlights;
