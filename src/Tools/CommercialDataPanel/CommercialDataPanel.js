import React, { useState } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import {
  AirbusConstellation,
  PlanetProductBundle,
  PlanetScopeHarmonization,
  TPDI,
  TPDProvider,
  TPDICollections,
  CRS_EPSG4326,
} from '@sentinel-hub/sentinelhub-js';

import './CommercialDataPanel.scss';
import Accordion from '../../components/Accordion/Accordion';
import Quotas from './Quotas/Quotas';
import { Results } from './Results/Results';
import Orders from './Orders/Orders';
import OrderOptions, { OrderType } from './OrderOptions/OrderOptions';
import Search from './Search/Search';
import { providerSpecificParameters } from './Search/config';
import { ConfirmationDialog } from './Orders/ConfirmationDialog';
import { calculateAOICoverage, extractErrorMessage } from './commercialData.utils';
import store, { commercialDataSlice } from '../../store';

import moment from 'moment';

const Tabs = {
  SEARCH_OPTIONS: 0,
  RESULTS: 1,
  ORDER_OPTIONS: 2,
  MY_ORDERS: 3,
  MY_QUOTAS: 4,
};

const defaultSearchParamsForProvider = (dataProvider) => {
  switch (dataProvider) {
    case TPDICollections.PLANET_SCOPE:
      return {
        productBundle: PlanetProductBundle.ANALYTIC_UDM2,
      };
    default:
      return {};
  }
};

const defaultSearchParams = {
  advancedOptions: false,
  dataProvider: TPDICollections.AIRBUS_SPOT,
  fromTime: moment.utc().subtract(3, 'months').startOf('day'),
  toTime: moment.utc().endOf('day'),
};

const defaultOrderOptions = {
  name: null,
  type: OrderType.QUERY,
  limit: 10,
  collectionId: null,
  manualCollection: false,
  planetApiKey: null,
  harmonizeData: true,
};

const pageSize = {
  [TPDICollections.PLANET_SCOPE]: 250,
  [TPDICollections.AIRBUS_PLEIADES]: 50,
  [TPDICollections.AIRBUS_SPOT]: 50,
  [TPDICollections.MAXAR_WORLDVIEW]: 50,
};

