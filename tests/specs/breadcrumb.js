module.exports = {

    "Breadcrumb navigation": function (browser) {
        browser
            .login()

            .createAndOpenWorkflow()
            .createTask()

            .click(".task")
            .assert.value('input[name="Task Name"]', 'Javascript_Task')
            .assert.containsText("#breadcrumb", 'Javascript_Task')


            .click("#breadcrumb-selected-job")
            .assert.value('input[name="Job Name"]', 'Untitled Job')

            .click("#breadcrumb-list-workflows")
            .assert.containsText("#workflow-list", 'Project: Default')

            .end();
    },

};
