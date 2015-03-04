module.exports = {

    "Breadcrumb navigation": function (browser) {
        browser
            .login()

            .freshWorkflow()
            .createTask()

            .click(".task")
            .assert.value('input[name="Task Name"]', 'Javascript_Task')
            .assert.containsText("#breadcrumb", 'Javascript_Task')
            .assert.containsText("#breadcrumb", 'Untitled Job')
            .assert.containsText("#breadcrumb", 'Workflows')

            .click("#breadcrumb-selected-job")
            .assert.value('input[name="Job Name"]', 'Untitled Job')
            .assert.containsText("#breadcrumb", 'Untitled Job')
            .assert.containsText("#breadcrumb", 'Workflows')

            .click("#breadcrumb-list-workflows")
            .assert.containsText("#workflow-list", 'Project: Default')
            .assert.containsText("#breadcrumb", 'Workflows')

            .end();
    },

};
