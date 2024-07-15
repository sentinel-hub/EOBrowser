import { BYOCSubTypes } from '@sentinel-hub/sentinelhub-js';
import { DATASOURCES } from '../../../const';
import BYOCDataSourceHandler from './BYOCDataSourceHandler';
import {
  PLANET_SCOPE,
  SKY_SAT,
  FOREST_CARBON_DILIGENCE,
  LAND_SURFACE_TEMPERATURE,
  SOIL_WATER_CONTENT,
  ABOVEGROUND_CARBON_DENSITY,
  CANOPY_HEIGHT,
  CANOPY_COVER,
  LST_100M,
  LST_1000M,
  SWC_100M,
  SWC_1000M,
  PLANET_BASEMAPS,
  ANALYSIS_READY_PLANETSCOPE,
  ROAD_AND_BUILDING_DETECTION,
} from './dataSourceConstants';
import GenericSearchGroup from './DatasourceRenderingComponents/searchGroups/GenericSearchGroup';
import { BYOCLayer } from '@sentinel-hub/sentinelhub-js';
import { FetchingFunction } from '../search';
import { t } from 'ttag';
import { PLANET_SANDBOX_COLLECTIONS } from '../../../assets/protected_themes';
import HelpTooltip from './DatasourceRenderingComponents/HelpTooltip';
import {
  PlanetScopeTooltip,
  SkySatTooltip,
  ForestCarbonDiligenceTooltip,
  LandSurfaceTemperatureTooltip,
  SoilWaterContentTooltip,
  AbovegroundCarbonDensityTooltip,
  CanopyHeightTooltip,
  CanopyCoverTooltip,
  LST100MTooltip,
  LST1000MTooltip,
  SWC100MTooltip,
  SWC1000MTooltip,
  PlanetBaseMapsTooltip,
  AnalysisReadyPlanetScopeTooltip,
  RoadAndBuildingDetectionTooltip,
} from './DatasourceRenderingComponents/dataSourceTooltips/PlanetSandboxDataTooltip';

export default class PlanetSandboxDatasourceHandler extends BYOCDataSourceHandler {
  getDatasetSearchLabels = () => ({
    [ANALYSIS_READY_PLANETSCOPE]: 'Analysis-Ready PlanetScope',
    [SKY_SAT]: 'SkySat',
    [PLANET_SCOPE]: 'PlanetScope',
    [FOREST_CARBON_DILIGENCE]: 'Forest Carbon Diligence',
    [LAND_SURFACE_TEMPERATURE]: 'Land Surface Temperature',
    [SOIL_WATER_CONTENT]: 'Soil Water Content',
    [ABOVEGROUND_CARBON_DENSITY]: 'Aboveground Carbon Density',
    [CANOPY_HEIGHT]: 'Canopy Height',
    [CANOPY_COVER]: 'Canopy Cover',
    [LST_100M]: 'LST 100m',
    [LST_1000M]: 'LST 1000m',
    [SWC_100M]: 'SWC 100m',
    [SWC_1000M]: 'SWC 1000m',
    [PLANET_BASEMAPS]: 'Planet Basemaps',
    [ROAD_AND_BUILDING_DETECTION]: 'Road and Building Detection',
  });

  collections = [];

  urls = [];
  datasets = [];
  allLayers = [];
  datasource = DATASOURCES.PLANET_SANDBOX_DATA;

  isChecked = {};

  KNOWN_COLLECTIONS = {
    [ANALYSIS_READY_PLANETSCOPE]: PLANET_SANDBOX_COLLECTIONS[ANALYSIS_READY_PLANETSCOPE],
    [PLANET_SCOPE]: PLANET_SANDBOX_COLLECTIONS[PLANET_SCOPE],
    [SKY_SAT]: PLANET_SANDBOX_COLLECTIONS[SKY_SAT],
    [FOREST_CARBON_DILIGENCE]: {
      [ABOVEGROUND_CARBON_DENSITY]: PLANET_SANDBOX_COLLECTIONS[ABOVEGROUND_CARBON_DENSITY],
      [CANOPY_HEIGHT]: PLANET_SANDBOX_COLLECTIONS[CANOPY_HEIGHT],
      [CANOPY_COVER]: PLANET_SANDBOX_COLLECTIONS[CANOPY_COVER],
    },
    [LAND_SURFACE_TEMPERATURE]: {
      [LST_100M]: PLANET_SANDBOX_COLLECTIONS[LST_100M],
      [LST_1000M]: PLANET_SANDBOX_COLLECTIONS[LST_1000M],
    },
    [SOIL_WATER_CONTENT]: {
      [SWC_100M]: PLANET_SANDBOX_COLLECTIONS[SWC_100M],
      [SWC_1000M]: PLANET_SANDBOX_COLLECTIONS[SWC_1000M],
    },
    [PLANET_BASEMAPS]: PLANET_SANDBOX_COLLECTIONS[PLANET_BASEMAPS],
    [ROAD_AND_BUILDING_DETECTION]: PLANET_SANDBOX_COLLECTIONS[ROAD_AND_BUILDING_DETECTION],
  };

