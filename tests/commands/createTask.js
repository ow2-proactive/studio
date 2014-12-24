exports.command = function () {

    this
        .waitForElementVisible('#task-menu', 1000)
        .click('#task-menu')
        .waitForElementVisible('#Javascript', 1000)
        .moveToElement('#Javascript', 0, 0)
        .mouseButtonDown(0)
        .moveToElement('#workflow-designer', 100, 100)
        .mouseButtonUp(0)

    return this;
};
