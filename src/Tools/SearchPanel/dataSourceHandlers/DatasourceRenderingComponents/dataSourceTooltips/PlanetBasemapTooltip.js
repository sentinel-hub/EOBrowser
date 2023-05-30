import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const getMarkdown = () => t`
Through the **NICFI** (Norway’s International Climate & Forests Initiative) Satellite Data Program, anyone can access 
Planet’s high-resolution, analysis-ready mosaics of the world’s tropics in order to support reducing and reversing the 
loss of tropical forests, combating climate change, conserving biodiversity, contributing to forest regrowth, restoration 
and enhancement, and facilitating sustainable development. You can view, download and stream access by signing up for the 
NICFI Satellite Data Program [here](http://www.planet.com/nicfi).

**Spatial resolution:** < 5 metres.

**Data availability:** Global tropical regions, September 2015 - August 2020 biannually, from September 2020 monthly.

**Common usage:** Forest management, urban growth monitoring, biodiversity conservation.
`;

const PlanetBasemapTooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} linkTarget="_blank" />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href="https://www.planet.com/nicfi/">Planet NICFI</ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default PlanetBasemapTooltip;
