import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { EOBButton } from '../../../junk/EOBCommon/EOBButton/EOBButton';
import { NotificationPanel } from '../../../Notification/NotificationPanel';

import './Search.scss';
import SearchForm from './SearchForm';

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
