
module.exports = {
  beforeEach : function(browser, done) {
    console.log('Start recording');
    require('/usr/lib/node_modules/nightwatch-record').start(browser, done);
    done();
  },

  afterEach : function(browser, done) {
    console.log('Stop recording');
    require('/usr/lib/node_modules/nightwatch-record').stop(browser, done);
    done();
  },

  'Test login' : function (browser) {
    const loginBtnSelector = 'span.userPanel a.btn';
    const popupLoginBtnSelector = 'button.btn.btn-sinergise';
    const popupUsernameInputSelector = 'input[name="username"]';
    const popupPasswordInputSelector = 'input[name="password"]';
    browser
      .url(process.env['EOB_URL'])
      .waitForElementVisible(loginBtnSelector, 5000)
      .assert.containsText(loginBtnSelector, 'Login')
      .click(loginBtnSelector)
      .window_handles(function(result) {
        const popupWindowHandle = result.value[1];
        browser.switchWindow(popupWindowHandle);
      })
      .verify.urlContains('https://services.sentinel-hub.com/oauth/auth');

    // enter username and password:
    browser
      .waitForElementVisible(popupUsernameInputSelector, 3000)
      .click(popupUsernameInputSelector)
      .setValue(popupUsernameInputSelector, process.env['EOB_LOGIN_USER'])
      .waitForElementVisible(popupPasswordInputSelector, 1000)
      .click(popupPasswordInputSelector)
      .setValue(popupPasswordInputSelector, process.env['EOB_LOGIN_PASS'])
      .waitForElementVisible(popupLoginBtnSelector, 1000)
      .click(popupLoginBtnSelector)
      .pause(2000)
      .assert.elementNotPresent('div.error', "Login error message must not be present")

    // verify that we are logged-in in main window:
    browser
      .window_handles(function(result) {
        const mainWindowHandle = result.value[0];
        this.switchWindow(mainWindowHandle);
      })
      .verify.urlContains(browser.globals.eob_url)
      .pause(2000)
      .assert.elementNotPresent(loginBtnSelector, "Login button must no longer be present")
      .end();
  }
};
