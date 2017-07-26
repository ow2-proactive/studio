define(['jquery',
        'backbone',
        'proactive/model/Job',
        'proactive/model/WorkflowCollection',
        'proactive/view/xml/JobXmlView',
        'xml2json',
        'text!proactive/templates/workflow-list.html',
        'text!proactive/templates/workflow-list-category.html',
        'text!proactive/templates/workflow-list-entry.html'
    ],
    function ($, Backbone, Job, WorkflowList, XmlView, xml2json, workflowListTemplate, workflowListCategory, workflowListEntryTemplate) {

        "use strict";

        var WorkflowListEntry = Backbone.View.extend({
            tagName: 'li',
            className: 'list-group-item',
            initialize: function () {
                this.model.on('destroy', this.remove, this);
                this.model.on('change', this.model.collection.sort, this.model.collection);
            },
            render: function () {
                var template = _.template(workflowListEntryTemplate);
                this.$el.html(template(this.model.toJSON()));

                var app = this.options.app;

                if (app.models.currentWorkflow && app.models.currentWorkflow.get("id") === this.model.get("id")) {
                    this.$el.addClass("success");
                }
                return this;
            },
            events: {
                'click': 'open',
                'click .btn-open': 'open',
                'click .btn-clone': 'clone',
                'click .btn-remove': 'destroy'
            },
            open: function() {
                var app = this.options.app;
                app.import(this.model);
                app.router.navigate(this.options.mode+"s/" + this.model.get('id'));
            },
            destroy: function (event) {
                event.stopPropagation();
                this.model.destroy()
                var app = this.options.app;

                if (app.models.currentWorkflow && app.models.currentWorkflow.get("id") === this.model.get("id")) {
                    app.emptyWorkflowView();
                    app.router.navigate(this.options.mode+"s", {trigger: true})
                }
            },
            clone: function (event) {
                event.stopPropagation();
                this.model.collection.create(this.model.clone().omit("id"), {wait: true});
            }
        });

        return Backbone.View.extend({
            template: _.template(workflowListTemplate),
            initialize: function () {
                this.$el = $("<div></div>");
                $("#properties-container").append(this.$el);
            },
            events: {
                'click .create-workflow-button': 'createOne',
                'change #select-mode': 'switchMode'
            },
            listenToCollection: function (success) {
                this.stopListening();
                this.listenTo(this.collection, 'reset', this.addAll);
                this.listenTo(this.collection, 'add', this.addAll);
                this.listenTo(this.collection, 'remove', this.addAll);
                this.collection.fetch({reset: true, success: success});
            },
            createOne: function (event) {
                var jobModel = new Job();
                var lastUntitledJobIndex = 0;

                if (this.collection.length > 0) {
                    var lastUntitledJobName;
                    var models = this.collection.models;

                    for (var i=0; i<models.length; i++) {
                        var model = models[i];
                        var modelName = model.attributes.name;

                        if (modelName.startsWith("Untitled " + this.mode + " ")) {
                            lastUntitledJobName = modelName;

                            var chunks = lastUntitledJobName.split(" ");
                            var parsedIndex = parseInt(chunks[chunks.length - 1]);

                            if (!isNaN(parsedIndex) &&
                                    parsedIndex > lastUntitledJobIndex) {
                                lastUntitledJobIndex = parsedIndex;
                            }
                        }
                    }
                }

                var jobName = "Untitled " + this.mode + " " + (lastUntitledJobIndex + 1);
                jobModel.set("Name", jobName);
                var jobXml = new XmlView().xml(jobModel);
                var workflowId = -1;
                var that = this;
                var workflow = this.collection.create({name: jobName, xml: jobXml}, {
                    success: function () {
                        var StudioApp = require('StudioApp');
                        if (!StudioApp.isWorkflowOpen() && event.openWorkflow) {
                            workflowId = workflow.id;
                            console.log('Open workflow ' + workflowId);
                            that.open(workflowId);
                            StudioApp.importFromCatalog();
                            $('#catalog-get-close-button').click();
                        }
                    }
                });
            },
            addOne: function (model) {
                var workflow = new WorkflowListEntry({model: model, app: this.options.app, mode:this.mode});
                this.$('#workflow-list ul').last().append(workflow.render().el)
            },
            addAll: function () {
                var that = this;
                var currentWorkflow = this._currentWorkflow();
                if (currentWorkflow) {
                    var jobName = currentWorkflow.get("name");
                }
                this.$el.html(this.template({jobName: jobName, mode: this.mode}));
                var categoryTemplate = _.template(workflowListCategory);
                this.collection.groupByProject(function(project, workflows) {
                    that.$('#workflow-list').append(categoryTemplate({project: project}));
                    _.each(workflows, that.addOne, that);

                });
            },
            listWorkflows: function (openAfterFetch) {
                this.listMode("workflow", this.options.workflows, openAfterFetch);
            },
            listTemplates: function (openAfterFetch) {
                this.listMode("template", this.options.templates, openAfterFetch);
            },
            listMode: function (modeName, collection, openAfterFetch) {
                if (this.mode === modeName) {
                    this.addAll();
                } else {
                    this.collection = collection;
                    this.mode = modeName;
                    var list = this;
                    this.listenToCollection(function() { list.open(openAfterFetch) });
                }
            },
            open: function (id) {
                if (!id) {return;}

                var model = this.collection.findWhere({'id':parseInt(id)});
                if (!model) {
                    console.log("WARN: trying to open non existing " + this.mode + " with id " + id)
                    var router = this.options.app.router;
                    router.navigate(this.mode+"s", {trigger: true})
                    return;
                }
                var app = this.options.app;
                app.import(model);
            },
            saveCurrentWorkflow: function (name, workflowXml, metadata) {
                this._currentWorkflow().save(
                    {
                        name: name,
                        xml: workflowXml,
                        metadata: JSON.stringify(metadata)
                    });
                if (this.options.paletteView) {
                    //this.options.paletteView.render();
                }
            },
            _currentWorkflow: function () {
                return this.options.app.models.currentWorkflow;
            },
            switchMode: function (e) {
                var newMode = e.target.value;
                if (this.mode === newMode) {
                    return;
                }

                var router = this.options.app.router;
                this.options.app.emptyWorkflowView(true);

                if (this.mode === "workflow") {
                    router.navigate("templates", {trigger: true})
                } else {
                    router.navigate("workflows", {trigger: true})
                }
            },
            listCurrent: function () {
                this.addAll();
            }
        });
    });

