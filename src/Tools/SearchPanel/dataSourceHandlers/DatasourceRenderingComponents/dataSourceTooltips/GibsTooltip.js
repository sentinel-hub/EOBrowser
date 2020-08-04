import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const getMarkdown = () => t`
**GIBS** (Global Imagery Browse Services) provides quick access to over 600 satellite imagery
products, covering every part of the world. Most imagery is available within a few hours after
satellite overpass, some products span almost 30 years.
`;

const GibsTooltip = () => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs">
            NASA
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

export default GibsTooltip;
