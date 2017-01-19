exports.command = function (url) {

    url = typeof url !== 'undefined' ? url : this.globals.studio_url;

    this
        .url(url)
        .waitForElementVisible('body')
        .resizeWindow(1650, 1280)
        .setWindowPosition(0, 0)
        .waitForElementPresent('button[type=submit]')
        .setValue('#user', 'user')
        .setValue('#password', 'pwd')
        .click('button[type=submit]');
    return this;
};
