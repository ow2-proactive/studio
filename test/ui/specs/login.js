module.exports = {
    // Set global timeout to 5 seconds. This will be applied to each wait for which does not
    // specify a timeout
    waitForConditionTimeout: 5000,
    "Login": function (browser) {
        browser
            .login()
            .end();
    },

    "Login with wrong password": function (browser) {
        browser
            .url(browser.globals.studio_url)
            .waitForElementVisible('button[type=submit]')
            .setValue('#user', 'demo')
            .setValue('#password', 'wrongpassword')
            .click('button[type=submit]')
            .waitForElementVisible('.ui-pnotify-title')
            .assert.containsText('.ui-pnotify-title', 'Cannot connect to ProActive Studio')
            .end();
    },

    // (test fails only with Chrome)
    "PWS-159 The dialog Please open a workflow appears behind the no workflow open panel": function (browser) {
        browser
            .login()
            .clickCloseWorkflow()
            .openDropdown('#file-dropdown')
            .click("#save-button")
            .waitForElementVisible('#select-workflow-modal')
            .assert.containsText('#select-workflow-modal h3', 'Please open a workflow')
            .click("#select-workflow-modal .modal-footer .btn") // close button
            .waitForElementNotVisible('#select-workflow-modal')
            .end();
    }

};
