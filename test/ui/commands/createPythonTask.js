exports.command = function () {

    this
        .waitForElementVisible('#task-menu')
        .click('#task-menu')
        .waitForElementVisible('#Jython')
        .moveToElement('#Jython', 8, 8)
        .mouseButtonDown(0)
        .moveToElement('#workflow-designer', 100, 100)
        .mouseButtonUp(0);
    return this;
};
