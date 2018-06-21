module.exports = {
    // Set global timeout to 5 seconds. This will be applied to each wait for which does not
    // specify a timeout
    waitForConditionTimeout: 5000,

    "Breadcrumb navigation": function (browser) {
        browser
            .login()
            .removeAllWorkflows()
            .createNewWorkflow()

            .createTask()

            .click(".task")
            .assert.value('input[name="Task Name"]', 'Javascript_Task')
            .assert.containsText("#breadcrumb", 'Javascript_Task')
            .assert.containsText("#breadcrumb", 'script_javascript')
            .assert.containsText("#breadcrumb", 'Workflows')

            .click("#breadcrumb-selected-job")
            .assert.value('input[name="Name"]', 'script_javascript')
            .assert.containsText("#breadcrumb", 'script_javascript')
            .assert.containsText("#breadcrumb", 'Workflows')

            .click("#breadcrumb-list-workflows")
            .assert.containsText("#workflow-list", 'Project: Default')
            .assert.containsText("#breadcrumb", 'Workflows')

            .toggleMenu()
            .clickCloseWorkflow()
            .removeAllWorkflows()
            .end();
    }
};
