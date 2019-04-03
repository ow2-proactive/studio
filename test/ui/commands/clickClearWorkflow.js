// macro for clearing a workflow from the workflow-designer + wait for the menu animation to finish

exports.command = function () {
    return this
        .waitForElementPresent('#menu-bar', 2000)
        .openDropdown('#edit-dropdown')
        .waitForElementVisible('#clear-button', 2000, 'The menu has not collapsed or is hidden')
        .click("#clear-button")
        .waitForElementNotPresent('.task')
        .pause(this.globals.menuAnimationTime);
};
