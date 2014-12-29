exports.command = function (xpathCheck) {

    this
        .moveToElement('.ui-pnotify-title', 10, 10)
        .pause(500)
        .click("span.glyphicon.glyphicon-remove")
        .waitForElementNotPresent('.ui-pnotify-title')

    return this;
};
