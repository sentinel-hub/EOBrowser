import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import {
  PlanetProductBundle,
  PlanetScopeHarmonization,
  PlanetSupportedProductBundles,
  TPDI,
  TPDICollections,
  ResamplingKernel,
  PlanetItemType,
  PlanetPVType,
  PlanetPVId,
  PlanetARPSType,
  PlanetARPSId,
} from '@sentinel-hub/sentinelhub-js';

import './CommercialDataPanel.scss';
import Accordion from '../../components/Accordion/Accordion';
import Quotas from './Quotas/Quotas';
import { Results } from './Results/Results';
import Transactions from './Transactions/Transactions';
import TransactionOptions from './TransactionOptions/TransactionOptions';
import Search from './Search/Search';
import { GEOCENTO_EARTHIMAGES } from './const.js';
import { providerSpecificSearchParameters } from './Search/config';
import { CollectionSelectionType } from './TransactionOptions/CollectionSelection';
import { ConfirmationDialog } from './Transactions/ConfirmationDialog';
import {
  calculateAOICoverage,
  getProvider,
  extractErrorMessage,
  createSearchParams,
  openGeocentoLink,
  getTPDICollectionsWithLabels,
} from './commercialData.utils';
import { TRANSACTION_TYPE, OrderType, FATHOM_TRACK_EVENT_LIST } from '../../const';
import store, { commercialDataSlice } from '../../store';

import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import { TPDProvider } from '@sentinel-hub/sentinelhub-js';
import { handleFathomTrackEvent } from '../../utils';

const Tabs = {
  SEARCH_OPTIONS: 0,
  RESULTS: 1,
  ORDER_OPTIONS: 2,
  MY_ORDERS: 3,
  MY_QUOTAS: 4,
  HELP: 5,
};

const defaultPlanetProductBundle = {
  [PlanetItemType.PSScene]: PlanetProductBundle.ANALYTIC_UDM2,
  [PlanetItemType.PSScene4Band]: PlanetProductBundle.ANALYTIC_UDM2,
  [PlanetItemType.SkySatCollect]: PlanetProductBundle.ANALYTIC_UDM2,
};

export const defaultPlanetHarmonizeTo = {
  [PlanetItemType.PSScene]: PlanetScopeHarmonization.SENTINEL2,
  [PlanetItemType.PSScene4Band]: PlanetScopeHarmonization.PS2,
};

const defaultPlanetPVId = {
  [PlanetPVType.BiomassProxy]: PlanetPVId.BIOMASS_PROXY_V3_0_10,
  [PlanetPVType.LandSurfaceTemperature]: PlanetPVId.LST_AMSR2_V1_0_100,
  [PlanetPVType.SoilWaterContent]: PlanetPVId.SWC_AMSR2_C_V1_0_100,
  [PlanetPVType.ForestCarbonDiligence30m]: PlanetPVId.CANOPY_HEIGHT_V1_1_0_30,
};

export const isPlanetHarmonizationSupported = (itemType, productBundle) => {
  if (!PlanetSupportedProductBundles[itemType].includes(productBundle)) {
    return false;
  }

  //PSScene4Band item type and top-of-atmosphere product bundles
  if (itemType === PlanetItemType.PSScene4Band) {
    return !/_sr/i.test(productBundle);
  }

  // PSScene item type and surface reflectance product bundles
  if (itemType === PlanetItemType.PSScene) {
    return /_sr/i.test(productBundle);
  }

  return false;
};

const defaultSearchParamsForProvider = (dataProvider) => {
  switch (dataProvider) {
    case TPDICollections.PLANET_ARPS:
      return {
        type: PlanetARPSType.AnalysisReadyPlanetScope,
        id: PlanetARPSId.PS_ARD_SR_DAILY,
      };
    case TPDICollections.PLANET_SCOPE:
      return {
        itemType: PlanetItemType.PSScene,
        productBundle: defaultPlanetProductBundle[PlanetItemType.PSScene],
      };
    case TPDICollections.PLANET_SKYSAT:
      return {
        itemType: PlanetItemType.SkySatCollect,
        productBundle: defaultPlanetProductBundle[PlanetItemType.SkySatCollect],
      };
    case TPDICollections.PLANETARY_VARIABLES:
      return {
        type: PlanetPVType.BiomassProxy,
        id: defaultPlanetPVId[PlanetPVType.BiomassProxy],
      };
    default:
      return {};
  }
};

const defaultDataProvider = TPDICollections.PLANET_SCOPE;

const defaultSearchParams = {
  advancedOptions: false,
  fromTime: moment.utc().subtract(3, 'months').startOf('day'),
  toTime: moment.utc().endOf('day'),
  dataProvider: defaultDataProvider,
  ...defaultSearchParamsForProvider(defaultDataProvider),
};

