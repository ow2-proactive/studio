/**
 * Remove all workflows, create a new one and open it.
 */
exports.command = function () {
    var browser = this;

    var deleteWorkflows = function (iteration, amount) {
        // isVisible will cause a test failure if element cannot be found, fallback to Selenium method
        browser.element("css selector", ".btn-remove", function (result) {
            console.log("Remove Workflows, iteration: "+iteration+", max repetitions: "+amount)
            if (result.status === 0 && iteration < amount) {
                browser.click('.btn-remove')
                deleteWorkflows(iteration +1, amount);
            }
        })
    }
    deleteWorkflows(0, browser.globals.numberOfTries);

    browser
        .click('.create-workflow-button')
        .waitForElementPresent('.list-group-item:last-child .btn-open')
        .click('.list-group-item:last-child .btn-open')
        .waitForElementNotPresent('.no-workflows-open-help-title')
        .waitForElementVisible('.panel-group');

    return browser;
};
