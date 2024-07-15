import React from 'react';
import { useDispatch } from 'react-redux';
import { t } from 'ttag';

import { DraggableDialogBox } from '../components/DraggableDialogBox/DraggableDialogBox';
import { EOBButton } from '../junk/EOBCommon/EOBButton/EOBButton';
import { modalSlice } from '../store';
import ReactMarkdown from 'react-markdown';

import './PSDNonEligibleUserModal.scss';

const BILLING_LINK = 'https://apps.sentinel-hub.com/dashboard/#/account/billing?plans_tab=processing';

const text = t`### Your current account type is not eligible

Continue without access (OK) or upgrade your account to gain access to Planet Sandbox Data.`;

function PSDNonEligibleUserModal() {
  const dispatch = useDispatch();
  return (
    <DraggableDialogBox width={600} height={250} onClose={() => {}} showCloseButton={false} modal={true}>
      <div className="non-eligible-psd-modal">
        <ReactMarkdown className="text" linkTarget="_blank" children={text} />

        <div className="buttons">
          <EOBButton
            className="ok-btn"
            text={t`OK`}
            onClick={() => {
              dispatch(modalSlice.actions.removeModal());
            }}
          />
          <EOBButton
            className="upgrade-account-link-btn"
            text={t`Upgrade account`}
            onClick={() => {
              window.open(BILLING_LINK, '_blank', 'noopener, noreferrer');
              dispatch(modalSlice.actions.removeModal());
            }}
          />
        </div>
      </div>
    </DraggableDialogBox>
  );
}

export default PSDNonEligibleUserModal;
