module.exports = {

    "Drag and drop a single task": function (browser) {
        browser
            .login()

            .moveToElement('.ui-pnotify-title', 10, 10)
            .pause(500)
            .click("span.glyphicon.glyphicon-remove")
            .waitForElementNotPresent('.ui-pnotify-title', 1000)

            .createAndOpenWorkflow()

            .createTask()

            .click('#validate-button')
            .waitForElementVisible('.ui-pnotify-title', 1000)
            .assert.containsText('.ui-pnotify-title', 'Workflow is valid')

            .click('#export-button')
            .waitForElementVisible('.CodeMirror-code', 1000)

            .element("css selector", ".CodeMirror", function (result) {
                browser.execute(function (data) {
                    return arguments[0].CodeMirror.getValue();
                }, [result.value], function (res) {
                    var jobXml = res.value
                    console.log(jobXml)
                    var xpath = require('xpath')
                        , dom = require('xmldom').DOMParser

                    var doc = new dom().parseFromString(jobXml)
                    var taskName = xpath.select("//*[local-name()='task']/@name", doc)[0].value

                    this.assert.equal(taskName, "Javascript_Task")
                });
            })
            .end();
    },


};
