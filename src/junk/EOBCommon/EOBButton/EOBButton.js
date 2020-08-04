import React, { PureComponent } from 'react';
import './EOBButton.scss';

export class EOBButton extends PureComponent {
  render() {
    const { text, icon, loading, fluid, onClick, disabled, className, progress = null, ...rest } = this.props;
    return (
      <a
        className={`btn ${className || ''} ${fluid ? 'full-size' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={!disabled ? onClick : null}
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
