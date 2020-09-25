import React from 'react';
import Timelapse from '../Controls/Timelapse/Timelapse';
import ImageDownload from '../Controls/ImgDownload/ImageDownload';
import FIS from '../Controls/FIS/FIS';
import PinsStoryBuilder from '../Controls/PinsStoryBuilder/PinsStoryBuilder';
import SharePinsLink from '../Tools/Pins/SharePinsLink';
import TerrainViewer from '../TerrainViewer/TerrainViewer';

export const ModalId = {
  IMG_DOWNLOAD: 'ImgDownload',
  TIMELAPSE: 'Timelapse',
  FIS: 'FIS',
  SHAREPINSLINK: 'SharePinsLink',
  PINS_STORY_BUILDER: 'PinsStoryBuilder',
  TERRAIN_VIEWER: 'TerrainViewer',
};

export const Modals = {
  [ModalId.IMG_DOWNLOAD]: <ImageDownload />,
  [ModalId.TIMELAPSE]: <Timelapse />,
  [ModalId.FIS]: <FIS />,
  [ModalId.SHAREPINSLINK]: <SharePinsLink />,
  [ModalId.PINS_STORY_BUILDER]: <PinsStoryBuilder />,
  [ModalId.TERRAIN_VIEWER]: <TerrainViewer />,
};
