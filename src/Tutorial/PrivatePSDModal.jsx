import React from 'react';
import { connect } from 'react-redux';
import { t } from 'ttag';
import ReactMarkdown from 'react-markdown';

import { DraggableDialogBox } from '../components/DraggableDialogBox/DraggableDialogBox';
import { EOBButton } from '../junk/EOBCommon/EOBButton/EOBButton';

import './PrivatePSDModal.scss';

const text = t`You need to be logged-in and an eligible user to have access to Planet Sandbox Data. [Learn more](https://www.sentinel-hub.com/pricing/)`;

function PrivatePSDModal({ handlePrivateThemeDecision }) {
  return (
    <DraggableDialogBox width={600} height={225} onClose={() => {}} showCloseButton={false} modal={true}>
      <div className="private-psd-modal">
        <ReactMarkdown className="text" linkTarget="_blank" children={text} />

        <div className="login-text">
          <div>{t`If you already have an account.`}</div>
          <div className="login-link" onClick={() => handlePrivateThemeDecision(true)}>{t`Log in`}</div>
        </div>
        <EOBButton className="ok-btn" text={t`OK`} onClick={() => handlePrivateThemeDecision(false)} />
      </div>
    </DraggableDialogBox>
  );
}

const mapStoreToProps = (store) => ({
  handlePrivateThemeDecision: store?.modal?.params?.handlePrivateThemeDecision,
});
export default connect(mapStoreToProps)(PrivatePSDModal);
