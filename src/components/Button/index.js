import React, { PureComponent } from 'react';

export default class extends PureComponent {
  render() {
    const { text, icon, loading, fluid, onClick, disabled, className, ...rest } = this.props;
    return (
      <a
        className={`btn ${className} ${fluid ? 'full-size' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={!disabled && onClick}
        {...rest}
      >
        {loading ? (
          <i className="fa fa-spinner fa-spin fa-fw" />
        ) : (
          <span>
            {icon && <i className={`fa fa-${icon}`} />}
            {text}
          </span>
        )}
      </a>
    );
  }
}
