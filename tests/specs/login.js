module.exports = {
    "Login": function (browser) {
        browser
            .login()
            .end();
    },

    "Login with wrong password": function (browser) {
        browser
            .url("http://localhost:8080/studio")
            .waitForElementVisible('button[type=submit]', 1000)
            .setValue('#user', 'demo')
            .setValue('#password', 'wrongpassword')
            .click('button[type=submit]')
            .waitForElementVisible('.ui-pnotify-title', 1000)
            .assert.containsText('.ui-pnotify-title', 'Cannot connect to ProActive Studio')
            .end();
    },

    // (test fails only with Chrome)
    "PWS-159 The dialog Please open a workflow appears behind the no workflow open panel": function (browser) {
        browser
            .login()

            .click("#save-button")

            .waitForElementVisible('#select-workflow-modal', 1000)
            .assert.containsText('#select-workflow-modal h3', 'Please open a workflow')

            .click("#select-workflow-modal .modal-footer .btn") // close button

            .waitForElementNotVisible('#select-workflow-modal', 1000)

            .end();
    },

};
