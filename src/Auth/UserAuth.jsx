import React from 'react';
import { t } from 'ttag';

import { doLogin, doLogout } from './authHelpers';

const UserAuth = ({ user }) => {
  return (
    <span className="user-panel">
      {user ? (
        <div className="logout-button" onClick={doLogout} title={t`Logout`}>
          <i className="fa fa-power-off" />
        </div>
      ) : (
        <div
          className="login-button"
          onClick={doLogin}
          title={t`Login to unlock advanced features such as timelapse, analytical download, own configurations and more.`}
        >
          {t`Login`}
        </div>
      )}
    </span>
  );
};

export default UserAuth;
