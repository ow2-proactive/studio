exports.command = function (url) {

    url = typeof url !== 'undefined' ? url : this.globals.studio_url;

    this
        .resizeWindow(1280,1024)
        .url(url)
        .waitForElementPresent('button[type=submit]')
        .setValue('#user', 'user')
        .setValue('#password', 'pwd')
        .click('button[type=submit]');
    return this;
};
