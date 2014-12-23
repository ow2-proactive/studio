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
    }

};
