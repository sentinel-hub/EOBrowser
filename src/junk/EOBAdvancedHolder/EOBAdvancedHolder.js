import React from 'react';
import { t } from 'ttag';

import { BandsToRGB } from '../BandsToRGB/BandsToRGB';
import { GroupedBandsToRGB } from '../BandsToRGB/GroupedBandsToRGB';
import { EvalScriptInput } from './EvalScriptInput';
import { b64DecodeUnicode } from '../EOBCommon/utils/Base64MDM';
import DataFusion from './DataFusion';
import Accordion from '../../components/Accordion/Accordion';
import { IndexBands } from '../BandsToRGB/IndexBands';

import './EOBAdvancedHolder.scss';

export default class EOBAdvancedHolder extends React.Component {
  state = {
    openAccordion: 0, // composite accordion displayed by default
  };

  toggleAccordion = index => {
    if (index !== this.state.openAccordion) {
      this.setState({ openAccordion: index });
    } else {
      this.setState({ openAccordion: null });
    }
  };

  render() {
    const {
      channels,
      layers,
      evalscript,
      evalscripturl,
      dataFusion = {},
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
    } = this.props;

    const groupedChannels =
      activeDatasource && activeDatasource.groupChannels ? activeDatasource.groupChannels(channels) : null;

    return layers && channels ? (
      <div className="advancedPanel" style={style}>
        <header>
          {
            // eslint-disable-next-line
            <a onClick={onBack} className="btn secondary">
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
            <BandsToRGB bands={channels} value={layers} onChange={onCompositeChange} />
          )}
        </Accordion>
        <Accordion
          open={this.state.openAccordion === 1}
          title="Index"
          toggleOpen={() => this.toggleAccordion(1)}
        >
          <IndexBands bands={channels} layers={indexLayers} onChange={onIndexScriptChange} />
        </Accordion>
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
            evalscript={b64DecodeUnicode(evalscript)}
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
