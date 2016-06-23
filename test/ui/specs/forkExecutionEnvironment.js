module.exports = {
    "Find Fork Execution Environment setting": function (browser) {
        browser
            .login() // Login into the interface
            .closeNotification() // Close all notifications
            .removeAllWorkflows() // Clean studio from previous use
            .createNewWorkflow() // Create a new workflow
            .waitForElementVisible('#accordion-properties') // Wait for the sidebar to be visible
            .assert.elementNotPresent("#simple-form")
            .createTask() // Add a task to the workflow
            .click(".task") // Select the task -- that will show a new sidebar
            .useXpath() // every selector now must be xpath
            .waitForElementVisible('//*[@id=\"Fork Environment\"]') // Check for the Fork Environment tab
            .moveToElement('//*[@id=\"Fork Environment\"]', 10, 10)
            .pause(browser.globals.menuAnimationTime)
            .click('//*[@id=\"Fork Environment\"]') // Click on the Fork Environment tab
            .pause(browser.globals.menuAnimationTime)
            // Wait for the For Execution Environment select to be visible
            .waitForElementVisible('//select[@name=\"Fork Execution Environment\"]')
            .useCss() // we're back to CSS now
            .end(); // That's it done
    },
    "Test that Docker Execution Environment setting is inserted on selection": function (browser) {
        browser
            .login() // Login into the interface
            .closeNotification() // Close all notifications
            .removeAllWorkflows() // Clean studio from previous use
            .createNewWorkflow() // Create a new workflow
            .waitForElementVisible('#accordion-properties') // Wait for the sidebar to be visible
            .assert.elementNotPresent("#simple-form")
            .createTask() // Add a task to the workflow
            .click(".task") // Select the task -- that will show a new sidebar
            .useXpath() // every selector now must be xpath
            .waitForElementVisible('//*[@id=\"Fork Environment\"]') // Check for the Fork Environment tab
            .moveToElement('//*[@id=\"Fork Environment\"]', 10, 10)
            .pause(browser.globals.menuAnimationTime)
            .click('//*[@id=\"Fork Environment\"]') // Click on the Fork Environment tab
            .pause(browser.globals.menuAnimationTime)
            // Wait for the For Execution Environment select to be visible
            .waitForElementVisible('//select[@name=\"Fork Execution Environment\"]')
            // Click in the Fork Execution Environment selector and select 2 (Docker)
            .click('//select[@name=\"Fork Execution Environment\"]/option[2]')
            .pause(browser.globals.menuAnimationTime)
            .getValue('//input[@name=\"Java Home\"]' ,
            function (result) {
                this.assert.equal(typeof result, "object");
                this.assert.equal(result.status, 0);
                this.assert.equal(result.value, "/usr");
            })
            .useCss() // we're back to CSS now
            .end();
    }
}