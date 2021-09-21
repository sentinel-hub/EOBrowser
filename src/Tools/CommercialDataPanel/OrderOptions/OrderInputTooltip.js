import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import HelpTooltip from '../../SearchPanel/dataSourceHandlers/DatasourceRenderingComponents/HelpTooltip';

const orderInputHelp = {
  name: () => t`Order name
  `,
  type: () => t`ORDER USING PRODUCTS IDS

  Search for data and add products to you order by clicking on "Add to Order" buttons. This will add product IDs to your Order Options under "Added Products (by ID)."
  
  ORDER USING QUERY
  
  Your order will be based on your AOI and time range, without searching for data and adding products to your order. Especially useful for ordering time-series data.
  It's possible for some products to be partially covered by clouds, despite the cloud coverage % information being 0.
  `,
  collectionId: () => t`Collection ID`,
  size: () => t`Ordered products will be clipped to the selected area.`,
  limit: () => t`Set an approximate order limit to prevent undesired large area requests.`,
  harmonizeData: () =>
    t`Harmonization is not yet supported for surface reflectance products, thus this field must be explicitly set to NONE if productBundle is analytic_sr or analytic_sr_udm2.`,
  planetApiKey: () =>
    t`Enter a Planet API key, that you received via email after purchasing a Planet PlanetScope Sentinel Hub Package`,
  createOrder: () =>
    t`When you click "Create Order", your order will be created. At this stage, the order will not go through and no quota will be substracted. This will happen when you confirm the order. Before you do, you will be able to review the requested quota and decide if you would like to proceed.`,
};

export const OrderInputTooltip = ({ inputId }) => {
  if (!orderInputHelp[inputId]) {
    return null;
  }

  return (
    <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
      <ReactMarkdown source={orderInputHelp[inputId]()} />
    </HelpTooltip>
  );
};
