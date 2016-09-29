/**
 * Create a new one and open it.
 */
exports.command = function () {
    var browser = this;
    browser
        .click('.create-workflow-button')
        .waitForElementPresent('.list-group-item:last-child .btn-open')
        .click('.list-group-item:last-child .btn-open')
        .waitForElementNotPresent('.no-workflows-open-help-title')
        .waitForElementVisible('.panel-group');
    return browser;
};
