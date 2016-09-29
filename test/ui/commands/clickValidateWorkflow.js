// macro for validating a workflow from the workflow-designer + wait for the menu animation to finish

exports.command = function () {
    return this
        .waitForElementPresent('.navbar-toggle', 2000)
        .waitForElementVisible('#validate-button', 2000, 'The menu has not collapsed or is hidden')
        .click('#validate-button')
        .pause(this.globals.menuAnimationTime);
};
