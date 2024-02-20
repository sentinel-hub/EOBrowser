import ReactMarkdown from 'react-markdown';
import { DraggableDialogBox } from '../../components/DraggableDialogBox/DraggableDialogBox';
import { EOBButton } from '../../junk/EOBCommon/EOBButton/EOBButton';
import store, { modalSlice } from '../../store';
import './RestrictedAccessNotification.scss';
import { t } from 'ttag';
import { doLogout } from '../authHelpers';

const BILLING_LINK = 'https://apps.sentinel-hub.com/dashboard/#/account/billing?plans_tab=processing';

const text = t`### You have reached your monthly account limits

To continue, use EO Browser in anonymous mode (limited feature availability) or upgrade to an account with account with higher limits.`;

export default function RestrictedAccessNotification() {
  return (
    <DraggableDialogBox width={600} height={250} modal={true} showTitleBar={false} showCloseButton={false}>
      <div className="restricted-access-notification">
        <ReactMarkdown className="text" linkTarget="_blank" children={text} />

        <div className="buttons">
          <EOBButton
            text={t`Continue anonymously`}
            onClick={async () => {
              await doLogout();
              store.dispatch(modalSlice.actions.removeModal());
            }}
          />
          <EOBButton
            text={t`Upgrade account`}
            onClick={() => {
              window.open(BILLING_LINK, '_blank', 'noopener, noreferrer');
              store.dispatch(modalSlice.actions.removeModal());
            }}
          />
        </div>
      </div>
    </DraggableDialogBox>
  );
}
