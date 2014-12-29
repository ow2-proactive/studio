module.exports = {

    "Drag and drop a single task": function (browser) {
        browser
            .login()

            .closeNotification()

            .freshWorkflow()

            .createTask()

            .click('#save-button')
            .assert.notification("Saved")

            .closeNotification()

            .click('#validate-button')
            .assert.notification('Workflow is valid')

            .checkExport(function (select, jobXmlDocument) {
                var taskName = select("//p:task/@name", jobXmlDocument)[0].value

                this.assert.ok(taskName.indexOf("Javascript_Task") > -1, "Task name")
            })
            .end();
    },

    "Workflow with job variable": function (browser) {
        browser
            .login()

            .freshWorkflow()

            .click("#Job\\ Variables")

            .click('div[name="Variables"] button')

            .waitForElementVisible('#Name')
            .setValue("#Name", "aVariable")
            .setValue("#Value", "aValue")

            .click('.btn.ok')

            .checkExport(function (select, jobXmlDocument) {
                var variable = select("//p:variable", jobXmlDocument)[0]

                this.assert.equal(variable.attributes[0].value, "aVariable", "Variable name")
                this.assert.equal(variable.attributes[1].value, "aValue", "Variable value")
            })
            .end();
    },

    "Clear workflow": function (browser) {
        browser
            .login()

            .freshWorkflow()

            .createTask()
            .waitForElementVisible('.task')

            .click("#clear-button")

            .waitForElementNotPresent('.task')

            .checkExport(function (select, jobXmlDocument) {
                var task = select("//p:task", jobXmlDocument)[0]

                this.assert.equal(task, null, "No task in XML")
            })

            .end();
    }


};
