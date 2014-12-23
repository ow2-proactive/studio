exports.command = function (url) {

    url = typeof url !== 'undefined' ? url : "http://localhost:8080/studio";

    this
        .windowMaximize()
        .url(url)
        .waitForElementVisible('button[type=submit]', 1000)
        .setValue('#user', 'demo')
        .setValue('#password', 'demo')
        .click('button[type=submit]')
        .waitForElementVisible('.no-workflows-open-help-title', 1000)
        .assert.containsText('.no-workflows-open-help-title', 'No workflows are open')

    return this;
};
