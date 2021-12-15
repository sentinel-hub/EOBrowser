import React from 'react';
import { t } from 'ttag';

import { BandsToRGB } from '../BandsToRGB/BandsToRGB';
import { GroupedBandsToRGB } from '../BandsToRGB/GroupedBandsToRGB';
import { EvalScriptInput } from './EvalScriptInput';
import DataFusion from './DataFusion';
import Accordion from '../../components/Accordion/Accordion';
import { IndexBands } from '../BandsToRGB/IndexBands';
import { withRouter } from 'react-router-dom';

import './EOBAdvancedHolder.scss';

export const CUSTOM_VISUALIZATION_URL_ROUTES = ['#custom-composite', '#custom-index', '#custom-script'];
class EOBAdvancedHolder extends React.Component {
  state = {
    openAccordion: 0, // composite accordion displayed by default
  };

  toggleAccordion = (index) => {
    if (index !== this.state.openAccordion) {
      this.setState({ openAccordion: index });
      window.location.hash = CUSTOM_VISUALIZATION_URL_ROUTES[index];
    } else {
      this.setState({ openAccordion: null });
    }
  };

  initAccordion = () => {
    const hashIndex = CUSTOM_VISUALIZATION_URL_ROUTES.indexOf(this.props.location.hash);
    if (hashIndex !== -1) {
      this.setState({ openAccordion: hashIndex });
    }
  };

  componentDidMount() {
    if (this.props.location.hash) {
      this.initAccordion();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.hash !== prevProps.location.hash) {
      this.initAccordion();
    }
  }

  render() {
    const {
      channels,
      layers,
      evalscript,
      evalscripturl,
      dataFusion = [],
      activeLayer: activeDatasource,
      initialTimespan,
      isEvalUrl,
      indexLayers,
      style,
      onUpdateScript,
      onDataFusionChange,
      onBack,
      onCodeMirrorRefresh,
      onCompositeChange,
      onIndexScriptChange,
      areBandsClasses,
      supportsIndex,
    } = this.props;

    const groupedChannels =
      activeDatasource && activeDatasource.datasetId && activeDatasource.groupChannels
        ? activeDatasource.groupChannels(activeDatasource.datasetId)
        : null;

    return layers && channels ? (
      <div className="advancedPanel" style={style}>
        <header>
          {
            // eslint-disable-next-line
            <a onClick={onBack} className="eob-btn primary">
              <i className="fa fa-arrow-left" />
              {t`Back`}
            </a>
          }
        </header>
        <Accordion
          open={this.state.openAccordion === 0}
          title="Composite"
          toggleOpen={() => this.toggleAccordion(0)}
        >
          {groupedChannels ? (
            <GroupedBandsToRGB groupedBands={groupedChannels} value={layers} onChange={onCompositeChange} />
          ) : (
            <BandsToRGB
              bands={channels}
              value={layers}
              onChange={onCompositeChange}
              areBandsClasses={areBandsClasses}
            />
          )}
        </Accordion>

        {supportsIndex && (
          <Accordion
            open={this.state.openAccordion === 1}
            title="Index"
            toggleOpen={() => this.toggleAccordion(1)}
          >
            <IndexBands
              bands={channels}
              layers={indexLayers}
              onChange={onIndexScriptChange}
              evalscript={evalscript}
            />
          </Accordion>
        )}
        <Accordion
          open={this.state.openAccordion === 2}
          title="Custom script"
          toggleOpen={() => this.toggleAccordion(2)}
        >
          {activeDatasource && (
            <DataFusion
              key={activeDatasource.baseUrls.WMS}
              baseUrlWms={activeDatasource.baseUrls.WMS}
              settings={dataFusion}
              onChange={onDataFusionChange}
              initialTimespan={initialTimespan}
            />
          )}
          <EvalScriptInput
            evalscript={evalscript}
            evalscripturl={window.decodeURIComponent(evalscripturl || '')}
            isEvalUrl={isEvalUrl}
            onRefresh={onCodeMirrorRefresh}
            onChange={onUpdateScript}
          />
        </Accordion>
      </div>
    ) : (
      <div />
    );
  }
}

export default withRouter(EOBAdvancedHolder);
