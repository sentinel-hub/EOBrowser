import React from 'react';

import './NotificationPanel.scss';

export const NotificationPanel = ({ type, msg, className }) => {
  let icon = null;
  switch (type) {
    case 'error':
      icon = 'exclamation-circle';
      break;
    case 'warning':
      icon = 'exclamation-triangle';
      break;
    case 'info':
      icon = 'info-circle';
      break;
    default:
      break;
  }

  return (
    <div className={`notification-panel ${className || ''}`}>
      {icon && <i className={`fas fa-${icon}`} />}
      {msg}
    </div>
  );
};
