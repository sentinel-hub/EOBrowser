import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { TPDICollections } from '@sentinel-hub/sentinelhub-js';
import { EOBButton } from '../../../junk/EOBCommon/EOBButton/EOBButton';
import { NotificationPanel } from '../../../Notification/NotificationPanel';

import './Search.scss';
import SearchForm from './SearchForm';
import { GEOCENTO_EARTHIMAGES } from './config';

const TPDICollectionsWithLabels = [
  { value: TPDICollections.AIRBUS_PLEIADES, label: 'Airbus Pleiades', requiresQuotas: true },
  { value: TPDICollections.AIRBUS_SPOT, label: 'Airbus SPOT', requiresQuotas: true },
  { value: TPDICollections.MAXAR_WORLDVIEW, label: 'Maxar WorldView', requiresQuotas: true },
  { value: TPDICollections.PLANET_SCOPE, label: 'Planet PlanetScope', requiresQuotas: false },
  { value: TPDICollections.PLANET_SKYSAT, label: 'Planet SkySat', requiresQuotas: false },
  { value: TPDICollections.PLANETARY_VARIABLES, label: 'Planet Planetary Variables', requiresQuotas: false },
  { value: GEOCENTO_EARTHIMAGES, label: 'Geocento EarthImages', requiresQuotas: true },
];

export const getTPDICollectionsWithLabels = (userAccountInfo) =>
  TPDICollectionsWithLabels.filter(
    (collection) => userAccountInfo.quotasEnabled || !collection.requiresQuotas,
  );

const Search = ({
  onSearch,
  searchParams,
  handleSearchParamChange,
  searchInProgress,
  searchError,
  aoiGeometry,
  searchText = t`Search`,
  userAccountInfo,
}) => {
  const validateSearchParams = () => {
    //check provider specific params

    return !!aoiGeometry;
  };

  return (
    <div className="commercial-data-search">
      <SearchForm
        searchParams={searchParams}
        handleSearchParamChange={handleSearchParamChange}
        userAccountInfo={userAccountInfo}
      />

      <EOBButton
        className="commercial-data-button"
        fluid
        onClick={onSearch}
        text={searchText}
        disabled={searchInProgress || !validateSearchParams()}
        loading={searchInProgress}
      />
      {searchError && <NotificationPanel type="error" msg={searchError} />}
    </div>
  );
};

const mapStoreToProps = (store) => ({
  aoiGeometry: store.aoi.geometry,
});

export default connect(mapStoreToProps, null)(Search);
