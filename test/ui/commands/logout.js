// macro for loging out

exports.command = function () {
    return this
        .pause(this.globals.menuAnimationTime)
        .waitForElementPresent('#logout-view-container > div > form > button')
        .moveToElement('#logout-view-container > div > form > button', 10, 10)
        .click('#logout-view-container > div > form > button')
        .waitForElementPresent('#login-view');
};