const getDefaultSearchParams = (userAccountInfo) => {
  const TPDICollectionsWithLabels = getTPDICollectionsWithLabels(userAccountInfo);

  if (TPDICollectionsWithLabels.map((c) => c.value).includes(defaultDataProvider)) {
    return defaultSearchParams;
  }

  throw new Error('No matching default search params found');
};

const defaultTransactionOptions = {
  name: null,
  type: OrderType.QUERY,
  limit: 10,
  collectionSelectionType: CollectionSelectionType.USER,
  collectionId: null,
  manualCollection: false,
  planetApiKey: null,
  productKernel: ResamplingKernel.CC,
  harmonizeTo: PlanetScopeHarmonization.NONE,
};

const pageSize = {
  [TPDICollections.PLANET_SCOPE]: 250,
  [TPDICollections.AIRBUS_PLEIADES]: 50,
  [TPDICollections.AIRBUS_SPOT]: 50,
  [TPDICollections.MAXAR_WORLDVIEW]: 50,
};

const getCommercialHelpText = (quotas) => t`
**General**  
The "Commercial data" tab allows you to search, purchase, and visualize Commercial Third-Party data.

**Available constellations**  
We currently offer data from 3 different commercial data providers offering data from 5 different constellations:
- Planet [Planet scope](https://docs.sentinel-hub.com/api/latest/data/planet-scope/) (4/8 bands, 3m resolution)
- Planet [SkySat](https://docs.sentinel-hub.com/api/latest/data/planet/skysat/) (4 bands, 0.5m resolution)
- Airbus [Pleiades](https://docs.sentinel-hub.com/api/latest/data/airbus/pleiades/) (5 bands, 0.5m - 2m resolution)
- Airbus [SPOT](https://docs.sentinel-hub.com/api/latest/data/airbus/spot/) (5 bands, 1.5m - 6m resolution)
- Maxar [WorldView](https://docs.sentinel-hub.com/api/latest/data/maxar/world-view/) (5 bands, 0.5m - 2m resolution)

As the term "commercial" implies, the data comes at a cost, which means **in addition to your existing Sentinel Hub subscription, you will need to purchase quota** for the data you are interested in.

**Quota**  
Check *My quota* to see how much quota you have for each of the constellations. You can purchase quota through the [Sentinel Hub Dashboard](https://apps.sentinel-hub.com/dashboard/#/account/billing).

**Purchase**  
To purchase commercial data, you must:
- search for the data (*Search options*),
- select a product from the results (*Results*),
- add the product to your order,
- specify where to save the order (*Order options*),
- review the order and confirm it (*Created orders (not confirmed)* in *My orders*). Your order will now be listed under *Running orders* and move to *Finished orders* once the data has been purchased and ingested.

**More information**  
For more information on ordering commercial data ( Third Party Data Import ), please see the [Sentinel Hub Documentation Page](https://docs.sentinel-hub.com/api/latest/api/data-import/).
`;

