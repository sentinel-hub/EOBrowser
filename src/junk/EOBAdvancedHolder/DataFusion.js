import React from 'react';
import {
  LayersFactory,
  DATASET_AWSEU_S1GRD,
  DATASET_S2L1C,
  DATASET_S2L2A,
  DATASET_S3SLSTR,
  DATASET_S3OLCI,
  DATASET_S5PL2,
  DATASET_AWS_L8L1C,
  DATASET_MODIS,
  DATASET_AWS_DEM,
} from '@sentinel-hub/sentinelhub-js';
import { t } from 'ttag';

import DataFusionSupplementalDataset from './DataFusionSupplementalDataset';

export default class DataFusion extends React.Component {
  state = {
    primaryLayer: null,
  };

  async componentDidMount() {
    const { baseUrlWms } = this.props;
    const layers = await LayersFactory.makeLayers(baseUrlWms);
    this.setState({
      primaryLayer: layers[0],
    });
  }

  toggleDataFusionEnabled = () => {
    const {
      settings,
      settings: { enabled = false },
    } = this.props;
    this.props.onChange({
      ...settings,
      enabled: !enabled,
    });
  };

  onSupplementalDatasetChange = (datasetId, values) => {
    const { settings } = this.props;
    const { supplementalDatasets: supplementalDatasetsSettings = {} } = settings;
    this.props.onChange({
      ...settings,
      supplementalDatasets: {
        ...supplementalDatasetsSettings,
        [datasetId]: values,
      },
    });
  };

  supportsDataFusion(dataset) {
    return [
      'https://services.sentinel-hub.com/',
      'https://creodias.sentinel-hub.com/',
      'https://services-uswest2.sentinel-hub.com/',
    ].includes(dataset.shServiceHostname);
  }

  getSupplementalLayers(dataset) {
    // - services: S1GRD, S2L2A, S2L1C
    // - creodias: S3SLSTR, S3OLCI, S5PL2
    // - uswest: L8, MODIS, DEM
    switch (dataset) {
      case DATASET_AWSEU_S1GRD:
      case DATASET_S2L1C:
      case DATASET_S2L2A:
      case DATASET_S3SLSTR:
      case DATASET_S3OLCI:
      case DATASET_S5PL2:
        return {
          [DATASET_AWSEU_S1GRD.id]: {
            label: 'S-1 GRD',
            dataset: DATASET_AWSEU_S1GRD,
            additionalMosaickingOrders: [],
          },
          [DATASET_S2L1C.id]: {
            label: 'S-2 L1C',
            dataset: DATASET_S2L1C,
            additionalMosaickingOrders: [{ label: t`Least cloud coverage`, id: 'leastCC' }],
          },
          [DATASET_S2L2A.id]: {
            label: 'S-2 L2A',
            dataset: DATASET_S2L2A,
            additionalMosaickingOrders: [{ label: t`Least cloud coverage`, id: 'leastCC' }],
          },
          [DATASET_S3SLSTR.id]: {
            label: 'S-3 SLSTR',
            dataset: DATASET_S3SLSTR,
            additionalMosaickingOrders: [{ label: t`Least cloud coverage`, id: 'leastCC' }],
          },
          [DATASET_S3OLCI.id]: {
            label: 'S-3 OLCI',
            dataset: DATASET_S3OLCI,
            additionalMosaickingOrders: [],
          },
          [DATASET_S5PL2.id]: {
            label: 'S-5P L2',
            dataset: DATASET_S5PL2,
            additionalMosaickingOrders: [],
          },
        };
      case DATASET_AWS_L8L1C:
      case DATASET_MODIS:
      case DATASET_AWS_DEM:
        return {
          [DATASET_AWS_L8L1C.id]: {
            label: 'Landsat 8 L1C',
            dataset: DATASET_AWS_L8L1C,
            additionalMosaickingOrders: [{ label: t`Least cloud coverage`, id: 'leastCC' }],
          },
          [DATASET_MODIS.id]: {
            label: 'MODIS',
            dataset: DATASET_MODIS,
            additionalMosaickingOrders: [],
          },
          [DATASET_AWS_DEM.id]: {
            label: 'DEM',
            dataset: DATASET_AWS_DEM,
            additionalMosaickingOrders: [],
          },
        };
      default:
        return {};
    }
  }

  render() {
    const { primaryLayer } = this.state;
    const {
      settings: { enabled = false, supplementalDatasets: supplementalDatasetsSettings = {} },
      initialTimespan,
    } = this.props;

    if (primaryLayer === null) {
      return <i className="fa fa-spinner fa-spin fa-fw" />;
    }

    if (!primaryLayer.dataset) {
      return null;
    }

    if (!this.supportsDataFusion(primaryLayer.dataset)) {
      return null;
    }

    const dataset = primaryLayer.dataset;
    const supplementalDatasets = this.getSupplementalLayers(primaryLayer.dataset);

    return (
      <div style={{ padding: '5px 0px 5px 0px', fontSize: 12, marginTop: '5px' }}>
        <span className="checkbox-holder use-url">
          <input
            type="checkbox"
            id="data-fusion-checkbox"
            onChange={this.toggleDataFusionEnabled}
            checked={enabled}
          />
          <label htmlFor="data-fusion-checkbox">{t`Use additional datasets (advanced)`}</label>
        </span>

        {enabled && (
          <div className="insert-url-block">
            <div className="primary-dataset">
              <label>{`Primary dataset: ${supplementalDatasets[dataset.id].label}`}</label>
              <div className="datasource-info">
                <i className="fa fa-info-circle" />
                <span>{`Datasource alias in evalscript: "${dataset.shProcessingApiDatasourceAbbreviation.toLowerCase()}"`}</span>
              </div>
            </div>
            {Object.keys(supplementalDatasets).map(supDatasetId =>
              supDatasetId === dataset.id ? null : (
                <DataFusionSupplementalDataset
                  key={supDatasetId}
                  label={supplementalDatasets[supDatasetId].label}
                  dataset={supplementalDatasets[supDatasetId].dataset}
                  additionalMosaickingOrders={supplementalDatasets[supDatasetId].additionalMosaickingOrders}
                  initialTimespan={initialTimespan}
                  settings={supplementalDatasetsSettings[supDatasetId] || {}}
                  onChange={values => this.onSupplementalDatasetChange(supDatasetId, values)}
                />
              ),
            )}
          </div>
        )}
      </div>
    );
  }
}
