// macro for clearing a workflow from the workflow-designer + wait for the menu animation to finish

exports.command = function () {
    return this
        .waitForElementPresent('.navbar-toggle', 2000)
        .waitForElementVisible('#clear-button', 2000, 'The menu has not collapsed or is hidden')
        .click("#clear-button")
        .waitForElementNotPresent('.task')
        .pause(this.globals.menuAnimationTime);
};
