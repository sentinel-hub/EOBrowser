import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';

import { DraggableDialogBox } from '../components/DraggableDialogBox/DraggableDialogBox';
import { EOBButton } from '../junk/EOBCommon/EOBButton/EOBButton';

import './PrivateThemeModal.scss';

function PrivateThemeModal({ handlePrivateThemeDecision }) {
  return (
    <DraggableDialogBox
      width={600}
      height={158}
      onClose={() => {}}
      showCloseButton={false}
      title={t`The theme you are trying to access is private`}
      modal={true}
    >
      <div className="private-theme-modal">
        <div className="private-theme-text">{t`Please login to gain access to it`}</div>

        <div className="private-theme-buttons">
          <EOBButton className="login-btn" text={t`Login`} onClick={() => handlePrivateThemeDecision(true)} />
          <EOBButton
            className="no-login-btn"
            text={t`Continue without logging in`}
            onClick={() => handlePrivateThemeDecision(false)}
          />
        </div>
      </div>
    </DraggableDialogBox>
  );
}

const mapStoreToProps = (store) => ({
  handlePrivateThemeDecision: store?.modal?.params?.handlePrivateThemeDecision,
});
export default connect(mapStoreToProps)(PrivateThemeModal);
