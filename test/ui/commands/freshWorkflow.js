/**
 * Remove all workflows, create a new one and open it.
 */
exports.command = function () {
    var browser = this

    var deleteWorkflows = function () {
        // isVisible will cause a test failure if element cannot be found, fallback to Selenium method
        browser.element("css selector", ".btn-remove", function (result) {
            if (result.status === 0) {
                browser.click('.btn-remove')
                deleteWorkflows();
            }
        })
    }
    deleteWorkflows();

    browser
        .click('.create-workflow-button')
        .waitForElementPresent('.list-group-item:last-child .btn-open')
        .click('.list-group-item:last-child .btn-open')
        .waitForElementNotPresent('.no-workflows-open-help-title')
        .waitForElementVisible('.panel-group');

    return browser;
};
