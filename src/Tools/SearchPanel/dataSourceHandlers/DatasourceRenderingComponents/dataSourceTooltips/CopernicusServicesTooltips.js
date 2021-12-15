import React from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'ttag';
import ExternalLink from '../../../../../ExternalLink/ExternalLink';
import logoCopernicus from './images/logo-tooltips-copernicus.png';

const CorineLandCoverMarkdown = () => t`
**CORINE Land Cover (CLC)** inventory is a vector-based dataset that consists of 44 land cover and land use classes, derived from a series of satellite missions. In the majority of European countries, CLC is produced using visual interpretation of high resolution satellite imagery. In a few countries semi-automatic solutions are applied, using national in-situ data, satellite image processing, GIS integration and generalisation. More information [here](https://github.com/sentinel-hub/public-collections/tree/main/collections/corine-land-cover). 

**Coverage**: Most of Europe.

**Data availability**:
CLC data is updated every 6 years. In EO Browser, data is available on the following dates:
01-01-1990, 01-01-2000, 01-01-2006, 01-01-2012, 01-01-2018.

**Common Usage**:
Land use and land cover monitoring, analysis and change prediction for various applications, including environment, agriculture, transport and spatial planning. 
`;

const GlobalLandCoverMarkdown = () => t`
**Global Land Cover** products provide a discrete land cover classification map according to UN-FAO Land Cover Classification System. Additional continuous fractional layers for all basic land cover classes are included as bands, to provide more detailed information on each land cover class. More information [here](https://github.com/sentinel-hub/public-collections/tree/main/collections/global-land-cover). 

**Coverage**: Global.

**Data availability**:
Updated on a yearly basis. In EO Browser, data is available on the following dates:
01-01-2015, 01-01-2016, 01-01-2017, 01-01-2018, 01-01-2019.

**Common Usage**: 
Land use and land cover monitoring, used to aid policy decisions on various issues, including agriculture and food security, biodiversity, climate change, forest and water resources, land degradation & desertification and rural development.
`;

const WaterBodiesMarkdown = () => t`
The **Water Bodies** product shows the surface extent covered by inland water on a permanent, seasonal or occasional basis on a global scale. It contains one main Water Body detection layer (WB) and one Quality layer (QUAL), that provides information on the seasonal dynamics of the detected water bodies. More information [here](https://collections.sentinel-hub.com/water-bodies/). 

**Coverage**:
Global coverage from longitude -180°E to +180°W and latitude +80°N to -60°S. Depending on the month, some high latitude areas are not covered by Sentinel-2 satellites.

**Data Availability**:
Since October 2020, updated monthly. 

**Common Usage**
Monitoring of water bodies, droughts, floods and climate change.
`;

const GlobalSurfaceWaterMarkdown = () => t`
The **Global Surface Water** collection is derived from Landsat 5, 7 and 8 imagery and shows various aspects of the spatio-temporal distribution of surface water between 1984 and 2020 (with annual revisions) at a global scale in six different layers. Surface water is considered as any uncovered stretch of water (fresh and salt water areas) greater than 30m² visible from space, including natural and artificial water bodies. More information [here](https://collections.sentinel-hub.com/global-surface-water/).

**Coverage**: Global coverage from longitude 170°E to 180°W and latitude 80°N to 50°S.

**Data Availability**: 1984 - 2019, 1984 - 2020.

**Spatial resolution**: 30 meters.

**Common Usage**: Monitoring of water bodies for water resource management, climate modelling, biodiversity conservation and food security.
`;

const HRVPPSeasonalTrajectoriesMarkdown = () => t`
The **Seasonal Trajectories** product is a filtered time series of Plant Phenology Index (PPI) provided yearly on a 10-daily basis. It is part of the Copernicus Land Monitoring Service (CLMS), pan-European High Resolution Vegetation Phenology and Productivity (HR-VPP) product suite. The Seasonal Trajectories PPI is derived through fitting a smoothing and gap filling function to the yearly time-series raw PPI values generated from Sentinel-2 satellite observations. More information [here](https://collections.sentinel-hub.com/seasonal-trajectories/).

**Coverage**: Europe (EEA39 region) from longitude from 25°W to 45°E and latitude 26°N to 72°N.

**Data Availability**: Since January 2017, updated every 10 days.

**Spatial resolution**: 10 meters.

**Common Usage**: Plant phenology monitoring, such as tracking green canopy foliage dynamics through time. 
`;

const HRVPPVegetationIndicesMarkdown = () => t`
The **Vegetation Indices** product is part of the Copernicus Land Monitoring Service (CLMS), pan-European High Resolution Vegetation Phenology and Productivity (HR-VPP) product suite. The product is comprised of 4 raw Vegetation Indices generated near real-time (NRT) from Sentinel-2 satellite observations. More information [here](https://collections.sentinel-hub.com/vegetation-indices/).

**Coverage**: Europe (EEA39 region) from longitude from 25°W to 45°E and latitude 26°N to 72°N.

**Data Availability**: Since October 2016, updated daily. 

**Spatial resolution**: 10 meters.

**Common Usage**: Plant phenology assessment and monitoring, including vegetation cover, density, productivity and health.
`;

const HRVPPVPPS1Markdown = () => t`
The **Vegetation Phenology and Productivity Parameters** product is part of the Copernicus Land Monitoring Service (CLMS), pan-European High Resolution Vegetation Phenology and Productivity (HR-VPP) product suite. The VPP product is comprised of 13 parameters that describe specific stages of the seasonal vegetation growth cycle. These parameters are extracted from Seasonal Trajectories of the Plant Phenology Index (PPI) derived from Sentinel-2 satellite observations.
 More information [here](https://collections.sentinel-hub.com/vegetation-phenology-and-productivity-parameters-season-1/).

**Coverage**: Europe (EEA39 region) from longitude from 25°W to 45°E and latitude 26°N to 72°N.

**Data Availability**: Since January 2017, updated annually.

**Spatial resolution**: 10 meters.

**Common Usage**: Detailed assessment of the impacts of human or climate change on the ecosystem through monitoring of vegetation responses to disturbances, e.g. droughts, storms, insect infestations, and to human influence from global to local levels.
`;

