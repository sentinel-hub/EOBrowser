import React, { PureComponent } from 'react';
import './EOBButton.scss';

export class EOBButton extends PureComponent {
  render() {
    const {
      text,
      icon,
      loading,
      fluid,
      onClick,
      onDisabledClick,
      disabled,
      className,
      progress = null,
      ...rest
    } = this.props;
    return (
      <a
        className={`eob-btn ${className || ''} ${fluid ? 'full-size' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={!disabled ? onClick : onDisabledClick}
        {...rest}
      >
        {loading ? (
          <>
            <i className="fa fa-spinner fa-spin fa-fw" />
            {progress !== null ? <span className="progress">{progress}%</span> : ''}
          </>
        ) : (
          <>
            {icon && <i className={`fa fa-${icon}`} />}
            {text}
          </>
        )}
      </a>
    );
  }
}
