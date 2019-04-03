module.exports = {
    // Set global timeout to 5 seconds. This will be applied to each wait for which does not
    // specify a timeout
    waitForConditionTimeout: 5000,
    "Drag and drop a single task": function (browser) {
        browser
            .login()
            .closeNotification()
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .createNewWorkflow()
            .createTask()
            .clickSaveWorkflow()
            .assert.notification("Saved")
            .closeNotification()
            .clickValidateWorkflow()
            .assert.notification('Workflow is valid')
            .closeNotification()
            .checkExport(function (select, jobXmlDocument) {
                var taskName = select("//p:task/@name", jobXmlDocument)[0].value

                this.assert.ok(taskName.indexOf("Javascript_Task") > -1, "Task name")
            })
            .keys(browser.Keys.ESCAPE)
            .pause(browser.globals.menuAnimationTime)
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .end();
    },
    
    "Test export python task": function (browser) {
        browser
            .login()
            .closeNotification()
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .createNewWorkflow()
            .createPythonTask()
            .clickSaveWorkflow()
            .assert.notification("Saved")
            .closeNotification()
            .clickValidateWorkflow()
            .assert.notification('Workflow is valid')
            .closeNotification()
            .checkExport(function (select, jobXmlDocument) {
                this.assert.ok(true, "jobXmlDocument: " + jobXmlDocument);
                var taskName = select("//p:task/@name", jobXmlDocument)[0].value;
                this.assert.ok(taskName.indexOf("Python_Task") > -1, "Task name");
                var selected = select("//p:scriptExecutable/p:script/p:code[@language='python']", jobXmlDocument);
                this.assert.ok(true, "selected code: " + selected);

                var data = selected[0].toString().replace(" xmlns=\"urn:proactive:jobdescriptor:3.11\"", "");

                this.assert.ok(true, "selected data: " + data);

                var pythonExpectedScript = "<code language=\"python\">"
                pythonExpectedScript = pythonExpectedScript.concat("\n            <![CDATA[");
                pythonExpectedScript = pythonExpectedScript.concat("\nfor x in range(1, 11):");
                pythonExpectedScript = pythonExpectedScript.concat("\n    print x");
                pythonExpectedScript = pythonExpectedScript.concat("\n]]>");
                pythonExpectedScript = pythonExpectedScript.concat("\n          </code>");

                this.assert.equal(data, pythonExpectedScript, "Data value")
                
            })
            .keys(browser.Keys.ESCAPE)
            .pause(browser.globals.menuAnimationTime)
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .end();
    },

    "Workflow with job variable": function (browser) {
        browser
            .login()
            .closeNotification()
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .createNewWorkflow()
            
            // default mode is detailed view so we have to switch to simple view for the test
            .assert.elementPresent("#accordion-properties")
            .assert.elementPresent("#form-switch")
            .click('#form-switch')
            .waitForElementVisible('#confirm-data-loss')
            .assert.containsText('#confirm-data-loss', 'After switching to simple view all custom selection scripts will be lost')
            .click("#data-loss-continue")
            .waitForElementVisible('#simple-form')
            .assert.elementNotPresent("#accordion-properties")
            .pause(browser.globals.menuAnimationTime)
            .click('div[name="Variables"] button')
            .waitForElementVisible('#Name')
            .setValue("#Name", "aVariable")
            .setValue("#Value", "aValue")

            .click('.btn.ok')
            .pause(browser.globals.menuAnimationTime)

            .checkExport(function (select, jobXmlDocument) {
                var variable = select("//p:variable", jobXmlDocument)[0]

                this.assert.equal(variable.attributes[0].value, "aVariable", "Variable name")
                this.assert.equal(variable.attributes[1].value, "aValue", "Variable value")
            })
            .pause(browser.globals.menuAnimationTime)
            .keys(browser.Keys.ESCAPE)
            .pause(browser.globals.menuAnimationTime)
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .end();
    },

    "Clear workflow": function (browser) {
        browser
            .login()
            .closeNotification()
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .createNewWorkflow()
            .createTask()
            .waitForElementVisible('.task')
            .clickClearWorkflow()
            .checkExport(function (select, jobXmlDocument) {
                var task = select("//p:task", jobXmlDocument)[0]
                this.assert.equal(task, null, "No task in XML")
            })
            .keys(browser.Keys.ESCAPE)
            .pause(browser.globals.menuAnimationTime)
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .end();
    },

    "Update task name": function (browser) {
    	var _taskNameVal = 'updated_task_name';
    	
        browser
            .login()
            .closeNotification()
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .createNewWorkflow()
            .createTask()
            .waitForElementVisible('.task')
            .click(".task")
            .assert.containsText('.task-name > .name', 'Javascript_Task')
            .waitForElementVisible("input[name='Task Name']")
            .clearValue("input[name='Task Name']")
            .setValue("input[name='Task Name']", _taskNameVal)
            .assert.containsText('.task-name > .name', _taskNameVal)
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .end();
    },

    "Display tab tooltips": function (browser) {
        browser
            .login()
            .closeNotification()
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .createNewWorkflow()
            .assert.attributeEquals("a[id='Error Handling']", "data-help", "Configure workflow behavior upon errors")
            .createTask()
            .waitForElementVisible('.task')
            .click(".task")
            .assert.attributeEquals("a[id='Multi-Node Execution']", "data-help", "Configuration of resources requirements")
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .end();
    }


};
