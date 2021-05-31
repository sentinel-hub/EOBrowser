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
The **Global Surface Water** collection is derived from Landsat 5, 7 and 8 imagery and shows various aspects of the spatio-temporal distribution of surface water between 1984 and 2019 at a global scale in six different layers. Surface water is considered as any uncovered stretch of water (fresh and salt water areas) greater than 30m² visible from space, including natural and artificial water bodies. More information [here](https://collections.sentinel-hub.com/global-surface-water/).

**Coverage**: Global coverage from longitude 170°E to 180°W and latitude 80°N to 50°S.

**Data Availability**: Surface water dynamics between 1984 and 2019.

**Spatial resolution**: 30 meters.

**Common Usage**: Monitoring of water bodies for water resource management, climate modelling, biodiversity conservation and food security.
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

export { CorineLandCoverTooltip, GlobalLandCoverTooltip, WaterBodiesTooltip, GlobalSurfaceWaterTooltip };
