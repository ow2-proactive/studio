exports.command = function () {

    this
        .click('#task-menu')
        .waitForElementVisible('#Javascript', 1000)
        .moveToElement('#Javascript', 0, 0)
        .mouseButtonDown(0)
        .moveToElement('#workflow-designer', 100, 100)
        .mouseButtonUp(0)

    return this;
};
