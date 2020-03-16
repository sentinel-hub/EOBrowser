import React, { Component } from 'react';
import onClickOutside from 'react-onclickoutside';
import Tooltip from 'react-tooltip-lite';
import './HelpTooltip.css';

class HelpTooltip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
    };
  }

  toggleTooltip = () => {
    this.setState(oldState => ({
      opened: !oldState.opened,
    }));
  };

  handleClickOutside = e => {
    const clickIsInside = Array.from(document.querySelectorAll('[class^="react-tooltip-lite"]')).some(elem =>
      elem.contains(e.target),
    );
    if (this.props.closeOnClickOutside && !clickIsInside) {
      this.setState({
        opened: false,
      });
    }
  };

  render() {
    return (
      <Tooltip
        isOpen={this.state.opened}
        tagName="span"
        direction={this.props.direction}
        content={this.props.children}
        className={`helpTooltip ${this.props.className} ${this.state.opened ? 'opened' : 'closed'}`}
      >
        <a onClick={this.toggleTooltip} className="helpTooltipIcon">
          <i className="fa fa-question-circle" />
        </a>
      </Tooltip>
    );
  }
}

export default onClickOutside(HelpTooltip);
