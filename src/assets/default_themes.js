import { t } from 'ttag';
import { EDUCATION_THEMES } from './education_themes';

const educationThemesDefaultMode = EDUCATION_THEMES.map(t => {
  const normalModePostfix = '-NORMAL-MODE';
  const eduThemeNormalMode = { ...t, id: `${t.id}${normalModePostfix}` };
  if (t.pins) {
    eduThemeNormalMode.pins = t.pins.map(p => ({ ...p, themeId: `${p.themeId}${normalModePostfix}` }));
  }
  return eduThemeNormalMode;
});

export const DEFAULT_THEMES = [
  {
    name: t`Default`,
    id: 'DEFAULT-THEME',
    content: [
      {
        name: 'Landsat 5 ESA',
        service: 'WMS',
        url: 'https://eocloud.sentinel-hub.com/v1/wms/e3e5e6-YOUR-INSTANCEID-HERE',
        layersExclude: '/^B[0-9][0-9A]/i',
      },

      {
        name: 'Landsat 7 ESA',
        service: 'WMS',
        url: 'https://eocloud.sentinel-hub.com/v1/wms/65e58c-YOUR-INSTANCEID-HERE',
        layersExclude: '/^B[0-9][0-9A]/i',
      },

      {
        name: 'Landsat 8 ESA',
        service: 'WMS',
        url: 'https://eocloud.sentinel-hub.com/v1/wms/2d8dbf-YOUR-INSTANCEID-HERE',
        layersExclude: '/^B[0-9][0-9A]/i',
      },

      {
        name: 'Landsat 8 USGS',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/950dce-YOUR-INSTANCEID-HERE',
        preselected: true,
      },

      {
        name: 'Sentinel-1 EOCloud GRD IW',
        service: 'WMS',
        url: 'https://eocloud.sentinel-hub.com/v1/wms/6a6b78-YOUR-INSTANCEID-HERE',
        layersExclude: ['VV', 'VH', 'HH', 'HV'],
      },

      {
        name: 'Sentinel-1 EOCloud GRD EW',
        service: 'WMS',
        url: 'https://eocloud.sentinel-hub.com/v1/wms/52803c-YOUR-INSTANCEID-HERE',
        layersExclude: ['VV', 'VH', 'HH', 'HV'],
      },

      {
        name: 'Sentinel-1 EOCloud GRD EW SH',
        service: 'WMS',
        url: 'https://eocloud.sentinel-hub.com/v1/wms/3f5321-YOUR-INSTANCEID-HERE',
        layersExclude: ['VV', 'VH', 'HH', 'HV'],
      },

      {
        name: 'Sentinel-1 AWS EW HH',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/7bced1-YOUR-INSTANCEID-HERE',
      },
      {
        name: 'Sentinel-1 AWS EW HH+HV',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/694b40-YOUR-INSTANCEID-HERE',
      },
      {
        name: 'Sentinel-1 AWS IW VV',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/118885-YOUR-INSTANCEID-HERE',
      },
      {
        name: 'Sentinel-1 AWS IW VV+VH',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/f2068f-YOUR-INSTANCEID-HERE',
      },

      {
        name: 'Sentinel-2 L1C',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/42924c-YOUR-INSTANCEID-HERE',
      },

      {
        name: 'Sentinel-2 L2A',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/bd86bc-YOUR-INSTANCEID-HERE',
        preselected: true,
      },

      {
        name: 'Sentinel-3 SLSTR',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/786d82-YOUR-INSTANCEID-HERE',
      },

      {
        name: 'Sentinel-3 OLCI',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/82f84f-YOUR-INSTANCEID-HERE',
        preselected: true,
      },

      {
        name: 'Sentinel-5P O3 / NO2 / ...',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/2c5dc5-YOUR-INSTANCEID-HERE',
      },

      {
        name: 'MODIS',
        service: 'WMS',
        url: 'https://services.sentinel-hub.com/ogc/wms/a322e0-YOUR-INSTANCEID-HERE',
      },

      {
        name: 'Envisat Meris',
        service: 'WMS',
        url: 'https://eocloud.sentinel-hub.com/v1/wms/65a188-YOUR-INSTANCEID-HERE',
        layersExclude: '/^B[0-9][0-9A]/',
      },

      {
        name: 'Proba-V',
        service: 'WMS',
        url: 'https://proba-v-mep.esa.int/applications/geo-viewer/app/geoserver/ows',
        layersExclude: '/_1KM$/',
      },
      {
        name: 'GIBS',
        service: 'WMS',
        url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
      },
    ],
  },

  ...educationThemesDefaultMode,
];
