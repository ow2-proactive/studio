// macro for saving a workflow from the workflow-designer + wait for the menu animation to finish

exports.command = function () {
    return this
        .waitForElementPresent('#menu-bar', 2000)
        .openDropdown('#file-dropdown')
        .waitForElementVisible('#save-button', 2000, 'The menu has not collapsed or is hidden')
        .click('#save-button')
        .pause(this.globals.menuAnimationTime);
};
