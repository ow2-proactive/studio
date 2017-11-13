/* global define */

define(
    [
        'jquery',
        'jsplumb',
        'jquery.ui.droppable',
        'proactive/model/Job',
        'proactive/model/WorkflowCollection',
        'proactive/model/CatalogBucketCollection',
        'proactive/model/CatalogWorkflowCollection',
        'proactive/view/PaletteView',
        'proactive/view/WorkflowView',
        'proactive/view/EmptyWorkflowView',
        'proactive/view/xml/JobXmlView',
        'proactive/view/LoginView',
        'proactive/view/LogoutView',
        'proactive/view/CatalogGetView',
        'proactive/view/CatalogPublishView',
        'proactive/view/CatalogSetTemplatesBucketView',
        'proactive/view/WorkflowListView',
        'xml2json',
        'proactive/router',
        'proactive/view/dom',
        'proactive/jsplumb',
        'jquery.ui.touch-punch',
        '../studio-conf'
        
    ],

    function ($, jsPlumb, ui, Job, WorkflowCollection, CatalogBucketCollection, CatalogWorkflowCollection, PaletteView, WorkflowView, EmptyWorkflowView, JobXmlView, LoginView, LogoutView, CatalogGetView, CatalogPublishView, CatalogSetTemplatesBucketView, WorkflowListView, xml2json, StudioRouter, dom, version) {

    'use strict';

    return {

        models : {
            jobModel : undefined, // TODO move it to workflow
            currentWorkflow : undefined,
            workflows: undefined,
            templates: undefined,
            catalogBuckets: undefined,
            templatesBucketName : undefined,
            openedAccordion : undefined
        },

        views : {
            palleteView : undefined,
            workflowView : undefined,
            propertiesView : undefined,
            xmlView : undefined,
            loginView : undefined,
            logoutView : undefined,
            catalogGetView : undefined,
            catalogPublishView : undefined,
            catalogSetTemplatesBucketView : undefined
        },

        router: undefined,

        init: function() {
            var that = this;

            jsPlumb.bind('ready', function () {
                console.log('Initializing the studio');
                that.views.loginView = new LoginView({app:that});
            });

            if (!String.prototype.startsWith) {
                String.prototype.startsWith = function(searchString, position){
                    position = position || 0;
                    return this.substr(position, searchString.length) === searchString;
                };
            }
        },
        login: function() {

            this.models.workflows = new WorkflowCollection();
            this.models.catalogBuckets = new CatalogBucketCollection();

            this.models.catalogBuckets.fetch();
            this.modelsToRemove = [];

            this.views.propertiesView = new WorkflowListView({workflowView: this.views.workflowView, paletteView:this.views.palleteView, workflows: this.models.workflows, templates: this.models.templates, app: this});
            this.views.logoutView = new LogoutView({app: this});
            this.views.workflowView = new EmptyWorkflowView();
            this.views.catalogGetView = new CatalogGetView({buckets: this.models.catalogBuckets});
            this.views.catalogPublishView = new CatalogPublishView({buckets: this.models.catalogBuckets});
            this.views.catalogSetTemplatesBucketView = new CatalogSetTemplatesBucketView({buckets: this.models.catalogBuckets});

            this.router = new StudioRouter(this);
        },
        logout: function() {
            var that = this;
            $.each(this.models, function(i, model) {
                if (model) {
                    that.models[i] = undefined;
                }
            });
            $.each(this.views, function(i, view) {
                if (view) {
                    view.remove();
                    that.views[i] = undefined;
                }
            });
            this.views.loginView = new LoginView({app:this});
        },
        import: function(workflow) {

            this.closeWorkflow();

            var jobXml = workflow.get('xml');

            var json = xml2json.xmlToJson(xml2json.parseXml(jobXml));
            this.models.jobModel = new Job();
            this.models.jobModel.populate(json.job);
            this.models.currentWorkflow = workflow;

            this.views.workflowView = new WorkflowView({model: this.models.jobModel, app: this});
            this.views.xmlView = new JobXmlView({model: this.models.jobModel});

            this.views.workflowView.saveInitialState();
        },
        importFromCatalog: function () {
            this.mergeXML(this.xmlToImport, null);
            this.views.workflowView.importNoReset();
        },
        _replaceJobModel: function (json) {
            console.log('Replacing the model');
            this.models.jobModel = new Job();
            this.models.jobModel.populate(json.job);

            this.views.workflowView.model = this.models.jobModel;
            this.views.xmlView.model = this.models.jobModel;
        },
        importNoReset: function (json) {
            this._replaceJobModel(json);
            this.views.workflowView.importNoReset();
        },
        merge: function(json, elem) {
            this.models.jobModel.populate(json.job, true, false);
            this.views.workflowView.layoutNewElements(elem);
            this.views.workflowView.importNoReset();
        },
        mergeTemplate: function(json, elem) {
            this.models.jobModel.populate(json.job, true, true);
            this.views.workflowView.layoutNewElements(elem);
            this.views.workflowView.importNoReset();
        },
        updateWorkflowName: function(job) {
            this.models.jobModel.updateWorkflowName(job)  ;
        },
        mergeXML: function(xml, elem) {
            var json = xml2json.xmlToJson(xml2json.parseXml(xml));
            this.merge(json, elem);
        },
        mergeTemplateXML: function(xml, elem) {
            var json = xml2json.xmlToJson(xml2json.parseXml(xml));
            this.mergeTemplate(json, elem);
        },
        closeWorkflow: function() {
            if (this.models.jobModel) {
                this.models.jobModel.destroy();
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
            var json = xml2json.xmlToJson(xml2json.parseXml(jobXml));
            this.importNoReset(json);
        },
        isWorkflowOpen: function() {

            return this.views.xmlView != null;
        },
        setTemplateBucket: function(bucketName){
            var bucketId;
            var defaultBucketName = "Examples";
            if (!bucketName)
                bucketName = defaultBucketName;
            $.ajax({
                type: "GET",
                headers : { 'sessionID': localStorage['pa.session'] },
                async: false,
                url: '/catalog/buckets/?kind=workflow',
                success: function (data) {
                    var foundBucket = data.find(function(bucket){
                        return bucket.name.toLowerCase() == bucketName.toLowerCase();
                    });
                    if (foundBucket){
                        bucketId = foundBucket.id;
                        bucketName = foundBucket.name;
                    }
                    else {
                        var defaultBucket = data.find(function(bucket){
                            return bucket.name.toLowerCase() == defaultBucketName.toLowerCase();
                        });
                        bucketId = defaultBucket.id;
                        bucketName = defaultBucket.name;
                    }
                },
                error: function (data) {
                  console.log("Cannot get buckets - ", data);
                }
            });
            if (bucketName.length > 30)
                this.models.templatesBucketName = bucketName.substr(0,27)+'...'.replace('_',' ').replace('-',' ');
            else
                this.models.templatesBucketName = bucketName.replace('_',' ').replace('-',' ');
            var divBucketName = $("<div id='bucket-name-title'>"+ this.models.templatesBucketName+"</div>");
            $("#studio-bucket-title").empty();
            $("#studio-bucket-title").append(divBucketName);

            this.models.templates = new CatalogWorkflowCollection({id : bucketId});
            if (this.views.palleteView)
                this.views.palleteView.remove();
            this.views.palleteView = new PaletteView({templates: this.models.templates, app: this});
        }
    };
});
