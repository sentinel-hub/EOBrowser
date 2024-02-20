import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import HelpTooltip from '../../SearchPanel/dataSourceHandlers/DatasourceRenderingComponents/HelpTooltip';

const sourceTypeLink =
  'https://developers.planet.com/docs/subscriptions/pvs-subs/#product-descriptions-and-identifiers';
const sourceIDLink =
  'https://developers.planet.com/docs/subscriptions/pvs-subs/#planetary-variables-types-and-ids';

const searchInputHelp = {
  type: () =>
    t`**Source Type** refers to the specific Planetary Variables (PV) product you can subscribe to: Biomass Proxy, Land Surface Temperature, Soil Water Content, Vegetation Optical Depth and Forest Carbon Dilligence. More info [here](${sourceTypeLink}).`,
  id: () =>
    t`**Source ID** is the unique identifier for the Planetary Variables (PV) data products derived from a naming convention that combines the product type and resolution. More info [here](${sourceIDLink}).`,
};

export const SearchInputTooltip = ({ inputId }) => {
  if (!searchInputHelp[inputId]) {
    return null;
  }

  return (
    <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
      <ReactMarkdown children={searchInputHelp[inputId]()} linkTarget="_blank" />
    </HelpTooltip>
  );
};
