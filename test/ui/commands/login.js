exports.command = function (url) {

    url = typeof url !== 'undefined' ? url : this.globals.studio_url;

    this
        .resizeWindow(1920,1080)
        .url(url)
        .waitForElementVisible('button[type=submit]')
        .setValue('#user', 'user')
        .setValue('#password', 'pwd')
        .click('button[type=submit]')
        .waitForElementVisible('.no-workflows-open-help-title')
        .assert.containsText('.no-workflows-open-help-title', 'No workflows are open')

    return this;
};
