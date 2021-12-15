import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const getMarkdown = () => t`
Through Norway’s International Climate & Forests Initiative, anyone can now access Planet’s high-resolution, analysis-ready mosaics of the world’s tropics in order to help reduce and reverse the loss of tropical forests, combat climate change, conserve biodiversity, and facilitate sustainable development
`;

const PlanetBasemapTooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
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
