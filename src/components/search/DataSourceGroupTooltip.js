import React from 'react';
import { CREDITS_SOURCES } from '../../store/config';
import './DataSourceGroupTooltip.scss';

const CreditItem = props => {
  let { creditData } = props;
  let logoOrTextLink;

  if (creditData.logo) {
    logoOrTextLink = (
      <img src={creditData.logo} alt={creditData.name} className="dataSourceGroupTooltipLogo" />
    );
  } else {
    logoOrTextLink = creditData.name;
  }

  return (
    <div>
      <a href={creditData.link} alt={creditData.name} target="_blank" rel="noopener noreferrer">
        {logoOrTextLink}
      </a>
    </div>
  );
};

const DataSourceGroupTooltip = props => {
  const { dataSourceGroup } = props;

  return (
    <div>
      <div className="dataSourceGroupTooltipDescription">{dataSourceGroup.description}</div>
      {dataSourceGroup.credits && (
        <div className="dataSourceGroupTooltipCredits">
          <div>Credits:</div>
          {dataSourceGroup.credits.map((credit, index) => (
            <CreditItem key={index} creditData={CREDITS_SOURCES[credit]} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DataSourceGroupTooltip;
