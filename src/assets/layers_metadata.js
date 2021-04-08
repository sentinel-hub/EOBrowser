import { t } from 'ttag';
import { EDUCATION_MODE } from '../const';

export const PREDEFINED_LAYERS_METADATA = [
  {
    match: [
      { datasourceId: 'S3SLSTR', layerId: 'S7_VISUALIZED' },
      { datasourceId: 'S3SLSTR', layerId: 'S8_VISUALIZED' },
      { datasourceId: 'S3SLSTR', layerId: 'S9_VISUALIZED' },
    ],
    legend: {
      type: 'continuous',
      minPosition: 223,
      maxPosition: 323,
      gradients: [
        { position: 223, color: '#002863', label: '<= - 50' },
        { position: 253, color: '#2e82ff', label: '- 20' },
        { position: 263, color: '#80b3ff' },
        { position: 272, color: '#e0edff' },
        { position: 273, color: '#ffffff', label: '0' },
        { position: 274, color: '#fefce7' },
        { position: 283, color: '#FDE191' },
        { position: 293, color: '#f69855', label: '20' },
        { position: 303, color: '#ec6927' },
        { position: 323, color: '#aa2d1d', label: '>= 50 [°C]' },
      ],
    },
  },

  {
    match: [
      { datasourceId: 'S3SLSTR', layerId: 'F1_VISUALIZED' },
      { datasourceId: 'S3SLSTR', layerId: 'F2_VISUALIZED' },
    ],
    legend: {
      type: 'continuous',
      minPosition: 223,
      maxPosition: 373,
      gradients: [
        { position: 223, color: '#003d99', label: '<= -50' },
        { position: 253, color: '#2e82ff' },
        { position: 263, color: '#80b3ff' },
        { position: 273, color: '#ffffff', label: '0' },
        { position: 274, color: '#fefce7' },
        { position: 283, color: '#FDE191' },
        { position: 293, color: '#f69855' },
        { position: 303, color: '#ec6927' },
        { position: 323, color: '#aa2d1d', label: '50' },
        { position: 343, color: '#650401' },
        { position: 373, color: '#3d0200', label: '>= 100 [°C]' },
      ],
    },
    description: () =>
      t`# Thermal IR fire emission bands\n\nSentinel-3 Sea and Land Surface Temperature Instrument (SLSTR) has two dedicated channels (F1 and F2) that aim to detect Land Surface Temperature (LST). F2 Channel, with a central wavelength of 10854 nm measures in the thermal infrared, or TIR. It is very useful for fire and high temperature event monitoring at 1 km resolution.\n\n\n\nMore info [here.](https://sentinel.esa.int/web/sentinel/user-guides/sentinel-3-slstr/overview/geophysical-measurements/land-surface-temperature)`,
  },

  {
    match: [{ datasourceId: 'S5_CH4', layerId: 'CH4_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 1600,
      maxPosition: 2000,
      gradients: [
        { position: 1600, color: '#000080', label: '1600' },
        { position: 1650, color: '#0000ff', label: '1650' },
        { position: 1750, color: '#00ffff', label: '1750' },
        { position: 1850, color: '#ffff00', label: '1850' },
        { position: 1950, color: '#ff0000', label: '1950' },
        { position: 2000, color: '#800000', label: '2000 [ppb]' },
      ],
    },
    description: () =>
      t`# Methane (CH4)\n\n\n\nMethane is, after carbon dioxide, the most important contributor to the anthropogenically (caused by human activity) enhanced greenhouse effect. Measurements are provided in parts per billion (ppb) with a spatial resolution of 7 km x 3.5 km.\n\n\n\nMore info [here.](http://www.tropomi.eu/data-products/methane)`,
  },

  {
    match: [{ datasourceId: 'S5_HCHO', layerId: 'HCHO_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 0.001,
      gradients: [
        { position: 0, color: '#000080', label: '0.0' },
        { position: 0.000125, color: '#0000ff', label: '1.25E-4' },
        { position: 0.000375, color: '#00ffff', label: '3.75E-4' },
        { position: 0.000625, color: '#ffff00', label: '6.25E-4' },
        { position: 0.000875, color: '#ff0000', label: '8.75E-4' },
        { position: 0.001, color: '#800000', label: '1E-3 [mol / m^2]' },
      ],
    },
    description: () =>
      t`# Formaldehyde (HCHO)\n\n\n\nLong term satellite observations of tropospheric formaldehyde (HCHO) are essential to support air quality and chemistry-climate related studies from the regional to the global scale. The seasonal and inter-annual variations of the formaldehyde distribution are principally related to temperature changes and fire events, but also to changes in anthropogenic (human-made) activities. Its lifetime being of the order of a few hours, HCHO concentrations in the boundary layer can be directly related to the release of short-lived hydrocarbons, which mostly cannot be observed directly from space. Measurements are in mol per square meter (mol/ m^2).\n\n\n\nMore info [here.](http://www.tropomi.eu/data-products/formaldehyde)`,
  },

  {
    match: [{ datasourceId: 'S5_SO2', layerId: 'SO2_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 0.01,
      gradients: [
        { position: 0, color: '#000080', label: '0.0' },
        { position: 0.00125, color: '#0000ff', label: '1.25E-3' },
        { position: 0.00375, color: '#00ffff', label: '3.75E-3' },
        { position: 0.00625, color: '#ffff00', label: '6.25E-3' },
        { position: 0.00875, color: '#ff0000', label: '8.75E-3' },
        { position: 0.01, color: '#800000', label: '1E-2 [mol / m^2]' },
      ],
    },
    description: () =>
      t`# Sulfur Dioxide (SO2)\n\n\n\nSulphur dioxide enters the Earth’s atmosphere through both natural and anthropogenic (human made) processes. It plays a role in chemistry on a local and global scale and its impact ranges from short term pollution to effects on climate. Only about 30% of the emitted SO2 comes from natural sources; the majority is of anthropogenic origin. Sentinel-5P/TROPOMI instrument samples the Earth’s surface with a revisit time of one day with a spatial resolution of 3.5 x 7 km which allows the resolution of fine details including the detection of smaller SO2 plumes. Measurements are in mol per square meter (mol/ m^2).\n\n\n\nMore info [here.](http://www.tropomi.eu/data-products/sulphur-dioxide)`,
  },

  {
    match: [{ datasourceId: 'S5_O3', layerId: 'O3_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 0.36,
      gradients: [
        { position: 0, color: '#000080', label: '0.0' },
        { position: 0.045, color: '#0000ff', label: '0.045' },
        { position: 0.135, color: '#00ffff', label: '0.135' },
        { position: 0.225, color: '#ffff00', label: '0.225' },
        { position: 0.315, color: '#ff0000', label: '0.315' },
        { position: 0.36, color: '#800000', label: '0.36 [mol / m^2]' },
      ],
    },
    description: () =>
      t`# Ozone (O3)\n\n\n\nOzone is of crucial importance for the equilibrium of the Earth atmosphere. In the stratosphere, the ozone layer shields the biosphere from dangerous solar ultraviolet radiation. In the troposphere, it acts as an efficient cleansing agent, but at high concentration it also becomes harmful to the health of humans, animals, and vegetation. Ozone is also an important greenhouse-gas contributor to ongoing climate change. Since the discovery of the Antarctic ozone hole in the 1980s and the subsequent Montreal Protocol regulating the production of chlorine-containing ozone-depleting substances, ozone has been routinely monitored from the ground and from space. Measurements are in mol per square meter (mol/ m^2)\n\n\n\nMore info [here.](http://www.tropomi.eu/data-products/total-ozone-column)`,
  },

  {
    match: [{ datasourceId: 'S5_NO2', layerId: 'NO2_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 0.0001,
      gradients: [
        { position: 0, color: '#000080', label: '0.0' },
        { position: 0.0000125, color: '#0000ff', label: '1.25E-5' },
        { position: 0.0000375, color: '#00ffff', label: '3.75E-5' },
        { position: 0.0000625, color: '#ffff00', label: '6.25E-5' },
        { position: 0.0000875, color: '#ff0000', label: '8.75E-5' },
        { position: 0.0001, color: '#800000', label: '1.0E-4 [mol / m^2]' },
      ],
    },
    description: () =>
      t`# Nitrogen Dioxide (NO2)\n\n\n\nNitrogen dioxide (NO2) and nitrogen oxide (NO) together are usually referred to as nitrogen oxides. They are important trace gases in the Earth’s atmosphere, present in both the troposphere and the stratosphere. They enter the atmosphere as a result of anthropogenic activities (particularly fossil fuel combustion and biomass burning) and natural processes (such as microbiological processes in soils, wildfires and lightning). Measurements are in mol per square meter (mol/ m^2).\n\n\n\nMore info [here.](http://www.tropomi.eu/data-products/nitrogen-dioxide)`,
  },

  {
    match: [{ datasourceId: 'S5_CO', layerId: 'CO_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 0.1,
      gradients: [
        { position: 0, color: '#000080', label: '0.0' },
        { position: 0.0125, color: '#0000ff', label: '0.0125' },
        { position: 0.0375, color: '#00ffff', label: '0.0375' },
        { position: 0.0625, color: '#ffff00', label: '0.0625' },
        { position: 0.0875, color: '#ff0000', label: '0.0875' },
        { position: 0.1, color: '#800000', label: '0.1 [mol / m^2]' },
      ],
    },
    description: () =>
      t`# Carbon Monoxide (CO)\n\n\n\nCarbon monoxide (CO) is an important atmospheric trace gas. In certain urban areas, it is a major atmospheric pollutant. Main sources of CO are combustion of fossil fuels, biomass burning, and atmospheric oxidation of methane and other hydrocarbons. The carbon monoxide total column is measured in mol per square meter (mol/ m^2).\n\n\n\nMore info [here.](http://www.tropomi.eu/data-products/carbon-monoxide)`,
  },

  {
    match: [
      { datasourceId: 'S5_AER_AI', layerId: 'AER_AI_340_AND_380_VISUALIZED' },
      { datasourceId: 'S5_AER_AI', layerId: 'AER_AI_354_AND_388_VISUALIZED' },
    ],
    legend: {
      type: 'continuous',
      minPosition: -1.0,
      maxPosition: 5.0,
      gradients: [
        { position: -1.0, color: '#000080', label: '-1.0' },
        { position: -0.25, color: '#0000ff', label: '-0.25' },
        { position: 1.25, color: '#00ffff', label: '1.25' },
        { position: 2.75, color: '#ffff00', label: '2.75' },
        { position: 4.25, color: '#ff0000', label: '4.25' },
        { position: 5, color: '#800000', label: '5' },
      ],
    },
    description: () =>
      t`# Aerosol Index\n\nThe Aerosol Index (AI) is a qualitative index indicating the presence of elevated layers of aerosols in the atmosphere. It can be used to detect the presence of UV absorbing aerosols such as desert dust and volcanic ash plumes. Positive values (from light blue to red) indicate the presence of UV-absorbing aerosol. This index is calculated for two pairs of wavelengths: 340/380 nm and 354/388 nm.\n\nMore info [here.](https://earth.esa.int/web/sentinel/technical-guides/sentinel-5p/level-2/aerosol-index)`,
  },

  {
    match: [{ datasourceId: 'S5_CLOUD', layerId: 'CLOUD_BASE_HEIGHT_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0,
      maxPosition: 20000,
      gradients: [
        { position: 0, color: '#000080', label: '0' },
        { position: 2500, color: '#0000ff', label: '2500' },
        { position: 7500, color: '#00ffff', label: '7500' },
        { position: 12500, color: '#ffff00', label: '12500' },
        { position: 17500, color: '#ff0000', label: '17500' },
        { position: 20000, color: '#800000', label: '20000 [m]' },
      ],
    },
    description: () => t`# Cloud base height\n\nHeight of cloud base measured in meters (m).`,
  },

  {
    match: [{ datasourceId: 'S5_CLOUD', layerId: 'CLOUD_BASE_PRESSURE_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 10000.0,
      maxPosition: 110000.0,
      gradients: [
        { position: 10000, color: '#000080', label: '10000' },
        { position: 22500, color: '#0000ff', label: '22500' },
        { position: 47500, color: '#00ffff', label: '47500' },
        { position: 72500, color: '#ffff00', label: '72500' },
        { position: 97500, color: '#ff0000', label: '97500' },
        { position: 110000, color: '#800000', label: '110000 [Pa]' },
      ],
    },
    description: () => t`# Cloud base pressure\n\nPressure measured at cloud base in Pascal (Pa).`,
  },

  {
    match: [{ datasourceId: 'S5_CLOUD', layerId: 'CLOUD_FRACTION_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 1.0,
      gradients: [
        { position: 0, color: '#000080', label: '0' },
        { position: 0.125, color: '#0000ff', label: '0.125' },
        { position: 0.375, color: '#00ffff', label: '0.375' },
        { position: 0.625, color: '#ffff00', label: '0.625' },
        { position: 0.875, color: '#ff0000', label: '0.875' },
        { position: 1, color: '#800000', label: '1' },
      ],
    },
    description: () =>
      t`# Effective radiometric cloud fraction\n\nEffective radiometric cloud fraction represents the portion of the Earth's surface covered by clouds, divided by the total surface. Clouds have shielding, albedo, and in-cloud absorption effects on trace gas retrieval. The effective radiometric cloud fraction is an important parameter to correct these effects.`,
  },

  {
    match: [{ datasourceId: 'S5_CLOUD', layerId: 'CLOUD_OPTICAL_THICKNESS_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 250.0,
      gradients: [
        { position: 0, color: '#000080', label: '0' },
        { position: 30, color: '#0000ff', label: '30' },
        { position: 95, color: '#00ffff', label: '95' },
        { position: 155, color: '#ffff00', label: '155' },
        { position: 220, color: '#ff0000', label: '220' },
        { position: 250, color: '#800000', label: '250' },
      ],
    },
    description: () =>
      t`# Cloud optical thickness\n\nThe cloud thickness is a key parameter to characterise optical properties of clouds. It is a measure of how much sunlight passes through the cloud to reach Earth's surface. The higher a cloud's optical thickness, the more sunlight the cloud is scattering and reflecting. Dark blue shows where there are low cloud optical thickness values and red shows larger cloud optical thickness.`,
  },

  {
    match: [{ datasourceId: 'S5_CLOUD', layerId: 'CLOUD_TOP_HEIGHT_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 0.0,
      maxPosition: 20000.0,
      gradients: [
        { position: 0, color: '#000080', label: '0' },
        { position: 2500, color: '#0000ff', label: '2500' },
        { position: 7500, color: '#00ffff', label: '7500' },
        { position: 12500, color: '#ffff00', label: '12500' },
        { position: 17500, color: '#ff0000', label: '17500' },
        { position: 20000, color: '#800000', label: '20000 [m]' },
      ],
    },
    description: () => t`# Cloud top height\n\nHeight of cloud top measured in meters (m).`,
  },

  {
    match: [{ datasourceId: 'S5_CLOUD', layerId: 'CLOUD_TOP_PRESSURE_VISUALIZED' }],
    legend: {
      type: 'continuous',
      minPosition: 10000.0,
      maxPosition: 110000.0,
      gradients: [
        { position: 10000, color: '#000080', label: '10000' },
        { position: 22500, color: '#0000ff', label: '22500' },
        { position: 47500, color: '#00ffff', label: '47500' },
        { position: 72500, color: '#ffff00', label: '72500' },
        { position: 97500, color: '#ff0000', label: '97500' },
        { position: 110000, color: '#800000', label: '110000 [Pa]' },
      ],
    },
    description: () => t`# Cloud top pressure\n\nPressure measured at cloud top in Pascal (Pa).`,
  },

  {
    match: [{ datasourceId: 'AWS_L8L1C', layerId: 'THERMAL' }],
    legend: {
      type: 'continuous',
      minPosition: 223,
      maxPosition: 348,
      gradients: [
        { position: 223, color: '#003d99', label: '<= -50' },
        { position: 253, color: '#2e82ff', label: '-20' },
        { position: 263, color: '#80b3ff', label: '-10' },
        { position: 272, color: '#e0edff' },
        { position: 273, color: '#ffffff', label: '0' },
        { position: 274, color: '#fefce7' },
        { position: 283, color: '#FDE191', label: '10' },
        { position: 293, color: '#f69855', label: '20' },
        { position: 303, color: '#f66927', label: '30' },
        { position: 323, color: '#aa2d1d', label: '50' },
        { position: 342, color: '#650401', label: '90' },
        { position: 348, color: '#3d0200', label: '>= 100 [°C]' },
      ],
    },
    description: () =>
      t`# Thermal band 10\n\nThis thermal visualization is based on band 10 (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). At the central wavelength of 10895 nm it measures in the thermal infrared, or TIR. Instead of measuring the temperature of the air, like weather stations do, band 10 reports on the ground itself, which is often much hotter. Thermal band 10 is useful in providing surface temperatures and is collected with a 100-meter resolution.\n\n\n\nMore info [here](https://www.usgs.gov/faqs/what-are-band-designations-landsat-satellites?qt-news_science_products=0#qt-news_science_products) and [here.](https://landsat.gsfc.nasa.gov/landsat-8/landsat-8-bands/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '3_NDVI' },
      { datasourceId: 'S2L2A', layerId: '3_NDVI' },
      { datasourceId: 'ENVISAT_MERIS', layerId: 'NDVI' },
      { datasourceId: 'S2L1C', layerId: 'NORMALIZED-DIFFERENCE-VEGETATION-INDEX-NDVI' },
      { datasourceId: 'S2L2A', layerId: 'NORMALIZED-DIFFERENCE-VEGETATION-INDEX-NDVI' },
      { datasourceId: 'AWS_L8L1C', layerId: '4-NDVI' },
      { datasourceId: 'ESA_L8', layerId: '3_NDVI' },
      { datasourceId: 'ESA_L7', layerId: '3_NDVI' },
      { datasourceId: 'ESA_L5', layerId: '3_NDVI' },
      { datasourceId: 'MODIS', layerId: 'NDVI' },
      { datasourceId: 'S2L1C', layerId: '6_NDVI' },
      { datasourceId: 'S2L2A', layerId: '6_NDVI' },
      { datasourceId: 'S2L1C', layerId: '5_NDVI' },
      { datasourceId: 'S2L2A', layerId: '5_NDVI' },
    ],
    legend: {
      type: 'continuous',
      minPosition: -0.2,
      maxPosition: 1.1,
      gradients: [
        { position: -0.2, color: 'rgb(5%,5%,5%)', label: '- 1' },
        { position: -0.1, color: 'rgb(5%,5%,5%)', label: '- 0.5' },
        { position: -0.1, color: 'rgb(75%,75%,75%)' },
        { position: 0, color: 'rgb(75%,75%,75%)', label: '- 0.2' },
        { position: 0, color: 'rgb(86%,86%,86%)' },
        { position: 0.1, color: 'rgb(86%,86%,86%)', label: '- 0.1' },
        { position: 0.1, color: 'rgb(92%,92%,92%)' },
        { position: 0.2, color: 'rgb(92%,92%,92%)', label: ' 0' },
        { position: 0.2, color: 'rgb(100%,98%,80%)' },
        { position: 0.25, color: 'rgb(100%,98%,80%)' },
        { position: 0.25, color: 'rgb(93%,91%,71%)' },
        { position: 0.3, color: 'rgb(93%,91%,71%)' },
        { position: 0.3, color: 'rgb(87%,85%,61%)' },
        { position: 0.35, color: 'rgb(87%,85%,61%)' },
        { position: 0.35, color: 'rgb(80%,78%,51%)' },
        { position: 0.4, color: 'rgb(80%,78%,51%)' },
        { position: 0.4, color: 'rgb(74%,72%,42%)' },
        { position: 0.45, color: 'rgb(74%,72%,42%)' },
        { position: 0.45, color: 'rgb(69%,76%,38%)' },
        { position: 0.5, color: 'rgb(69%,76%,38%)' },
        { position: 0.5, color: 'rgb(64%,80%,35%)' },
        { position: 0.55, color: 'rgb(64%,80%,35%)' },
        { position: 0.55, color: 'rgb(57%,75%,32%)' },
        { position: 0.6, color: 'rgb(57%,75%,32%)', label: ' 0.2' },
        { position: 0.6, color: 'rgb(50%,70%,28%)' },
        { position: 0.65, color: 'rgb(50%,70%,28%)' },
        { position: 0.65, color: 'rgb(44%,64%,25%)' },
        { position: 0.7, color: 'rgb(44%,64%,25%)' },
        { position: 0.7, color: 'rgb(38%,59%,21%)' },
        { position: 0.75, color: 'rgb(38%,59%,21%)' },
        { position: 0.75, color: 'rgb(31%,54%,18%)' },
        { position: 0.8, color: 'rgb(31%,54%,18%)' },
        { position: 0.8, color: 'rgb(25%,49%,14%)' },
        { position: 0.85, color: 'rgb(25%,49%,14%)' },
        { position: 0.85, color: 'rgb(19%,43%,11%)' },
        { position: 0.9, color: 'rgb(19%,43%,11%)' },
        { position: 0.9, color: 'rgb(13%,38%,7%)' },
        { position: 0.95, color: 'rgb(13%,38%,7%)' },
        { position: 0.95, color: 'rgb(6%,33%,4%)' },
        { position: 1.0, color: 'rgb(6%,33%,4%)' },
        { position: 1.0, color: 'rgb(0%,27%,0%)', label: ' 0.6' },
        { position: 1.1, color: 'rgb(0%,27%,0%)', label: ' 1' },
      ],
    },
    titles: () => ({
      [EDUCATION_MODE.id]: 'NDVI',
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: 'Normalized Difference Vegetation Index',
    }),
    description: () =>
      t`# Normalized Difference Vegetation Index (NDVI)\n\nThe normalized difference vegetation index is a simple, but effective index for quantifying green vegetation. It is a measure of the state of vegetation health based on how plants reflect light at certain wavelengths. The value range of the NDVI is -1 to 1. Negative values of NDVI (values approaching -1) correspond to water. Values close to zero (-0.1to 0.1) generally correspond to barren areas of rock, sand, or snow. Low, positive values represent shrub and grassland (approximately 0.2 to 0.4), while high values indicate temperate and tropical rainforests (values approaching 1).\n\nMore info [here](https://custom-scripts.sentinel-hub.com/sentinel-2/ndvi/) and [here.](https://eos.com/ndvi/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '4_EVI' },
      { datasourceId: 'S2L2A', layerId: '4_EVI' },
    ],
    titles: () => ({
      [EDUCATION_MODE.id]: `EVI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Enhanced Vegetation Index`,
    }),
    description: () =>
      t`# Enhanced Vegetation Index (EVI)\n\nThe enhanced vegetation index (EVI) is an 'optimized' vegetation index as it corrects for soil background signals and atmospheric influences. It is very useful in areas of dense canopy cover. The range of values for EVI is -1 to 1, with healthy vegetation generally around 0.20 to 0.80.\n\n\n\n\n\nMore infos [here](https://custom-scripts.sentinel-hub.com/sentinel-2/evi/) and [here.](https://earthobservatory.nasa.gov/features/MeasuringVegetation/measuring_vegetation_4.php)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: '5_ARVI', themeId: 'FORESTRY' },
      { datasourceId: 'S2L2A', layerId: '5_ARVI', themeId: 'FORESTRY' },
    ],
    titles: () => ({
      [EDUCATION_MODE.id]: `ARVI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Atmospherically Resistant Vegetation Index `,
    }),
    description: () =>
      t`# Atmospherically Resistant Vegetation Index (ARVI)\n\nThe Atmospherically Resistant Vegetation Index (ARVI) is a vegetation index that minimizes the effects of atmospheric scattering. It is most useful for regions with high content of atmospheric aerosol (fog, dust, smoke, air pollution). The range for an ARVI is -1 to 1 where green vegetation generally falls between values of 0.20 to 0.80.\n\n\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/sentinel-2/arvi/) and [here.](https://eos.com/blog/6-spectral-indexes-on-top-of-ndvi-to-make-your-vegetation-analysis-complete/)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: '6_SAVI', themeId: 'FORESTRY' },
      { datasourceId: 'S2L2A', layerId: '6_SAVI', themeId: 'FORESTRY' },
      { datasourceId: 'S2L1C', layerId: 'SAVI', themeId: 'AGRICULTURE' },
      { datasourceId: 'S2L2A', layerId: 'SAVI', themeId: 'AGRICULTURE' },
    ],
    titles: () => ({
      [EDUCATION_MODE.id]: `SAVI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Soil Adjusted Vegetation Index`,
    }),
    description: () =>
      t`# Soil Adjusted Vegetation Index (SAVI)\n\n The Soil Adjusted Vegetation Index is similar to Normalized Difference Vegetation Index (NDVI) but is used in areas where vegetative cover is low (< 40%). The index is a transformation technique that minimizes soil brightness influences from spectral vegetation indices involving red and near-infrared (NIR) wavelengths. The index is helpful when analysing young crops, arid regions with sparse vegetation and exposed soil surfaces.\n\n\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/sentinel-2/savi/) and [here.](https://eos.com/blog/6-spectral-indexes-on-top-of-ndvi-to-make-your-vegetation-analysis-complete/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '7_MARI' },
      { datasourceId: 'S2L2A', layerId: '7_MARI' },
    ],
    titles: () => ({
      [EDUCATION_MODE.id]: `MARI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Modified Anthocyanin Reflectance Index`,
    }),
    description: () =>
      t`# Modified Anthocyanin Reflectance Index (mARI/ARI2)\n\nAnthocyanins are pigments common in higher plants, causing their red, blue and purple coloration. They provide valuable information about the physiological status of plants, as they are considered indicators of various types of plant stresses. The reflectance of anthocyanin is highest around 550nm. However, the same wavelengths are reflected by chlorophyll as well. To isolate the anthocyanins, the 700nm spectral band, that reflects only chlorophyll and not anthocyanins, is subtracted.\n\nTo correct for leaf density and thickness, the near infrared spectral band (in the recommended wavelengths of 760-800nm), which is related to leaf scattering, is added to the basic ARI index. The new index is called modified ARI or mARI (also ARI2).\n\nmARI values for the examined trees in [this original article](https://custom-scripts.sentinel-hub.com/sentinel-2/mari/) ranged in values from 0 to 8.\n\n\n\n\n\nMore info [here.](https://digitalcommons.unl.edu/cgi/viewcontent.cgi?article=1227&context=natrespapers)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '4_GREEN-CITY' },
      { datasourceId: 'S2L2A', layerId: '4_GREEN-CITY' },
    ],

    description: () =>
      t`# Green City Script\n\nThe Green city script aims to raise awareness of green areas in cities around the world. The script takes into account the Normalized Difference Vegetation Index (NDVI) and true color wavelengths; it separates built up areas from vegetated ones, making it useful for detecting urban areas. Built up areas are displayed in grey and vegetation is displayed in green.\n\n\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/green_city/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '3_URBAN-CLASSIFIED' },
      { datasourceId: 'S2L2A', layerId: '3_URBAN-CLASSIFIED' },
    ],

    description: () =>
      t`# Urban Classified Script\n\nThe Urban Classified script aims to detect built up areas by separating them from barren ground, vegetation and water. Areas with a high moisture content are returned in blue; areas indicating built up areas are returned in white; vegetated areas are returned in green; everything else indicates barren ground and is displayed in brown colors.\n\n\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/urban_classified/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '5_URBAN-LAND-INFRARED-COLOR' },
      { datasourceId: 'S2L2A', layerId: '5_URBAN-LAND-INFRARED-COLOR' },
    ],

    description: () =>
      t`# Urban Land Infrared Color Script\n\nThis script, made by Leo Tolari, combines true color visualization with near infrared (NIR) and shortwave infrared (SWIR) wavelengths. The script highlights urban areas better than true color, while still looking natural.\n\n\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/urban_land_infrared/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '4_MOISTURE-STRESS' },
      { datasourceId: 'S2L2A', layerId: '4_MOISTURE-STRESS' },
      { datasourceId: 'S2L1C', layerId: '9_MOISTURE-STRESS' },
      { datasourceId: 'S2L2A', layerId: '9_MOISTURE-STRESS' },
    ],

    description: () =>
      t`# NDMI for Moisture Stress\n\nThe Normalized Difference Moisture Index (NDMI) for moisture stress can be used to detect irrigation. For all the index values above 0, knowing the land use and land cover, it is possible to determine whether irrigation has taken place. Knowing the type of crop grown (e.g. citrus crops), it is possible to identify whether irrigation is being effective or not during the crucial growing summer season, as well as find out if some parts of the farm are being under or over-irrigated.\n\n\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/ndmi_special/#)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: '5-MOISTURE-INDEX1' },
      { datasourceId: 'S2L2A', layerId: '5-MOISTURE-INDEX1' },
      { datasourceId: 'S2L1C', layerId: 'MOISTURE-INDEX' },
      { datasourceId: 'S2L2A', layerId: 'MOISTURE-INDEX' },
      { datasourceId: 'S2L1C', layerId: '2_MOISTURE-INDEX' },
      { datasourceId: 'S2L2A', layerId: '2_MOISTURE-INDEX' },
      { datasourceId: 'S2L1C', layerId: '99_MOISTURE-INDEX' },
      { datasourceId: 'S2L2A', layerId: '99_MOISTURE-INDEX' },
    ],
    legend: {
      type: 'continuous',
      minPosition: -0.8,
      maxPosition: 0.8,
      gradients: [
        { position: -0.8, color: 'rgb(50%,0%,0%)', label: '< -0.8' },
        { position: -0.64, color: 'rgb(100%,0%,0%)', label: '-0.24' },
        { position: -0.32, color: 'rgb(100%,100%,0%)', label: '-0.032' },
        { position: 0, label: '0' },
        { position: 0.32, color: 'rgb(0%,100%,100%)', label: '0.032' },
        { position: 0.64, color: 'rgb(0%,0%,100%)', label: '0.24' },
        { position: 0.8, color: 'rgb(0%,0%,50%)', label: '> 0.8' },
      ],
    },
    titles: () => ({
      [EDUCATION_MODE.id]: `NDMI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Normalized Difference Moisture Index`,
    }),
    description: () =>
      t`# Normalized Difference Moisture Index (NDMI)\n\nThe normalized difference moisture Index (NDMI) is used to determine vegetation water content and monitor droughts. The value range of the NDMI is -1 to 1. Negative values of NDMI (values approaching -1) correspond to barren soil. Values around zero (-0.2 to 0.4) generally correspond to water stress. High, positive values represent high canopy without water stress (approximately 0.4 to 1).\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/ndmi/)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: '7-NDWI' },
      { datasourceId: 'S2L2A', layerId: '7-NDWI' },
      { datasourceId: 'S2L1C', layerId: '3_NDWI' },
      { datasourceId: 'S2L2A', layerId: '3_NDWI' },
      { datasourceId: 'MODIS', layerId: 'NDWI' },
    ],
    legend: {
      type: 'continuous',
      minPosition: -0.8,
      maxPosition: 0.8,
      gradients: [
        { position: -0.8, color: 'rgb(0%,100%,0%)', label: '< -0.8' },
        { position: 0, color: 'rgb(100%,100%,100%)', label: '0' },
        { position: 0.8, color: 'rgb(0%,0%,100%)', label: '0.8' },
      ],
    },
    titles: () => ({
      [EDUCATION_MODE.id]: `NDWI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Normalized Difference Water Index`,
    }),
    description: () =>
      t`# Normalized Difference Water Index (NDWI)\n\nThe normalized difference water index is most appropriate for water body mapping. Values of water bodies are larger than 0.5. Vegetation has smaller values. Built-up features have positive values between zero and 0.2.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/ndwi/)`,
  },

  {
    match: [{ datasourceId: 'MODIS', layerId: 'NDWI' }],
    legend: {
      type: 'continuous',
      minPosition: -0.8,
      maxPosition: 0.8,
      gradients: [
        { position: -0.8, color: 'rgb(0%,100%,0%)', label: '< -0.8' },
        { position: 0, color: 'rgb(100%,100%,100%)', label: '0' },
        { position: 0.8, color: 'rgb(0%,0%,100%)', label: '0.8' },
      ],
    },
    titles: () => ({
      [EDUCATION_MODE.id]: `NDWI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Normalized Difference Water Index`,
    }),
    description: () =>
      t`# Normalized Difference Water Index (NDWI)\n\nThe normalized difference water index is most appropriate for water body mapping. Values of water bodies are larger than 0.5. Vegetation has smaller values. Built-up features have positive values between zero and 0.2.`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '2_FALSE_COLOR' },
      { datasourceId: 'S2L2A', layerId: '2_FALSE_COLOR' },
      { datasourceId: 'S2L1C', layerId: 'FALSE-COLOR' },
      { datasourceId: 'S2L2A', layerId: 'FALSE-COLOR' },
      { datasourceId: 'S2L1C', layerId: '2_FALSE-COLOR' },
      { datasourceId: 'S2L2A', layerId: '2_FALSE-COLOR' },
    ],

    description: () =>
      t`# False color composite\n\nA false color composite uses at least one non-visible wavelength to image Earth. The false color composite using near infrared, red and green bands is very popular (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). The false colour composite is most commonly used to assess plant density and health, since plants reflect near infrared and green light, while they absorb red. Cities and exposed ground are grey or tan, and water appears blue or black.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/sentinel-2/false_color_infrared/) and [here.](https://earthobservatory.nasa.gov/features/FalseColor/page6.php)`,
  },

  {
    match: [{ datasourceId: 'AWS_L8L1C', layerId: '3_FALSE_COLOR' }],

    description: () =>
      t`# False color composite\n\nA false color composite uses at least one non-visible wavelength to image Earth. The false color composite using near infrared, red and green bands is very popular (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). The false colour composite is most commonly used to assess plant density and health, since plants reflect near infrared and green light, while they absorb red. Cities and exposed ground are grey or tan, and water appears blue or black.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/landsat-8/composites/) and [here.](https://gisgeography.com/landsat-8-bands-combinations/)`,
  },

  {
    match: [
      { datasourceId: 'ESA_L5', layerId: '2_FALSE_COLOR' },
      { datasourceId: 'ESA_L7', layerId: '2_FALSE_COLOR' },
    ],

    description: () =>
      t`# False color composite\n\nA false color composite uses at least one non-visible wavelength to image Earth. The false color composite using near infrared, red and green bands is very popular (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). The false colour composite is most commonly used to assess plant density and health, since plants reflect near infrared and green light, while they absorb red. Cities and exposed ground are grey or tan, and water appears blue or black.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/Landsat-57/composites/) and [here.](https://earthobservatory.nasa.gov/features/FalseColor)`,
  },

  {
    match: [{ datasourceId: 'ENVISAT_MERIS', layerId: 'FALSE_COLOR' }],

    description: () =>
      t`# False color composite\n\nA false color composite uses at least one non-visible wavelength to image Earth. The false color composite using near infrared, red and green bands is very popular (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). The false colour composite is most commonly used to assess plant density and health, since plants reflect near infrared and green light, while they absorb red. Cities and exposed ground are grey or tan, and water appears blue or black.\n\n\n\nMore info [here.](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/meris/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '1_TRUE_COLOR' },
      { datasourceId: 'S2L2A', layerId: '1_TRUE_COLOR' },
      { datasourceId: 'S2L1C', layerId: 'TRUE-COLOR' },
      { datasourceId: 'S2L2A', layerId: 'TRUE-COLOR' },
      { datasourceId: 'S2L1C', layerId: '1_TRUE-COLOR' },
      { datasourceId: 'S2L2A', layerId: '1_TRUE-COLOR' },
    ],

    description: () =>
      t`# True color composite\n\nSensors carried by satellites can image Earth in different regions of the electromagnetic spectrum. Each region in the spectrum is referred to as a band. Sentinel-2 has 13 bands. True color composite uses visible light bands red, green and blue in the corresponding red, green and blue color channels, resulting in a natural colored product, that is a good representation of the Earth as humans would see it naturally.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/sentinel-2/composites/) and [here.](http://www.fis.uni-bonn.de/en/recherchetools/infobox/professionals/remote-sensing-systems/spectroscopy).`,
  },

  {
    match: [{ datasourceId: 'ESA_L5', layerId: '1_TRUE_COLOR' }],

    description: () =>
      t`# True color composite\n\nSensors carried by satellites can image Earth in different regions of the electromagnetic spectrum. Each region in the spectrum is referred to as a band. Landsat 5 has 7 bands. True color composite uses visible light bands red, green and blue in the corresponding red, green and blue color channels, resulting in a natural colored product, that is a good representation of the Earth as humans would see it naturally.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/Landsat-57/composites/) and [here.](https://www.usgs.gov/land-resources/nli/landsat/landsat-5?qt-science_support_page_related_con=0#qt-science_support_page_related_con)`,
  },

  {
    match: [{ datasourceId: 'ESA_L7', layerId: '1_TRUE_COLOR' }],

    description: () =>
      t`# True color composite\n\nSensors carried by satellites can image Earth in different regions of the electromagnetic spectrum. Each region in the spectrum is referred to as a band. Landsat 7 has 8 bands. True color composite uses visible light bands red, green and blue in the corresponding red, green and blue color channels, resulting in a natural colored product, that is a good representation of the Earth as humans would see it naturally.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/Landsat-57/composites/) and [here.](https://www.usgs.gov/land-resources/nli/landsat/landsat-7?qt-science_support_page_related_con=0#qt-science_support_page_related_con)`,
  },

  {
    match: [
      { datasourceId: 'AWS_L8L1C', layerId: '1_TRUE_COLOR' },
      { datasourceId: 'AWS_L8L1C', layerId: '1_TRUE-COLOR' },
      { datasourceId: 'AWS_L8L1C', layerId: 'TRUE-COLOR' },
    ],

    description: () =>
      t`# True color composite\n\nSensors carried by satellites can image Earth in different regions of the electromagnetic spectrum. Each region in the spectrum is referred to as a band. Landsat 8 has 11 bands. True color composite uses visible light bands red, green and blue in the corresponding red, green and blue color channels, resulting in a natural colored product, that is a good representation of the Earth as humans would see it naturally.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/landsat-8/composites/) and [here.](https://landsat.gsfc.nasa.gov/landsat-8/landsat-8-bands/)`,
  },

  {
    match: [{ datasourceId: 'ENVISAT_MERIS', layerId: '1_TRUE_COLOR' }],

    description: () =>
      t`# True color composite\n\nSensors carried by satellites can image Earth in different regions of the electromagnetic spectrum Each region in the spectrum is referred to as a band. True color composite uses visible light bands red, green and blue in the corresponding red, green and blue color channels, resulting in a natural colored product, that is a good representation of the Earth as humans would see it naturally.\n\n\n\nMore info [here.](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/meris/)`,
  },

  {
    match: [{ datasourceId: 'S3OLCI', layerId: '1_TRUE_COLOR' }],

    description: () =>
      t`# True color composite\n\nSensors carried by satellites can image Earth in different regions of the electromagnetic spectrum . Each region in the spectrum is referred to as a band. True color composite uses visible light bands red, green and blue in the corresponding red, green and blue color channels, resulting in a natural colored product, that is a good representation of the Earth as humans would see it naturally.\n\n\n\nMore info [here.](https://sentinel.esa.int/web/sentinel/user-guides/sentinel-3-olci/overview/heritage)`,
  },

  {
    match: [{ datasourceId: 'S3OLCI', layerId: '6_TRUE-COLOR-HIGLIGHT-OPTIMIZED' }],

    description: () =>
      t`# Enhanced True Color Visualization\n\nThis script uses highlight optimization to avoid burnt out pixels and to even out the exposure. It makes clouds look natural and keep as much visual information as possible. Sentinel-3 OLCI tiles cover large areas, making it possible to observe large cloud formations, such as hurricanes.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-3/true_color_highlight_optimized/)`,
  },

  {
    match: [{ datasourceId: 'AWS_L8L1C', layerId: '2_TRUE_COLOR_PANSHARPENED' }],

    description: () =>
      t`# Pansharpened True Color\n\nThe pansharpened true color composite is done by using the usual true color data (red, green and blue (RGB)) and enhancing them by using the panchromatic band 8, or pan band (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). An image from the pan band is similar to black-and-white film: it combines light from the red, green, and blue parts of the spectrum into a single measure of overall visible reflectance. Pansharpened images have 2x the resolution of the usual true color composite, greatly enhancing the usefulness of Landsat imagery.\n\n\n\nMore info [here](https://blog.mapbox.com/pansharpening-for-higher-resolution-in-landsat-live-e4717cd7c356) and [here.](https://landsat.gsfc.nasa.gov/landsat-8/landsat-8-bands/)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: '4-FALSE-COLOR-URBAN' },
      { datasourceId: 'S2L2A', layerId: '4-FALSE-COLOR-URBAN' },
      { datasourceId: 'S2L1C', layerId: 'FALSE-COLOR-URBAN' },
      { datasourceId: 'S2L2A', layerId: 'FALSE-COLOR-URBAN' },
      { datasourceId: 'S2L1C', layerId: '2_FALSE-COLOR-URBAN' },
      { datasourceId: 'S2L2A', layerId: '2_FALSE-COLOR-URBAN' },
    ],

    description: () =>
      t`# False Color Urban composite\n\nThis composite is used to visualize urbanized areas more clearly. Vegetation is visible in shades of green, while urbanized areas are represented by white, grey, or purple. Soils, sand, and minerals are shown in a variety of colors. Snow and ice appear as dark blue, and water as black or blue. Flooded areas are very dark blue and almost black. The composite is useful for detecting wildfires and calderas of volcanoes, as they are displayed in shades of red and yellow.\n\n\n\nMore info [here.](https://eos.com/false-color/)`,
  },

  {
    match: [{ datasourceId: 'AWS_L8L1C', layerId: 'FALSE-COLOR-LAVA-FLOW' }],

    description: () =>
      t`# False Color Urban composite\n\nThis composite uses a combination of bands in visible and in short wave infrared (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). It displays vegetation in shades of green. While darker shades of green indicate denser vegetation, sparse vegetation have lighter shades. Urban areas are blue and soils have various shades of brown.\n\n\n\nMore info [here.](https://gisgeography.com/landsat-8-bands-combinations/)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'FALSE-COLOR-11-8-2' },
      { datasourceId: 'S2L2A', layerId: 'FALSE-COLOR-11-8-2' },
      { datasourceId: 'S2L1C', layerId: 'FALSE-COLOR-1182' },
      { datasourceId: 'S2L2A', layerId: 'FALSE-COLOR-1182' },
      { datasourceId: 'S2L1C', layerId: '6_AGRICULTURE' },
      { datasourceId: 'S2L2A', layerId: '6_AGRICULTURE' },
    ],

    description: () =>
      t`# Agriculture composite\n\nThis composite uses short-wave infrared, near-infrared and blue bands to monitor crop health (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). Both short-wave and near infrared bands are particularly good at highlighting dense vegetation, which appears dark green in the composite. Crops appear in a vibrant green and bare earth appears magenta.\n\n\n\nMore info [here](https://earthobservatory.nasa.gov/features/FalseColor/page5.php) and [here.](https://gisgeography.com/sentinel-2-bands-combinations/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '5_SNOW-CLASSIFIER' },
      { datasourceId: 'S2L2A', layerId: '5_SNOW-CLASSIFIER' },
    ],

    description: () =>
      t`# Snow Classifier\n\nThe Snow Classifier algorithm aims to detect snow by classifying pixels based on different brightness and Normalized Difference Snow Index (NDSI) thresholds. Values classified as snow are returned in bright vivid blue. The script can overestimate snow areas over clouds.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/snow_classifier/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '4_ULYSSYS-WATER-QUALITY-VIEWER' },
      { datasourceId: 'S2L2A', layerId: '4_ULYSSYS-WATER-QUALITY-VIEWER' },
    ],

    description: () =>
      t`# Ulyssys Water Quality Viewer (UWQV)\n\nThe script aims to dynamically visualize the chlorophyll and sediment conditions of water bodies, which are primary indicators of water quality. The chlorophyll content ranges in colors from dark blue (low chlorophyll content) through green to red (high chlorophyll content). Sediment concentrations are colored brown; opaque brown indicates high sediment content.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/ulyssys_water_quality_viewer/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '6-SWIR' },
      { datasourceId: 'S2L2A', layerId: '6-SWIR' },
      { datasourceId: 'S2L1C', layerId: '5_SWIR' },
      { datasourceId: 'S2L2A', layerId: '5_SWIR' },
      { datasourceId: 'S2L1C', layerId: 'SWIR' },
      { datasourceId: 'S2L2A', layerId: 'SWIR' },
    ],
    titles: () => ({
      [EDUCATION_MODE.id]: `SWIR`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Short Wave Infrared Composite`,
    }),
    description: () =>
      t`# Short wave infrared composite (SWIR)\n\nShort wave infrared (SWIR) measurements can help scientists estimate how much water is present in plants and soil, as water reflects SWIR wavelengths. Short wave infrared bands (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands) are also useful for distinguishing between cloud types (water clouds versus ice clouds), snow and ice, all of which appear white in visible light. In this composite vegetation appears in shades of green, soils and built-up areas are in various shades of brown, and water appears black. Newly burned land reflects strongly in SWIR bands, making them valuable for mapping fire damages. Each rock type reflects shortwave infrared light differently, making it possible to map out geology by comparing reflected SWIR light.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/composites/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '8-NDSI' },
      { datasourceId: 'S2L2A', layerId: '8-NDSI' },
      { datasourceId: 'S2L1C', layerId: '4_NDSI' },
      { datasourceId: 'S2L2A', layerId: '4_NDSI' },
    ],
    titles: () => ({
      [EDUCATION_MODE.id]: `NDSI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Normalised Difference Snow Index`,
    }),
    description: () =>
      t`# Normalised Difference Snow Index (NDSI)\n\nThe Sentinel-2 normalised difference snow index can be used to differentiate between cloud and snow cover as snow absorbs in the short-wave infrared light, but reflects the visible light, whereas cloud is generally reflective in both wavelengths. Snow cover is represented in bright vivid blue.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/sentinel-2/ndsi/) and [here.](https://earth.esa.int/web/sentinel/technical-guides/sentinel-2-msi/level-2a/algorithm)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '3_TONEMAPPED-NATURAL-COLOR' },
      { datasourceId: 'S2L2A', layerId: '3_TONEMAPPED-NATURAL-COLOR' },
      { datasourceId: 'S2L1C', layerId: '2_HIGHLIGHT-OPTIMIZED-NATURAL-COLOR' },
      { datasourceId: 'S2L2A', layerId: '2_HIGHLIGHT-OPTIMIZED-NATURAL-COLOR' },
    ],

    description: () =>
      t`# Highlight Optimized Natural Color\n\nThis script aims to display the Earth in beautiful natural color images. It uses highlight optimization to avoid burnt out pixels and to even out the exposure.\n\n\n\nMore info [here.](https://sentinel-hub.github.io/custom-scripts/sentinel-2/highlight_optimized_natural_color/#)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: '3_GEOLOGY-12-8-2' },
      { datasourceId: 'S2L2A', layerId: '3_GEOLOGY-12-8-2' },
    ],

    description: () =>
      t`# Geology 12, 8, 2 composite\n\nThis composite uses short-wave infrared (SWIR) band 12 to differentiate among different rock types (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). Each rock and mineral type reflects short-wave infrared light differently, making it possible to map out geology by comparing reflected SWIR light. Near infrared (NIR) band 8 highlights vegetation and band 2 detects moisture, both contributing to differentiation of ground materials. The composite is useful for finding geological formations and features (e.g. faults, fractures), lithology (e.g. granite, basalt, etc.) and mining applications.\n\n\n\nMore info [here.](https://www.euspaceimaging.com/wp-content/uploads/2018/06/EUSI-SWIR.pdf)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: '4_GEOLOGY-8-11-12' },
      { datasourceId: 'S2L2A', layerId: '4_GEOLOGY-8-11-12' },
    ],

    description: () =>
      t`# Geology 8, 11, 12 composite\n\nThis composite uses both short-wave infrared (SWIR) bands 11 and 12 to differentiate among different rock types (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands). Each rock and mineral type reflects shortwave infrared light differently, making it possible to map out geology by comparing reflected SWIR light. Near Infrared (NIR) band 8 highlights vegetation, contributing to differentiation of ground materials. Vegetation in the composite appears red. The composite is useful for differentiating vegetation, and land especially geologic features that can be useful for mining and mineral exploration.\n\n\n\nMore info [here](https://earthobservatory.nasa.gov/features/FalseColor/page5.php) and [here.](http://murphygeological.com/new---sentinel-2.html#)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'WILDFIRES-PIERRE-MARKUSE' },
      { datasourceId: 'S2L2A', layerId: 'WILDFIRES-PIERRE-MARKUSE' },
      { datasourceId: 'S2L1C', layerId: 'WILDFIRES' },
      { datasourceId: 'S2L2A', layerId: 'WILDFIRES' },
      { datasourceId: 'S2L1C', layerId: 'WILDFIRES-NORMAL-MODE' },
      { datasourceId: 'S2L2A', layerId: 'WILDFIRES-NORMAL-MODE' },
    ],

    description: () =>
      t`# Wildfires\n\nThis script, created by Pierre Markuse, visualizes wildfires using Sentinel-2 data. It combines natural color background with some NIR/SWIR data for smoke penetration and more detail, while adding highlights from B11 and B12 to show fires in red and orange colors.\n\n\n\nMore info [here.](https://pierre-markuse.net/2017/08/07/visualizing-wildfires-sentinel-2-imagery-eo-browser/)`,
  },

  {
    match: [
      { datasourceId: 'S3OLCI', layerId: '1_TRUE_COLOR_ENHANCED' },
      { datasourceId: 'S3OLCI', layerId: '2_ENHANCED-TRUE-COLOR' },
    ],

    description: () =>
      t`# Enhanced True Color\n\nThis script, created by Pierre Markuse, uses multiple bands (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands) and saturation and brightness control to enhance the true color visualization.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-3/enhanced_true_color-2/#)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'BURN-AREA-INDEX-BAI' },
      { datasourceId: 'S2L2A', layerId: 'BURN-AREA-INDEX-BAI' },
      { datasourceId: 'S2L1C', layerId: 'BURN-AREA-INDEX' },
      { datasourceId: 'S2L2A', layerId: 'BURN-AREA-INDEX' },
    ],
    legend: {
      type: 'continuous',
      minPosition: -1,
      maxPosition: 6,
      gradients: [
        { position: 0, color: 'rgb(100%,100%,100%)', label: '-1' },
        { position: 25, color: 'rgb(100%,52.73%,0%)', label: '' },
        { position: 50, color: 'rgb(100%,43.36%,0%)', label: '' },
        { position: 75, color: 'rgb(68.36%,0%,0%)', label: '' },
        { position: 100, color: 'rgb(0%,0%,0%)', label: '6' },
      ],
    },
    titles: () => ({
      [EDUCATION_MODE.id]: `BAI`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Burned Area Index`,
    }),
    description: () =>
      t`# Burned Area Index\n\nBurned Area Index takes advantage of the wider spectrum of Visible, Red-Edge, NIR and SWIR bands.\n\nValues description:()=> The range of values for the index is \`-1\` to \`1\` for burn scars, and \`1\` - \`6\` for active fires. Different fire intensities may result in different thresholds; the current values were calibrated, as per original author, on mostly Mediterranen regions.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/bais2/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'NORMALIZED-BURN-RATIO-NBR' },
      { datasourceId: 'S2L2A', layerId: 'NORMALIZED-BURN-RATIO-NBR' },
      { datasourceId: 'S2L1C', layerId: 'NORMALIZED-BURN-RATIO' },
      { datasourceId: 'S2L2A', layerId: 'NORMALIZED-BURN-RATIO' },
    ],
    legend: {
      type: 'continuous',
      minPosition: -1,
      maxPosition: 1,
      gradients: [
        { position: 0, color: 'rgb(100%,100%,100%)', label: '-1' },
        { position: 25, color: 'rgb(100%,52.73%,0%)', label: '' },
        { position: 50, color: 'rgb(100%,43.36%,0%)', label: '' },
        { position: 75, color: 'rgb(68.36%,0%,0%)', label: '' },
        { position: 100, color: 'rgb(0%,0%,0%)', label: '1' },
      ],
    },
    titles: () => ({
      [EDUCATION_MODE.id]: `NBR`,
    }),
    shortDescriptions: () => ({
      [EDUCATION_MODE.id]: `Normalized Burn Ratio`,
    }),
    description: () =>
      t`# Normalized Burn Ratio (NBR)\n\nNormalized Burn Ratio is frequently used to estimate burn severity. It uses near-infrared (NIR) and shortwave-infrared (SWIR) wavelengths. Healthy vegetation has a high reflectance in the near-infrared portion of the spectrum, and a low short-wave infrared reflectance. On the other hand, burned areas have a high shortwave infrared reflectance but low reflectance in the near infrared Darker pixels indicate burned areas.\n\n\n\nMore info [here](http://gsp.humboldt.edu/OLM/Courses/GSP_216_Online/lesson5-1/NBR.html) and [here.](https://mybinder.org/v2/gh/sentinel-hub/education/master?filepath=wildfires%2FWildfires%20from%20Satellite%20Images.ipynb)`,
  },
  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'ATMOSPHERIC-PENETRATION' },
      { datasourceId: 'S2L2A', layerId: 'ATMOSPHERIC-PENETRATION' },
    ],

    description: () =>
      t`# Atmospheric penetration\n\nThis composite uses different bands (a band is a region of the electromagnetic spectrum; a satellite sensor can image Earth in different bands) in the non-visible part of the electromagnetic spectrum to reduce the influence of the atmosphere in the image. Short wave infrared bands 11 and 12 are highly reflected by the heated areas, making them useful for fire and burned area mapping. Short wave infrared band 8, is on contrary, highly reflected by vegetation, which signifies absence of fire. Vegetation appears blue, displaying details related to the vegetation vigor. Healthy vegetation is shown in light blue while the stressed, sparse or/and arid vegetation appears in dull blue. Urban features are white, grey, cyan or purple.\n\n\n\nMore info [here.](https://eos.com/atmospheric-penetration/)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'BARREN-SOIL' },
      { datasourceId: 'S2L2A', layerId: 'BARREN-SOIL' },
      { datasourceId: 'S2L1C', layerId: '8_BARREN-SOIL' },
      { datasourceId: 'S2L2A', layerId: '8_BARREN-SOIL' },
    ],

    description: () =>
      t`# Barren Soil Visualization\n\nThe Barren Soil Visualization can be useful for soil mapping, to investigate the location of landslides or the extent of erosion in non-vegetated areas. This visualization shows all vegetation in green and the barren ground in red. Water appears black.\n\n\n\nMore info [here](https://custom-scripts.sentinel-hub.com/sentinel-2/barren_soil/) and [here.](https://medium.com/sentinel-hub/create-useful-and-beautiful-satellite-images-with-custom-scripts-8ef0e6a474c6)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'TRUE-COLOR-LAVA-FLOW' },
      { datasourceId: 'S2L2A', layerId: 'TRUE-COLOR-LAVA-FLOW' },
    ],

    description: () =>
      t`# True Color with IR Highlights composite\n\nThis composite enhances the true color visualization by adding the shortwave infrared wavelengths to amplify details. It displays heated areas in red/orange.\n\n\n\nMore info [here.](https://medium.com/sentinel-hub/active-volcanoes-as-seen-from-space-9d1de0133733)`,
  },

  {
    match: [
      { datasourceId: 'S2L1C', layerId: 'BURNED-AREAS-DETECTION' },
      { datasourceId: 'S2L2A', layerId: 'BURNED-AREAS-DETECTION' },
    ],

    description: () =>
      t`# Detection of Burned Areas\n\nThis script is used to detect large scale recently burned areas. Pixels colored red highlight burned areas, and all other pixels are returned in true color. The script sometimes overestimates burned areas over water and clouds.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-2/burned_area_ms/)`,
  },

  {
    match: [{ datasourceId: 'S2L2A', layerId: 'SCENE-CLASSIFICATION' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#000000',
          label: 'No Data (Missing data)',
        },
        {
          color: '#ff0000',
          label: 'Saturated or defective pixel',
        },
        {
          color: '#2f2f2f',
          label: 'Dark features / Shadows ',
        },
        {
          color: '#643200',
          label: 'Cloud shadows',
        },
        {
          color: '#00a000',
          label: 'Vegetation',
        },
        {
          color: '#ffe65a',
          label: 'Not-vegetated',
        },
        {
          color: '#0000ff',
          label: 'Water',
        },
        {
          color: '#808080',
          label: 'Unclassified',
        },
        {
          color: '#c0c0c0',
          label: 'Cloud medium probability',
        },
        {
          color: '#ffffff',
          label: 'Cloud high probability',
        },
        {
          color: '#64c8ff',
          label: 'Thin cirrus',
        },
        {
          color: '#ff96ff',
          label: 'Snow or ice',
        },
      ],
    },
    description: () =>
      t`# Scene classification\n\n\n\nScene classification was developed to distinguish between cloudy pixels, clear pixels and water pixels of Sentinel-2 data and is a result of ESA's Scene classification algorithm. Twelve different classifications are provided including classes of clouds, vegetation, soils/desert, water and snow. It does not constitute a land cover classification map in a strict sense.\n\n\n\nMore info [here.](https://earth.esa.int/web/sentinel/technical-guides/sentinel-2-msi/level-2a/algorithm)`,
  },

  {
    match: [
      { datasourceId: 'S3OLCI', layerId: '2_OTCI' },
      { datasourceId: 'S3OLCI', layerId: '3_OTCI' },
    ],
    legend: {
      type: 'continuous',
      gradients: [
        {
          color: '#00007f',
          label: '<= 0',
          position: 0,
        },
        {
          color: '#004ccc',
          label: '1',
          position: 1,
        },
        {
          color: '#ff3333',
          label: '1.8',
          position: 1.8,
        },
        {
          color: '#ffe500',
          label: '2.5',
          position: 2.5,
        },
        {
          color: '#00cc19',
          label: '4',
          position: 4,
        },
        {
          color: '#009933',
          label: '4.5',
          position: 4.5,
        },
        {
          color: '#ffffff',
          label: '5',
          position: 5,
        },
      ],
      maxPosition: 5,
      minPosition: 0,
    },
    description: () =>
      t`# Terrestrial Chlorophyll Index (OTCI)\n\n\n\nThe Terrestrial Chlorophyll Index (OTCI) is estimated based on the chlorophyll content in terrestrial vegetation and can be used to monitor vegetation condition and health. Low OTCI values usually signify water, sand or snow. Extremely high values, displayed with white, usually suggest the absence of chlorophyll as well. They generally represent either bare ground, rock or clouds. The chlorophyll values in between range from red (low chlorophyll values) to dark green (high chlorophyll values) can be used to determine vegetation health.\n\n\n\nMore info [here.](https://custom-scripts.sentinel-hub.com/sentinel-3/otci/)`,
  },

  {
    match: [{ datasourceId: 'MODIS', layerId: 'SALINITY-INDEX' }],
    legend: {
      type: 'continuous',
      gradients: [
        {
          color: 'rgb(100%,100%,100%)',
          label: '0',
          position: 0,
        },
        {
          color: 'rgb(50%,70%,0%)',
          label: '0.3',
          position: 0.3,
        },
        {
          color: 'rgb(0%,40%,0%)',
          label: '0.6',
          position: 0.6,
        },
        {
          color: 'rgb(0%,0%,0%)',
          label: 1,
          position: 1,
        },
      ],
      maxPosition: 1,
      minPosition: 0,
    },
    description: () =>
      t`# Normalized Difference Salinity Index\n\nThe index visualizes the amount of salt present in soils. Soil salinization is one of the most common land degradation processes, especially in arid and semi-arid regions, where precipitation exceeds evaporation. \n\n Higher values indicate higher salinity and low values indicate lower salinity.\n\nRead more [here,](https://webapps.itc.utwente.nl/librarywww/papers_2003/msc/wrem/khaier.pdf) [here](https://modis.gsfc.nasa.gov/sci_team/pubs/abstract_new.php?id=29271) and [here.](https://www.indexdatabase.de/db/i-single.php?id=57)`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_GLOBAL_LAND_COVER', layerId: 'DISCRETE-CLASSIFICATION-MAP' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#282828',
          label: 'No input data',
        },
        {
          color: '#ffbb22',
          label: 'Shrubs',
        },
        {
          color: '#ffff4c',
          label: 'Herbaceous\nvegetation',
        },
        {
          color: '#f096ff',
          label: 'Cropland',
        },
        {
          color: '#fa0000',
          label: 'Urban built up',
        },
        {
          color: '#b4b4b4',
          label: 'Bare sparse\nvegetation',
        },
        {
          color: '#f0f0f0',
          label: 'Snow and Ice',
        },
        {
          color: '#0032c8',
          label: 'Permanent\nwater bodies',
        },
        {
          color: '#0096a0',
          label: 'Herbaceous\nwetland',
        },
        {
          color: '#fae6a0',
          label: 'Moss and lichen',
        },
        {
          color: '#58481f',
          label: 'Closed forest,\nevergreen needle leaf',
        },
        {
          color: '#009900',
          label: 'Closed forest,\nevergreen, broad leaf',
        },
        {
          color: '#70663e',
          label: 'Closed forest,\ndeciduous needle leaf',
        },
        {
          color: '#00cc00',
          label: 'Closed forest,\ndeciduous broad leaf',
        },
        {
          color: '#4e751f',
          label: 'Closed forest,\nmixed',
        },
        {
          color: '#007800',
          label: 'Closed forest,\nunknown',
        },
        {
          color: '#666000',
          label: 'Open forest,\nevergreen needle leafs',
        },
        {
          color: '#8db400',
          label: 'Open forest,\nevergreen broad leaf',
        },
        {
          color: '#8d7400',
          label: 'Open forest,\ndeciduous needle leaf',
        },
        {
          color: '#a0dc00',
          label: 'Open forest,\ndeciduous broad leaf',
        },
        {
          color: '#929900',
          label: 'Open forest,\nmixed',
        },
        {
          color: '#648c00',
          label: 'Open forest,\nunknown',
        },
        {
          color: '#000080',
          label: 'Open sea',
        },
      ],
    },
    description: () =>
      t`# Discrete Classification Map\n\n\n\nThis layer visualises Global Land Cover discrete classification map with 23 classes defined using the UN-FAO Land Cover Classification System (LCCS) and with color scheme defined in the Product User Manual. Map [here.](https://land.copernicus.eu/global/sites/cgls.vito.be/files/products/CGLOPS1_PUM_LC100m-V3_I3.3.pdf)`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_GLOBAL_LAND_COVER', layerId: 'FOREST-TYPE' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#ffffff',
          label: 'Not a forest',
        },
        {
          color: '#58481f',
          label: 'Evergreen niddle leaf',
        },
        {
          color: '#009900',
          label: 'Evergreen broad leaf',
        },
        {
          color: '#70663e',
          label: 'Deciduous needle leaf',
        },
        {
          color: '#00cc00',
          label: 'Deciduous broad leaf',
        },
        {
          color: '#4e751f',
          label: 'Mix of forest type ',
        },
      ],
    },
    description: () =>
      t`# Forest Types\n\n\n\nVisualized forest types based on 6 classes, as defined in the UN-FAO Land Cover Classification System (LCCS). More [here.](https://land.copernicus.eu/global/sites/cgls.vito.be/files/products/CGLOPS1_PUM_LC100m-V3_I3.3.pdf).`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_CORINE_LAND_COVER', layerId: '1_CORINE-LAND-COVER' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#e6004d',
          label: 'Continuous\nurban fabric',
        },
        {
          color: '#ff0000',
          label: 'Discontinuous\nurban fabric',
        },
        {
          color: '#cc4df2',
          label: 'Industrial or\ncommercial units',
        },
        {
          color: '#cc0000',
          label: 'Road and rail\nnetworks',
        },
        {
          color: '#e6cccc',
          label: 'Port areas',
        },
        {
          color: '#e6cce6',
          label: 'Airports',
        },
        {
          color: '#a600cc',
          label: 'Mineral\nextraction sites',
        },
        {
          color: '#a64d00',
          label: 'Dump sites',
        },
        {
          color: '#ff4dff',
          label: 'Construction\nsites',
        },
        {
          color: '#ffa6ff',
          label: 'Green urban\nareas',
        },
        {
          color: '#ffe6ff',
          label: 'Sport and leisure\nfacilities',
        },
        {
          color: '#ffffa8',
          label: 'Non-irrigated\narable land',
        },
        {
          color: '#ffff00',
          label: 'Permanently\nirrigated land',
        },
        {
          color: '#e6e600',
          label: 'Rice fields',
        },
        {
          color: '#e68000',
          label: 'Vineyards',
        },
        {
          color: '#f2a64d',
          label: 'Fruit trees and\nberry plantations',
        },
        {
          color: '#e6a600',
          label: 'Olive groves',
        },
        {
          color: '#e6e64d',
          label: 'Pastures',
        },
        {
          color: '#ffe6a6',
          label: 'Annual crops\nassociated with\npermanent crops',
        },
        {
          color: '#ffe64d',
          label: 'Complex cultivation\npatterns',
        },
        {
          color: '#e6cc4d',
          label: 'Land principally\noccupied by\nagriculture with\n significant areas\nof natural vegetation',
        },
        {
          color: '#f2cca6',
          label: 'Agro-forestry\nareas',
        },
        {
          color: '#80ff00',
          label: 'Broad-leaved\nforest',
        },
        {
          color: '#00a600',
          label: 'Coniferous\nforest',
        },
        {
          color: '#4dff00',
          label: 'Mixed forest',
        },
        {
          color: '#ccf24d',
          label: 'Natural\ngrasslands',
        },
        {
          color: '#a6ff80',
          label: 'Moors and\nheathland',
        },
        {
          color: '#a6e64d',
          label: 'Sclerophyllous\nvegetation',
        },
        {
          color: '#a6f200',
          label: 'Transitional\nwoodland-shrub',
        },
        {
          color: '#e6e6e6',
          label: 'Beaches, dunes\nand sands',
        },
        {
          color: '#cccccc',
          label: 'Bare rocks',
        },
        {
          color: '#ccffcc',
          label: 'Sparsely\nvegetated areas',
        },
        {
          color: '#000000',
          label: 'Burnt areas',
        },
        {
          color: '#a6e6cc',
          label: 'Glaciers and\nperpetual snow',
        },
        {
          color: '#a6a6ff',
          label: 'Inland marshes',
        },
        {
          color: '#4d4dff',
          label: 'Peat bogs',
        },
        {
          color: '#ccccff',
          label: 'Salt marshes',
        },
        {
          color: '#e6e6ff',
          label: 'Salines',
        },
        {
          color: '#a6a6e6',
          label: 'Intertidal\nflats',
        },
        {
          color: '#00ccf2',
          label: 'Water courses',
        },
        {
          color: '#80f2e6',
          label: 'Water bodies',
        },
        {
          color: '#00ffa6',
          label: 'Coastal lagoons',
        },
        {
          color: '#a6ffe6',
          label: 'Estuaries',
        },
        {
          color: '#e6f2ff',
          label: 'Sea and ocean',
        },
        {
          color: '#ffffff',
          label: 'No data',
        },
      ],
    },
    description: () =>
      t`# Corine Land Cover (CLC)\n\n\n\nIn this Corine Land Cover layer, all 44 classes are shown. Learn about each class [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/docs/pdf/CLC2018_Nomenclature_illustrated_guide_20190510.pdf) and see the evalscript [here](https://custom-scripts.sentinel-hub.com/copernicus_services/corine_land_cover/).`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_CORINE_LAND_COVER', layerId: '2_ARTIFICIAL-SURFACES' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#e6004d',
          label: 'Continuous\nurban fabric',
        },
        {
          color: '#ff0000',
          label: 'Discontinuous\nurban fabric',
        },
        {
          color: '#cc4df2',
          label: 'Industrial or\ncommercial units',
        },
        {
          color: '#cc0000',
          label: 'Road and rail\nnetworks',
        },
        {
          color: '#e6cccc',
          label: 'Port areas',
        },
        {
          color: '#e6cce6',
          label: 'Airports',
        },
        {
          color: '#a600cc',
          label: 'Mineral\nextraction sites',
        },
        {
          color: '#a64d00',
          label: 'Dump sites',
        },
        {
          color: '#ff4dff',
          label: 'Construction\nsites',
        },
        {
          color: '#ffa6ff',
          label: 'Green urban\nareas',
        },
        {
          color: '#ffe6ff',
          label: 'Sport and leisure\nfacilities',
        },
      ],
    },
    description: () =>
      t`# Corine Land Cover (CLC) - Artificial Surfaces\n\n\n\nIn this Corine Land Cover layer, only the 11 artificial surface classes are shown, based on the classification [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/html). Learn about each class [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/docs/pdf/CLC2018_Nomenclature_illustrated_guide_20190510.pdf) and see the evalscript with all the classes [here](https://custom-scripts.sentinel-hub.com/copernicus_services/corine_land_cover/).`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_CORINE_LAND_COVER', layerId: '3_AGRICULTURAL-AREAS' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#ffffa8',
          label: 'Non-irrigated\narable land',
        },
        {
          color: '#ffff00',
          label: 'Permanently\nirrigated land',
        },
        {
          color: '#e6e600',
          label: 'Rice fields',
        },
        {
          color: '#e68000',
          label: 'Vineyards',
        },
        {
          color: '#f2a64d',
          label: 'Fruit trees and\nberry plantations',
        },
        {
          color: '#e6a600',
          label: 'Olive groves',
        },
        {
          color: '#e6e64d',
          label: 'Pastures',
        },
        {
          color: '#ffe6a6',
          label: 'Annual crops\nassociated with\npermanent crops',
        },
        {
          color: '#ffe64d',
          label: 'Complex cultivation\npatterns',
        },
        {
          color: '#e6cc4d',
          label: 'Land principally\noccupied by\nagriculture with\n significant areas\nof natural vegetation',
        },
        {
          color: '#f2cca6',
          label: 'Agro-forestry\nareas',
        },
      ],
    },
    description: () =>
      t`# Corine Land Cover (CLC) - Agricultural Areas\n\n\n\nIn this Corine Land Cover layer, only the 11 agricultural classes are shown, based on the classification [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/html). Learn about each class [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/docs/pdf/CLC2018_Nomenclature_illustrated_guide_20190510.pdf) and see the evalscript with all the classes [here](https://custom-scripts.sentinel-hub.com/copernicus_services/corine_land_cover/).`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_CORINE_LAND_COVER', layerId: '4_FOREST-AND-SEMINATURAL-AREAS' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#80ff00',
          label: 'Broad-leaved\nforest',
        },
        {
          color: '#00a600',
          label: 'Coniferous\nforest',
        },
        {
          color: '#4dff00',
          label: 'Mixed forest',
        },
        {
          color: '#ccf24d',
          label: 'Natural\ngrasslands',
        },
        {
          color: '#a6ff80',
          label: 'Moors and\nheathland',
        },
        {
          color: '#a6e64d',
          label: 'Sclerophyllous\nvegetation',
        },
        {
          color: '#a6f200',
          label: 'Transitional\nwoodland-shrub',
        },
        {
          color: '#e6e6e6',
          label: 'Beaches, dunes\nand sands',
        },
        {
          color: '#cccccc',
          label: 'Bare rocks',
        },
        {
          color: '#ccffcc',
          label: 'Sparsely\nvegetated areas',
        },
        {
          color: '#000000',
          label: 'Burnt areas',
        },
        {
          color: '#a6e6cc',
          label: 'Glaciers and\nperpetual snow',
        },
      ],
    },
    description: () =>
      t`# Corine Land Cover (CLC) - Forest and Seminatural Areas\n\n\n\nIn this Corine Land Cover layer, only the 12 Forest and Seminatural Area classes are shown, based on the classification [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/html). Learn about each class [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/docs/pdf/CLC2018_Nomenclature_illustrated_guide_20190510.pdf) and see the evalscript with all the classes [here](https://custom-scripts.sentinel-hub.com/copernicus_services/corine_land_cover/).`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_CORINE_LAND_COVER', layerId: '5_WETLANDS' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#a6a6ff',
          label: 'Inland marshes',
        },
        {
          color: '#4d4dff',
          label: 'Peat bogs',
        },
        {
          color: '#ccccff',
          label: 'Salt marshes',
        },
        {
          color: '#e6e6ff',
          label: 'Salines',
        },
        {
          color: '#a6a6e6',
          label: 'Intertidal\nflats',
        },
      ],
    },
    description: () =>
      t`# Corine Land Cover (CLC) - Wetlands\n\n\n\nIn this Corine Land Cover layer, only the 5 Wetland classes are shown, based on the classification [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/html). 
      Learn about each class [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/docs/pdf/CLC2018_Nomenclature_illustrated_guide_20190510.pdf) and see the evalscript with all the classes [here](https://custom-scripts.sentinel-hub.com/copernicus_services/corine_land_cover/).`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_CORINE_LAND_COVER', layerId: '6_WATER-BODIES' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#00ccf2',
          label: 'Water courses',
        },
        {
          color: '#80f2e6',
          label: 'Water bodies',
        },
        {
          color: '#00ffa6',
          label: 'Coastal lagoons',
        },
        {
          color: '#a6ffe6',
          label: 'Estuaries',
        },
        {
          color: '#e6f2ff',
          label: 'Sea and ocean',
        },
        {
          color: '#ffffff',
          label: 'No data',
        },
      ],
    },
    description: () =>
      t`# Corine Land Cover (CLC) - Water Bodies\n\n\n\nIn this Corine Land Cover layer, only the 6 Water body classes are shown, based on the classification [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/html). Learn about each class [here](https://land.copernicus.eu/user-corner/technical-library/corine-land-cover-nomenclature-guidelines/docs/pdf/CLC2018_Nomenclature_illustrated_guide_20190510.pdf) and see the evalscript with all the classes [here](https://custom-scripts.sentinel-hub.com/copernicus_services/corine_land_cover/).`,
  },
  {
    match: [{ datasourceId: 'COPERNICUS_WATER_BODIES', layerId: 'WATER-BODIES-OCCURENCE' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#ff0000',
          label: 'Very low',
        },
        {
          color: '#8e35ef',
          label: 'Low',
        },
        {
          color: '#a6a6e6',
          label: 'Medium',
        },
        {
          color: '#00ffff',
          label: 'High',
        },
        {
          color: '#3bb9ff',
          label: 'Very High',
        },
        {
          color: '#0032c8',
          label: 'Permanent',
        },
      ],
    },
    description: () =>
      t`# Water Bodies - Occurrence\n\n\n\nThis layer displays the 6 occurrence levels of the Quality layer (QUAL), providing information on the seasonal dynamics of the detected water bodies. QUAL is generated from water body occurrence statistics computed from previous monthly Water Bodies products. The occurrence statistics is ranked from low occurrence to permanent occurrence. More information [here](https://collections.sentinel-hub.com/water-bodies/readme.html), and [here](https://custom-scripts.sentinel-hub.com/copernicus_services/water-bodies-occurence/#).`,
  },

  {
    match: [{ datasourceId: 'COPERNICUS_WATER_BODIES', layerId: 'WATER-BODIES' }],

    legend: {
      type: 'discrete',
      items: [
        {
          color: '#344ACD',
          label: 'Water',
        },
      ],
    },
    description: () =>
      t`# Water Bodies\n\n\n\nThis layer visualizes the Water Bodies detection layer (WB), which shows water bodies detected using the Modified Normalized Difference Water Index (MNDWI) derived from Sentinel-2 Level 1C data. More information [here](https://collections.sentinel-hub.com/water-bodies/readme.html), and [here](https://custom-scripts.sentinel-hub.com/copernicus_services/water-bodies/).`,
  },

  {
    match: [{ datasourceId: 'GIBS_ASTER_GDEM', layerId: 'ASTER_GDEM_Color_Index' }],
    legend: {
      type: 'continuous',
      minPosition: 0,
      maxPosition: 255,
      gradients: [
        { position: '1', color: 'rgb(0,117,39)', label: '5' },
        { position: '2', color: 'rgb(0,118,39)' },
        { position: '3', color: 'rgb(0,119,40)' },
        { position: '4', color: 'rgb(0,120,41)' },
        { position: '5', color: 'rgb(0,121,42)' },
        { position: '6', color: 'rgb(0,122,42)' },
        { position: '7', color: 'rgb(0,123,43)' },
        { position: '8', color: 'rgb(0,125,44)' },
        { position: '9', color: 'rgb(0,126,45)' },
        { position: '10', color: 'rgb(0,127,46)' },
        { position: '11', color: 'rgb(0,128,46)' },
        { position: '12', color: 'rgb(0,129,47)' },
        { position: '13', color: 'rgb(0,130,48)' },
        { position: '14', color: 'rgb(0,132,49)' },
        { position: '15', color: 'rgb(0,133,49)' },
        { position: '16', color: 'rgb(0,134,50)' },
        { position: '17', color: 'rgb(0,135,51)' },
        { position: '18', color: 'rgb(0,136,52)' },
        { position: '19', color: 'rgb(0,137,53)' },
        { position: '20', color: 'rgb(0,139,53)' },
        { position: '21', color: 'rgb(0,140,54)' },
        { position: '22', color: 'rgb(0,141,55)' },
        { position: '23', color: 'rgb(0,142,56)' },
        { position: '24', color: 'rgb(0,143,56)' },
        { position: '25', color: 'rgb(0,144,57)' },
        { position: '26', color: 'rgb(0,146,58)' },
        { position: '27', color: 'rgb(0,147,59)' },
        { position: '28', color: 'rgb(0,148,60)' },
        { position: '29', color: 'rgb(0,149,60)' },
        { position: '30', color: 'rgb(0,150,61)' },
        { position: '31', color: 'rgb(0,151,62)' },
        { position: '32', color: 'rgb(0,152,63)' },
        { position: '33', color: 'rgb(0,154,63)' },
        { position: '34', color: 'rgb(0,155,64)' },
        { position: '35', color: 'rgb(0,156,65)' },
        { position: '36', color: 'rgb(0,157,66)' },
        { position: '37', color: 'rgb(0,158,67)' },
        { position: '38', color: 'rgb(0,159,67)' },
        { position: '39', color: 'rgb(0,161,68)' },
        { position: '40', color: 'rgb(0,162,69)' },
        { position: '41', color: 'rgb(0,163,70)' },
        { position: '42', color: 'rgb(0,164,70)' },
        { position: '43', color: 'rgb(0,165,71)' },
        { position: '44', color: 'rgb(0,166,72)' },
        { position: '45', color: 'rgb(0,168,73)' },
        { position: '46', color: 'rgb(0,169,74)' },
        { position: '47', color: 'rgb(0,170,74)' },
        { position: '48', color: 'rgb(0,171,75)' },
        { position: '49', color: 'rgb(0,172,76)' },
        { position: '50', color: 'rgb(0,173,77)' },
        { position: '51', color: 'rgb(0,175,78)' },
        { position: '52', color: 'rgb(3,175,76)' },
        { position: '53', color: 'rgb(6,176,75)' },
        { position: '54', color: 'rgb(9,177,74)' },
        { position: '55', color: 'rgb(12,178,73)' },
        { position: '56', color: 'rgb(15,179,72)' },
        { position: '57', color: 'rgb(18,179,71)' },
        { position: '58', color: 'rgb(21,180,70)' },
        { position: '59', color: 'rgb(24,181,69)' },
        { position: '60', color: 'rgb(28,182,67)' },
        { position: '61', color: 'rgb(31,183,66)' },
        { position: '62', color: 'rgb(34,183,65)' },
        { position: '63', color: 'rgb(37,184,64)' },
        { position: '64', color: 'rgb(40,185,63)' },
        { position: '65', color: 'rgb(43,186,62)' },
        { position: '66', color: 'rgb(46,187,61)' },
        { position: '67', color: 'rgb(49,187,60)' },
        { position: '68', color: 'rgb(53,188,58)' },
        { position: '69', color: 'rgb(56,189,57)' },
        { position: '70', color: 'rgb(59,190,56)' },
        { position: '71', color: 'rgb(62,191,55)' },
        { position: '72', color: 'rgb(65,191,54)' },
        { position: '73', color: 'rgb(68,192,53)' },
        { position: '74', color: 'rgb(71,193,52)' },
        { position: '75', color: 'rgb(74,194,51)' },
        { position: '76', color: 'rgb(78,195,50)' },
        { position: '77', color: 'rgb(82,196,48)' },
        { position: '78', color: 'rgb(87,197,46)' },
        { position: '79', color: 'rgb(91,198,45)' },
        { position: '80', color: 'rgb(96,199,43)' },
        { position: '81', color: 'rgb(100,200,42)' },
        { position: '82', color: 'rgb(105,201,40)' },
        { position: '83', color: 'rgb(109,202,39)' },
        { position: '84', color: 'rgb(114,203,37)' },
        { position: '85', color: 'rgb(118,205,36)' },
        { position: '86', color: 'rgb(123,206,34)' },
        { position: '87', color: 'rgb(127,207,33)' },
        { position: '88', color: 'rgb(132,208,31)' },
        { position: '89', color: 'rgb(136,209,30)' },
        { position: '90', color: 'rgb(141,210,28)' },
        { position: '91', color: 'rgb(145,211,27)' },
        { position: '92', color: 'rgb(150,212,25)' },
        { position: '93', color: 'rgb(154,214,24)' },
        { position: '94', color: 'rgb(159,215,22)' },
        { position: '95', color: 'rgb(163,216,21)' },
        { position: '96', color: 'rgb(168,217,19)' },
        { position: '97', color: 'rgb(172,218,18)' },
        { position: '98', color: 'rgb(177,219,16)' },
        { position: '99', color: 'rgb(181,220,15)' },
        { position: '100', color: 'rgb(186,221,13)' },
        { position: '101', color: 'rgb(191,223,12)' },
        { position: '102', color: 'rgb(191,222,11)' },
        { position: '103', color: 'rgb(192,221,11)' },
        { position: '104', color: 'rgb(192,220,11)' },
        { position: '105', color: 'rgb(193,219,11)' },
        { position: '106', color: 'rgb(193,218,11)' },
        { position: '107', color: 'rgb(194,217,11)' },
        { position: '108', color: 'rgb(195,216,11)' },
        { position: '109', color: 'rgb(195,215,11)' },
        { position: '110', color: 'rgb(196,214,11)' },
        { position: '111', color: 'rgb(196,213,11)' },
        { position: '112', color: 'rgb(197,212,11)' },
        { position: '113', color: 'rgb(197,211,11)' },
        { position: '114', color: 'rgb(198,210,11)' },
        { position: '115', color: 'rgb(199,209,11)' },
        { position: '116', color: 'rgb(199,208,11)' },
        { position: '117', color: 'rgb(200,207,11)' },
        { position: '118', color: 'rgb(200,206,11)' },
        { position: '119', color: 'rgb(201,205,11)' },
        { position: '120', color: 'rgb(201,204,11)' },
        { position: '121', color: 'rgb(202,204,11)' },
        { position: '122', color: 'rgb(203,203,10)' },
        { position: '123', color: 'rgb(203,202,10)' },
        { position: '124', color: 'rgb(204,201,10)' },
        { position: '125', color: 'rgb(204,200,10)' },
        { position: '126', color: 'rgb(205,199,10)' },
        { position: '127', color: 'rgb(205,198,10)' },
        { position: '128', color: 'rgb(206,197,10)', label: '1450' },
        { position: '129', color: 'rgb(207,196,10)' },
        { position: '130', color: 'rgb(207,195,10)' },
        { position: '131', color: 'rgb(208,194,10)' },
        { position: '132', color: 'rgb(208,193,10)' },
        { position: '133', color: 'rgb(209,192,10)' },
        { position: '134', color: 'rgb(209,191,10)' },
        { position: '135', color: 'rgb(210,190,10)' },
        { position: '136', color: 'rgb(211,189,10)' },
        { position: '137', color: 'rgb(211,188,10)' },
        { position: '138', color: 'rgb(212,187,10)' },
        { position: '139', color: 'rgb(212,186,10)' },
        { position: '140', color: 'rgb(213,185,10)' },
        { position: '141', color: 'rgb(214,185,10)' },
        { position: '142', color: 'rgb(213,182,10)' },
        { position: '143', color: 'rgb(212,180,10)' },
        { position: '144', color: 'rgb(211,177,11)' },
        { position: '145', color: 'rgb(210,175,11)' },
        { position: '146', color: 'rgb(209,172,12)' },
        { position: '147', color: 'rgb(208,170,12)' },
        { position: '148', color: 'rgb(207,168,13)' },
        { position: '149', color: 'rgb(206,165,13)' },
        { position: '150', color: 'rgb(205,163,14)' },
        { position: '151', color: 'rgb(204,160,14)' },
        { position: '152', color: 'rgb(203,158,15)' },
        { position: '153', color: 'rgb(202,155,15)' },
        { position: '154', color: 'rgb(201,153,16)' },
        { position: '155', color: 'rgb(200,151,16)' },
        { position: '156', color: 'rgb(199,148,17)' },
        { position: '157', color: 'rgb(198,146,17)' },
        { position: '158', color: 'rgb(197,143,18)' },
        { position: '159', color: 'rgb(196,141,18)' },
        { position: '160', color: 'rgb(195,138,19)' },
        { position: '161', color: 'rgb(194,136,19)' },
        { position: '162', color: 'rgb(193,134,19)' },
        { position: '163', color: 'rgb(192,131,20)' },
        { position: '164', color: 'rgb(191,129,20)' },
        { position: '165', color: 'rgb(190,126,21)' },
        { position: '166', color: 'rgb(189,124,21)' },
        { position: '167', color: 'rgb(188,121,22)' },
        { position: '168', color: 'rgb(187,119,22)' },
        { position: '169', color: 'rgb(186,117,23)' },
        { position: '170', color: 'rgb(185,114,23)' },
        { position: '171', color: 'rgb(184,112,24)' },
        { position: '172', color: 'rgb(183,109,24)' },
        { position: '173', color: 'rgb(182,107,25)' },
        { position: '174', color: 'rgb(181,104,25)' },
        { position: '175', color: 'rgb(180,102,26)' },
        { position: '176', color: 'rgb(179,100,26)' },
        { position: '177', color: 'rgb(178,97,27)' },
        { position: '178', color: 'rgb(177,95,27)' },
        { position: '179', color: 'rgb(176,92,28)' },
        { position: '180', color: 'rgb(175,90,28)' },
        { position: '181', color: 'rgb(175,88,29)' },
        { position: '182', color: 'rgb(174,88,32)' },
        { position: '183', color: 'rgb(174,89,36)' },
        { position: '184', color: 'rgb(174,90,40)' },
        { position: '185', color: 'rgb(174,91,44)' },
        { position: '186', color: 'rgb(173,92,48)' },
        { position: '187', color: 'rgb(173,93,52)' },
        { position: '188', color: 'rgb(173,94,55)' },
        { position: '189', color: 'rgb(173,95,59)' },
        { position: '190', color: 'rgb(172,96,63)' },
        { position: '191', color: 'rgb(172,97,67)' },
        { position: '192', color: 'rgb(172,97,71)' },
        { position: '193', color: 'rgb(172,98,75)' },
        { position: '194', color: 'rgb(171,99,79)' },
        { position: '195', color: 'rgb(171,100,82)' },
        { position: '196', color: 'rgb(171,101,86)' },
        { position: '197', color: 'rgb(171,102,90)' },
        { position: '198', color: 'rgb(170,103,94)' },
        { position: '199', color: 'rgb(170,104,98)' },
        { position: '200', color: 'rgb(170,105,102)' },
        { position: '201', color: 'rgb(170,106,106)' },
        { position: '202', color: 'rgb(170,109,109)' },
        { position: '203', color: 'rgb(171,112,112)' },
        { position: '204', color: 'rgb(171,115,115)' },
        { position: '205', color: 'rgb(172,118,118)' },
        { position: '206', color: 'rgb(173,121,121)' },
        { position: '207', color: 'rgb(173,124,124)' },
        { position: '208', color: 'rgb(174,128,128)' },
        { position: '209', color: 'rgb(174,131,131)' },
        { position: '210', color: 'rgb(175,134,134)' },
        { position: '211', color: 'rgb(176,137,137)' },
        { position: '212', color: 'rgb(176,140,140)' },
        { position: '213', color: 'rgb(177,143,143)' },
        { position: '214', color: 'rgb(177,147,147)' },
        { position: '215', color: 'rgb(178,150,150)' },
        { position: '216', color: 'rgb(179,153,153)' },
        { position: '217', color: 'rgb(179,156,156)' },
        { position: '218', color: 'rgb(180,159,159)' },
        { position: '219', color: 'rgb(180,162,162)' },
        { position: '220', color: 'rgb(181,166,166)' },
        { position: '221', color: 'rgb(182,169,169)' },
        { position: '222', color: 'rgb(182,172,172)' },
        { position: '223', color: 'rgb(183,175,175)' },
        { position: '224', color: 'rgb(183,178,178)' },
        { position: '225', color: 'rgb(184,181,181)' },
        { position: '226', color: 'rgb(185,185,185)' },
        { position: '227', color: 'rgb(187,187,187)' },
        { position: '228', color: 'rgb(189,189,189)' },
        { position: '229', color: 'rgb(192,192,192)' },
        { position: '230', color: 'rgb(194,194,194)' },
        { position: '231', color: 'rgb(197,197,197)' },
        { position: '232', color: 'rgb(199,199,199)' },
        { position: '233', color: 'rgb(201,201,201)' },
        { position: '234', color: 'rgb(204,204,204)' },
        { position: '235', color: 'rgb(206,206,206)' },
        { position: '236', color: 'rgb(209,209,209)' },
        { position: '237', color: 'rgb(211,211,211)' },
        { position: '238', color: 'rgb(213,213,213)' },
        { position: '239', color: 'rgb(216,216,216)' },
        { position: '240', color: 'rgb(218,218,218)' },
        { position: '241', color: 'rgb(221,221,221)' },
        { position: '242', color: 'rgb(223,223,223)' },
        { position: '243', color: 'rgb(226,226,226)' },
        { position: '244', color: 'rgb(228,228,228)' },
        { position: '245', color: 'rgb(230,230,230)' },
        { position: '246', color: 'rgb(233,233,233)' },
        { position: '247', color: 'rgb(235,235,235)' },
        { position: '248', color: 'rgb(238,238,238)' },
        { position: '249', color: 'rgb(240,240,240)' },
        { position: '250', color: 'rgb(242,242,242)' },
        { position: '251', color: 'rgb(245,245,245)' },
        { position: '252', color: 'rgb(247,247,247)' },
        { position: '253', color: 'rgb(250,250,250)' },
        { position: '254', color: 'rgb(252,252,252)' },
        { position: '255', color: 'rgb(255,255,255)', label: '> 8400 [m]' },
      ],
    },
  },
  {
    match: [{ datasourceId: 'GIBS_VIIRS_SNPP_DAYNIGHTBAND_ENCC', layerId: 'VIIRS_SNPP_DayNightBand_ENCC' }],
    legend: {
      type: 'continuous',
      minPosition: 0,
      maxPosition: 255,
      gradients: [
        { position: '1', color: 'rgb(1,1,1)', label: '0 - 1' },
        { position: '2', color: 'rgb(2,2,2)' },
        { position: '3', color: 'rgb(3,3,3)' },
        { position: '4', color: 'rgb(4,4,4)' },
        { position: '5', color: 'rgb(5,5,5)' },
        { position: '6', color: 'rgb(6,6,6)' },
        { position: '7', color: 'rgb(7,7,7)' },
        { position: '8', color: 'rgb(8,8,8)' },
        { position: '9', color: 'rgb(9,9,9)' },
        { position: '10', color: 'rgb(10,10,10)' },
        { position: '11', color: 'rgb(11,11,11)' },
        { position: '12', color: 'rgb(12,12,12)' },
        { position: '13', color: 'rgb(13,13,13)' },
        { position: '14', color: 'rgb(14,14,14)' },
        { position: '15', color: 'rgb(15,15,15)' },
        { position: '16', color: 'rgb(16,16,16)' },
        { position: '17', color: 'rgb(17,17,17)' },
        { position: '18', color: 'rgb(18,18,18)' },
        { position: '19', color: 'rgb(19,19,19)' },
        { position: '20', color: 'rgb(20,20,20)' },
        { position: '21', color: 'rgb(21,21,21)' },
        { position: '22', color: 'rgb(22,22,22)' },
        { position: '23', color: 'rgb(23,23,23)' },
        { position: '24', color: 'rgb(24,24,24)' },
        { position: '25', color: 'rgb(25,25,25)' },
        { position: '26', color: 'rgb(26,26,26)' },
        { position: '27', color: 'rgb(27,27,27)' },
        { position: '28', color: 'rgb(28,28,28)' },
        { position: '29', color: 'rgb(29,29,29)' },
        { position: '30', color: 'rgb(30,30,30)' },
        { position: '31', color: 'rgb(31,31,31)' },
        { position: '32', color: 'rgb(32,32,32)' },
        { position: '33', color: 'rgb(33,33,33)' },
        { position: '34', color: 'rgb(34,34,34)' },
        { position: '35', color: 'rgb(35,35,35)' },
        { position: '36', color: 'rgb(36,36,36)' },
        { position: '37', color: 'rgb(37,37,37)' },
        { position: '38', color: 'rgb(38,38,38)' },
        { position: '39', color: 'rgb(39,39,39)' },
        { position: '40', color: 'rgb(40,40,40)' },
        { position: '41', color: 'rgb(41,41,41)' },
        { position: '42', color: 'rgb(42,42,42)' },
        { position: '43', color: 'rgb(43,43,43)' },
        { position: '44', color: 'rgb(44,44,44)' },
        { position: '45', color: 'rgb(45,45,45)' },
        { position: '46', color: 'rgb(46,46,46)' },
        { position: '47', color: 'rgb(47,47,47)' },
        { position: '48', color: 'rgb(48,48,48)' },
        { position: '49', color: 'rgb(49,49,49)' },
        { position: '50', color: 'rgb(50,50,50)' },
        { position: '51', color: 'rgb(51,51,51)' },
        { position: '52', color: 'rgb(52,52,52)' },
        { position: '53', color: 'rgb(53,53,53)' },
        { position: '54', color: 'rgb(54,54,54)' },
        { position: '55', color: 'rgb(55,55,55)' },
        { position: '56', color: 'rgb(56,56,56)' },
        { position: '57', color: 'rgb(57,57,57)' },
        { position: '58', color: 'rgb(58,58,58)' },
        { position: '59', color: 'rgb(59,59,59)' },
        { position: '60', color: 'rgb(60,60,60)' },
        { position: '61', color: 'rgb(61,61,61)' },
        { position: '62', color: 'rgb(62,62,62)' },
        { position: '63', color: 'rgb(63,63,63)' },
        { position: '64', color: 'rgb(64,64,64)' },
        { position: '65', color: 'rgb(65,65,65)' },
        { position: '66', color: 'rgb(66,66,66)' },
        { position: '67', color: 'rgb(67,67,67)' },
        { position: '68', color: 'rgb(68,68,68)' },
        { position: '69', color: 'rgb(69,69,69)' },
        { position: '70', color: 'rgb(70,70,70)' },
        { position: '71', color: 'rgb(71,71,71)' },
        { position: '72', color: 'rgb(72,72,72)' },
        { position: '73', color: 'rgb(73,73,73)' },
        { position: '74', color: 'rgb(74,74,74)' },
        { position: '75', color: 'rgb(75,75,75)' },
        { position: '76', color: 'rgb(76,76,76)' },
        { position: '77', color: 'rgb(77,77,77)' },
        { position: '78', color: 'rgb(78,78,78)' },
        { position: '79', color: 'rgb(79,79,79)' },
        { position: '80', color: 'rgb(80,80,80)' },
        { position: '81', color: 'rgb(81,81,81)' },
        { position: '82', color: 'rgb(82,82,82)' },
        { position: '83', color: 'rgb(83,83,83)' },
        { position: '84', color: 'rgb(84,84,84)' },
        { position: '85', color: 'rgb(85,85,85)' },
        { position: '86', color: 'rgb(86,86,86)' },
        { position: '87', color: 'rgb(87,87,87)' },
        { position: '88', color: 'rgb(88,88,88)' },
        { position: '89', color: 'rgb(89,89,89)' },
        { position: '90', color: 'rgb(90,90,90)' },
        { position: '91', color: 'rgb(91,91,91)' },
        { position: '92', color: 'rgb(92,92,92)' },
        { position: '93', color: 'rgb(93,93,93)' },
        { position: '94', color: 'rgb(94,94,94)' },
        { position: '95', color: 'rgb(95,95,95)' },
        { position: '96', color: 'rgb(96,96,96)' },
        { position: '97', color: 'rgb(97,97,97)' },
        { position: '98', color: 'rgb(98,98,98)' },
        { position: '99', color: 'rgb(99,99,99)' },
        { position: '100', color: 'rgb(100,100,100)' },
        { position: '101', color: 'rgb(101,101,101)' },
        { position: '102', color: 'rgb(102,102,102)' },
        { position: '103', color: 'rgb(103,103,103)' },
        { position: '104', color: 'rgb(104,104,104)' },
        { position: '105', color: 'rgb(105,105,105)' },
        { position: '106', color: 'rgb(106,106,106)' },
        { position: '107', color: 'rgb(107,107,107)' },
        { position: '108', color: 'rgb(108,108,108)' },
        { position: '109', color: 'rgb(109,109,109)' },
        { position: '110', color: 'rgb(110,110,110)' },
        { position: '111', color: 'rgb(111,111,111)' },
        { position: '112', color: 'rgb(112,112,112)' },
        { position: '113', color: 'rgb(113,113,113)' },
        { position: '114', color: 'rgb(114,114,114)' },
        { position: '115', color: 'rgb(115,115,115)' },
        { position: '116', color: 'rgb(116,116,116)' },
        { position: '117', color: 'rgb(117,117,117)' },
        { position: '118', color: 'rgb(118,118,118)' },
        { position: '119', color: 'rgb(119,119,119)' },
        { position: '120', color: 'rgb(120,120,120)' },
        { position: '121', color: 'rgb(121,121,121)' },
        { position: '122', color: 'rgb(122,122,122)' },
        { position: '123', color: 'rgb(123,123,123)' },
        { position: '124', color: 'rgb(124,124,124)' },
        { position: '125', color: 'rgb(125,125,125)' },
        { position: '126', color: 'rgb(126,126,126)' },
        { position: '127', color: 'rgb(127,127,127)' },
        { position: '128', color: 'rgb(128,128,128)', label: '128' },
        { position: '129', color: 'rgb(129,129,129)' },
        { position: '130', color: 'rgb(130,130,130)' },
        { position: '131', color: 'rgb(131,131,131)' },
        { position: '132', color: 'rgb(132,132,132)' },
        { position: '133', color: 'rgb(133,133,133)' },
        { position: '134', color: 'rgb(134,134,134)' },
        { position: '135', color: 'rgb(135,135,135)' },
        { position: '136', color: 'rgb(136,136,136)' },
        { position: '137', color: 'rgb(137,137,137)' },
        { position: '138', color: 'rgb(138,138,138)' },
        { position: '139', color: 'rgb(139,139,139)' },
        { position: '140', color: 'rgb(140,140,140)' },
        { position: '141', color: 'rgb(141,141,141)' },
        { position: '142', color: 'rgb(142,142,142)' },
        { position: '143', color: 'rgb(143,143,143)' },
        { position: '144', color: 'rgb(144,144,144)' },
        { position: '145', color: 'rgb(145,145,145)' },
        { position: '146', color: 'rgb(146,146,146)' },
        { position: '147', color: 'rgb(147,147,147)' },
        { position: '148', color: 'rgb(148,148,148)' },
        { position: '149', color: 'rgb(149,149,149)' },
        { position: '150', color: 'rgb(150,150,150)' },
        { position: '151', color: 'rgb(151,151,151)' },
        { position: '152', color: 'rgb(152,152,152)' },
        { position: '153', color: 'rgb(153,153,153)' },
        { position: '154', color: 'rgb(154,154,154)' },
        { position: '155', color: 'rgb(155,155,155)' },
        { position: '156', color: 'rgb(156,156,156)' },
        { position: '157', color: 'rgb(157,157,157)' },
        { position: '158', color: 'rgb(158,158,158)' },
        { position: '159', color: 'rgb(159,159,159)' },
        { position: '160', color: 'rgb(160,160,160)' },
        { position: '161', color: 'rgb(161,161,161)' },
        { position: '162', color: 'rgb(162,162,162)' },
        { position: '163', color: 'rgb(163,163,163)' },
        { position: '164', color: 'rgb(164,164,164)' },
        { position: '165', color: 'rgb(165,165,165)' },
        { position: '166', color: 'rgb(166,166,166)' },
        { position: '167', color: 'rgb(167,167,167)' },
        { position: '168', color: 'rgb(168,168,168)' },
        { position: '169', color: 'rgb(169,169,169)' },
        { position: '170', color: 'rgb(170,170,170)' },
        { position: '171', color: 'rgb(171,171,171)' },
        { position: '172', color: 'rgb(172,172,172)' },
        { position: '173', color: 'rgb(173,173,173)' },
        { position: '174', color: 'rgb(174,174,174)' },
        { position: '175', color: 'rgb(175,175,175)' },
        { position: '176', color: 'rgb(176,176,176)' },
        { position: '177', color: 'rgb(177,177,177)' },
        { position: '178', color: 'rgb(178,178,178)' },
        { position: '179', color: 'rgb(179,179,179)' },
        { position: '180', color: 'rgb(180,180,180)' },
        { position: '181', color: 'rgb(181,181,181)' },
        { position: '182', color: 'rgb(182,182,182)' },
        { position: '183', color: 'rgb(183,183,183)' },
        { position: '184', color: 'rgb(184,184,184)' },
        { position: '185', color: 'rgb(185,185,185)' },
        { position: '186', color: 'rgb(186,186,186)' },
        { position: '187', color: 'rgb(187,187,187)' },
        { position: '188', color: 'rgb(188,188,188)' },
        { position: '189', color: 'rgb(189,189,189)' },
        { position: '190', color: 'rgb(190,190,190)' },
        { position: '191', color: 'rgb(191,191,191)' },
        { position: '192', color: 'rgb(192,192,192)' },
        { position: '193', color: 'rgb(193,193,193)' },
        { position: '194', color: 'rgb(194,194,194)' },
        { position: '195', color: 'rgb(195,195,195)' },
        { position: '196', color: 'rgb(196,196,196)' },
        { position: '197', color: 'rgb(197,197,197)' },
        { position: '198', color: 'rgb(198,198,198)' },
        { position: '199', color: 'rgb(199,199,199)' },
        { position: '200', color: 'rgb(200,200,200)' },
        { position: '201', color: 'rgb(201,201,201)' },
        { position: '202', color: 'rgb(202,202,202)' },
        { position: '203', color: 'rgb(203,203,203)' },
        { position: '204', color: 'rgb(204,204,204)' },
        { position: '205', color: 'rgb(205,205,205)' },
        { position: '206', color: 'rgb(206,206,206)' },
        { position: '207', color: 'rgb(207,207,207)' },
        { position: '208', color: 'rgb(208,208,208)' },
        { position: '209', color: 'rgb(209,209,209)' },
        { position: '210', color: 'rgb(210,210,210)' },
        { position: '211', color: 'rgb(211,211,211)' },
        { position: '212', color: 'rgb(212,212,212)' },
        { position: '213', color: 'rgb(213,213,213)' },
        { position: '214', color: 'rgb(214,214,214)' },
        { position: '215', color: 'rgb(215,215,215)' },
        { position: '216', color: 'rgb(216,216,216)' },
        { position: '217', color: 'rgb(217,217,217)' },
        { position: '218', color: 'rgb(218,218,218)' },
        { position: '219', color: 'rgb(219,219,219)' },
        { position: '220', color: 'rgb(220,220,220)' },
        { position: '221', color: 'rgb(221,221,221)' },
        { position: '222', color: 'rgb(222,222,222)' },
        { position: '223', color: 'rgb(223,223,223)' },
        { position: '224', color: 'rgb(224,224,224)' },
        { position: '225', color: 'rgb(225,225,225)' },
        { position: '226', color: 'rgb(226,226,226)' },
        { position: '227', color: 'rgb(227,227,227)' },
        { position: '228', color: 'rgb(228,228,228)' },
        { position: '229', color: 'rgb(229,229,229)' },
        { position: '230', color: 'rgb(230,230,230)' },
        { position: '231', color: 'rgb(231,231,231)' },
        { position: '232', color: 'rgb(232,232,232)' },
        { position: '233', color: 'rgb(233,233,233)' },
        { position: '234', color: 'rgb(234,234,234)' },
        { position: '235', color: 'rgb(235,235,235)' },
        { position: '236', color: 'rgb(236,236,236)' },
        { position: '237', color: 'rgb(237,237,237)' },
        { position: '238', color: 'rgb(238,238,238)' },
        { position: '239', color: 'rgb(239,239,239)' },
        { position: '240', color: 'rgb(240,240,240)' },
        { position: '241', color: 'rgb(241,241,241)' },
        { position: '242', color: 'rgb(242,242,242)' },
        { position: '243', color: 'rgb(243,243,243)' },
        { position: '244', color: 'rgb(244,244,244)' },
        { position: '245', color: 'rgb(245,245,245)' },
        { position: '246', color: 'rgb(246,246,246)' },
        { position: '247', color: 'rgb(247,247,247)' },
        { position: '248', color: 'rgb(248,248,248)' },
        { position: '249', color: 'rgb(249,249,249)' },
        { position: '250', color: 'rgb(250,250,250)' },
        { position: '251', color: 'rgb(251,251,251)' },
        { position: '252', color: 'rgb(252,252,252)' },
        { position: '253', color: 'rgb(253,253,253)' },
        { position: '254', color: 'rgb(254,254,254)' },
        { position: '255', color: 'rgb(255,255,255)', label: '255' },
      ],
    },
  },
];
