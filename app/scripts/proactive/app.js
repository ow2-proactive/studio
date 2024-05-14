/* global define */

define(
    [
        'jquery',
        'jsplumb',
        'pnotify',
        'jquery.ui.droppable',
        'proactive/config',
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
        'proactive/view/SetPresetView',
        'proactive/view/WorkflowListView',
        'proactive/view/JobVariableView',
        'proactive/view/WorkflowVariablesView',
        'proactive/view/VariableEditorView',
        'xml2json',
        'proactive/router',
        'proactive/view/dom',
        'proactive/jsplumb',
        'jquery.ui.touch-punch',
        '../studio-conf'

    ],

    function ($, jsPlumb, PNotify, ui, Config, Job, WorkflowCollection, CatalogBucketCollection, CatalogWorkflowCollection, PaletteView, WorkflowView, EmptyWorkflowView, JobXmlView, LoginView, LogoutView, CatalogGetView, CatalogPublishView, CatalogSetTemplatesBucketView, SetPresetView, WorkflowListView, JobVariableView, WorkflowVariablesView, VariableEditorView, xml2json, StudioRouter, dom, version) {

    'use strict';

    return {

        models : {
            jobModel : undefined, // TODO move it to workflow
            // Currently open workflow
            currentWorkflow : undefined,
            // List of opened workflows to display in WorkflowList
            workflows: undefined,
            // List of all templates (workflows from all buckets in the palette)
            templates: undefined,
            // List of all buckets in the Catalog
            catalogBuckets: undefined,
            openedAccordion : undefined
        },

        views : {
            paletteView : undefined,
            workflowView : undefined,
            propertiesView : undefined,
            xmlView : undefined,
            loginView : undefined,
            logoutView : undefined,
            catalogGetView : undefined,
            catalogPublishView : undefined,
            setPresetView : undefined,
            catalogSetSecondaryTemplatesBucketView : undefined,
            jobVariableView : undefined,
            workflowVariablesView : undefined,
            variableEditorView : undefined
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
            this.models.catalogBuckets = new CatalogBucketCollection({kind:'workflow'});


            this.views.propertiesView = new WorkflowListView({workflowView: this.views.workflowView, paletteView:this.views.paletteView, workflows: this.models.workflows, templates: this.models.templates, app: this});
            this.views.paletteView = new PaletteView({templatesBucketName: this.models.templatesBucketName, app: this});
            this.views.logoutView = new LogoutView({app: this});
            this.views.workflowView = new EmptyWorkflowView();
            this.views.catalogGetView = new CatalogGetView({buckets: this.models.catalogBuckets});
            this.views.catalogPublishView = new CatalogPublishView({buckets: this.models.catalogBuckets});
            this.views.catalogSetSecondaryTemplatesBucketView = new CatalogSetTemplatesBucketView({buckets: this.models.catalogBuckets});
            this.views.setPresetView = new SetPresetView({presets: Config.palette_presets});
            this.views.jobVariableView =  new JobVariableView();
            this.views.workflowVariablesView =  new WorkflowVariablesView();
            this.views.variableEditorView =  new VariableEditorView();
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
        setCopyright: function(json, currentJobIsEmpty) {
            // copyright is set if the importing workflow has copyright and the current workflow is empty
            var importedJobHasCopyright = (json["#comment"] && json["#comment"].indexOf("Copyright") != 0);
            if (importedJobHasCopyright && currentJobIsEmpty) {
                this.models.jobModel.set({
                    "Copyright": json["#comment"]
                });
            } else {
                this.models.jobModel.set({
                    "Copyright": null
                });
            }
        },
        import: function(workflow) {

            this.closeWorkflow();

            var jobXml = workflow.get('xml');

            var json = xml2json.xmlToJson(xml2json.parseXml(jobXml));
            this.models.jobModel = new Job();
            this.models.jobModel.populate(json.job);
            this.setCopyright(json, true);

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
            this.setCopyright(json, true);

            this.views.workflowView.model = this.models.jobModel;
            this.views.xmlView.model = this.models.jobModel;
        },
        importNoReset: function (json) {
            this._replaceJobModel(json);
            this.views.workflowView.importNoReset();
        },
        merge: function(json, elem) {
            var currentJobIsEmpty = !(this.models.jobModel && this.models.jobModel.tasks && this.models.jobModel.tasks.length > 0);
            this.models.jobModel.populate(json.job, true, false);
            this.setCopyright(json, currentJobIsEmpty);
            this.views.workflowView.layoutNewElements(elem);
            this.views.workflowView.importNoReset();
        },
        mergeTemplate: function(json, elem) {
            var currentJobIsEmpty = !(this.models.jobModel && this.models.jobModel.tasks && this.models.jobModel.tasks.length > 0);
            this.models.jobModel.populate(json.job, true, true);
            this.setCopyright(json, currentJobIsEmpty);
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
        openWorkflowFromCatalog : function(bucketName, workflowName, revision) {
            var that = this;
            var url = Config.prefixURL;
             if (revision) {
                url = url + '/catalog/buckets/' + bucketName + '/resources/'+workflowName+'/revisions/'+revision+'/raw';
             } else {
                url = url + '/catalog/buckets/' + bucketName + '/resources/'+workflowName+ '/raw';
             }
            dom.getWorkflowFromCatalog(url, function (response) {
                that.xmlToImport = new XMLSerializer().serializeToString(response);
                dom.open_catalog_workflow();
            });
        },
        openWorkflowFromScheduler : function(jobId) {
            var that = this;
            var url = Config.prefixURL + '/rest/scheduler/jobs/'+jobId+'/xml/';
            dom.getWorkflowFromScheduler(url, function (response) {
                that.xmlToImport = new XMLSerializer().serializeToString(response);
                dom.open_catalog_workflow();
            });
        }
    };
});
