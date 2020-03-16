import React from 'react';

export default class AuthWindow extends React.Component {
  static defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  SRC = './tokenAssisted.html';
  UPDATE_SECONDS_BEFORE_EXPIRY = 60;

  componentDidMount() {
    window.addEventListener('message', e => {
      if (e.data.access_token) {
        this.props.setToken(e.data.access_token);
        const tokenExpiresIn = (e.data.expires_in - this.UPDATE_SECONDS_BEFORE_EXPIRY) * 1000;
        this.revokeTokenTimeout = setTimeout(() => {
          this.props.setTokenShouldBeUpdated(true);
        }, tokenExpiresIn);
      }
    });
  }

  renderAuthIframe = () => (
    <iframe
      style={{ display: 'none' }}
      title="assistedToken"
      src={this.SRC}
      height={this.props.height}
      width={this.props.width}
    />
  );

  render() {
    if (this.props.tokenShouldBeUpdated) {
      return this.renderAuthIframe();
    }
    return null;
  }
}
