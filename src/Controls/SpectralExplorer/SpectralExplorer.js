import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';
import store, { modalSlice } from '../../store';
import {
  getDataSourceHandler,
  getDatasetLabel,
} from '../../Tools/SearchPanel/dataSourceHandlers/dataSourceHandlers';
import { getBandsValues, spectralExplorerLabels } from './SpectralExplorer.utils';
import Content from './Content';

import './SpectralExplorer.scss';
import Rodal from 'rodal';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import { CancelToken } from '@sentinel-hub/sentinelhub-js';

let cancelToken = new CancelToken();

const Loading = ({ loading }) => {
  if (!loading) {
    return null;
  }
  return (
    <div className="fetching">
      <i className="fa fa-cog fa-spin fa-3x fa-fw" />
      {t`Loading, please wait`}
    </div>
  );
};

const ErrorMessage = ({ error, onClose }) => {
  if (!error) {
    return null;
  }
  return (
    <div className="error-message">
      <div>{error}</div>
      <EOBButton text={t`Close`} onClick={onClose} />
    </div>
  );
};

const ModalWrapper = ({ className, width, height, onClose, title, headerComponent, children }) => (
  <Rodal animation="slideUp" visible={true} width={width} height={height} onClose={onClose} closeOnEsc={true}>
    <div className={className}>
      <div className="title-bar">
        <h3 className="title">{title}</h3>
        {headerComponent ? headerComponent : null}
      </div>
      {children}
    </div>
  </Rodal>
);

const SpectralExplorer = ({
  datasetId,
  fromTime,
  toTime,
  geometry,
  customSelected,
  visualizationUrl,
  layerId,
  geometryType,
}) => {
  const [bandsValues, setBandsValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    const load = async (cancelToken) => {
      try {
        setLoading(true);
        setError(null);

        const result = await getBandsValues({
          datasetId,
          fromTime,
          geometry,
          toTime,
          visualizationUrl,
          cancelToken,
        });
        setBandsValues(result);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    //cancel previous requests in progress and create new cancel token
    if (cancelToken) {
      cancelToken.cancel();
    }
    cancelToken = new CancelToken();

    load(cancelToken);

    return () => {
      if (cancelToken) {
        cancelToken.cancel();
      }
    };
  }, [datasetId, customSelected, fromTime, geometry, layerId, toTime, visualizationUrl]);

  const dsh = getDataSourceHandler(datasetId);
  const bands = dsh?.getBands(datasetId) ?? [];
  const onClose = () => store.dispatch(modalSlice.actions.removeModal());
  return (
    <ModalWrapper
      className="spectral-explorer"
      width={700}
      height={550}
      onClose={onClose}
      title={`${spectralExplorerLabels.title()}: ${getDatasetLabel(datasetId)}`}
    >
      <Loading loading={loading} />
      <ErrorMessage error={error} onClose={onClose} />
      <Content
        datasetId={datasetId}
        loading={loading}
        error={error}
        values={bandsValues}
        bands={bands}
        geometryType={geometryType}
      ></Content>
    </ModalWrapper>
  );
};

const getPoiOrAoiGeometry = (store) => {
  const geometryType = store?.modal?.params?.geometryType;

  if (!geometryType) {
    return null;
  }

  return store?.[geometryType]?.geometry;
};

const mapStoreToProps = (store) => ({
  customSelected: store.visualization.customSelected,
  datasetId: store.visualization.datasetId,
  fromTime: store.visualization.fromTime,
  toTime: store.visualization.toTime,
  geometry: getPoiOrAoiGeometry(store),
  visualizationUrl: store.visualization.visualizationUrl,
  layerId: store.visualization.layerId,
  geometryType: store?.modal?.params?.geometryType,
});

export default connect(mapStoreToProps, null)(SpectralExplorer);
