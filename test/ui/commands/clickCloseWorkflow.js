// macro for closing a workflow from the workflow-designer + wait for the menu to finish its closing animation

exports.command = function () {
    return this
        .waitForElementPresent('#menu-bar', 2000)
        .openDropdown('#file-dropdown')
        .waitForElementPresent('#close-button', 2000)
        .waitForElementVisible('#close-button', 5000, 'The menu has not collapsed or is hidden')
        .click('#close-button')
        .pause(this.globals.menuAnimationTime);
};
