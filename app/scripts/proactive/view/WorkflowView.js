define(
    [
        'dagre',
        'proactive/rest/studio-client',
        'proactive/model/Job',
        'proactive/view/ViewWithProperties',
        'proactive/view/TaskView',
        'proactive/view/utils/undo'
    ],

    function (d, StudioClient, Job, ViewWithProperties, TaskView, undoManager) {

    "use strict";

    return ViewWithProperties.extend({
        workFlowDesigner: $("<div id='workflow-designer'></div>"),
        taskViews: [],
        initialize: function () {
            this.constructor.__super__.initialize.apply(this);
            var that = this;

            this.$el = this.workFlowDesigner;
            $("#workflow-designer-outer").append(this.$el);

            this.initJsPlumb();
            this.$el.html(this.workFlowDesigner);
            this.$el.dblclick(function (event) {
                that.clearTextSelection();

                console.log("Creating task", event);
                that.createTask({offset: {top: event.clientY, left: event.clientX}});
            })
            this.model.on("change:Name", this.updateJobName, this);

            this.$el.droppable({
                accept: ".job-element",
                drop: function (event, ui) {
                    that.dropElement(event, ui)
                }
            });

            this.importNoReset()
        },
        dropElement: function(event, ui) {
            var that = this;

            undoManager.runWithDisabled(function () {
                var elem = $(ui.draggable);

                if (elem.hasClass('task-menu')) {
                    that.createTask(ui)
                } else {
                      console.log("Dropped element: ", elem.data("templateName"), elem.data("templateUrl"));
                      var templateUrl;
                      if (elem.data("templateUrl"))
                        templateUrl = elem.data("templateUrl");
                      else {
                        var templateName =  elem.data('templateName');
                        var templateModel = that.options.app.models.templates[elem.data('bucketName')].find(function(template) {return template.attributes.name == templateName});
                        var bucketName = templateModel.attributes.bucket_name;
                        var workflowName = templateModel.attributes.name;
                        templateUrl = '/catalog/buckets/' + bucketName + '/resources/'+workflowName+'/raw';
                      }
                      $.ajax({
                          type: "GET",
                          dataType: "text",
                          headers : { 'sessionID': localStorage['pa.session'] },
                          async: false,
                          url: templateUrl,
                          success: function (data) {
                              that.options.app.mergeTemplateXML(data, ui);
                          },
                          error: function (data) {
                              console.log("Cannot retrieve the template", data)
                              StudioClient.alert("Cannot retrieve the template", "Name: " + elem.data("templateName") + ", url: " + elem.data("templateUrl"), 'error');
                          }
                      });
                }
            });
        },
        initJsPlumb: function () {
            var that = this;

            function duplicateConnections(connection) {
                return _.filter(jsPlumb.getAllConnections(), function (c) {
                    return connection.target == c.target &&
                        connection.source == c.source &&
                        connection.scope == c.scope &&
                        connection.id != c.id;
                });
            }

            function detachDuplicateConnections(connection) {
                var duplicates = duplicateConnections(connection);
                if (duplicates.length > 0) {
                    _.each(duplicates, function (connection) {
                        jsPlumb.detach(connection, {fireEvent: false})
                    });
                    removeUnconnectedTargetEndpoints();
                    return true;
                } else {
                    return false;
                }
            }

            function removeUnconnectedTargetEndpoints() {
                jsPlumb.selectEndpoints().each(function (ep) {
                    if (ep.connections.length == 0 && !ep.isSource) {
                        jsPlumb.deleteEndpoint(ep)
                    }
                })
            }

            jsPlumb.setContainer($("#workflow-designer"))
            jsPlumb.unbind();

            jsPlumb.bind("connection", function (connection) {
                if (detachDuplicateConnections(connection.connection)) {
                    return;
                }
                connection.sourceEndpoint.addClass("connected")
                connection.targetEndpoint.addClass("connected")
                var source = connection.source;
                var target = connection.target;
                if ($(target).data("view")) {
                    var targetModel = $(target).data("view").model;
                    var sourceModel = $(source).data("view").model;
                    if (connection.connection.scope == 'dependency') {
                        targetModel.addDependency(sourceModel);
                    } else {
                        sourceModel.setControlFlow(connection.connection.scope, targetModel);
                    }
                }
            });

            jsPlumb.bind('connectionDetached', function (connection) {
                if (connection.connection.scope != 'dependency') {
                    connection.sourceEndpoint.removeClass("connected")
                }
                connection.targetEndpoint.removeClass("connected")

                var source = connection.source;
                var target = connection.target;

                if ($(target).data("view")) {
                    var sourceModel = $(source).data("view").model;
                    var targetModel = $(target).data("view").model;
                    if (connection.connection.scope == 'dependency') {
                        targetModel.removeDependency(sourceModel);
                    } else {
                        sourceModel.removeControlFlow(connection.connection.scope, targetModel);
                    }
                }
            });

            // showing target endpoints
            jsPlumb.bind('connectionDrag', function (connection) {
                $('.task').each(function (i, task) {
                    // do not display the possible destination on the same element as the origin, except for the loop
                    if (connection.scope == 'loop' || $(task).attr('id') != connection.sourceId) {
                        $(task).data('view').addTargetEndPoint(connection.scope);
                    }
                })
                jsPlumb.repaintEverything()
            });

            jsPlumb.bind('connectionDragStop', function (connection) {
                removeUnconnectedTargetEndpoints()

                if (!connection.target) {
                    // creating a task where drag stopped
                    var sourcePoints = jsPlumb.getEndpoints($("#" + connection.sourceId));
                    for (var i in sourcePoints) {
                        if (sourcePoints[i].scope == connection.scope) {
                            var sourceView = $("#" + connection.sourceId).data('view')
                            var newTask = that.createTask({offset: {top: that.mouseup.top, left: that.mouseup.left}});
                            var endpointDep = newTask.addTargetEndPoint(connection.scope)
                            jsPlumb.connect({source: sourcePoints[i], target: endpointDep, overlays: sourceView.overlays()});

                            break;
                        }
                    }

                }
            });

            this.$el.mouseup(function (event) {
                that.mouseup = {top: event.clientY, left: event.clientX};
            })


            jsPlumb.bind("click", function (connection, originalEvent) {
                if ("isPropagationStopped" in originalEvent && originalEvent.isPropagationStopped()) return false;
                var source = connection.source;
                var target = connection.target;

                console.log("click on the ", connection)
                jsPlumb.detach(connection);
                removeUnconnectedTargetEndpoints()
            });

        },
        createTask: function (ui) {
            console.log("Initializing TaskView")
            var view = new TaskView();

            var position = {top: ui.offset.top, left: ui.offset.left};
            var rendering = this.addView(view, position);

            this.model.addTask(rendering.model);
            this.model.trigger('change');

            return view;
        },
        updateJobName: function () {
            var jobNameInputField = $("input[id='" + this.model.cid + "_Name']");
            //$("#breadcrumb-project-name").text(this.model.get("Project Name"))
            // Prevent having empty Workflow names. Nameless workflows do not affect the scheduler but cannot be removed from studio unless they get a name.
            if (!this.model.get("Name") || this.model.get("Name").trim() === "") {
                this.model.set("Name", "");
                StudioClient.alert('Workflow name is empty','Workflow Name should not be empty','error');
                jobNameInputField.css({ "border": "1px solid #D2322D"});
            }
            $("#breadcrumb-selected-job").text(this.model.get("Name"))
        },
        clean: function () {
            this.workFlowDesigner.empty();
            jsPlumb.reset()
            this.initJsPlumb()
        },
        addView: function (view, position) {
            var that = this;
            var rendering = view.render();
            this.workFlowDesigner.append(rendering.$el);
            rendering.$el.offset(position);

            view.addSourceEndPoint('dependency')

            jsPlumb.draggable(rendering.$el);
            // Prevent dragged tasks from hiding under the left panel
            $(rendering.$el).draggable({containment:"#workflow-designer"});
            this.taskViews.push(view);

            rendering.$el.data("view", view);
            return rendering;
        },
        removeView: function (view) {
            var thizz = this;
            undoManager.runWithDisabled(function() {
                view.removing = true;
                var endPoints = jsPlumb.getEndpoints(view.$el)
                for (var i in endPoints) {
                    try {
                        jsPlumb.deleteEndpoint(endPoints[i]);
                    } catch (err) {
                        console.log(err)
                    }
                }

                thizz.model.removeTask(view.model);
                view.$el.remove();
                jsPlumb.remove(view.$el);

                var index = thizz.taskViews.indexOf(view);
                if (index != -1) {
                    thizz.taskViews.splice(index, 1);
                }

                thizz.$el.click();
            })
        },
        import: function () {
            this.importNoReset();
            undoManager.reset()
        },
        importNoReset: function () {

            this.taskViews = [];

            var that = this;
            this.clean();

            this.model.on("change:Name", this.updateJobName, this);

            // to avoid model change by creating connections clean all jsplumb events
            jsPlumb.unbind();

            var task2View = {};
            $.each(this.model.tasks, function (i, task) {
                var view = new TaskView({model: task});

                that.addView(view, {top: 0, left: 0});
                task2View[task.get('Task Name')] = view;
            })

            //adding dependencies after all views exist
            $.each(this.model.tasks, function (i, task) {
                if (task.dependencies) {
                    $.each(task.dependencies, function (i, dep) {
                        if (task2View[dep.get('Task Name')]) {
                            var taskView = task2View[dep.get('Task Name')];
                            taskView.addDependency(task2View[task.get('Task Name')])
                        }
                    })
                }
                if (task.controlFlow) {
                    if (task.controlFlow.if) {
                        var taskIf = task2View[task.get('Task Name')];
                        if (taskIf) {
                            taskIf.addIf(task.controlFlow.if, task2View)
                        }
                    }
                    if (task.controlFlow.replicate) {
                        var taskReplicateView = task2View[task.get('Task Name')];
                        var taskDepView = task2View[that.model.getDependantTask(task.get('Task Name'))];
                        taskReplicateView.addReplicate(taskDepView);
                    }
                    if (task.controlFlow.loop) {
                        var loopTarget = task.controlFlow.loop.task;
                        var taskLoopView = task2View[task.get('Task Name')];
                        var targetView = task2View[loopTarget.get('Task Name')];
                        taskLoopView.addLoop(targetView)
                    }
                }
            })

            this.initJsPlumb();
            this.model.trigger('change');
            this.restoreLayout();
            // regenerating the form
            this.$el.click();
        },
        autoLayout: function () {
            var nodes = [];
            var taskWidth = 0;
            $(".task").each(function (i, task) {
                var t = $(task);
                nodes.push({id: t.attr('id'), width: t.width(), height: t.height()})
                taskWidth = t.width();
            })
            var edges = [];

            $.each(jsPlumb.getAllConnections(), function (i, con) {
                edges.push({sourceId: con.source.id, targetId: con.target.id})
            })
            // computing layout with dagre
            dagre.layout().nodes(nodes).edges(edges).nodeSep(50).rankSep(100).run();

            var workflowDesigner = $('#workflow-designer-outer')
            var containerPosition = workflowDesigner.position();
            // finding max left offset and top offset to center the graph
            var maxLeft = 0, maxTop = 0;
            $.each(nodes, function (i, node) {
                if (node.dagre.x > maxLeft) maxLeft = node.dagre.x;
                if (node.dagre.y > maxTop) maxTop = node.dagre.y;
            })

            var leftOffset = workflowDesigner.width() - maxLeft < 0 ? 0 : (workflowDesigner.width() - maxLeft) / 2 - taskWidth;
            var topOffset = workflowDesigner.height() - maxTop < 0 ? 100 : (workflowDesigner.height() - maxTop) / 2 + 50;

            $.each(nodes, function (i, node) {
                var pos = {};
                if (node.dagre.x) pos.left = node.dagre.x + containerPosition.left + leftOffset;
                if (node.dagre.x) pos.top = node.dagre.y + containerPosition.top + topOffset;
                $("#" + node.dagre.id).offset(pos)
            })
            jsPlumb.repaintEverything();
        },
        layoutNewElements: function (uiWithInitialOffset) {
            if (!uiWithInitialOffset) {
                this.autoLayout()
                return;
            }

            var app = this.options.app;
            var elemWithInitialOffset = $(uiWithInitialOffset.draggable);

            // finding task that are not layouted
            var nodes = [];
            $.each(this.model.tasks, function (i, task) {
                var taskName = task.get("Task Name");
                var offset = {};
                offset["top"] = task.get("PositionTop");
                offset["left"] = task.get("PositionLeft");
                if (!offset["left"] || !offset["top"] || offset["left"]===0 || offset["top"]===0) {
                    nodes.push({id: taskName, task: task, width: 78, height: 28});
                }
            })

            var edges = [];

            $.each(nodes, function (i, node) {
                var task = node.task;

                if (task.dependencies) {
                    $.each(task.dependencies, function (i, dep) {
                        edges.push({sourceId: dep.get("Task Name"), targetId: task.get("Task Name")})
                    })
                }
                if (task.controlFlow) {
                    if (task.controlFlow.if) {
                        if (task.controlFlow.if.task) {
                            edges.push({sourceId: task.get("Task Name"), targetId: task.controlFlow.if.task.get("Task Name")})
                        }
                        if (task.controlFlow.if.else && task.controlFlow.if.else.task) {
                            edges.push({sourceId: task.get("Task Name"), targetId: task.controlFlow.if.else.task.get("Task Name")})
                        }
                        if (task.controlFlow.if.continuation && task.controlFlow.if.continuation.task) {
                            edges.push({sourceId: task.get("Task Name"), targetId: task.controlFlow.if.continuation.task.get("Task Name")})
                        }
                    }
                    // replicate and loop control flows require dependencies
                    // so they will be layouted correctly
                }
            });

            // computing layout with dagre
            dagre.layout().nodes(nodes).edges(edges).nodeSep(50).rankSep(100).run();

            // compute offsets relative to workflow-designer
            var leftOffset = uiWithInitialOffset.offset.left-$('#workflow-designer').offset().left-(elemWithInitialOffset.width()/2)+50;
            var topOffset = uiWithInitialOffset.offset.top-$('#workflow-designer').offset().top-10;

            var job = app.models.jobModel
            $.each(nodes, function (i, node) {
                var pos = {};
                if (node.dagre.x) pos.left = node.dagre.x + leftOffset;
                if (node.dagre.y) pos.top = node.dagre.y + topOffset;
                var task = job.getTaskByName(node.dagre.id);
                task.set('PositionTop', pos.top);
                task.set('PositionLeft', pos.left);
            })
            app.models.currentWorkflow.save({}, {wait: true});
        },
        restoreLayoutFromOffsets: function (offsets) {
            var that = this;

            $('.task').each(function () {
                var taskName = $(this).find("span.name").text()
                var offset = offsets[taskName]
                var autolayout = false;

                if (offset) {
                    if (offset.left==0 && offset.top==0) {
                        autolayout = true;
                    }
                    // compute absolute offsets
					var new_offset = {};
					new_offset.left = $('#workflow-designer').offset().left + offset.left;
					new_offset.top = $('#workflow-designer').offset().top + offset.top;
                    $(this).offset(new_offset);
                } else {
                    autolayout = true;
                }

                if (autolayout) {
                    console.log("ERROR: enforce autolayout because of invalid offsets", offsets)
                    that.autoLayout();
                    return false;
                }

            })
            jsPlumb.repaintEverything();
        },
        restoreLayout: function () {
            var app = this.options.app;
            var job = app.models.jobModel;
            var offsets = {};
            for (var i = 0; i < job.tasks.length; i++) {
                var name = job.tasks[i].get('Task Name');
                var offset = {};
                offset["top"] = job.tasks[i].get('PositionTop');
                offset["left"] = job.tasks[i].get('PositionLeft');
                if (!offset["top"] || !offset["left"] || offset["top"] === 0 || offset["left"] === 0) {
                    this.autoLayout();
                    return;
                }
                offsets[name] = offset;
            }
            this.restoreLayoutFromOffsets(offsets);
        },
        zoom: 1,
        setZoom: function (zoom) {
            if (zoom) this.zoom = zoom;

            var p = [ "-webkit-", "-moz-", "-ms-", "-o-", "" ],
                s = "scale(" + this.zoom + ")";

            for (var i = 0; i < p.length; i++)
                this.workFlowDesigner.css(p[i] + "transform", s);

            jsPlumb.setZoom(this.zoom);
        },
        zoomIn: function () {
            if (this.zoom < 2) {
                this.zoom += 0.3;
                this.setZoom(this.zoom)
            }
        },
        zoomOut: function () {
            if (this.zoom > 0.4) {
                this.zoom -= 0.3;
                this.setZoom(this.zoom)
            }
        },
        getTaskViewByName: function (name) {
            return _.find(this.taskViews, function (view) {
                return (name === view.model.get("Task Name"));
            })
        },
        copyPasteTasks: function (position , newTaskModels, tasksView, tasksPosition) {

            // to avoid model change by creating connections clean all jsplumb events
            jsPlumb.unbind();

            var thizz = this;
            var StudioApp = require('StudioApp');
            var jobModel = StudioApp.models.jobModel;
            var newTaskViews = {};
            var minLeft = 0;
            var minTop = 0;
            function sort(arr, type){
                return Array.prototype.slice.call(arr).sort(function(a,b){
                    return a[type] - b[type];
                })
            }
            minLeft = sort(tasksPosition, 'left')[0].left;
            minTop = sort(tasksPosition, 'top')[0].top;

            $.each(newTaskModels, function (i, newTaskModel) {
                var taskView = tasksView[i];
                // cloning of scripts in branches does not work properly
                // do it manually here
                if (newTaskModel.controlFlow) {
                    if (newTaskModel.controlFlow.if) {
                        newTaskModel.controlFlow.if.model = newTaskModel.controlFlow.if.model.clone()
                    }
                    if (newTaskModel.controlFlow.replicate) {
                        newTaskModel.controlFlow.replicate.model = newTaskModel.controlFlow.replicate.model.clone()
                    }
                    if (newTaskModel.controlFlow.loop) {
                        newTaskModel.controlFlow.loop.model = newTaskModel.controlFlow.loop.model.clone()
                    }
                }

                var suffix = 2;
                var newTaskName = newTaskModel.get("Task Name") + suffix;
                while (jobModel.getTaskByName(newTaskName)) {
                    suffix += 1;
                    newTaskName = newTaskModel.get("Task Name") + suffix
                }
                newTaskModel.set("Task Name", newTaskName)
                jobModel.addTask(newTaskModel);

                var newTaskView = new TaskView({model: newTaskModel});

                if (!position.top) {
                    position = {top: taskView.$el.offset().top + 100, left: taskView.$el.offset().left + 100};
                }

               if(tasksPosition[i].left == minLeft){
                   tasksPosition[i].left = position.left
               } else if(minLeft){
                   tasksPosition[i].left = tasksPosition[i].left - minLeft + position.left
             }

              if(tasksPosition[i].top == minTop){
                   tasksPosition[i].top = position.top
            } else if(minTop){
               tasksPosition[i].top = tasksPosition[i].top - minTop + position.top
               }
                thizz.addView(newTaskView, {left: tasksPosition[i].left , top: tasksPosition[i].top  })
                newTaskViews[taskView.model.get("Task Name")] = newTaskView;
            })
            // process dependencies
            $.each(newTaskViews, function (name, taskView) {
                if (taskView.model.dependencies) {
                    var newDependencies = [];
                    $.each(taskView.model.dependencies, function (i, task) {
                        var copiedTaskView = newTaskViews[task.get("Task Name")];
                        if (copiedTaskView) {
                            newDependencies.push(copiedTaskView.model)
                            copiedTaskView.addDependency(taskView);
                        }
                    })
                    taskView.model.dependencies = newDependencies;
                }
            })
            // process control flows
            $.each(newTaskViews, function (oldTaskName, taskView) {
                var task = taskView.model;
                if (task.controlFlow) {
                    if (task.controlFlow.if) {
                        taskView.addIf(task.controlFlow.if, newTaskViews)
                        // switching cloned model to new tasks
                        if (task.controlFlow.if.task && newTaskViews[task.controlFlow.if.task.get("Task Name")]) {
                            task.controlFlow.if.task = newTaskViews[task.controlFlow.if.task.get("Task Name")].model;
                        } else {
                            delete task.controlFlow['if']['task'];
                        }
                        if (task.controlFlow.if.else && task.controlFlow.if.else.task && newTaskViews[task.controlFlow.if.else.task.get("Task Name")]) {
                            task.controlFlow.if.else.task = newTaskViews[task.controlFlow.if.else.task.get("Task Name")].model;
                        } else {
                            delete task.controlFlow['if']['else'];
                        }
                        if (task.controlFlow.if.continuation && task.controlFlow.if.continuation.task && newTaskViews[task.controlFlow.if.continuation.task.get("Task Name")]) {
                            task.controlFlow.if.continuation.task = newTaskViews[task.controlFlow.if.continuation.task.get("Task Name")].model;
                        } else {
                            delete task.controlFlow['if']['continuation'];
                        }
                    }
                    if (task.controlFlow.replicate) {
                        var taskDepView = newTaskViews[jobModel.getDependantTask(oldTaskName)];
                        taskView.addReplicate(taskDepView);
                    }
                    if (task.controlFlow.loop) {
                        var loopTarget = task.controlFlow.loop.task;
                        var targetView = newTaskViews[loopTarget.get('Task Name')];
                        taskView.addLoop(targetView)
                    }
                }
            })

            this.initJsPlumb();
        },
        getOpenAccordions: function () {
            var result = {job: this.openedAccordion};
            $.each(this.taskViews, function (i, taskView) {
                var taskName = taskView.model.get("Task Name");
                result[taskName] = taskView.openedAccordion;
            });
            return result;
        },
        restoreOpenAccordions: function (openAccordions) {
            if (openAccordions.job) {
                this.openedAccordion = openAccordions.job;
            }
            var that = this;
            $.each(openAccordions, function (taskName, accordion) {
                var taskView = that.getTaskViewByName(taskName);
                if (taskView && accordion) {
                    taskView.openedAccordion = accordion;
                }
            })
        },
        getActiveTask: function () {
            return $("#breadcrumb-task-name").text();
        },
        restoreActiveTask: function (taskName) {
            $("span.name").each(function (i, el) {
                if ($(el).text() === taskName) {
                    $(el).click()
                }
            })
        },
        saveInitialState: function() {
            // saving the initial job
            undoManager.save(true);
        },
        remove: function() {
            jsPlumb.unbind();
            jsPlumb.deleteEveryEndpoint();
            Backbone.View.prototype.remove.apply(this, arguments);
        }
    });

})
