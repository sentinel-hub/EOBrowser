import React, { useState } from 'react';
import { TPDICollections } from '@sentinel-hub/sentinelhub-js';
import { EOBButton } from '../../../junk/EOBCommon/EOBButton/EOBButton';
import { NotificationPanel } from '../../../Notification/NotificationPanel';
import { CollectionSelection } from './CollectionSelection';
import { OrderInputTooltip } from './OrderInputTooltip';
import { t } from 'ttag';

import SearchForm from '../Search/SearchForm';

import 'react-toggle/style.css';
import './TransactionOptions.scss';
import { renderProviderSpecificTransactionParams } from './renderProviderSpecificTransactionParams';

const SubscriptionOptions = ({
  actionError,
  actionInProgress,
  aoiGeometry,
  onCreateTransaction,
  transactionOptions,
  searchParams,
  setTransactionOptions,
  setConfirmAction,
  user,
  handleSearchParamChange,
  userAccountInfo,
}) => {
  const [planetApiKeyHidden, setPlanetApiKeyHidden] = useState(true);

  const validateInputs = () => {
    // name must be entered
    const { name, planetApiKey } = transactionOptions;
    if (!name) {
      return false;
    }

    if (
      searchParams &&
      [
        TPDICollections.PLANET_SCOPE,
        TPDICollections.PLANETARY_VARIABLES,
        TPDICollections.PLANET_ARPS,
      ].includes(searchParams.dataProvider) &&
      !planetApiKey
    ) {
      return false;
    }

    return !!aoiGeometry;
  };

  const createSubscriptionHandler = () => {
    if (!transactionOptions.collectionId) {
      setConfirmAction({
        title: () => t`Creating subscription`,
        message: t`You have selected "Create a new collection". Are you sure you don't want to add the data to an existing collection?`,
        action: () => {
          onCreateTransaction();
          setConfirmAction(null);
        },
        showCancel: true,
      });
      return;
    }

    onCreateTransaction();
  };

  return (
    <div className="commercial-data-subscription-options">
      <div className="row">
        <label title={t`Subscription name`}>{t`Subscription name`}</label>
        <div>
          <input
            defaultValue={transactionOptions.name}
            disabled={!!actionInProgress}
            placeholder={t`e.g.: My planet data`}
            onChange={(e) => setTransactionOptions({ ...transactionOptions, name: e.target.value })}
          ></input>
          <OrderInputTooltip inputId="subscriptionName" />
        </div>
      </div>
      <SearchForm
        searchParams={searchParams}
        handleSearchParamChange={handleSearchParamChange}
        userAccountInfo={userAccountInfo}
        isCreateOrderSubscriptionTab={true}
      />

      <CollectionSelection
        disabled={!!actionInProgress}
        transactionOptions={transactionOptions}
        setTransactionOptions={setTransactionOptions}
        user={user}
        searchParams={searchParams}
      />
      {searchParams &&
        searchParams.dataProvider &&
        renderProviderSpecificTransactionParams(searchParams.dataProvider, {
          actionInProgress: actionInProgress,
          transactionOptions: transactionOptions,
          searchParams: searchParams,
          setTransactionOptions: setTransactionOptions,
          planetApiKeyHidden: planetApiKeyHidden,
          setPlanetApiKeyHidden: setPlanetApiKeyHidden,
        })}

      <div className="actions">
        <EOBButton
          className="commercial-data-button"
          fluid
          onClick={createSubscriptionHandler}
          disabled={!validateInputs() || !!actionInProgress}
          text={t`Create subscription`}
          loading={actionInProgress}
        />
        <OrderInputTooltip inputId="createSubscription" />
      </div>
      {actionError && <NotificationPanel type="error" msg={actionError} />}
    </div>
  );
};

export default SubscriptionOptions;