const CommercialDataPanel = ({
  user,
  aoiGeometry,
  searchResults,
  location,
  displaySearchResults,
  quotasEnabled,
}) => {
  const [selectedAccordion, setSelectedAccordion] = useState(0);
  const [searchParams, setSearchParams] = useState(defaultSearchParams);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionError, setActionError] = useState();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [orderOptions, setOrderOptions] = useState(defaultOrderOptions);
  const [activeOrderId, setActiveOrderId] = useState();
  const [confirmAction, setConfirmAction] = useState(false);
  const [cachedPreviews, setCachedPreviews] = useState([]);

  const setSearchResults = (payload) => {
    store.dispatch(commercialDataSlice.actions.setSearchResults(payload));
  };

  const handleSearchParamChange = (name, value) => {
    setSearchParams((prevState) => {
      let newParams = { ...prevState };
      //remove previous dataProvider specific values on provider change
      if (name === 'dataProvider') {
        newParams = { ...newParams, ...defaultSearchParamsForProvider(value) };
        let providerParameters = providerSpecificParameters[newParams.dataProvider];
        if (!!providerParameters) {
          providerParameters.forEach((param) => {
            delete newParams[param.id];
          });
        }
      }

      //remove values for advanced options on disabling advanced options
      if (name === 'advancedOptions') {
        let providerParameters = providerSpecificParameters[newParams.dataProvider];
        if (!value && !!providerParameters) {
          providerParameters
            .filter((param) => !!param.advanced)
            .forEach((param) => {
              delete newParams[param.id];
            });
        }
      }

      if (name === 'productBundle') {
        setOrderOptions({
          ...orderOptions,
          harmonizeData:
            value !== PlanetProductBundle.ANALYTIC_SR_UDM2 && value !== PlanetProductBundle.ANALYTIC_SR,
        });
      }

      return {
        ...newParams,
        [name]: value,
      };
    });
  };

  const onSearch = async () => {
    setActionInProgress(true);
    setActionError(null);
    try {
      const params = { ...searchParams };
      if (aoiGeometry) {
        // only CRS_EPSG4326 is supported atm
        params.geometry = aoiGeometry;
        params.crs = CRS_EPSG4326;
      }

      if (params.dataProvider === TPDICollections.AIRBUS_SPOT) {
        params.constellation = AirbusConstellation.SPOT;
      }

      if (params.dataProvider === TPDICollections.AIRBUS_PLEIADES) {
        params.constellation = AirbusConstellation.PHR;
      }

      let provider = getProvider(params.dataProvider);

      const requestsConfig = {
        authToken: user.access_token,
      };

      let results = [];
      let searchResults = await TPDI.search(provider, params, requestsConfig, pageSize[params.dataProvider]);
      if (searchResults && searchResults.features) {
        results = [...searchResults.features];
      }
      while (searchResults && searchResults.links && searchResults.links.nextToken) {
        searchResults = await TPDI.search(
          provider,
          params,
          requestsConfig,
          pageSize[params.dataProvider],
          searchResults.links.nextToken,
        );
        if (searchResults && searchResults.features) {
          results = [...results, ...searchResults.features];
        }
      }
      const resultsWithCalculatedAttributes = results.map((result) => ({
        ...result,
        coverage: calculateAOICoverage(aoiGeometry, result.geometry),
      }));
      setSearchResults(resultsWithCalculatedAttributes);
      setSelectedProducts([]);
      toggleAccordion(Tabs.RESULTS, true);
    } catch (err) {
      console.error(err);
      const responseErrorMessage = err?.request?.response?.error?.errors[0]?.violation;
      setActionError(responseErrorMessage || err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const onCreateOrder = async () => {
    setActionInProgress(true);
    setActionError(null);
    try {
      const params = { ...searchParams };
      if (aoiGeometry) {
        // only CRS_EPSG4326 is supported atm
        params.geometry = aoiGeometry;
        params.crs = CRS_EPSG4326;
      }

      if (params.dataProvider === TPDICollections.AIRBUS_SPOT) {
        params.constellation = AirbusConstellation.SPOT;
      }

      if (params.dataProvider === TPDICollections.AIRBUS_PLEIADES) {
        params.constellation = AirbusConstellation.PHR;
      }

      if (params.dataProvider === TPDICollections.PLANET_SCOPE) {
        params.planetApiKey = orderOptions.planetApiKey;
        params.harmonizeTo = orderOptions.harmonizeData
          ? PlanetScopeHarmonization.PS2
          : PlanetScopeHarmonization.NONE;
      }

      const requestsConfig = {
        authToken: user.access_token,
      };

      const newOrder = await TPDI.createOrder(
        getProvider(params.dataProvider),
        orderOptions.name,
        orderOptions.collectionId,
        orderOptions.type === OrderType.PRODUCTS ? selectedProducts : null,
        params,
        requestsConfig,
      );

      if (newOrder && newOrder.id) {
        setActiveOrderId(newOrder.id);
      }
      reset();
      toggleAccordion(Tabs.MY_ORDERS);
    } catch (err) {
      console.error(err);
      setActionError(extractErrorMessage(err));
    } finally {
      setActionInProgress(false);
    }
  };

  const toggleAccordion = (index, showOnMap = false) => {
    if (index !== selectedAccordion) {
      setSelectedAccordion(index);
    } else {
      setSelectedAccordion(null);
    }
    store.dispatch(commercialDataSlice.actions.setDisplaySearchResults(showOnMap));
    if (index !== Tabs.MY_ORDERS) {
      store.dispatch(commercialDataSlice.actions.setSelectedOrder(null));
    }
  };

  const addProduct = (productId) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts, productId]);
    }
    setOrderOptions({ ...orderOptions, type: OrderType.PRODUCTS });
  };

  const removeProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts.filter((id) => id !== productId)]);
    }
  };

  const reset = () => {
    setSearchParams(defaultSearchParams);
    setSelectedProducts([]);
    setOrderOptions(defaultOrderOptions);
    store.dispatch(commercialDataSlice.actions.reset());
  };

  React.useEffect(() => {
    // initialize default parameters when "component is mounted"
    // this doesn't really make sense as default parameters are already correctly set.
    // it was added only to forse rerender, otherwise datePicker will crash with Target container is not a DOM element.
    reset();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="commercial-data-panel">
      <Accordion
        open={true}
        hidden={selectedAccordion !== Tabs.SEARCH_OPTIONS}
        title={t`Search options`}
        toggleOpen={() => toggleAccordion(Tabs.SEARCH_OPTIONS)}
      >
        <Search
          searchParams={searchParams}
          handleSearchParamChange={handleSearchParamChange}
          onSearch={onSearch}
          searchInProgress={actionInProgress}
          searchError={actionError}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.RESULTS}
        title={t`Results`}
        toggleOpen={() => toggleAccordion(Tabs.RESULTS, true)}
      >
        <Results
          searchResults={searchResults}
          provider={getProvider(searchParams.dataProvider)}
          onCreateOrder={() => {
            toggleAccordion(Tabs.ORDER_OPTIONS);
          }}
          searchParams={searchParams}
          addProduct={addProduct}
          removeProduct={removeProduct}
          selectedProducts={selectedProducts}
          cachedPreviews={cachedPreviews}
          setCachedPreviews={setCachedPreviews}
          location={location}
          displaySearchResults={displaySearchResults}
          quotasEnabled={quotasEnabled}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.ORDER_OPTIONS}
        title={t`Order options`}
        toggleOpen={() => toggleAccordion(Tabs.ORDER_OPTIONS)}
        disabled={!quotasEnabled}
      >
        <OrderOptions
          actionError={actionError}
          actionInProgress={actionInProgress}
          onCreateOrder={onCreateOrder}
          orderOptions={orderOptions}
          removeProduct={removeProduct}
          searchParams={searchParams}
          searchResults={searchResults}
          selectedProducts={selectedProducts}
          setOrderOptions={setOrderOptions}
          setConfirmAction={setConfirmAction}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.MY_ORDERS}
        title={t`My orders`}
        toggleOpen={() => toggleAccordion(Tabs.MY_ORDERS)}
        disabled={!quotasEnabled}
      >
        <Orders
          activeOrderId={activeOrderId}
          setActiveOrderId={setActiveOrderId}
          setConfirmAction={setConfirmAction}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.MY_QUOTAS}
        title={t`My quotas`}
        toggleOpen={() => toggleAccordion(Tabs.MY_QUOTAS)}
      >
        <Quotas />
      </Accordion>
      {confirmAction ? ConfirmationDialog(confirmAction, setConfirmAction) : null}
    </div>
  );
};

const mapStoreToProps = (store) => ({
  user: store.auth.user,
  aoiGeometry: store.aoi.geometry,
  searchResults: store.commercialData.searchResults,
  location: store.commercialData.location,
  displaySearchResults: store.commercialData.displaySearchResults,
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(CommercialDataPanel);

const getProvider = (dataProvider) => {
  let provider;
  if (dataProvider === TPDICollections.AIRBUS_SPOT || dataProvider === TPDICollections.AIRBUS_PLEIADES) {
    provider = TPDProvider.AIRBUS;
  } else if (dataProvider === TPDICollections.MAXAR_WORLDVIEW) {
    provider = TPDProvider.MAXAR;
  } else if (dataProvider === TPDICollections.PLANET_SCOPE) {
    provider = TPDProvider.PLANET;
  }
  return provider;
};
