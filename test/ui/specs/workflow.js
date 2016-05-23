module.exports = {
    // Set global timeout to 5 seconds. This will be applied to each wait for which does not
    // specify a timeout
    waitForConditionTimeout: 5000,
    "Drag and drop a single task": function (browser) {
        browser
            .login()
            .closeNotification()
            .freshWorkflow()
            .createTask()
            .showMenu()
            .waitForElementVisible('#save-button')
            .click('#save-button')
            .assert.notification("Saved")
            .hideMenu()
            .closeNotification()
            .showMenu()
            .click('#validate-button')
            .assert.notification('Workflow is valid')
            .checkExport(function (select, jobXmlDocument) {
                var taskName = select("//p:task/@name", jobXmlDocument)[0].value

                this.assert.ok(taskName.indexOf("Javascript_Task") > -1, "Task name")
            })
            .end();
    },
    
    "Test export python task": function (browser) {
        browser
            .login()
            .closeNotification()
            .freshWorkflow()
            .createPythonTask()
            .showMenu()
            .waitForElementVisible('#save-button')
            .click('#save-button')
            .assert.notification("Saved")
            .hideMenu()
            .closeNotification()
            .showMenu()
            .click('#validate-button')
            .assert.notification('Workflow is valid')
            .checkExport(function (select, jobXmlDocument) {
                var taskName = select("//p:task/@name", jobXmlDocument)[0].value

                this.assert.ok(taskName.indexOf("Python_Task") > -1, "Task name")
                
                var data = jobXmlDocument.getElementsByTagName("scriptExecutable")[0];
               
                
                var pythonExpectedScript = "<scriptExecutable>"
                pythonExpectedScript = pythonExpectedScript.concat("\n        <script>");
                pythonExpectedScript = pythonExpectedScript.concat("\n          <code language=\"python\">");
                pythonExpectedScript = pythonExpectedScript.concat("\n            <![CDATA[");
                pythonExpectedScript = pythonExpectedScript.concat("\nfor x in range(1, 11):");
                pythonExpectedScript = pythonExpectedScript.concat("\n    print x");
                pythonExpectedScript = pythonExpectedScript.concat("\n]]>");
                pythonExpectedScript = pythonExpectedScript.concat("\n          </code>");
                pythonExpectedScript = pythonExpectedScript.concat("\n        </script>");
                pythonExpectedScript = pythonExpectedScript.concat("\n      </scriptExecutable>");

                
                this.assert.equal(data, pythonExpectedScript, "Data value")
                
                                
            })
            .end();
    },

    "Workflow with job variable": function (browser) {
        browser
            .login()
            .freshWorkflow()
            
            // default mode is detailed view so we have to switch to simple view for the test
            .assert.elementPresent("#accordion-properties")
            .assert.elementPresent("#form-switch")
            .click('#form-switch')
            .waitForElementVisible('#confirm-data-loss')
            .assert.containsText('#confirm-data-loss', 'After switching to simple view all custom selection scripts will be lost')
            .click("#data-loss-continue")
            .waitForElementVisible('#simple-form')
            .assert.elementNotPresent("#accordion-properties")
            
            .click("button.btn.btn-default")
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
            .showMenu()
            .click("#clear-button")
            .waitForElementNotPresent('.task')
            .checkExport(function (select, jobXmlDocument) {
                var task = select("//p:task", jobXmlDocument)[0]
                this.assert.equal(task, null, "No task in XML")
            })
            .end();
    }


};
