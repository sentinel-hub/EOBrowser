import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faList,
  faPaintBrush,
  faThumbtack,
  faExchangeAlt,
} from '@fortawesome/free-solid-svg-icons';
import './Tabs.scss';
import { t } from 'ttag';

export class Tabs extends Component {
  handleSelect = renderKey => {
    if (renderKey !== 2) {
      // clear hash routes, except for 2 = Visualization tab
      window.location.hash = '';
    }
    this.props.onSelect(renderKey);
  };

  renderTabButtons = () => {
    return (
      <ul className="tab-list">
        {this.props.children.map(
          /* Note that we are accessing childrens' props here. This breaks encapsulation principles,
           but allows us to declare tabs in a nicer way (we can define props directly on each tab)*/
          tab => {
            let icon = null;
            switch (tab.props.icon) {
              case 'search':
                icon = faSearch;
                break;
              case 'list':
                icon = faList;
                break;
              case 'paint-brush':
                icon = faPaintBrush;
                break;
              case 'thumb-tack':
                icon = faThumbtack;
                break;
              case 'exchange-alt':
                icon = faExchangeAlt;
                break;
              default:
                icon = null;
                break;
            }
            return (
              <li
                id={`${tab.props.id}Button`}
                key={tab.props.renderKey}
                value={tab.props.renderKey}
                onClick={() =>
                  tab.props.enabled
                    ? this.handleSelect(tab.props.renderKey)
                    : this.props.onErrorMessage(t`Search for data first.`)
                }
                className={this.props.activeIndex === tab.props.renderKey ? 'tab-selected' : ''}
                disabled={!tab.props.enabled}
              >
                {tab.props.count ? (
                  <span className="counter-badge">{tab.props.count}</span>
                ) : (
                  icon && <FontAwesomeIcon icon={icon} className="fa-icon" />
                )}

                {tab.props.title}
              </li>
            );
          },
        )}
      </ul>
    );
  };

  renderContent() {
    return this.props.children.map((pane, index) => (
      <div id={pane.props.id} key={pane.props.renderKey} className="tabPanelContainer">
        <div className={pane.props.renderKey === this.props.activeIndex ? 'active' : 'none'}>{pane}</div>
      </div>
    ));
  }

  render() {
    return (
      <div className="tabs-container">
        {this.renderTabButtons()}
        {this.renderContent()}
      </div>
    );
  }
}

export class Tab extends Component {
  static defaultProps = {
    enabled: true,
  };

  render() {
    return this.props.children;
  }
}
