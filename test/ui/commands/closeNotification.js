// macro to close a notification
// this macro waits some time for the notification to do its animations (appearing and close)

exports.command = function (xpathCheck) {

    return this
        .pause(this.globals.menuAnimationTime)
        .moveToElement('span.glyphicon.glyphicon-remove', 0, 0)
        .pause(this.globals.menuAnimationTime)
        .click('span.glyphicon.glyphicon-remove')
        .waitForElementNotPresent('.ui-pnotify-title');
};
