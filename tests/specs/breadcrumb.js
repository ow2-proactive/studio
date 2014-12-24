module.exports = {

    "Breadcrumb navigation": function (browser) {
        browser
            .login()

            .createAndOpenWorkflow()
            .createTask()

            .click(".task")
            .assert.value('input[name="Task Name"]', 'Javascript_Task')
            .assert.containsText("#breadcrumb", 'Javascript_Task')
            .assert.containsText("#breadcrumb", 'Untitled workflow')
            .assert.containsText("#breadcrumb", 'Workflows')

            .click("#breadcrumb-selected-job")
            .assert.value('input[name="Job Name"]', 'Untitled workflow')
            .assert.containsText("#breadcrumb", 'Untitled workflow')
            .assert.containsText("#breadcrumb", 'Workflows')

            .click("#breadcrumb-list-workflows")
            .assert.containsText("#workflow-list", 'Project: Default')
            .assert.containsText("#breadcrumb", 'Workflows')

            .end();
    },

};
