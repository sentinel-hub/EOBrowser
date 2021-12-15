// function is used by Sentinel5PDataSourceHandler and update-previews
export const getS5ProductType = (datasetId) => {
  switch (datasetId) {
    case 'S5_O3':
      return 'O3';
    case 'S5_NO2':
      return 'NO2';
    case 'S5_SO2':
      return 'SO2';
    case 'S5_CO':
      return 'CO';
    case 'S5_HCHO':
      return 'HCHO';
    case 'S5_CH4':
      return 'CH4';
    case 'S5_AER_AI':
      return 'AER_AI';
    case 'S5_CLOUD':
      return 'CLOUD';
    default:
      return 'CLOUD';
  }
};
