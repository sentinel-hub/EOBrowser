import React from 'react';
import './Accordion.scss';

export default class Accordion extends React.PureComponent {
  render() {
    const { title, children, open, toggleOpen } = this.props;

    return (
      <div className="accordion-wrap">
        <div className={open ? 'accordion-title open' : 'accordion-title '} onClick={toggleOpen}>
          {title}
          {open ? <i className="fa fa-chevron-up" /> : <i className="fa fa-chevron-down" />}
        </div>
        {open && <div className="accordion-content">{children}</div>}
      </div>
    );
  }
}
