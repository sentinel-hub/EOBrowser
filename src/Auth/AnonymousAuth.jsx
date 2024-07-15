import React from 'react';

import './Auth.scss';
import {
  UPDATE_BEFORE_EXPIRY_ANON_TOKEN,
  fetchAnonTokenUsingService,
  getAnonTokenFromLocalStorage,
  getTokenExpiration,
  saveAnonTokenToLocalStorage,
  scheduleTokenRefresh,
} from './authHelpers';

let anonTokenRefreshTimeout = null;

export default class AnonymousAuth extends React.Component {
  RECAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY;

  captchaRef = undefined;

  saveAnonTokenAndScheduleRefresh = (anonToken) => {
    saveAnonTokenToLocalStorage(anonToken);
    this.props.setAnonToken(anonToken?.access_token);

    if (anonToken) {
      anonTokenRefreshTimeout = scheduleTokenRefresh(
        getTokenExpiration(anonToken),
        UPDATE_BEFORE_EXPIRY_ANON_TOKEN,
        anonTokenRefreshTimeout,
        this.captchaRef.executeCaptcha,
      );
    }
  };

  setInitialToken = async () => {
    let anonToken = await getAnonTokenFromLocalStorage();
    if (anonToken) {
      this.saveAnonTokenAndScheduleRefresh(anonToken);
    } else {
      this.captchaRef.executeCaptcha();
    }
  };

  onCaptchaExecuted = async (siteResponse) => {
    const anonToken = await fetchAnonTokenUsingService(import.meta.env.VITE_ANON_AUTH_SERVICE_URL, {
      siteResponse: siteResponse,
    });
    this.saveAnonTokenAndScheduleRefresh(anonToken);
  };

  render() {
    return (
      <Captcha
        ref={(node) => (this.captchaRef = node)}
        onExecute={this.onCaptchaExecuted}
        onLoad={this.setInitialToken}
        sitekey={this.RECAPTCHA_SITE_KEY}
        action="token_assisted_anonymous"
      />
    );
  }
}

class Captcha extends React.Component {
  componentDidMount() {
    this.loadCaptchaScript();
  }

  loadCaptchaScript = () => {
    if (!window.grecaptcha) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.onload = this.props.onLoad;
      script.src = 'https://www.google.com/recaptcha/api.js?render=' + this.props.sitekey;
      this.instance.appendChild(script);
    }
  };

  executeCaptcha = () => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(this.props.sitekey, {
          action: this.props.action,
        })
        .then((captchaToken) => {
          this.props.onExecute(captchaToken);
        });
    });
  };

  render() {
    return <div ref={(el) => (this.instance = el)} />;
  }
}
