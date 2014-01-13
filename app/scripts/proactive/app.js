// simple concept of an app. TODO use require.js in the future
var StudioApp = {

    projects : new Projects(),
    jobModel : new Job(),

    palleteView : undefined,
    workflowView : undefined,
    propertiesView : undefined,
    xmlView : undefined,
    loginView : undefined,

    init: function() {
        var that = this;

        jsPlumb.bind("ready", function () {

            that.palleteView = new PaletteView({el: $("#palette-container")});
            that.workflowView = new WorkflowView({el: $("#workflow-designer"), model: that.jobModel, projects: that.projects});
            that.xmlView = new JobXmlView({el: $("#workflow-xml-container"), model: that.jobModel});
            that.propertiesView = new PropertiesView({el: $("#properties-container"), projects: that.projects, workflowView: that.workflowView, xmlView: that.xmlView});
            that.loginView = new LoginView({el: $("#login-view"), projects: that.projects, workflowView: that.workflowView});

            that.projects.init();

            var workflowJson = that.projects.getCurrentWorkFlowAsJson()
            if (workflowJson) {
                that.workflowView.import(workflowJson);
                // TODO change the way how we updated the model in xmlView
                that.xmlView.model = that.workflowView.model;
            } else {
                var jobXml = that.xmlView.xml(that.jobModel);
                var jobName = that.jobModel.get("Job Name")
                that.projects.addEmptyWorkflow(jobName, jobXml);
            }
            that.workflowView.$el.click();
        })
    },

    clear: function() {
        var job = new Job();
        this.jobModel = job;
        this.workflowView.model = job;
        this.xmlView.model = job;

        this.workflowView.clean();
        this.jobModel.trigger('change');
    }
}

StudioApp.init();