const HRVPPVPPS2Markdown = () => t`
The **Vegetation Phenology and Productivity Parameters** product is part of the Copernicus Land Monitoring Service (CLMS), pan-European High Resolution Vegetation Phenology and Productivity (HR-VPP) product suite. The VPP product is comprised of 13 parameters that describe specific stages of the seasonal vegetation growth cycle. These parameters are extracted from Seasonal Trajectories of the Plant Phenology Index (PPI) derived from Sentinel-2 satellite observations.
 More information [here](https://collections.sentinel-hub.com/vegetation-phenology-and-productivity-parameters-season-2/).

**Coverage**: Europe (EEA39 region) from longitude from 25°W to 45°E and latitude 26°N to 72°N.

**Data Availability**: Since January 2017, updated annually.

**Spatial resolution**: 10 meters.

**Common Usage**: Detailed assessment of the impacts of human or climate change on the ecosystem through monitoring of vegetation responses to disturbances, e.g. droughts, storms, insect infestations, and to human influence from global to local levels.
`;

const CLCAccountingMarkdown = () => t`
The **Corine Land Cover Accounting Layers** are status layers modified for the purpose of consistent statistical analysis in the land cover change accounting system. The modification combines CLC status and change layers in the 100 m raster in order to create homogeneous quality time series of CLC / CLC-change layers for accounting purposes. The CLC inventory consists of 44 land cover and land use classes derived from a series of satellite missions since it was first established. More information [here](https://collections.eurodatacube.com/corine-land-cover-accounting-layers/).

**Coverage**: Europe (EEA39 region).

**Data Availability**: Since 2000, updated every 6 years. Data available for 2000, 2006, 2012 and 2018.

**Spatial resolution**: 100 meters.

**Common Usage**: Land use and land cover monitoring, analysis and change prediction for various applications, including environment, agriculture, transport and spatial planning.`;

const WorldCoverMarkdown = () => t`
The **ESA WorldCover** product is the first global land cover map at 10 m resolution based on both Sentinel-1 and Sentinel-2 data. More information [here](https://esa-worldcover.org/).

**Coverage**: Global coverage.

**Data Availability**: 2020.

**Spatial resolution**: 10 meters.

**Common Usage**: Development of novel services to help with preserving biodiversity, food security, carbon assessment and climate modelling.
`;

const Tooltip = (getMarkdown, url) => {
  return (
    <div>
      <div className="data-source-group-tooltip-description">
        <ReactMarkdown source={getMarkdown()} />
      </div>
      <div className="data-source-group-tooltip-credits">
        <div>{t`Credits:`}</div>
        <div>
          <ExternalLink href={url}>
            <img src={logoCopernicus} alt="Copernicus" className="data-source-group-tooltip-logo" />
          </ExternalLink>
        </div>
      </div>
    </div>
  );
};

const CorineLandCoverTooltip = () =>
  Tooltip(CorineLandCoverMarkdown, 'https://land.copernicus.eu/pan-european/corine-land-cover');

const GlobalLandCoverTooltip = () =>
  Tooltip(GlobalLandCoverMarkdown, 'https://land.copernicus.eu/global/products/lc');

const WaterBodiesTooltip = () =>
  Tooltip(WaterBodiesMarkdown, 'https://land.copernicus.eu/global/products/wb');

const GlobalSurfaceWaterTooltip = () =>
  Tooltip(GlobalSurfaceWaterMarkdown, 'https://global-surface-water.appspot.com/');

const HRVPPSeasonalTrajectoriesTooltip = () =>
  Tooltip(
    HRVPPSeasonalTrajectoriesMarkdown,
    'https://land.copernicus.eu/pan-european/biophysical-parameters/high-resolution-vegetation-phenology-and-productivity/seasonal-trajectories',
  );

const HRVPPVegetationIndicesTooltip = () =>
  Tooltip(
    HRVPPVegetationIndicesMarkdown,
    'https://land.copernicus.eu/pan-european/biophysical-parameters/high-resolution-vegetation-phenology-and-productivity/vegetation-indices',
  );

const HRVPPVPPS1Tooltip = () =>
  Tooltip(
    HRVPPVPPS1Markdown,
    'https://land.copernicus.eu/pan-european/biophysical-parameters/high-resolution-vegetation-phenology-and-productivity/vegetation-phenology-and-productivity',
  );

const HRVPPVPPS2Tooltip = () =>
  Tooltip(
    HRVPPVPPS2Markdown,
    'https://land.copernicus.eu/pan-european/biophysical-parameters/high-resolution-vegetation-phenology-and-productivity/vegetation-phenology-and-productivity',
  );

const CLCAccountingTooltip = () =>
  Tooltip(
    CLCAccountingMarkdown,
    'https://land.copernicus.eu/user-corner/technical-library/clc-product-user-manual',
  );

const WorldCoverTooltip = () => Tooltip(WorldCoverMarkdown, 'https://esa-worldcover.org/');

export {
  CorineLandCoverTooltip,
  GlobalLandCoverTooltip,
  WaterBodiesTooltip,
  GlobalSurfaceWaterTooltip,
  HRVPPSeasonalTrajectoriesTooltip,
  HRVPPVegetationIndicesTooltip,
  HRVPPVPPS1Tooltip,
  HRVPPVPPS2Tooltip,
  CLCAccountingTooltip,
  WorldCoverTooltip,
};
