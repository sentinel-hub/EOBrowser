import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { t } from 'ttag';
import { TPDICollections } from '@sentinel-hub/sentinelhub-js';

import { OrderInputTooltip } from './OrderInputTooltip';

const CollectionSelectionType = {
  CREATE: 'CREATE',
  MANUAL: 'MANUAL',
  USER: 'USER',
};

const createCollectionSelectionTypeLabel = () => ({
  [CollectionSelectionType.CREATE]: t`Create a new collection`,
  [CollectionSelectionType.MANUAL]: t`Manual Entry`,
  [CollectionSelectionType.USER]: t`Your collections`,
});

const DefaultCollections = {
  [TPDICollections.AIRBUS_PLEIADES]: 'My Airbus Pleiades',
  [TPDICollections.AIRBUS_SPOT]: 'My Airbus SPOT',
  [TPDICollections.MAXAR_WORLDVIEW]: 'My Maxar',
  [TPDICollections.PLANET_SCOPE]: 'My PlanetScope',
};

const CollectionsCache = new Map();

export const CollectionSelection = ({ disabled, orderOptions, setOrderOptions, searchParams, user }) => {
  const [userCollections, setUserCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collectionSelectionType, setCollectionSelectionType] = useState(CollectionSelectionType.USER);

  const onChangeHandler = (e) => {
    switch (e.target.value) {
      case CollectionSelectionType.CREATE:
        setOrderOptions({ ...orderOptions, collectionId: null, manualCollection: false });
        setCollectionSelectionType(CollectionSelectionType.CREATE);
        break;
      case CollectionSelectionType.MANUAL:
        setOrderOptions({ ...orderOptions, collectionId: null, manualCollection: true });
        setCollectionSelectionType(CollectionSelectionType.MANUAL);

        break;
      default: {
        setOrderOptions({ ...orderOptions, collectionId: e.target.value, manualCollection: false });
        setCollectionSelectionType(CollectionSelectionType.USER);
      }
    }
  };

  // try to find correct collection based
  // returns MANUAL, CREATE or existing collectionId
  const defaultCollectionId = (provider, collectionId, manualCollection) => {
    if (manualCollection) {
      return CollectionSelectionType.MANUAL;
    }

    if (!collectionId || collectionId === '') {
      if (collectionSelectionType === CollectionSelectionType.CREATE) {
        return CollectionSelectionType.CREATE;
      }

      const defaultCollection = userCollections.find(
        (collection) => collection.name && collection.name.startsWith(DefaultCollections[provider]),
      );

      return defaultCollection ? defaultCollection.id : CollectionSelectionType.CREATE;
    }

    return collectionId;
  };

  useEffect(() => {
    let source = axios.CancelToken.source();
    const fetchUserCollections = async () => {
      try {
        setLoading(true);

        if (CollectionsCache.has(user.access_token)) {
          setUserCollections(CollectionsCache.get(user.access_token));
          return;
        }

        const headers = {
          Authorization: `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        };
        const requestConfig = {
          headers: headers,
        };

        //taken from request builder
        const res = await axios.get(`https://services.sentinel-hub.com/api/v1/byoc/global`, requestConfig);
        if (res.data) {
          let collections = res.data.data.filter((col) => col.s3Bucket === 'sh.tpdi.byoc.eu-central-1');
          if (collections.length > 0) {
            setUserCollections(collections);
            CollectionsCache.set(user.access_token, collections);
          }
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };
    if (user && user.access_token) {
      fetchUserCollections();
    }
    return () => {
      if (source) {
        source.cancel();
      }
    };
  }, [user]);

  //update collectionId param once collections are loaded
  useEffect(() => {
    const calculatedCollectionId = defaultCollectionId(
      searchParams.dataProvider,
      collectionId,
      manualCollection,
    );

    if (
      calculatedCollectionId !== CollectionSelectionType.CREATE &&
      calculatedCollectionId !== CollectionSelectionType.MANUAL
    ) {
      setOrderOptions({ ...orderOptions, collectionId: calculatedCollectionId, manualCollection: false });
    }
    // eslint-disable-next-line
  }, [userCollections]);

  const { collectionId, manualCollection } = orderOptions;
  return (
    <div className="row">
      <label title={t`Collection ID`}>{t`Collection ID`}</label>
      <div>
        <div className="collection-selection">
          <select
            className="dropdown"
            disabled={disabled || loading}
            value={defaultCollectionId(searchParams.dataProvider, collectionId, manualCollection)}
            onChange={onChangeHandler}
          >
            <option value={CollectionSelectionType.CREATE}>
              {createCollectionSelectionTypeLabel().CREATE}
            </option>
            <option value={CollectionSelectionType.MANUAL}>
              {createCollectionSelectionTypeLabel().MANUAL}
            </option>
            {userCollections.length > 0 && (
              <optgroup label={createCollectionSelectionTypeLabel().USER}>
                {userCollections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {!!manualCollection && (
            <input
              defaultValue={collectionId}
              disabled={disabled}
              placeholder={t`Collection ID`}
              onChange={(e) => setOrderOptions({ ...orderOptions, collectionId: e.target.value })}
            ></input>
          )}
        </div>
        <OrderInputTooltip inputId="collectionId" />
      </div>
    </div>
  );
};
