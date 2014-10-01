define(
    [
        'jquery',
        'jsplumb',
        'jquery.ui.droppable',
        'proactive/model/Project',
        'proactive/model/Job',
        'proactive/view/PaletteView',
        'proactive/view/WorkflowView',
        'proactive/view/xml/JobXmlView',
        'proactive/view/LoginView',
        'proactive/view/PropertiesView',
        'proactive/jsplumb'
    ],

    function ($, jsPlumb, ui, Projects, Job, PaletteView, WorkflowView, JobXmlView, LoginView, PropertiesView) {

    "use strict";

    return {

        models : {
            projects : new Projects(),
            jobModel : new Job()
        },

        views : {
            palleteView : undefined,
            workflowView : undefined,
            propertiesView : undefined,
            xmlView : undefined,
            loginView : undefined
        },

        init: function() {
            var that = this;

            jsPlumb.bind("ready", function () {
                console.log("Initializing the studio")

                that.views.palleteView = new PaletteView({el: $("#palette-container")});
                that.views.workflowView = new WorkflowView({el: $("#workflow-designer"), model: that.models.jobModel, projects: that.models.projects});
                that.views.xmlView = new JobXmlView({el: $("#workflow-xml-container"), model: that.models.jobModel});
                that.views.propertiesView = new PropertiesView({el: $("#properties-container"), projects: that.models.projects, workflowView: that.views.workflowView, xmlView: that.views.xmlView});
                that.views.loginView = new LoginView({el: $("#login-view"), projects: that.models.projects, workflowView: that.views.workflowView});

                that.models.projects.init();

                var workflowJson = that.models.projects.getCurrentWorkFlowAsJson()
                if (workflowJson) {
                    that.import(workflowJson)
                } else {
                    var jobXml = that.views.xmlView.xml(that.models.jobModel);
                    var jobName = that.models.jobModel.get("Job Name")
                    that.models.projects.addEmptyWorkflow(jobName, jobXml);
                }

                $(".draggable").draggable({helper: "clone", scroll: true});

                that.views.workflowView.$el.click();
            })
        },
        _replaceJobModel: function (json) {
            console.log("Changing the current job model from", this.model);
            this.models.jobModel = new Job();
            this.models.jobModel.populate(json.job)
            console.log("To", this.models.jobModel);

            this.views.workflowView.model = this.models.jobModel;
            this.views.xmlView.model = this.models.jobModel;
        },
        setCurrentWorkflowUrl: function() {
            var meta = this.models.projects.getCurrentWorkFlowMeta()
            var newUrl = "?ref="+meta.reference;
            if (history) {
                history.pushState({},"",newUrl);
            } else {
                document.location.search = newUrl;
            }
        },
        import: function(json) {
            console.log("Importing workflow");
            this._replaceJobModel(json);
            this.views.workflowView.import();
            this.setCurrentWorkflowUrl()
        },
        importNoReset: function (json) {
            this._replaceJobModel(json);
            this.views.workflowView.importNoReset();
        },
        merge: function(json, elem) {
            this.models.jobModel.populate(json.job, true)
            this.views.workflowView.layoutNewElements(elem);
            this.views.workflowView.importNoReset();
        },
        clear: function() {
            var job = new Job();
            this.models.jobModel = job;
            this.views.workflowView.model = job;
            this.views.xmlView.model = job;
            this.views.workflowView.clean();

            this.models.jobModel.trigger('change');
        }
    }
})
