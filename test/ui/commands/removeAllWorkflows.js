// This command removes all existing workflows from the Studio user session.

exports.command = function () {
    var browser = this;
    var deleteWorkflows = function (iteration, amount) {
        // isVisible will cause a test failure if element cannot be found, fallback to Selenium method
        browser.element("css selector", ".btn-remove", function (result) {
            console.log("Remove Workflows, iteration: "+iteration+", max repetitions: "+amount);
            if (result.status === 0 && iteration < amount) {
                browser.click('.btn-remove');
                deleteWorkflows(iteration +1, amount);
            }
        })
    };
    return deleteWorkflows(0, browser.globals.numberOfTries);
};