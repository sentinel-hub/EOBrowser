import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { TPDI, TPDICollections } from '@sentinel-hub/sentinelhub-js';
import { EOBButton } from '../../../junk/EOBCommon/EOBButton/EOBButton';
import { NotificationPanel } from '../../../Notification/NotificationPanel';
import { formatNumberAsRoundedUnit } from '../commercialData.utils';

import './Quotas.scss';

const Providers = {
  [TPDICollections.AIRBUS_PLEIADES]: 'Airbus Pleiades',
  [TPDICollections.AIRBUS_SPOT]: 'Airbus SPOT',
  [TPDICollections.PLANET_SCOPE]: 'Planet PlanetScope',
  [TPDICollections.MAXAR_WORLDVIEW]: 'Maxar WorldView',
};

function renderQuotas(quotas) {
  return (
    <>
      <table>
        <thead>
          <tr>
            <td>{t`Provider`}</td>
            <td>
              {t`Purchased km`}
              <sup>2</sup>
            </td>
            <td>
              {t`Used km`}
              <sup>2</sup>
            </td>
          </tr>
        </thead>
        <tbody>
          {quotas.map((quota) => {
            return (
              <tr key={quota.id}>
                <td>{`${Providers[quota.collectionId]}`}</td>
                <td>{`${formatNumberAsRoundedUnit(quota.quotaSqkm, 2, '')}`}</td>
                <td>{`${formatNumberAsRoundedUnit(quota.quotaUsed, 2, '')}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {quotas && quotas.length === 0 && <NotificationPanel msg={t`No quotas available`} type="info" />}
    </>
  );
}

const Quotas = ({ user }) => {
  const [quotas, setQuotas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuotas = async (user) => {
    if (user && !!user.access_token) {
      try {
        setIsLoading(true);
        setError(null);
        const requestsConfig = {
          authToken: user.access_token,
        };
        const result = await TPDI.getQuotas(requestsConfig);
        setQuotas(result.sort((a, b) => a.collectionId.localeCompare(b.collectionId)));
      } catch (err) {
        console.error(err);
        setError(t`Unable to get quotas: ${err.message}`);
        setQuotas([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQuotas(user);
  }, [user]);

  return (
    <div className="commercial-data-quotas">
      {renderQuotas(quotas)}
      <EOBButton
        className="commercial-data-button"
        loading={isLoading}
        disabled={isLoading}
        fluid
        onClick={() => fetchQuotas(user)}
        text={t`Refresh quotas`}
      />
      {!!error && <NotificationPanel type="error" msg={error} />}
    </div>
  );
};

const mapStoreToProps = (store) => ({
  user: store.auth.user,
});

export default connect(mapStoreToProps, null)(Quotas);
