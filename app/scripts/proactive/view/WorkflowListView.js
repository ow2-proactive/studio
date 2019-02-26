define(['jquery',
        'backbone',
        'proactive/model/Job',
        'proactive/model/WorkflowCollection',
        'proactive/view/xml/JobXmlView',
        'xml2json',
        'text!proactive/templates/workflow-list.html',
        'text!proactive/templates/workflow-list-category.html',
        'text!proactive/templates/workflow-list-entry.html',
        'proactive/view/utils/undo',
        'pnotify'
    ],
    function ($, Backbone, Job, WorkflowList, XmlView, xml2json, workflowListTemplate, workflowListCategory, workflowListEntryTemplate, undoManager, PNotify) {

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
                PNotify.removeAll();
                var app = this.options.app;
                app.import(this.model);
                app.router.navigate("workflows/" + this.model.get('id'));
            },
            destroy: function (event) {
                event.stopPropagation();
                this.model.destroy()
                var app = this.options.app;

                if (app.models.currentWorkflow && app.models.currentWorkflow.get("id") === this.model.get("id")) {
                    app.emptyWorkflowView();
                    app.router.navigate("workflows/" , {trigger: true})
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

                        if (modelName.startsWith("Untitled workflow")) {
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

                var jobName = "Untitled workflow " + (lastUntitledJobIndex + 1);
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
                var workflow = new WorkflowListEntry({model: model, app: this.options.app});
                this.$('#workflow-list ul').last().append(workflow.render().el)
            },
            addAll: function () {
                var that = this;
                var currentWorkflow = this._currentWorkflow();
                if (currentWorkflow) {
                    var jobName = currentWorkflow.get("name");
                }
                this.$el.html(this.template({jobName: jobName}));
                var categoryTemplate = _.template(workflowListCategory);
                this.collection.groupByProject(function(project, workflows) {
                    that.$('#workflow-list').append(categoryTemplate({project: project}));
                    _.each(workflows, that.addOne, that);

                });
            },
            listWorkflows: function (openAfterFetch) {
                this.collection = this.options.workflows;
                var list = this;
                this.listenToCollection(function() { list.open(openAfterFetch) });
            },
            open: function (id) {
                PNotify.removeAll();
                if (!id) {return;}

                var model = this.collection.findWhere({'id':parseInt(id)});
                if (!model) {
                    console.log("WARN: trying to open non existing workflow with id " + id)
                    var router = this.options.app.router;
                    router.navigate("workflows", {trigger: true})
                    return;
                }

                this.options.app.import(model);
                Backbone.history.navigate("workflows/" + model.get('id'))
            },
            saveCurrentWorkflow: function (name, workflowXml, metadata) {
                this.saveTasksPositions();
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
            saveTasksPositions: function() {
                var offsets = undoManager.getOffsetsFromDOM();
                var app = this.options.app;
                var job = app.models.jobModel;
                for (var i = 0; i < job.tasks.length; i++) {
                    var task = job.tasks[i];
                    var name = task.get('Task Name');
                    task.set('PositionTop', offsets[name].top);
                    task.set('PositionLeft', offsets[name].left);
                }
            },
            _currentWorkflow: function () {
                return this.options.app.models.currentWorkflow;
            },
            listCurrent: function () {
                this.addAll();
            }
        });
    });