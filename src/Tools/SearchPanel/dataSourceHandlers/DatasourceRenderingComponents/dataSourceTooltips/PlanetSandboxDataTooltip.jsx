import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';

const PlanetScopeMarkdown = () => t`
With hundreds of Dove satellites in orbit, PlanetScope provides a high-resolution, continuous, and complete view of the world from above, every day. More [info](https://collections.sentinel-hub.com/planetscope/sandbox-data.html).

**Spatial resolution:** ~3 meters

**Revisit time:** Almost daily coverage

**Data availability:** 2022-05-01 - 2023-04-30

**Common usage:** Land cover maps, land-change detection maps, vegetation monitoring

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;
const SkySatMarkdown = () => t`
The SkySat satellite constellation consists of ~20 satellites that were launched between 2013 and 2020. Because of its rapid revisit time, these data are suitable for monitoring rapid changes on the Earth's surface. More [info](https://collections.sentinel-hub.com/skysat/sandbox-data.html).

**Spatial resolution:** ~ 0.5 meters

**Revisit time:** Capacity to image up to 10x daily

**Data availability:** 2021-01-01 - 2022-12-31

**Common usage:** Monitoring rapid changes on the Earth's surface

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;
const ForestCarbonDiligenceMarkdown = () => t`
Annual estimates of the aboveground carbon stored in woody biomass across the landscape, contains data layers measuring: canopy height, canopy cover, and aboveground live carbon. More [info](https://collections.sentinel-hub.com/forest-carbon-diligence/sandbox-data.html).

**Spatial resolution:** 30 meters

**Revisit time:** Annual

**Data availability:** 2013-01-01 - 2017-01-01

**Common usage:** Carbon quantification in trees, forest area and tree height measurements

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;
const LandSurfaceTemperatureMarkdown = () => t`
Land Surface Temperature provides twice-daily measurements of land surface temperature with high spatial resolution and consistency. More [info](https://collections.sentinel-hub.com/land-surface-temperature/sandbox-data.html).

**Spatial resolution:** 100 m, 1000 m

**Revisit time:**
  - Above 50° latitude: 2 observations daily at 01:30 and 13:30
  - Equator: At least ±180 obs. at 01:30 and ±180 obs. at 13:30 observations annually

**Data availability:**
  - 100m: 2017-07-01 - 2023-04-30
  - 1000m: 2013-01-01 - 2023-04-30

**Common usage:** Enhancing weather models with consistent temperature measurements, urban heat stress monitoring, monitoring drought conditions

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;
const SoilWaterContentMarkdown = () => t`
The Soil Water Content is the measure of the amount of water present in a unit volume of soil. It is typically expressed as a percentage and represents the ratio between the volume of water and the total volume of the soil. More [info](https://collections.sentinel-hub.com/soil-water-content/sandbox-data.html).

**Spatial resolution:** 100 m, 1000 m

**Revisit time:** 137-365 observations per year

**Data availability:**
  - 100m: 2017-07-01 - 2023-04-30
  - 1000m: 2015-04-01 - 2023-04-30

**Common usage:** Drought-index insurance, water management, soil compaction, flood risks mitigation

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;
const AbovegroundCarbonDensityMarkdown = () => t`
Annual estimates of the aboveground carbon stored in woody biomass across the landscape, contains data layers measuring: canopy height, canopy cover, and aboveground live carbon.

**Spatial resolution:** 30 meters

**Revisit time:** Annual

**Data availability:** 2013-01-01 - 2017-01-01

**Common usage:** Carbon quantification in trees, forest area and tree height measurements
`;
const CanopyHeightMarkdown = () => t`
Annual estimates of the aboveground carbon stored in woody biomass across the landscape, contains data layers measuring: canopy height, canopy cover, and aboveground live carbon.

**Spatial resolution:** 30 meters

**Revisit time:** Annual

**Data availability:** 2013-01-01 - 2017-01-01

**Common usage:** Carbon quantification in trees, forest area and tree height measurements
`;
const CanopyCoverMarkdown = () => t`
Annual estimates of the aboveground carbon stored in woody biomass across the landscape, contains data layers measuring: canopy height, canopy cover, and aboveground live carbon.

**Spatial resolution:** 30 meters

**Revisit time:** Annual

**Data availability:** 2013-01-01 - 2017-01-01

**Common usage:** Carbon quantification in trees, forest area and tree height measurements
`;
const LST100MMarkdown = () => t`
Land Surface Temperature provides twice-daily measurements of land surface temperature with high spatial resolution and consistency.

**Spatial resolution:** 100 m, 1000 m

**Revisit time:**
  - Above 50° latitude: 2 observations daily at 01:30 and 13:30
  - Equator: At least ±180 obs. at 01:30 and ±180 obs. at 13:30 observations annually

**Data availability:** 2017-07-01 - 2023-04-30

**Common usage:** Enhancing weather models with consistent temperature measurements, urban heat stress monitoring, monitoring drought conditions
`;
const LST1000MMarkdown = () => t`
Land Surface Temperature provides twice-daily measurements of land surface temperature with high spatial resolution and consistency. 

**Spatial resolution:** 100 m, 1000 m

**Revisit time:**
  - Above 50° latitude: 2 observations daily at 01:30 and 13:30
  - Equator: At least ±180 obs. at 01:30 and ±180 obs. at 13:30 observations annually

**Data availability:** 2013-01-01 - 2023-04-30

**Common usage:** Enhancing weather models with consistent temperature measurements, urban heat stress monitoring, monitoring drought conditions
`;
const SWC100MMarkdown = () => t`
The Soil Water Content is the measure of the amount of water present in a unit volume of soil. It is typically expressed as a percentage and represents the ratio between the volume of water and the total volume of the soil.

**Spatial resolution:** 100 m, 1000 m

**Revisit time:** 137-365 observations per year

**Data availability:** 2017-07-01 - 2023-04-30

**Common usage:** Drought-index insurance, water management, soil compaction, flood risks mitigation
`;
const SWC1000MMarkdown = () => t`
The Soil Water Content is the measure of the amount of water present in a unit volume of soil. It is typically expressed as a percentage and represents the ratio between the volume of water and the total volume of the soil.

**Spatial resolution:** 100 m, 1000 m

**Revisit time:** 137-365 observations per year

**Data availability:** 2015-04-01 - 2023-04-30

**Common usage:** Drought-index insurance, water management, soil compaction, flood risks mitigation
`;
const PlanetBaseMapsMarkdown = () => t`
Globally available mosaics created from PlanetScope imagery that are temporally and spatially consistent. Basemaps are available for both visual and analytic use cases with scientific accuracy. More [info](https://collections.sentinel-hub.com/planet-basemaps/sandbox-data.html).

**Spatial resolution:** 4.77 m at equator based on PlanetScope GSD

**Revisit time:** Weekly, bi-weekly, monthly, or quarterly using PlanetScope daily imagery

**Data availability:** 2021-01-01 - 2023-04-01

**Common usage:** Machine learning-analytics (cloud masking, optional radiometric normalization)

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;

const AnalysisReadyPlanetScopeMarkdown = () => t`
Analysis-Ready PlanetScope combines the monitoring benefits of daily 3 m spatial imagery, while enhancing temporal and spatial consistency with trusted, third-party data sources (Landsat, Sentinel-2, MODIS, VIIRS). More [info](https://collections.sentinel-hub.com/analysis-ready-planetscope/sandbox-data.html).

**Spatial resolution:** 3 meters

**Revisit time:** Near-daily

**Data availability:** 2022-05-01 - 2023-04-30

**Common usage:** Time-series analysis, machine learning applications

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;

const RoadAndBuildingDetectionMarkdown = () => t`
Globally available land cover maps derived from Planetscope imagery classifying pixels as road, building or neither. Generated on a weekly or monthly basis, these can be used to stay up to date with the latest development around the globe. More [info](https://collections.sentinel-hub.com/road-and-building-detection/sandbox-data.html).

**Spatial resolution:** 4.77m at equator based on PlanetScope GSD

**Revisit time:** Weekly or monthly using PlanetScope daily imagery

**Data availability:** 2021-01-01 - 2023-04-01

**Common usage:** Resource routing, urban growth tracking

**License:** [CC-BY-NC](https://creativecommons.org/licenses/by-nc/2.0/deed.en)
`;

const Tooltip = (getMarkdown, url) => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown children={getMarkdown()} linkTarget="_blank" />
      </div>
      {/* <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href={url}>Planet Sandbox Data</ExternalLink>
        </div>
      </div> */}
    </div>
  );
};

const PlanetScopeTooltip = () => Tooltip(PlanetScopeMarkdown, '');
const SkySatTooltip = () => Tooltip(SkySatMarkdown, '');
const ForestCarbonDiligenceTooltip = () => Tooltip(ForestCarbonDiligenceMarkdown, '');
const LandSurfaceTemperatureTooltip = () => Tooltip(LandSurfaceTemperatureMarkdown, '');
const SoilWaterContentTooltip = () => Tooltip(SoilWaterContentMarkdown, '');
const AbovegroundCarbonDensityTooltip = () => Tooltip(AbovegroundCarbonDensityMarkdown, '');
const CanopyHeightTooltip = () => Tooltip(CanopyHeightMarkdown, '');
const CanopyCoverTooltip = () => Tooltip(CanopyCoverMarkdown, '');
const LST100MTooltip = () => Tooltip(LST100MMarkdown, '');
const LST1000MTooltip = () => Tooltip(LST1000MMarkdown, '');
const SWC100MTooltip = () => Tooltip(SWC100MMarkdown, '');
const SWC1000MTooltip = () => Tooltip(SWC1000MMarkdown, '');
const PlanetBaseMapsTooltip = () => Tooltip(PlanetBaseMapsMarkdown, '');
const AnalysisReadyPlanetScopeTooltip = () => Tooltip(AnalysisReadyPlanetScopeMarkdown, '');
const RoadAndBuildingDetectionTooltip = () => Tooltip(RoadAndBuildingDetectionMarkdown, '');

export {
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
};
