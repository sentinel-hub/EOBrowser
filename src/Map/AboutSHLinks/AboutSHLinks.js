import React from 'react';
import './AboutSHLinks.scss';
import { t } from 'ttag';

import ExternalLink from '../../ExternalLink/ExternalLink';

export default class AboutSHLinks extends React.Component {
  render() {
    return (
      <div id="about-sh-links">
        <ExternalLink href="https://www.sentinel-hub.com/apps/eo_browser">{t`About EO Browser`}</ExternalLink>
        <ExternalLink href="https://forum.sentinel-hub.com/">{t`Contact us`}</ExternalLink>
        <ExternalLink href="https://www.sentinel-hub.com/apps/wms">{t`Get data`}</ExternalLink>
      </div>
    );
  }
}