const CommercialDataPanel = ({
  user,
  aoiGeometry,
  searchResults,
  location,
  displaySearchResults,
  userAccountInfo,
  impersonatedAccountId,
}) => {
  const [selectedAccordion, setSelectedAccordion] = useState(0);
  const [searchParams, setSearchParams] = useState(getDefaultSearchParams(userAccountInfo));
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionError, setActionError] = useState();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [transactionOptions, setTransactionOptions] = useState(defaultTransactionOptions);
  const [activeItemId, setActiveItemId] = useState();
  const [confirmAction, setConfirmAction] = useState(false);
  const [cachedPreviews, setCachedPreviews] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [areQuotasLoading, setAreQuotasLoading] = useState(false);
  const [quotasError, setQuotasError] = useState(null);

  const COLLECTIONS_ON_SUBSCRIPTION = [TPDICollections.PLANETARY_VARIABLES, TPDICollections.PLANET_ARPS];
  const isCollectionOnSubscription = (value) => COLLECTIONS_ON_SUBSCRIPTION.includes(value);

  const COLLECTIONS_WITH_NONE_HARMONIZATION = [TPDICollections.PLANET_SCOPE, TPDICollections.PLANET_SKYSAT];
  const isCollectionWithNoneHarmonization = (value) => COLLECTIONS_WITH_NONE_HARMONIZATION.includes(value);

  const [transactionType, setTransactionType] = useState(
    isCollectionOnSubscription(searchParams.dataProvider)
      ? TRANSACTION_TYPE.SUBSCRIPTION
      : TRANSACTION_TYPE.ORDER,
  );

  const areUserActionsEnabledInResults = (provider) => {
    const collection = getTPDICollectionsWithLabels(userAccountInfo).find((v) => v.value === provider);
    if (!collection) {
      return false;
    }

    if (!collection.requiresQuotas) {
      return !collection.requiresQuotas;
    }

    const quotaForCollection = userAccountInfo.quotas.find((q) => q.collectionId === provider);
    if (!quotaForCollection) {
      return false;
    }

    return quotaForCollection.quotaSqkm > 0;
  };

  const setSearchResults = (payload) => {
    store.dispatch(commercialDataSlice.actions.setSearchResults(payload));
  };

  const handleSearchParamChange = (name, value) => {
    setSearchParams((prevState) => {
      let newParams = { ...prevState };
      //remove previous dataProvider specific values on provider change
      if (name === 'dataProvider') {
        let providerParameters = providerSpecificSearchParameters[newParams.dataProvider];
        if (!!providerParameters) {
          providerParameters.forEach((param) => {
            delete newParams[param.id];
          });
          newParams = { ...newParams, ...defaultSearchParamsForProvider(value) };
        }

        //reset transaction params on data provider change
        if (prevState[name] !== value) {
          const newTransactionOptions = { ...defaultTransactionOptions };

          if (isCollectionWithNoneHarmonization(value)) {
            newTransactionOptions.harmonizeTo = PlanetScopeHarmonization.NONE;
          }

          const TPDICollectionWithLabel = getTPDICollectionsWithLabels(userAccountInfo).find(
            (v) => v.value === value,
          );
          if (TPDICollectionWithLabel && TPDICollectionWithLabel.requiresPlanetKey) {
            newTransactionOptions.planetApiKey = transactionOptions.planetApiKey ?? user.userdata.pl_api_key;
          }

          setTransactionOptions(newTransactionOptions);
        }

        setTransactionType(
          isCollectionOnSubscription(value) ? TRANSACTION_TYPE.SUBSCRIPTION : TRANSACTION_TYPE.ORDER,
        );

        //reset selected products
        setSelectedProducts([]);

        //reset search results
        setSearchResults([]);
      }

      //remove values for advanced options on disabling advanced options
      if (name === 'advancedOptions') {
        let providerParameters = providerSpecificSearchParameters[newParams.dataProvider];
        if (!value && !!providerParameters) {
          providerParameters
            .filter((param) => !!param.advanced)
            .forEach((param) => {
              delete newParams[param.id];
            });
        }
      }

      if (name === 'itemType') {
        newParams.productBundle = defaultPlanetProductBundle[value];

        setTransactionOptions({
          ...transactionOptions,
          harmonizeTo: isPlanetHarmonizationSupported(value, newParams.productBundle)
            ? defaultPlanetHarmonizeTo[value]
            : PlanetScopeHarmonization.NONE,
        });
      }

      if (name === 'productBundle') {
        setTransactionOptions({
          ...transactionOptions,
          harmonizeTo: isPlanetHarmonizationSupported(newParams.itemType, value)
            ? defaultPlanetHarmonizeTo[newParams.itemType]
            : PlanetScopeHarmonization.NONE,
        });
      }

      if (name === 'type') {
        newParams.id = defaultPlanetPVId[value];
      }

      return {
        ...newParams,
        [name]: value,
      };
    });
  };

  const onSearch = async () => {
    handleFathomTrackEvent(FATHOM_TRACK_EVENT_LIST.COMMERCIAL_SEARCH_BUTTON);

    setActionInProgress(true);
    setActionError(null);
    try {
      const params = createSearchParams(searchParams, aoiGeometry);

      if (impersonatedAccountId) {
        params.accountId = impersonatedAccountId;
      }

      if (params.dataProvider === GEOCENTO_EARTHIMAGES) {
        openGeocentoLink(searchParams, aoiGeometry);
        return;
      }

      let provider = getProvider(params.dataProvider);

      if (provider === TPDProvider.PLANETARY_VARIABLES) {
        toggleAccordion(Tabs.ORDER_OPTIONS, true);
        return;
      }

      if (provider === TPDProvider.PLANET && transactionOptions.planetApiKey) {
        params.planetApiKey = transactionOptions.planetApiKey;
      }

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
      const responseErrorMessage = err?.request?.response?.error?.errors?.[0]?.violation;
      const maxarResponseErrorMessage = err?.request?.response?.error?.message;
      setActionError(responseErrorMessage || maxarResponseErrorMessage || err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const onCreateTransaction = async () => {
    setActionInProgress(true);
    setActionError(null);
    try {
      const params = createSearchParams(searchParams, aoiGeometry);

      const requestsConfig = {
        authToken: user.access_token,
      };

      const createFunction =
        transactionType === TRANSACTION_TYPE.ORDER ? TPDI.createOrder : TPDI.createSubscription;
      const newTransaction = await createFunction(
        getProvider(params.dataProvider),
        transactionOptions.name,
        transactionOptions.collectionId,
        transactionType === TRANSACTION_TYPE.ORDER && OrderType.PRODUCTS ? selectedProducts : null,
        params,
        transactionOptions,
        requestsConfig,
      );
      toggleAccordion(Tabs.MY_ORDERS);

      if (newTransaction && newTransaction.id) {
        setActiveItemId(newTransaction.id);
      }
      reset();
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
    setTransactionOptions({ ...transactionOptions, type: OrderType.PRODUCTS });
  };

  const removeProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts.filter((id) => id !== productId)]);
    }
  };

  const reset = () => {
    setSearchParams(getDefaultSearchParams(userAccountInfo));
    setSelectedProducts([]);
    setTransactionOptions(defaultTransactionOptions);
    setTransactionOptions({ ...transactionOptions, planetApiKey: user.userdata.pl_api_key });
    store.dispatch(commercialDataSlice.actions.reset());
  };

  const fetchQuotas = async (user) => {
    if (user && !!user.access_token) {
      try {
        setAreQuotasLoading(true);
        setQuotasError(null);
        const requestsConfig = {
          authToken: user.access_token,
        };
        const result = await TPDI.getQuotas(requestsConfig);
        const collsWithLabels = getTPDICollectionsWithLabels(userAccountInfo);

        setQuotas(
          result
            .sort((a, b) => a.collectionId.localeCompare(b.collectionId))
            .filter((q) => {
              const col = collsWithLabels.find((c) => c.value === q.collectionId);
              return col && col.requiresQuotas;
            }),
        );
      } catch (err) {
        console.error(err);
        setQuotasError(t`Unable to get quotas: ${err.message}`);
        setQuotas([]);
      } finally {
        setAreQuotasLoading(false);
      }
    }
  };

  useEffect(() => {
    reset();
    fetchQuotas(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="commercial-data-panel">
      <Accordion
        open={true}
        hidden={selectedAccordion !== Tabs.SEARCH_OPTIONS}
        title={t`Query`}
        toggleOpen={() => toggleAccordion(Tabs.SEARCH_OPTIONS)}
      >
        <Search
          searchParams={searchParams}
          handleSearchParamChange={handleSearchParamChange}
          onSearch={onSearch}
          searchInProgress={actionInProgress}
          searchError={actionError}
          searchText={isCollectionOnSubscription(searchParams.dataProvider) ? t`Continue` : undefined}
          userAccountInfo={userAccountInfo}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.RESULTS}
        title={t`Products`}
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
          userAccountInfo={userAccountInfo}
          userActionsEnabled={areUserActionsEnabledInResults(searchParams.dataProvider)}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.ORDER_OPTIONS}
        title={t`Create order/subscription`}
        toggleOpen={() => toggleAccordion(Tabs.ORDER_OPTIONS)}
      >
        <TransactionOptions
          actionError={actionError}
          actionInProgress={actionInProgress}
          onCreateTransaction={onCreateTransaction}
          transactionOptions={transactionOptions}
          removeProduct={removeProduct}
          searchParams={searchParams}
          searchResults={searchResults}
          selectedProducts={selectedProducts}
          setTransactionOptions={setTransactionOptions}
          setConfirmAction={setConfirmAction}
          transactionType={transactionType}
          setTransactionType={setTransactionType}
          toggleAccordion={toggleAccordion}
          handleSearchParamChange={handleSearchParamChange}
          userAccountInfo={userAccountInfo}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.MY_ORDERS}
        title={t`My orders and subscriptions`}
        toggleOpen={() => toggleAccordion(Tabs.MY_ORDERS)}
      >
        <Transactions
          activeItemId={activeItemId}
          setActiveItemId={setActiveItemId}
          setConfirmAction={setConfirmAction}
          transactionType={transactionType}
          setTransactionType={setTransactionType}
        />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.MY_QUOTAS}
        title={t`My quotas`}
        toggleOpen={() => toggleAccordion(Tabs.MY_QUOTAS)}
      >
        <Quotas quotas={quotas} isLoading={areQuotasLoading} error={quotasError} fetchQuotas={fetchQuotas} />
      </Accordion>
      <Accordion
        open={selectedAccordion === Tabs.HELP}
        title={t`Help`}
        toggleOpen={() => toggleAccordion(Tabs.HELP)}
      >
        <ReactMarkdown children={getCommercialHelpText(quotas)} />
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
  impersonatedAccountId: store.auth.impersonatedUser.accountId,
});

export default connect(mapStoreToProps, null)(CommercialDataPanel);
