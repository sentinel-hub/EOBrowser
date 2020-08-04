import React from 'react';
import Timelapse from '../Controls/Timelapse/Timelapse';
import ImgDownload from '../Controls/ImgDownload/ImgDownload';
import FIS from '../Controls/FIS/FIS';
import PinsStoryBuilder from '../Controls/PinsStoryBuilder/PinsStoryBuilder';
import SharePinsLink from '../Tools/Pins/SharePinsLink';

export const ModalId = {
  IMG_DOWNLOAD: 'ImgDownload',
  TIMELAPSE: 'Timelapse',
  FIS: 'FIS',
  SHAREPINSLINK: 'SharePinsLink',
  PINS_STORY_BUILDER: 'PinsStoryBuilder',
};

export const Modals = {
  [ModalId.IMG_DOWNLOAD]: <ImgDownload />,
  [ModalId.TIMELAPSE]: <Timelapse />,
  [ModalId.FIS]: <FIS />,
  [ModalId.SHAREPINSLINK]: <SharePinsLink />,
  [ModalId.PINS_STORY_BUILDER]: <PinsStoryBuilder />,
};
