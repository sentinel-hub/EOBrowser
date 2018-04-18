import React from 'react';
import sgLogo from './logo30.png';

const Header = ({ user, onLogout, showLogin, onShowLogin }) => (
  <header className="logoHeader">
    {showLogin && (
      <span className="userPanel">
        {user ? (
          <div>
            Hello, <b>{user.name}</b>
            <a onClick={onLogout} title="Logout">
              <i className="fa fa-power-off" />
            </a>
          </div>
        ) : (
          <a className="btn" onClick={onShowLogin || null}>
            Login
          </a>
        )}
      </span>
    )}
    <span className="appTitle">
      <a className="sgLogo" href="https://www.sinergise.com" target="_blank" rel="noopener noreferrer">
        <img src={sgLogo} alt="Sinergise" />
      </a>
      {!showLogin ? 'Image browser' : 'EO Browser'}
    </span>
  </header>
);
export default Header;
