exports.command = function (url) {

    url = typeof url !== 'undefined' ? url : this.globals.studio_url;

    this
        .windowMaximize()
        .url(url)
        .waitForElementVisible('button[type=submit]', 1000)
        .setValue('#user', 'user')
        .setValue('#password', 'pwd')
        .click('button[type=submit]')
        .waitForElementVisible('.no-workflows-open-help-title', 1000)
        .assert.containsText('.no-workflows-open-help-title', 'No workflows are open')

    return this;
};
