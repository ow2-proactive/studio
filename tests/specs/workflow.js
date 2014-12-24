module.exports = {

    "Drag and drop a single task": function (browser) {
        browser
            .login()

            .closeNotification()

            .createAndOpenWorkflow()

            .createTask()

            .click('#save-button')
            .assert.notification("Saved")

            .closeNotification()

            .click('#validate-button')
            .assert.notification('Workflow is valid')

            .checkExport(function (xpath, jobXmlDocument) {
                var taskName = xpath.select("//*[local-name()='task']/@name", jobXmlDocument)[0].value

                this.assert.equal(taskName, "Javascript_Task")
            })
            .end();
    },

    "Workflow with job variable": function (browser) {
        browser
            .login()

            .createAndOpenWorkflow()

            .click("#Job\\ Variables")

            .click('div[name="Job Variables"] button')

            .waitForElementVisible('#Name', 1000)
            .setValue("#Name", "aVariable")
            .setValue("#Value", "aValue")

            .click('.btn.ok')

            .checkExport(function (xpath, jobXmlDocument) {
                var variable = xpath.select("//*[local-name()='variable']", jobXmlDocument)[0]

                this.assert.equal(variable.attributes[0].value, "aVariable", "Variable name")
                this.assert.equal(variable.attributes[1].value, "aValue", "Variable value")
            })
            .end();
    },

    "Clear workflow": function (browser) {
        browser
            .login()

            .createAndOpenWorkflow()

            .createTask()
            .waitForElementVisible('.task', 1000)

            .click("#clear-button")

            .waitForElementNotPresent('.task', 1000)

            .checkExport(function (xpath, jobXmlDocument) {
                var task = xpath.select("//*[local-name()='task']", jobXmlDocument)[0]

                this.assert.equal(task, null, "No task in XML")
            })

            .end();
    },


};
