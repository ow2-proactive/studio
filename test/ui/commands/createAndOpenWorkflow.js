exports.command = function () {

    this
        .click('.create-workflow-button')
        .click('.list-group-item:last-child .btn-open')
        .waitForElementNotPresent('.no-workflows-open-help-title');

    return this;
};
