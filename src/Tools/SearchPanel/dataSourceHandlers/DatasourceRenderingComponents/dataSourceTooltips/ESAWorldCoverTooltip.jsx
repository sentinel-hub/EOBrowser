import { t } from 'ttag';
import ReactMarkdown from 'react-markdown';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const WorldCoverMarkdown = () => t`
The **ESA WorldCover** product is the first global land cover map at 10 m resolution based on both Sentinel-1 and Sentinel-2 data. More information [here](https://esa-worldcover.org/).

**Coverage**: Global coverage.

**Data Availability**: 2020.

**Spatial resolution**: 10 meters.

**Common Usage**: Development of novel services to help with preserving biodiversity, food security, carbon assessment and climate modelling.
`;

const WorldCoverTooltip = () => (
  <div>
    <div className="data-source-group-tooltip-description">
      <ReactMarkdown children={WorldCoverMarkdown()} linkTarget="_blank" />
    </div>
    <div className="data-source-group-tooltip-credits">
      <div>{t`Credits:`}</div>
      <div>
        <ExternalLink href="https://esa-worldcover.org/">ESA</ExternalLink>
      </div>
    </div>
  </div>
);

export { WorldCoverTooltip };
