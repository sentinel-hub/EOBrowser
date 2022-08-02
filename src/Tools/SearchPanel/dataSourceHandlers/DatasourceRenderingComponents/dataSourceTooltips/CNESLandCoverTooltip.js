import { t } from 'ttag';
import ReactMarkdown from 'react-markdown';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';

const CNESLandCoverMarkdown = () => t`
The **CNES Land Cover Map** (Occupation des Sols, OSO) produces land classification for Metropolitan France at 10 m spatial resolution based on Sentinel-2 L2A data within the Theia Land Cover CES framework. Maps for 2020, 2019, and 2018 use a 23-categories nomenclature. For earlier maps in 2017 and 2016, a fully compatible 17-classes nomenclature is employed. More information [here](https://collections.sentinel-hub.com/cnes-land-cover-map/).

**Coverage**: Metropolitan France

**Data Availability**: 2016 - ongoing

**Spatial resolution**: 10 meters
`;

const CNESLandCoverTooltip = () => (
  <div>
    <div className="data-source-group-tooltip-description">
      <ReactMarkdown source={CNESLandCoverMarkdown()} />
    </div>
    <div className="data-source-group-tooltip-credits">
      <div>{t`Credits:`}</div>
      <div>
        <ExternalLink href="https://www.theia-land.fr/en/product/land-cover-map/">Theia</ExternalLink>,{' '}
        <ExternalLink href="https://www.cesbio.cnrs.fr/">CESBIO</ExternalLink>
      </div>
    </div>
  </div>
);

export { CNESLandCoverTooltip };
