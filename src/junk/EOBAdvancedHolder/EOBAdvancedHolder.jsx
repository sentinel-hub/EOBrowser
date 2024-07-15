import React from 'react';
import { t } from 'ttag';

import { BandsToRGB } from '../BandsToRGB/BandsToRGB';
import { GroupedBandsToRGB } from '../BandsToRGB/GroupedBandsToRGB';
import { EvalScriptInput } from './EvalScriptInput';
import DataFusion from './DataFusion';
import { IndexBands } from '../BandsToRGB/IndexBands';
import { withRouter } from 'react-router-dom';

import './EOBAdvancedHolder.scss';
import HelpTooltip from '../../Tools/SearchPanel/dataSourceHandlers/DatasourceRenderingComponents/HelpTooltip';
import ReactMarkdown from 'react-markdown';

const CUSTOM_VISUALISATION_TABS = {
  COMPOSITE_TAB: 0,
  INDEX_TAB: 1,
  CUSTOM_SCRIPT_TAB: 2,
};

export const CUSTOM_VISUALIZATION_URL_ROUTES = ['#custom-composite', '#custom-index', '#custom-script'];

const tutorial = 'https://docs.sentinel-hub.com/api/latest/evalscript/#tutorials-and-other-related-materials';
const repo = 'https://custom-scripts.sentinel-hub.com/';
const getTooltipContent = () => t`
An evalscript (or "custom script") is a piece of Javascript code that defines how the satellite data
should be processed by Sentinel Hub (one of the underlying services that powers the Browser) and what values the
service should return. \n\n
Read more about custom scripts in our [tutorials](${tutorial}) or use already prepared scripts
for different collections from the [custom script repository](${repo}).
`;

class EOBAdvancedHolder extends React.Component {
  state = {
    selectedTab: 0,
  };

  initTabs = () => {
    const hashIndex = CUSTOM_VISUALIZATION_URL_ROUTES.indexOf(this.props.location.hash);
    if (hashIndex !== -1) {
      this.setState({ selectedTab: hashIndex });
    }
  };

  componentDidMount() {
    if (this.props.location.hash) {
      this.initTabs();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.hash !== prevProps.location.hash) {
      this.initTabs();
    }
  }

  setSelectedTab(index) {
    this.setState({ selectedTab: index });
    window.location.hash = CUSTOM_VISUALIZATION_URL_ROUTES[index];
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
      onEvalscriptRefresh,
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

        <div className="custom-visualisation-content">
          <ul className="custom-visualisation-tabs">
            <li
              className={`tab-button ${
                this.state.selectedTab === CUSTOM_VISUALISATION_TABS.COMPOSITE_TAB ? `active` : ``
              }`}
              onClick={() => this.setSelectedTab(CUSTOM_VISUALISATION_TABS.COMPOSITE_TAB)}
            >{t`Composite`}</li>
            <li
              className={`tab-button ${
                this.state.selectedTab === CUSTOM_VISUALISATION_TABS.INDEX_TAB ? `active` : ``
              }`}
              onClick={() => this.setSelectedTab(CUSTOM_VISUALISATION_TABS.INDEX_TAB)}
            >{t`Index`}</li>
            <li
              className={`tab-button ${
                this.state.selectedTab === CUSTOM_VISUALISATION_TABS.CUSTOM_SCRIPT_TAB ? `active` : ``
              }`}
              onClick={() => this.setSelectedTab(CUSTOM_VISUALISATION_TABS.CUSTOM_SCRIPT_TAB)}
            >{t`Custom script`}</li>
          </ul>

          {this.state.selectedTab === CUSTOM_VISUALISATION_TABS.COMPOSITE_TAB && (
            <div className="custom-visualisation-wrapper">
              {groupedChannels ? (
                <GroupedBandsToRGB
                  groupedBands={groupedChannels}
                  value={layers}
                  onChange={onCompositeChange}
                />
              ) : (
                <BandsToRGB
                  bands={channels}
                  value={layers}
                  onChange={onCompositeChange}
                  areBandsClasses={areBandsClasses}
                />
              )}
            </div>
          )}

          {this.state.selectedTab === CUSTOM_VISUALISATION_TABS.INDEX_TAB && supportsIndex && (
            <div className="custom-visualisation-wrapper">
              <IndexBands
                bands={channels}
                layers={indexLayers}
                onChange={onIndexScriptChange}
                evalscript={evalscript}
              />
            </div>
          )}

          {this.state.selectedTab === CUSTOM_VISUALISATION_TABS.CUSTOM_SCRIPT_TAB && (
            <div className="custom-visualisation-wrapper">
              <HelpTooltip direction="right" closeOnClickOutside={true} className="padOnRight">
                <ReactMarkdown linkTarget="_blank">{getTooltipContent()}</ReactMarkdown>
              </HelpTooltip>
              <p>{t`Use custom script to create a custom visualization`}</p>
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
                onRefreshEvalscript={onEvalscriptRefresh}
                evalscript={evalscript}
                evalscripturl={window.decodeURIComponent(evalscripturl || '')}
                isEvalUrl={isEvalUrl}
                onChange={onUpdateScript}
              />
            </div>
          )}
        </div>
      </div>
    ) : (
      <div />
    );
  }
}

export default withRouter(EOBAdvancedHolder);
