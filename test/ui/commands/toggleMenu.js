// macro for toggling the menu on and off + wait for the menu to finish its animation

exports.command = function () {
    return this
        .waitForElementPresent('.navbar-toggle', 2000)
        .click('.navbar-toggle')
        .pause(this.globals.menuAnimationTime);
};