  willHandle(service, url, name, layers, preselected) {
    for (let datasetId of Object.keys(this.KNOWN_COLLECTIONS)) {
      const objectValues =
        typeof this.KNOWN_COLLECTIONS[datasetId] !== 'string'
          ? Object.values(this.KNOWN_COLLECTIONS[datasetId])
          : [this.KNOWN_COLLECTIONS[datasetId]];
      const layersWithDataset = layers.filter((l) => objectValues.includes(l.collectionId));

      layersWithDataset.forEach((layer) => {
        this.collections[layer.collectionId] = {
          title: this.getCollectionName(layer.collectionId) || layer.collectionTitle || layer.title,
          url: url,
          themeName: name.replace(t`Based on: `, ''),
          availableBands: layer.availableBands,
          subType: layer.subType,
        };
        // Once collections endpoint will be working properly,
        // title should be replaced with actual collection name (if service will provide such information)
      });
    }

    if (Object.keys(this.collections).length === 0) {
      return;
    }
    this.urls.push(url);
    this.datasets = Object.keys(this.collections);
    this.datasets.forEach((id) => {
      this.datasetSearchIds[id] = id;
      this.datasetSearchLabels[id] = this.collections[id].title;
    });
    this.allLayers.push(...layers);
    this.saveFISLayers(url, layers);
    return true;
  }

  getUrlsForDataset = () => {
    return this.urls;
  };

  getCollectionName(collectionId) {
    if (!collectionId) {
      return null;
    }

    const key = Object.keys(PLANET_SANDBOX_COLLECTIONS).find(
      (key) => PLANET_SANDBOX_COLLECTIONS[key] === collectionId,
    );
    if (!key) {
      return null;
    }
    return this.getDatasetSearchLabels()[key];
  }

  getNewFetchingFunctions(fromMoment, toMoment, queryArea = null) {
    if (!this.isChecked) {
      return [];
    }

    let fetchingFunctions = [];

    const checkeDatasets = Object.keys(this.isChecked).filter((k) => this.isChecked[k]);
    const selectedOptions =
      checkeDatasets.map((key) => this.searchFilters[key].selectedOptions)?.flat() || [];
    const datasets = selectedOptions.map((d) => PLANET_SANDBOX_COLLECTIONS[d]);

    datasets.forEach((datasetId) => {
      // InstanceId, layerId and evalscript are required parameters, although we don't need them for findTiles.
      // As we don't have any layer related information at this stage, some dummy values are set for those 3 params to prevent
      // querying configuration service for dataset defaults
      const subType = BYOCSubTypes.BYOC;
      const searchLayer = new BYOCLayer({
        instanceId: true,
        layerId: true,
        evalscript: '//',
        collectionId: datasetId,
        subType: subType,
      });
      const ff = new FetchingFunction(
        datasetId,
        searchLayer,
        fromMoment,
        toMoment,
        queryArea,
        this.convertToStandardTiles,
      );
      fetchingFunctions.push(ff);
    });
    return fetchingFunctions;
  }

  getKnownCollectionsList() {
    return Object.values(this.KNOWN_COLLECTIONS_LIST);
  }

  getSearchFormComponents() {
    if (!this.isHandlingAnyUrl()) {
      return null;
    }
    return (
      <>
        {Object.keys(this.KNOWN_COLLECTIONS).map((k) => {
          const collections = this.KNOWN_COLLECTIONS[k];
          const options = typeof collections !== 'string' ? Object.keys(collections) : [k];

          return (
            <GenericSearchGroup
              key={k + 'searchgroup'}
              label={this.getDatasetSearchLabels()[k]}
              preselected={false}
              saveCheckedState={this.saveCheckedState(k)}
              saveFiltersValues={this.saveSearchFilters(k)}
              options={options.length > 1 ? options : []}
              optionsLabels={this.getDatasetSearchLabels()}
              preselectedOptions={options.length <= 1 ? options : []}
              hasMaxCCFilter={false}
              renderOptionsHelpTooltips={this.renderOptionsHelpTooltips}
              dataSourceTooltip={this.renderOptionsHelpTooltips(k)}
            />
          );
        })}
      </>
    );
  }

  saveSearchFilters = (key) => (searchFilters) => {
    this.searchFilters[key] = searchFilters;
  };

  saveCheckedState = (key) => (checkedState) => {
    this.isChecked[key] = checkedState;
  };

  renderOptionsHelpTooltips = (option) => {
    switch (option) {
      case PLANET_SCOPE:
        return <PlanetScopeTooltip />;
      case SKY_SAT:
        return <SkySatTooltip />;
      case FOREST_CARBON_DILIGENCE:
        return <ForestCarbonDiligenceTooltip />;
      case LAND_SURFACE_TEMPERATURE:
        return <LandSurfaceTemperatureTooltip />;
      case SOIL_WATER_CONTENT:
        return <SoilWaterContentTooltip />;
      case ABOVEGROUND_CARBON_DENSITY:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <AbovegroundCarbonDensityTooltip />
          </HelpTooltip>
        );
      case CANOPY_HEIGHT:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <CanopyHeightTooltip />
          </HelpTooltip>
        );
      case CANOPY_COVER:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <CanopyCoverTooltip />
          </HelpTooltip>
        );
      case LST_100M:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <LST100MTooltip />
          </HelpTooltip>
        );
      case LST_1000M:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <LST1000MTooltip />
          </HelpTooltip>
        );
      case SWC_100M:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <SWC100MTooltip />
          </HelpTooltip>
        );
      case SWC_1000M:
        return (
          <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnLeft">
            <SWC1000MTooltip />
          </HelpTooltip>
        );
      case PLANET_BASEMAPS:
        return <PlanetBaseMapsTooltip />;
      case ANALYSIS_READY_PLANETSCOPE:
        return <AnalysisReadyPlanetScopeTooltip />;
      case ROAD_AND_BUILDING_DETECTION:
        return <RoadAndBuildingDetectionTooltip />;
      default:
        return null;
    }
  };
}
