define(
    [
        'jquery',
        'jsplumb',
        'jquery.ui.droppable',
        'proactive/model/Job',
        'proactive/model/WorkflowCollection',
        'proactive/model/TemplateCollection',
        'proactive/model/CatalogBucketCollection',
        'proactive/model/CatalogWorkflowCollection',
        'proactive/view/PaletteView',
        'proactive/view/WorkflowView',
        'proactive/view/EmptyWorkflowView',
        'proactive/view/xml/JobXmlView',
        'proactive/view/LoginView',
        'proactive/view/LogoutView',
        'proactive/view/CatalogView',
        'proactive/view/WorkflowListView',
        'xml2json',
        'proactive/router',
        'proactive/view/dom',
        'proactive/jsplumb',
        'jquery.ui.touch-punch',
    ],

    function ($, jsPlumb, ui, Job, WorkflowCollection, TemplateCollection, CatalogBucketCollection, CatalogWorkflowCollection, PaletteView, WorkflowView, EmptyWorkflowView, JobXmlView, LoginView, LogoutView, CatalogView, WorkflowListView, xml2json, StudioRouter, dom) {

    "use strict";

    return {

        models : {
            jobModel : undefined, // TODO move it to workflow
            currentWorkflow : undefined,
            workflows: undefined,
            templates: undefined,
            catalogBuckets: undefined,
            catalogWorkflows: undefined
        },

        views : {
            palleteView : undefined,
            workflowView : undefined,
            propertiesView : undefined,
            xmlView : undefined,
            loginView : undefined,
            logoutView : undefined,
            catalogView : undefined
        },

        router: undefined,

        init: function() {
            var that = this;

            jsPlumb.bind("ready", function () {
                console.log("Initializing the studio")
                that.views.loginView = new LoginView({app:that});
            })

        },
        login: function() {

            this.models.workflows = new WorkflowCollection();
            this.models.templates = new TemplateCollection();
            this.models.catalogBuckets = new CatalogBucketCollection();
            
            // TODO Handle pagination
            this.models.catalogBuckets.fetch();

            this.views.palleteView = new PaletteView({templates: this.models.templates, app: this});
            this.views.propertiesView = new WorkflowListView({workflowView: this.views.workflowView, paletteView:this.views.palleteView, workflows: this.models.workflows, templates: this.models.templates, app: this});
            this.views.logoutView = new LogoutView({app: this});
            this.views.workflowView = new EmptyWorkflowView();
            this.views.catalogView = new CatalogView({buckets: this.models.catalogBuckets});

            this.router = new StudioRouter(this);
        },
        logout: function() {
            var that = this;
            $.each(this.models, function(i, model) {
                if (model) {
                    that.models[i] = undefined;
                }
            })
            $.each(this.views, function(i, view) {
                if (view) {
                    view.remove()
                    that.views[i] = undefined;
                }
            })
            this.views.loginView = new LoginView({app:this});
        },
        import: function(workflow) {

            this.closeWorkflow();

            var jobXml = workflow.get('xml');

            var json = xml2json.xmlToJson(xml2json.parseXml(jobXml));
            this.models.jobModel = new Job();
            this.models.jobModel.populate(json.job)
            this.models.currentWorkflow = workflow;

            this.views.workflowView = new WorkflowView({model: this.models.jobModel, app: this});
            this.views.xmlView = new JobXmlView({model: this.models.jobModel});

            this.views.workflowView.saveInitialState();
        },
        _replaceJobModel: function (json) {
            console.log("Replacing the model");
            this.models.jobModel = new Job();
            this.models.jobModel.populate(json.job)

            this.views.workflowView.model = this.models.jobModel;
            this.views.xmlView.model = this.models.jobModel;
        },
        importNoReset: function (json) {
            this._replaceJobModel(json);
            this.views.workflowView.importNoReset();
        },
        merge: function(json, elem) {
            this.models.jobModel.populate(json.job, true, false)
            this.views.workflowView.layoutNewElements(elem);
            this.views.workflowView.importNoReset();
        },
        mergeTemplate: function(json, elem) {
            this.models.jobModel.populate(json.job, true, true)
            this.views.workflowView.layoutNewElements(elem);
            this.views.workflowView.importNoReset();
        },
        updateWorkflowName: function(job) {
            this.models.jobModel.updateWorkflowName(job)  
        },
        mergeXML: function(xml, elem) {
            var json = xml2json.xmlToJson(xml2json.parseXml(xml))
            this.merge(json, elem);
        },
        mergeTemplateXML: function(xml, elem) {
            var json = xml2json.xmlToJson(xml2json.parseXml(xml))
            this.mergeTemplate(json, elem);
        },
        closeWorkflow: function() {
            if (this.models.jobModel) {
                this.models.jobModel.destroy()
                this.models.jobModel = null;
            }
            if (this.views.workflowView) {
                this.views.workflowView.remove();
                this.views.workflowView = null;
            }
            if (this.views.xmlView) {
                this.views.xmlView.remove();
                this.views.xmlView = null;
            }
            this.models.currentWorkflow = null;
        },
        emptyWorkflowView: function (save) {
            if (save) {
                dom.saveWorkflow();
            }
            this.closeWorkflow();
            this.views.workflowView = new EmptyWorkflowView();
        },
        clear: function() {
            var jobXml = new JobXmlView().xml(new Job());
            var json = xml2json.xmlToJson(xml2json.parseXml(jobXml))
            this.importNoReset(json);
        },
        isWorkflowOpen: function() {
            return this.views.xmlView != null;
        }

    }
})
