import React from 'react';
import PropTypes from 'prop-types';

const NotificationPanel = ({ type, msg, html }) => {
  let icon = '';
  switch (type) {
    case 'error':
      icon = 'exclamation-circle';
      break;
    case 'ok':
      icon = 'check-circle';
      break;
    case 'warning':
      icon = 'exclamation-triangle';
      break;
    case 'info':
      icon = 'info-circle';
      break;
    case 'loading':
      icon = 'spinner fa-spin fa-fw';
      break;
    case 'nothing':
      icon = '';
      break;
    default:
      break;
  }

  return (
    <div className="notification">
      {icon !== '' && (
        <i className={`fa fa-${icon}`} style={{ marginRight: '6px' }} />
      )}
      {html && <span dangerouslySetInnerHTML={{ __html: msg }} />}
      {!html && msg}
    </div>
  );
};
NotificationPanel.propTypes = {
  type: PropTypes.oneOf([
    'error',
    'ok',
    'info',
    'warning',
    'loading',
    'nothing'
  ]).isRequired,
  msg: PropTypes.string.isRequired,
  html: PropTypes.bool
};
export default NotificationPanel;
