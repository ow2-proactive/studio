module.exports = {

    "Simple form by default": function (browser) {
        browser
            .login()
            .closeNotification()
            .freshWorkflow()
            .waitForElementVisible('#simple-form')
            .assert.elementNotPresent("#accordion-properties")
            .createTask()
            .click(".task")
            .waitForElementVisible('#simple-form')
            .assert.elementNotPresent("#accordion-properties")
            .end();
    },

    "Switch from job to detailed view and back": function (browser) {
        browser
            .login()
            .closeNotification()
            .freshWorkflow()
            .assert.elementNotPresent("#accordion-properties")
            .assert.elementPresent("#form-switch")
            .click("#form-switch")
            .waitForElementVisible('#accordion-properties')
            .assert.elementPresent("[placeholder='@attributes->priority']")
            .assert.elementPresent("#form-switch")
            .click("#form-switch")
            .waitForElementVisible('#confirm-data-loss')
            .assert.containsText('#confirm-data-loss', 'After switching to simple view all custom selection scripts will be lost')
            .click("#data-loss-continue")
            .waitForElementVisible('#simple-form')
            .end();
    },

    "Switch from task to detailed view and back": function (browser) {
        browser
            .login()
            .closeNotification()
            .freshWorkflow()
            .createTask()
            .click(".task")
            .assert.elementPresent("#form-switch")
            .click("#form-switch")
            .waitForElementVisible('#accordion-properties')
            .assert.elementPresent("#Execution")
            .assert.elementPresent("#form-switch")
            .click("#form-switch")
            .waitForElementVisible('#confirm-data-loss')
            .assert.containsText('#confirm-data-loss', 'After switching to simple view all custom selection scripts will be lost')
            .click("#data-loss-continue")
            .waitForElementVisible('#simple-form')
            .end();
    },

    "Check selection script generation": function (browser) {
        browser
            .login()
            .closeNotification()
            .freshWorkflow()
            .createTask()
            .click(".task")
            .waitForElementVisible("#simple-form")
            .setValue("input[name='Host Name']", "host_name")
            .setValue("select[name='Operating System']", "Linux")
            .setValue("input[name='Required amount of memory (in mb)']", "1000000")
            .click("input[name='Dedicated Host']")
            .checkExport(function (select, jobXmlDocument) {
                var selectionScripts = select("//p:code", jobXmlDocument)

                this.assert.ok(selectionScripts[0].childNodes[1].data.indexOf("host_name")>-1, "Host selection script")
                this.assert.ok(selectionScripts[1].childNodes[1].data.indexOf("linux")>-1, "OS selection script")
                this.assert.ok(selectionScripts[2].childNodes[1].data.indexOf("1000000")>-1, "Memory selection script")

                var topology = select("//p:singleHostExclusive", jobXmlDocument);
                this.assert.equal(topology.length, 1, "Topology descriptor is present")
            })
            .end();
    }
};
