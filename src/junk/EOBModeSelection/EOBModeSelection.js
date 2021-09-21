import React from 'react';
import { t } from 'ttag';

import './EOBModeSelection.scss';

const ModeSelectionButton = ({ highlighted, onClick, onMouseEnter }) => (
  <div
    className="mode-selection-button floatItem"
    title={t`Select mode`}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
  >
    <i className={`fa fa-graduation-cap ${highlighted ? `active` : null}`} />{' '}
  </div>
);

const ModeSelectionPanel = ({ highlighted, modes, onMouseLeave, onSelectMode, selectedModeId }) => (
  <div className="mode-selection-panel" onMouseLeave={onMouseLeave}>
    <div className="title">
      <div>{t`Mode:`}</div>
      <div>
        <i className={`fa fa-graduation-cap ${highlighted ? `active` : null}`} />{' '}
      </div>
    </div>
    <div className="items">
      {modes.map((mode, index) => (
        <label key={index}>
          <input
            type="radio"
            value={mode.id}
            name={mode.id}
            checked={mode.id === selectedModeId}
            onChange={(e) => onSelectMode(e)}
          />
          {mode.label()}
        </label>
      ))}
    </div>
  </div>
);

class EOBModeSelection extends React.Component {
  static defaultProps = {
    highlighted: false,
    modes: [],
    onSelectMode: (value) => {},
    selectedModeId: null,
  };

  state = {
    expanded: false,
  };

  toggleExpanded = () => {
    this.setState((prevState) => ({
      expanded: !prevState.expanded,
    }));
  };

  onMouseLeave = () => {
    setTimeout(() => this.setState({ expanded: false }), 100);
  };
  onMouseEnter = () => {
    setTimeout(() => this.setState({ expanded: true }), 100);
  };

  onSelectMode = (event) => {
    this.props.onSelectMode(event.target.value);
  };

  render() {
    const { expanded } = this.state;
    const { highlighted, modes, selectedModeId } = this.props;
    return (
      <div className="mode-selection">
        {!expanded && (
          <ModeSelectionButton
            onClick={this.toggleExpanded}
            onMouseEnter={this.onMouseEnter}
            highlighted={highlighted}
          />
        )}
        {expanded && (
          <ModeSelectionPanel
            highlighted={highlighted}
            modes={modes}
            onSelectMode={this.onSelectMode}
            selectedModeId={selectedModeId}
            onMouseLeave={this.onMouseLeave}
          />
        )}
      </div>
    );
  }
}

export default EOBModeSelection;
