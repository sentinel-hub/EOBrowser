import React from 'react';
import { t } from 'ttag';

import { DraggableBand } from './DraggableBand';
import { DraggableBandGhost } from './DraggableBandGhost';

import 'react-dragula/dist/dragula.min.css';
import './BandsToRGB.scss';
import { SelectedBand } from './SelectedBand';

// value = { r:'B01', g:'B02', b: 'B03' }
export const BandsToRGB = ({ bands, value, onChange, areBandsClasses }) => {
  if (!bands) {
    return null;
  }

  return (
    <React.Fragment>
      <p>{areBandsClasses ? t`Drag classes onto RGB fields.` : t`Drag bands onto RGB fields.`}</p>
      <div className="colors-container">
        {bands.map((band, i) => (
          <DraggableBand key={i} band={band} value={value} onChange={onChange} />
        ))}
        <DraggableBandGhost bands={bands} />
      </div>
      <div className="colors-output">
        {['r', 'g', 'b'].map((bandName, i) => (
          <SelectedBand key={i} bands={bands} value={value} bandName={bandName} showName />
        ))}
      </div>
    </React.Fragment>
  );
};
