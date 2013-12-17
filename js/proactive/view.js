(function($){

	Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;

	PaletteView = Backbone.View.extend({
		initialize: function() {
            this.render();
        },
        render: function() {
        	var taskWidget = $(
        			'<span class="label draggable ui-draggable job-element" title="Computational task">'+
        			'<img src="img/gears.png" width="40px">Task</span>');

            var ifWidget = $(
                '<span class="label draggable ui-draggable job-element control-flow control-flow-if" title="If Control">'+
                    '<img src="img/gears.png" width="20px">If</span>');

            var loopWidget = $(
                '<span class="label draggable ui-draggable job-element control-flow control-flow-loop" title="Loop Control">'+
                    '<img src="img/gears.png" width="20px">Loop</span>');

            var replicateWidget = $(
                '<span class="label draggable ui-draggable  job-element control-flow control-flow-replicate" title="Replicate Control">'+
                    '<img src="img/gears.png" width="20px">Replicate</span>');

            this.$el.append(taskWidget).append(replicateWidget).append(ifWidget).append(loopWidget);

        	$(".draggable").draggable({helper: "clone"});
	    }	
	});
	
	PropertiesView = Backbone.View.extend({
        listWorkflows: function() {

            var breadcrumb = $('<ul class="breadcrumb"></ul>');
            var workflows = $('<li class="active"><span>Workflows</span></li>');
            breadcrumb.append(workflows)

            var newWorkflow = $('<button type="button" class="btn btn-success btn-small create-workflow-button">Create Workflow</button>')

            newWorkflow.click(function() {

                var jobModel = new Job();
                var jobName = jobModel.get("Job Name");
                var jobXml = xmlView.xml(jobModel);

                projects.addEmptyWorkflow(jobName, jobXml);

                var workflowJson = projects.getCurrentWorkFlowAsJson()
                if (workflowJson) {
                    workflowView.import(workflowJson);
                }

                propertiesView.listWorkflows();
            })

            propertiesView.$el.html(breadcrumb);
            propertiesView.$el.append(newWorkflow);

            var workflows = projects.getWorkFlows();
            var selectedWorkflow = projects.getSelectWorkflowIndex();
            if (workflows.length > 0) {
                var table = $('<table class="table table-striped table-hover"></table>');
                var rows = $('<tbody></tbody>')

                table.append('<thead><tr><th>#</th><th>Name</th><th>Actions</th></tr></thead>');
                table.append(rows);

                for (var i=workflows.length-1; i>=0; i--) {
                    var rowClass = "";
                    if (i == selectedWorkflow) rowClass = "success";
                    rows.append('<tr data-id="'+i+'" class="'+rowClass+'"><td>'+(i+1)+'</td><td title="Click to edit">'+workflows[i].name+'</td><td><button type="button" class="btn btn-info btn-mini btn-clone">Clone</button> <button type="button" class="btn btn-danger btn-mini btn-remove">Remove</button></td></tr>')
                }

                propertiesView.$el.append(table);

                table.find('.btn-clone').click(function() {
                    event.preventDefault();
                    event.stopPropagation();

                    var workflowIndex = $(this).parents("tr").attr('data-id');
                    if (workflowIndex) {
                        console.log("Cloning the workflow number ", workflowIndex)
                        projects.cloneWorkflow(workflowIndex);
                        propertiesView.listWorkflows();
                    }
                })
                table.find('.btn-remove').click(function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    var workflowIndex = $(this).parents("tr").attr('data-id');
                    if (workflowIndex) {
                        console.log("Removing the workflow number ", workflowIndex)
                        projects.removeWorkflow(workflowIndex);
                        propertiesView.listWorkflows();
                    }
                })
                table.find('tr').click(function() {
                    var workflowIndex = $(this).attr('data-id');
                    if (workflowIndex) {
                        projects.setSelectWorkflowIndex(workflowIndex);
                        var workflowJson = projects.getCurrentWorkFlowAsJson()
                        if (workflowJson) {
                            workflowView.import(workflowJson);
                        }
                    }
                    propertiesView.listWorkflows();
                })
            }

            return false;
        }
	});

	ViewWatchingModelChange = Backbone.View.extend({
		initialize: function() {
	        this.model.on("change", this.render, this);
            this.render();
        }
	});
	
	ViewWithProperties = ViewWatchingModelChange.extend({
        render: function() {
        	var that = this;
        	if (this.element) this.$el = this.element;
        	
        	this.$el.unbind('click');

        	this.$el.click(function (event) {
        		event.stopPropagation();
                that.renderForm()
            });
            this.$el.dblclick(function() {
                event.stopPropagation();
            })

            return this;
	    },

        renderForm: function () {
            var that = this
            that.clearTextSelection();

            var form = new Backbone.Form({
                'model': that.model
            }).render();

            var breadcrumb = $('<ul id="breadcrumb" class="breadcrumb"></ul>');
            var workflows = $('<li class="active"><a href="#" id="breadcrumb-list-workflows">Workflows</a></li>');
            breadcrumb.append(workflows)
            breadcrumb.append('<li class="active"><span id="breadcrumb-job-name">' + jobModel.get("Job Name") + '</span></li>')
            if (that.model.get("Task Name")) {
                breadcrumb.append('<li class="active"><span id="breadcrumb-task-name">' + that.model.get("Task Name") + '</span></li>')

                var removeTask = $('<a href="#" class="glyphicon glyphicon-trash pull-right" title="Remove task"></a>');
                removeTask.click(function () {
                    workflowView.removeView(that);
                    return false;
                })
                breadcrumb.append(removeTask)
            }

            workflows.click(function () {
                return propertiesView.listWorkflows();
            })

            that.form = form;
            propertiesView.$el.data('form', form);

            form.on('change', function (f, changed) {
                form.commit();
            })


            form.$el.find("input").addClass("form-control");
            form.$el.find("select").addClass("form-control");
            form.$el.find("textarea").addClass("form-control");

            var tabs = form.$el.find("[data-tab]");
            if (tabs.length > 0) {
                var accordion = $('<div class="panel-group" id="accordion-properties">');
                var currentAccordionGroup = undefined;
                var curLabel = "";

                $.each(form.$el.children().children(), function (i, elem) {
                    var el = $(elem);
                    if (el.attr("data-tab")) {
                        var accId = "acc-" + i;
                        // defining if this accordion should be opened
                        var openAccordion = false;
                        if (i == 0 && !that.openedAccordion) {
                            openAccordion = true;
                        }
                        if (accId == that.openedAccordion) {
                            openAccordion = true;
                        }

                        var accordionGroup = $('<div class="panel panel-default"><div class="panel-heading"><a data-toggle="collapse" data-parent="#accordion-properties" href="#' + accId + '">' + el.attr("data-tab") + '</a></div></div>');
                        currentAccordionGroup = $('<div id="' + accId + '" class="panel-body collapse ' + (openAccordion ? "in" : "") + '"></div>');
                        accordionGroup.append(currentAccordionGroup);
                        accordion.append(accordionGroup);
                        curLabel = el.attr("data-tab").replace(/ /g, '');
                    }

                    // remove duplicate labels that comes from nested types
                    el.find("label").each(function (i, label) {
                        var labelName = $(label).text().replace(/ /g, '');
                        if (labelName && labelName == curLabel) {
                            // removing the duplicate as it's already in the accordion caption
                            $(label).remove();
                        } else {
                            curLabel = labelName;
                        }
                    })

                    // modifying checkbox layout
                    var checkbox = el.find("input[type='checkbox']");
                    if (checkbox.length > 0) {
                        el = el.find("label").addClass("checkbox").append(checkbox);
                    }

                    if (currentAccordionGroup)
                        currentAccordionGroup.append($('<div class="form-wrap"></div>').append(el));

                })

                propertiesView.$el.html(breadcrumb);
                propertiesView.$el.append(accordion);

                // saving expanded accordion
                $(".accordion-toggle").click(function () {
                    var accordionBody = $(this).parents(".accordion-group").find(".panel-body");
                    if (!accordionBody.hasClass("in")) {
                        that.openedAccordion = accordionBody.attr('id')
                    }
                })
            } else {
                propertiesView.$el.html(breadcrumb);
                propertiesView.$el.append(form.$el);
            }

            // showinf only file names in job classpath
            $(".visible-job-classpath input").val(function () {
                var fullPath = $(this).val();
                var fileName = fullPath.replace(/^.*[\\\/]/, '')
                $(this).attr('readonly', true);
                return fileName;
            })
        },
        clearTextSelection : function() {
            if(document.selection && document.selection.empty) {
                document.selection.empty();
            } else if(window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }
        }
	})


	WorkflowView = ViewWithProperties.extend({
		zoomArea: $("<div></div>"),
        taskViews: [],
		initialize: function() {
			this.constructor.__super__.initialize.apply(this);
			var that = this;
			
			this.$el.droppable({
				accept: ".job-element",
		  		drop: function(event, ui) {
                    var elem = $(ui.draggable);
                    if (!elem.hasClass('control-flow')) {
                        that.createTask(ui)
                    } else if (elem.hasClass('control-flow-if')) {
                        that.createIfWorkflow(ui)
                    } else if (elem.hasClass('control-flow-loop')) {
                        that.createLoopWorkflow(ui)
                    } else if (elem.hasClass('control-flow-replicate')) {
                        that.createReplicationWorkflow(ui)
                    }
		  		}
			});

            this.$el.dblclick(function(event) {
                that.clearTextSelection();

                console.log("Creating task", event);
                that.createTask({offset:{top:event.clientY, left:event.clientX}});
            })

            this.initJsPlumb();
            this.$el.html(this.zoomArea);
            this.model.on("change:Job Name", this.updateJobName, this);
        },
        initJsPlumb: function() {
            var that = this;

            jsPlumb.unbind();

			jsPlumb.bind("connection", function(connection) {
                connection.sourceEndpoint.addClass("connected")
                connection.targetEndpoint.addClass("connected")
				var source = connection.source;
				var target = connection.target;
                if ($(target).data("view")) {
                    var targetModel = $(target).data("view").model;
                    var sourceModel = $(source).data("view").model;
                    if (connection.connection.scope=='dependency') {
                        targetModel.addDependency(sourceModel);
                    } else {
                        sourceModel.setControlFlow(connection.connection.scope, targetModel);
                    }
                }
			});
			
			jsPlumb.bind('connectionDetached', function(connection) {
                if (connection.connection.scope!='dependency') {
                    connection.sourceEndpoint.removeClass("connected")
                }
                connection.targetEndpoint.removeClass("connected")

				var source = connection.source;
				var target = connection.target;

                if ($(target).data("view")) {
                    var sourceModel = $(source).data("view").model;
                    var targetModel = $(target).data("view").model;
                    if (connection.connection.scope=='dependency') {
                        targetModel.removeDependency(sourceModel);
                    } else {
                        jsPlumb.deleteEndpoint(connection.targetEndpoint);
                        sourceModel.removeControlFlow(connection.connection.scope, targetModel);
                    }
                }
			});

            // showing target endpoints
            jsPlumb.bind('connectionDrag', function(connection) {
                $('.task').each(function(i, task) {
                    if ($(task).attr('id') != connection.sourceId) {
                        $(task).data('view').addTargetEndPoint(connection.scope);
                    }
                })
                jsPlumb.repaintEverything()
            });

            // hiding unnecessary target endpoints
            jsPlumb.bind('connectionDragStop', function(connection) {
                $(".target-endpoint:not(.connected)").remove();

                if (!connection.target) {
                    // creating a task where drag stopped
                    var sourcePoints = jsPlumb.getEndpoints($("#"+connection.sourceId));
                    for (var i in sourcePoints) {
                        if (sourcePoints[i].scope == connection.scope) {
                            var sourceView = $("#" + connection.sourceId).data('view')
                            var newTask = that.createTask({offset:{top:that.mouseup.top, left:that.mouseup.left}});
                            var endpointDep = newTask.addTargetEndPoint(connection.scope)
                            jsPlumb.connect({source:sourcePoints[i], target:endpointDep, overlays: sourceView.overlays()});

                            break;
                        }
                    }

                }
            });

            this.$el.mouseup(function(event) {
                that.mouseup = {top: event.clientY, left: event.clientX};
            })


            jsPlumb.bind("click", function(connection, originalEvent) {
                if (originalEvent.isPropagationStopped()) return false;
				var source = connection.source;
				var target = connection.target;

                console.log("click on the ", connection)
				jsPlumb.detach(connection);
			});

        },
        createTask: function(ui) {
            var offset = this.$el.offset();

            console.log("Initializing TaskView")
            var view = new TaskView();

            var position = {top: ui.offset.top, left: ui.offset.left};
            var rendering = this.addView(view, position);

            this.model.addTask(rendering.model);
            this.model.trigger('change');

            return view;
        },
        createIfWorkflow: function(ui) {
            var offset = this.$el.offset();

            console.log("Initializing If Workflow")
            var taskIf = new TaskView();
            var taskTarget = new TaskView();
            var taskElse = new TaskView();
            var taskContinuation = new TaskView();

            var positionIf = {top: ui.offset.top, left: ui.offset.left};
            var positionTarget = {top: positionIf.top + 200, left: positionIf.left - 150};
            var positionElse = {top: positionTarget.top, left: positionTarget.left + 150};
            var positionContinuation = {top: positionTarget.top, left: positionElse.left + 150};

            var renderingIf = this.addView(taskIf, positionIf);
            var renderingTarget = this.addView(taskTarget, positionTarget);
            var renderingElse = this.addView(taskElse, positionElse);
            var renderingContinuation = this.addView(taskContinuation, positionContinuation);

            this.model.addTask(renderingIf.model);
            this.model.addTask(renderingTarget.model);
            this.model.addTask(renderingElse.model);
            this.model.addTask(renderingContinuation.model);

            var endpointIf = taskIf.addSourceEndPoint('if')
            var endpointTarget = taskTarget.addTargetEndPoint('if')
            var endpointElse = renderingElse.addTargetEndPoint('if')
            var endpointContinuation = renderingContinuation.addTargetEndPoint('if')

            jsPlumb.connect({source:endpointIf, target:endpointTarget, overlays:taskIf.overlays()});
            jsPlumb.connect({source:endpointIf, target:endpointElse, overlays:taskIf.overlays()});
            jsPlumb.connect({source:endpointIf, target:endpointContinuation, overlays:taskIf.overlays()});

            this.model.trigger('change');
        },
        createLoopWorkflow: function(ui) {
            var offset = this.$el.offset();

            console.log("Initializing Loop Workflow")
            var taskDo = new TaskView();
            var taskWhile = new TaskView();

            var positionDo = {top: ui.offset.top, left: ui.offset.left};
            var positionWhile = {top: positionDo.top + 200, left: positionDo.left};

            var renderingDo = this.addView(taskDo, positionDo);
            var renderingWhile = this.addView(taskWhile, positionWhile);

            this.model.addTask(renderingDo.model);
            this.model.addTask(renderingWhile.model);

            var endpointDo = taskDo.addTargetEndPoint('loop')
            var endpointWhile = taskWhile.addSourceEndPoint('loop')

            var endpointDepDo = taskDo.addSourceEndPoint('dependency')
            var endpointDepWhile = taskWhile.addTargetEndPoint('dependency')

            jsPlumb.connect({source:endpointDepDo, target:endpointDepWhile, overlays:taskWhile.overlays()});
            jsPlumb.connect({source:endpointWhile, target:endpointDo, overlays:taskWhile.overlays()});

            taskDo.model.set("Block", "start")
            taskWhile.model.set("Block", "end")
            taskDo.showBlockInTask()
            taskWhile.showBlockInTask()

            this.model.trigger('change');
        },
        createReplicationWorkflow: function(ui) {
            var offset = this.$el.offset();

            console.log("Initializing Replicate Workflow")
            var taskInit = new TaskView();
            var taskRepl = new TaskView();

            var positionInit = {top: ui.offset.top, left: ui.offset.left};
            var positionRepl = {top: positionInit.top + 200, left: positionInit.left};

            var renderingInit = this.addView(taskInit, positionInit);
            var renderingRepl = this.addView(taskRepl, positionRepl);

            this.model.addTask(renderingInit.model);
            this.model.addTask(renderingRepl.model);

            var endpointInit = taskInit.addSourceEndPoint('replicate')
            var endpointRepl = taskRepl.addTargetEndPoint('replicate')

            var endpointDepInit = taskInit.addSourceEndPoint('dependency')
            var endpointDepRepl = taskRepl.addTargetEndPoint('dependency')

            jsPlumb.connect({source:endpointInit, target:endpointRepl, overlays:taskInit.overlays()});
            jsPlumb.connect({source:endpointDepInit, target:endpointDepRepl, overlays:taskInit.overlays()});

            this.model.trigger('change');
        },
	    updateJobName: function() {
//	    	$("#breadcrumb-project-name").text(this.model.get("Project Name"))
	    	$("#breadcrumb-job-name").text(this.model.get("Job Name"))			
	    },
	    clean: function() {
	    	this.zoomArea.empty();
	    	jsPlumb.reset()
            this.initJsPlumb()
	    },
        initLeftOffset: [],
        initTopOffset: [],
        addView: function(view, position) {

            var that = this;
  			var rendering = view.render();
    		rendering.$el.offset(position);
    		this.zoomArea.append(rendering.$el);

            view.addSourceEndPoint('dependency')
            var initLeftOffset = [], initTopOffset = [];

            jsPlumb.draggable(rendering.$el,
                {
                    start: function (event, ui) {
                        var item = $(this);
                        var pos = item.position();
                        var items = $(".selected-task");

                        $.each(items || {}, function (key, value) {
                            var elemPos = $(value).position();
                            that.initLeftOffset[key] = elemPos.left - pos.left;
                            that.initTopOffset[key] = elemPos.top - pos.top;
                        });
                        //  items.trigger("start");
                        jsPlumb.repaint(items);
                        jsPlumb.repaint(item);


                    },
                    drag: function (event, ui) {
                        var item = $(this);
                        var pos = ui.offset;
                        var items = $(".selected-task");
                        $.each(items || {}, function (key, value) {

                            var oPos = {
                                left: pos.left + that.initLeftOffset[key],
                                top: pos.top + that.initTopOffset[key]
                            }, oEl = $(value);

                            oEl.offset(oPos);
                            jsPlumb.repaint(oEl, oPos);
                        });

                        // repaint the dragging item, passing in position
                        jsPlumb.repaint(item, pos);
                    },
                    stop: function (event, ui) {
                        var item = $(this);
                        var pos = $(this).offset();
                        var items = $(".selected-task");

                        $.each(items || {}, function (key, value) {
                            $(value).offset({
                                left: pos.left + that.initLeftOffset[key],
                                top: pos.top + that.initTopOffset[key]
                            });
                        });
                        jsPlumb.repaint(items);
                    }
                }
            )

            this.taskViews.push(view);
    		
            rendering.$el.data("view", view);
			return rendering;
        },
        removeView: function(view) {

            var endPoints = jsPlumb.getEndpoints(view.$el)
            for (var i in endPoints) {
                try {
                    jsPlumb.deleteEndpoint(endPoints[i]);
                } catch (err) {}
            }

            jobModel.removeTask(view.model);
            view.$el.remove();
            jsPlumb.remove(view.$el);

            index = this.taskViews.indexOf(view);
            if (index!=-1) {
                this.taskViews.splice(index, 1);
            }

            this.$el.click();
        },
        import: function(json, autoLayout) {

            jobModel = new Job();
            jobModel.populate(json.job)

            var that = this;
            this.clean();
            console.log("Changing job model from", this.model);
            this.model = jobModel;
            xmlView.model = jobModel;
            console.log("To", this.model);

            this.model.on("change:Job Name", this.updateJobName, this);

            // to avoid model change by creating connections clean all jsplumb events
            jsPlumb.unbind();

            var task2View = {};
            $.each(jobModel.tasks, function(i, task) {
                var view = new TaskView({model:task});
                that.addView(view, {top:0, left:0});
                task2View[task.get('Task Name')] = view;
            })

            //adding dependencies after all views exist
            $.each(jobModel.tasks, function(i, task) {
                if (task.dependencies) {
                    $.each(task.dependencies, function(i, dep) {
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
                        var taskDepView = task2View[jobModel.getDependantTask(task.get('Task Name'))];
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
            jobModel.trigger('change');
            if (autoLayout) {
                this.autoLayout()
            } else {
                this.restoreLayout();
            }
            // regenerating the form
            this.$el.click();
        },
        autoLayout: function() {
        	var nodes = [];
        	var taskWidth = 0;
        	$(".task").each(function(i, task) {
        		var t = $(task);
        		nodes.push({id:t.attr('id'), width:t.width(), height:t.height()})
        		taskWidth = t.width();
        	})
        	var edges = [];

        	$.each(jsPlumb.getAllConnections(), function(i, con) {
        		edges.push({sourceId:con.source.id, targetId:con.target.id})
        	})
        	// computing layout with dagre 
        	dagre.layout().nodes(nodes).edges(edges).nodeSep(50).rankSep(100).run();
        	
        	var containerPosition = $('#workflow-designer').position();
        	// finding max left offset and top offset to center the graph
        	var maxLeft = 0, maxTop = 0;
        	$.each(nodes, function(i, node) {
        		if (node.dagre.x > maxLeft) maxLeft = node.dagre.x;
        		if (node.dagre.y > maxTop) maxTop = node.dagre.y;
        	})
        	
        	var leftOffset = $('#workflow-designer').width() - maxLeft < 0? 0 : ($('#workflow-designer').width() - maxLeft)/2 - taskWidth;
        	var topOffset = $('#workflow-designer').height() - maxTop < 0? 0 : ($('#workflow-designer').height() - maxTop)/2 + 50;
        	
        	$.each(nodes, function(i, node) {
        		var pos = {}; 
        		if (node.dagre.x) pos.left = node.dagre.x + containerPosition.left + leftOffset;
        		if (node.dagre.x) pos.top = node.dagre.y + containerPosition.top + topOffset;
        		$("#"+node.dagre.id).offset(pos)
        	}) 
    		jsPlumb.repaintEverything();
        },
        restoreLayout: function() {
            var offsets = projects.getOffsetsFromLocalStorage();
            if (offsets) {
                $('.task').each(function() {
                    var taskName = $(this).find("span.name").text()
                    $(this).offset(offsets[taskName])
                })
                jsPlumb.repaintEverything();
            } else {
                this.autoLayout();
            }
        },
        zoom: 1,
        setZoom: function(zoom) {
        	if (zoom) this.zoom = zoom;
        	
            var p = [ "-webkit-", "-moz-", "-ms-", "-o-", "" ],
            s = "scale(" + this.zoom + ")";

            for (var i = 0; i < p.length; i++)
            	this.zoomArea.css(p[i] + "transform", s);

            jsPlumb.setZoom(this.zoom);
        },
        zoomIn: function() {
    		if (this.zoom < 2) {
    			this.zoom += 0.3;
    			this.setZoom(this.zoom)
    		}
        },
        zoomOut: function() {
    		if (this.zoom > 0.4) {
    			this.zoom -= 0.3;
    			this.setZoom(this.zoom)
    		}
        },
        getTaskViewByName: function(name) {
            return _.find(this.taskViews, function(view) {
                return (name === view.model.get("Task Name"));
            })
        },
        copyPasteSelected: function() {

            // to avoid model change by creating connections clean all jsplumb events
            jsPlumb.unbind();

            var newTaskViews = {};
            $(".selected-task").each(function(i, t) {
                var task = $(t);
                var taskView = task.data("view");

                var newTaskModel = jQuery.extend(true, {}, taskView.model);

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
                var newTaskName = newTaskModel.get("Task Name")+suffix;
                while (jobModel.getTaskByName(newTaskName)) {
                    suffix += 1;
                    newTaskName = newTaskModel.get("Task Name")+suffix
                }

                newTaskModel.set("Task Name", newTaskName)
                jobModel.addTask(newTaskModel);

                var newTaskView = new TaskView({model:newTaskModel});
                workflowView.addView(newTaskView, {top:taskView.$el.offset().top+100, left:taskView.$el.offset().left+100});

                newTaskViews[taskView.model.get("Task Name")] = newTaskView;
            })
            // process dependencies
            $.each(newTaskViews, function(name, taskView) {
                if (taskView.model.dependencies) {
                    var newDependencies = [];
                    $.each(taskView.model.dependencies, function(i, task) {
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
            $.each(newTaskViews, function(oldTaskName, taskView) {
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
        }
	});

    TaskView = ViewWithProperties.extend({

        icons: {"JavaExecutable": "img/java.png", "NativeExecutable": "img/command.png", "ScriptExecutable": "img/script.png"},
        controlFlows: {"dependency":true, "if":false, "replicate":false, "loop":false},

		initialize: function() {
			if (!this.model) this.model = new Task();
			this.modelType = this.model.get("Type");
	        this.model.on("change:Task Name", this.updateTaskName, this);
	        this.model.on("change:Type", this.changeTaskType, this);
            this.model.on("change:Control Flow", this.controlFlowChanged, this);
            this.model.on("change:Block", this.showBlockInTask, this);

            this.model.on("invalid", this.setInvalid, this);

			this.element = $('<div class="task"><a class="task-name"><img src="'
                +this.icons[this.modelType]+'" width="20px">&nbsp;<span class="name">'
                +this.model.get("Task Name")+'</span></a></div>');

            this.showBlockInTask();
        },

        updateTaskName: function() {
        	this.element.find(".name").text(this.model.get("Task Name"))
	    	$("#breadcrumb-task-name").text(this.model.get("Task Name"))
	    },

        setInvalid : function() {
            this.$el.addClass("invalid-task")
        },

        changeTaskType: function() {
        	var executableType = this.model.get("Type");
        	if (this.modelType && this.modelType != executableType) {
            	var executable = new window[executableType]();
            	this.model.schema = $.extend(true, {}, this.model.schema);
                // TODO beautify
            	if (executableType == "JavaExecutable") {
                	this.model.schema['Parameters'] = {type: 'NestedModel', model: JavaExecutable};
            	} else if (executableType == "NativeExecutable") {
                	this.model.schema['Parameters'] = {type: 'NestedModel', model: NativeExecutable};
            	} else {
                	this.model.schema['Parameters'] = {type: 'NestedModel', model: ScriptExecutable};
            	}
            	this.$el.find("img").attr('src', this.icons[executableType])
            	this.model.set({"Parameters" : executable});
            	this.$el.click();
        	}
        	this.modelType = executableType;
	    },
        controlFlowChanged: function(model, valu, handler) {
            var fromFormChange = handler.error; // its defined when form was changed
            var control = this.model.get("Control Flow");
            if (fromFormChange && control && control != 'none') {
                $('.source-endpoint:not(.connected)').remove();
                $('.target-endpoint:not(.connected)').remove();

                this.model.controlFlow = {};
                $.each(jsPlumb.getEndpoints(this.$el), function(i, endPoint) {
                    if (endPoint.scope!='dependency') jsPlumb.deleteEndpoint(endPoint)
                })

                this.addSourceEndPoint(control)
                jsPlumb.repaintEverything();
            }
        },
        showBlockInTask: function() {
            var block = this.model.get("Block");
            if (block && block != 'none') {
                if (block == 'start') this.element.removeClass('block-end').addClass('block-start');
                else this.element.removeClass('block-start').addClass('block-end');
            } else {
                 this.element.removeClass('block-end').removeClass('block-start');
            }
        },
	    showOrHideForkEnvironment: function() {
			var executable = this.model.get("Parameters");
			if (executable) {
				var forkEnvTitle = "Fork Environment";
				var forkEnvDiv = propertiesView.$el.find('[placeholder="forkEnvironment"]')
                if (typeof(executable.toJSON) != "undefined") {
                    executable = executable.toJSON();
                }
				if (executable[forkEnvTitle]==undefined) { return; }

				if (executable[forkEnvTitle]=="true") {
					forkEnvDiv.nextAll("div").show();
				} else {
					forkEnvDiv.nextAll("div").hide();
				}
			}        	
	    },
        overlays: function() {
            var arrowCommon = { foldback:0.7, fillStyle:"gray", width:14 };
            return [[ "Arrow", { location:0.7 }, { foldback:0.7, fillStyle:"gray", width:14 } ]];
        },
        showControlFlowScript: function(label, evn) {
            evn.stopPropagation()

            var labelElem = $(label.canvas);
            var modelType = labelElem.text();
            var model = this.model.controlFlow[modelType];
            if (!model) return;

            var modelView = new ViewWithProperties({el:labelElem, model:model.model})
            modelView.render();
            modelView.$el.click();
        },
        endpointsParams : function(type) {
            var that = this;
            if (type == 'if') {
                var params = {
                    color:'#00f', anchorSource:'BottomLeft', anchorTarget:'TopLeft', scope:"if",
                    overlays: [
                        [ "Arrow", { location:0.7 }, { foldback:0.7, fillStyle:"gray", width:14 } ],
                        [ "Label", {
                            label: function() {
                                var ifModel = that.model.controlFlow['if'];
                                if (!ifModel || ifModel&&!ifModel.model ) return 'if'
                                else if (!ifModel['else']) return 'else'
                                else if (!ifModel['continuation']) return 'continuation'
                                else return "";
                            },
                            cssClass:"l1 component label",
                            events: {'click': function(label, evn) { that.showControlFlowScript(label, evn)}}
                        }]
                    ]
                }
                return params;
            } else {
                var endpointTypes = {
                    'dependency':{
                        color:'#666', anchorSource:'BottomCenter', anchorTarget:'TopCenter', scope:"dependency",
                        overlays: [
                            [ "Arrow", { location:0.7 }, { foldback:0.7, fillStyle:"gray", width:14 } ]
                        ]
                    },
                    'loop':{
                        color:'#316b31', anchorSource:'TopRight', anchorTarget:'BottomRight', scope:"loop",
                        overlays: [
                            [ "Arrow", { location:0.7 }, { foldback:0.7, fillStyle:"gray", width:14 } ],
                            [ "Label", {
                                label: 'loop',
                                cssClass:"l1 component label",
                                events: {'click': function(label, evn) { that.showControlFlowScript(label, evn)}}
                            }]
                        ]
                    },
                    'replicate':{
                        color:'rgba(229,219,61,0.5)', anchorSource:[0.8, 1, 0, 1], anchorTarget:[0.8, 0], scope:"replicate",
                        overlays: [
                            [ "Arrow", { location:0.7 }, { foldback:0.7, fillStyle:"gray", width:14 } ],
                            [ "Label", {
                                label: 'replicate',
                                cssClass:"l1 component label",
                                events: {'click': function(label, evn) { that.showControlFlowScript(label, evn)}}
                            }]
                        ]
                    }

                }
                return endpointTypes[type];
            }
        },
        addSourceEndPoint: function(type) {
            var that = this;
            var params = this.endpointsParams(type);

            var sourceEndpoint = {
                paintStyle:{ width:15, height:15, fillStyle:params.color },
                connectorStyle : { strokeStyle:params.color },
                connectorOverlays:params.overlays,
                cssClass:"source-endpoint " + params.scope + "-source-endpoint " + (params.scope=="dependency"?"connected":""),
                scope:params.scope,
                isSource:true,
                maxConnections:-1
            };

            return jsPlumb.addEndpoint(that.$el, sourceEndpoint, { 'anchor':params.anchorSource });
        },
        addTargetEndPoint: function(type) {
            var that = this;
            var params = this.endpointsParams(type);

            var targetEndpoint = {
                paintStyle:{ width:15, height:15, fillStyle:params.color },
                connectorStyle : { strokeStyle:params.color },
                scope:params.scope,
                cssClass:"target-endpoint " + params.scope + "-target-endpoint",
                dropOptions:{ hoverClass:"hover", activeClass:"active" },
                isTarget:true,
                maxConnections:(type=='dependency'?-1:1)
            };
            return jsPlumb.addEndpoint(that.$el, targetEndpoint, { 'anchor':params.anchorTarget });
        },
        getSourceEndPoint: function(type) {
            var endpoints = jsPlumb.getEndpoints(this.$el);

            for (i in endpoints) {
                var ep = endpoints[i];
                if (ep.scope == type && ep.isSource) {
                    return ep;
                }
            }
        },
        getTargetEndPoint: function(type) {
            var endpoints = jsPlumb.getEndpoints(this.$el);

            for (i in endpoints) {
                var ep = endpoints[i];
                if (ep.scope == type && ep.isTarget) {
                    return ep;
                }
            }
        },
        addDependency: function(dependencyView) {
            var sourceEndPoint = this.getSourceEndPoint("dependency")
            if (!sourceEndPoint) {
                sourceEndPoint = this.addSourceEndPoint("dependency")
            }
            var targetEndPoint = dependencyView.getTargetEndPoint("dependency")
            if (!targetEndPoint) {
                targetEndPoint = dependencyView.addTargetEndPoint("dependency")
            }

            jsPlumb.connect({source:sourceEndPoint, target:targetEndPoint, overlays:this.overlays()});
        },
        addIf: function(ifFlow, views) {
            var endpointIf = this.addSourceEndPoint('if')

            if (ifFlow.task) {
                var taskTarget = views[ifFlow.task.get('Task Name')];
                if (taskTarget) {
                    var endpointTarget = taskTarget.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'if';
                    jsPlumb.connect({source:endpointIf, target:endpointTarget, overlays:this.overlays()});
                }
            }
            if (ifFlow.else && ifFlow.else.task) {
                var taskElse = views[ifFlow.else.task.get('Task Name')];
                if (taskElse) {
                    var endpointElse = taskElse.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'else';
                    jsPlumb.connect({source:endpointIf, target:endpointElse, overlays:this.overlays()});
                }
            }
            if (ifFlow.continuation && ifFlow.continuation.task) {
                var taskContinuation = views[ifFlow.continuation.task.get('Task Name')];
                if (taskContinuation) {
                    var endpointContinuation = taskContinuation.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'continuation';
                    jsPlumb.connect({source:endpointIf, target:endpointContinuation, overlays:this.overlays()});
                }
            }
        },
        addReplicate: function(view) {
            if (!view) return;
            var endpointSource = this.addSourceEndPoint('replicate')
            var endpointTarget = view.addTargetEndPoint('replicate')
            jsPlumb.connect({source:endpointSource, target:endpointTarget, overlays:this.overlays()});
        },
        addLoop: function(view) {
            if (!view) return;
            var endpointSource = this.addSourceEndPoint('loop')
            var endpointTarget = view.addTargetEndPoint('loop')
            jsPlumb.connect({source:endpointSource, target:endpointTarget, overlays:this.overlays()});
        },
	    render: function() {
	    	var that = this;
	    	ViewWithProperties.prototype.render.call(this);
            this.$el.mousedown(function(e) {
                if (!e.ctrlKey) {
                    $(".selected-task").removeClass("selected-task");
                }

                if (that.$el.hasClass("selected-task")) {
                    // unselecting the current task
                    that.$el.removeClass("selected-task");
                } else {
                    // selecting the current task
                    that.$el.addClass("selected-task");
                }
            })

	    	this.$el.click(function(e) {
                e.stopPropagation();

	    		that.form.on('Parameters:change', function(f, task) {
	    			that.form.commit();
	    			that.showOrHideForkEnvironment();
	    		})

                that.showOrHideForkEnvironment();
	    		$('select[name=Library]').click(e);
	    	})
	    	return this;
	    },
        commitForm: function() {
            this.form.commit();
        }
	});

	JobXmlView = Backbone.View.extend({
		initialize: function() {
			var that = this;
			$('#workflow-xml-tab').on('shown', function (e) {
				that.render();
			})
        },
        xml: function(jModel) {
            var that = this;
            var job = jModel.toJSON();

            var tasks = [];
            if (jModel.tasks) {
                $.each(jModel.tasks, function(i, task) {
                    var view = new TaskXmlView({model:task, jobView:that}).render();
                    tasks.push(view.$el.text());
                });
            }
            console.log("Generating job xml", job);
            console.log("Job model", jModel);

            var jobRendering = _.template($("#job-template").html(), {'job': job, 'tasks':tasks});

            // beautifying the job xml - removing multiple spaces
            jobRendering = jobRendering.replace(/ {2,}/g, ' ');
            // removing multiple \n before closing xml element tag
            jobRendering = jobRendering.replace(/\n+\s+>/g, '>\n');
            // indenting using vkbeautify
            return vkbeautify.xml(jobRendering.trim());
        },
        generateXml: function() {
            var that = this;
            return this.xml(this.model)
        },
        generateHtml: function() {
            var content = $("#workflow-designer").html();
            var url = document.URL;
            var hashPos = url.indexOf("#");
            if (hashPos!=-1) url = url.substr(0, hashPos);
            if (url.charAt(url.length-1)=='/') url = url.substr(0, url.length-1);

            var width = $("#workflow-designer").get(0).scrollWidth;
            var height = $("#workflow-designer").get(0).scrollHeight;

            var html = _.template($('#workflow-view-template').html(),
                {'url':url, 'content': content, 'width': width, 'height': height});

            // replacing all images paths
            html = html.replace(/img\//g, url+"/img/");
            return html;
        },
        render: function() {
        	// indenting using vkbeautify
        	this.$el.empty()
        	var pre = $('<pre class="brush:xml;toolbar:false;" id="workflow-xml"></pre>');
            this.generatedXml = vkbeautify.xml(this.generateXml())
        	pre.text(this.generatedXml)
        	this.$el.append(pre);
        	SyntaxHighlighter.highlight();

        	return this;
	    }
	});

	TaskXmlView = Backbone.View.extend({
        render: function() {
        	console.log("Generating task xml", this.model);
        	var executableType = this.model.get("Type");
        	var executableView = new window[executableType+"XmlView"]({model:this.model.get("Parameters")});
        	var executable = executableView.render().$el.text();

        	var selectionScripts=[];
        	if (this.model.get("Selection Scripts")) {
            	$.each(this.model.get("Selection Scripts"), function(i, script) {
            		var view = new TemplateView({model:script, template:"#script-template"}).render();
            		selectionScripts.push(view.$el.text());
            	})
        	}
        	
        	var preScript = new TemplateView({model:this.model.get("Pre Script"), template:"#script-template"}).render().$el.text();
        	var postScript = new TemplateView({model:this.model.get("Post Script"), template:"#script-template"}).render().$el.text();
        	var cleanScript = new TemplateView({model:this.model.get("Clean Script"), template:"#script-template"}).render().$el.text();

            var that = this;
            if (this.model.controlFlow) {
                $.each(['if', 'loop', 'replicate'], function(i, control) {
                    if (that.model.controlFlow[control]) {
                        var controlModel = that.model.controlFlow[control].model;
                        if (controlModel && controlModel.get('Script')) {
                            that.model.controlFlow[control].script =
                                new TemplateView({model: controlModel.get('Script'), template:"#script-template"}).render().$el.text();
                            return false;
                        }
                    }
                })
            }

        	var taskTemplate = _.template($("#task-template").html(),
        			{'task': this.model.toJSON(), 
        			'selectionScripts': selectionScripts,
        			'preScript': preScript.trim(),
        			'postScript': postScript.trim(),
        			'cleanScript': cleanScript.trim(),
        			'dependencies': this.model.dependencies,
                    'controlFlow': this.model.controlFlow,
        			'executable':executable});

        	this.$el.text(taskTemplate);
        	return this;
        }
	});

	JavaExecutableXmlView = Backbone.View.extend({
        render: function() {
            var model = this.model;
            if (typeof(this.model.toJSON) != "undefined") {
                model = this.model.toJSON();
            }
        	var script = undefined;
        	if (model["Environment Script"]) {
        		script = new TemplateView({model:model["Environment Script"], template:"#script-template"}).render().$el.text();
        		script = script.trim();
        	}
        	var template = _.template($("#java-executable-template").html(), {model: model, 'script': script});
        	this.$el.text(template);
        	return this;
        }
	});

	NativeExecutableXmlView = Backbone.View.extend({
        render: function() {
        	var model = this.model;
            if (typeof(this.model.toJSON) != "undefined") {
                model = this.model.toJSON();
            }
            var script = undefined;
        	if (model["Or Dynamic Command"]) {
        		script = new TemplateView({model:model["Or Dynamic Command"], template:"#script-template"}).render().$el.text();
        		script = script.trim();
        	}
        	var template = _.template($("#native-executable-template").html(), {model: model, 'script': script});
        	this.$el.text(template);
        	return this;
        }
	});
	
	ScriptExecutableXmlView = Backbone.View.extend({
        render: function() {
            var script = this.model["Script"];
            if (typeof(this.model.get) != "undefined" && this.model.get("Script")) {
                script = this.model.get("Script").toJSON();
            }
        	var scriptView = new TemplateView({model:script, template:"#script-template"}).render().$el.text();
        	var template = _.template($("#script-executable-template").html(), {'script': scriptView});
        	this.$el.text(template);
        	return this;
        }
	});

	TemplateView = Backbone.View.extend({
        render: function() {
        	if (this.model) {

                if (typeof(this.model.toJSON) != "undefined" && this.model) {
                    this.model = this.model.toJSON();
                }

            	var template = _.template($(this.options.template).html(), {'model': this.model});
            	this.$el.text(template);
        	}
        	return this;
        }
	});

    LoginView = Backbone.View.extend({
        initialize: function() {
            this.render();
        },
        login: function() {
            var that = this;
            var form = $('<form><input type="text" id="studio-user" class="span2 nav-login form-control  pull-left" placeholder="user"><input type="password" id="studio-pass" class="span2 nav-login form-control pull-left" placeholder="password"></form>')
            var buttonLogin = $('<button class="btn btn-small menu-button pull-left" data-toggle="dropdown">Login</button>');
            form.append(buttonLogin);

            buttonLogin.click(function() {
                StudioClient.login({
                    user:$("#studio-user").val(),
                    pass:$("#studio-pass").val()
                }, function() {
                    // on success
                    form.remove();
                    that.$el.html(that.logout());
                    projects.sync();

                    var workflowJson = projects.getCurrentWorkFlowAsJson()
                    if (workflowJson) {
                        workflowView.import(workflowJson);
                    }
                })
            })

            return form;
        },
        logout: function() {
            var that = this;
            var buttonLogout = $('<button class="btn btn-small menu-button" style="margin-bottom:5px" data-toggle="dropdown">Logout</button>');
            var menu = $('<form class="navbar-search pull-right menu-form">Logged in as <b>'+localStorage["user"]+'</b></form>');
            menu.append(buttonLogout);

            buttonLogout.click(function() {
                localStorage.removeItem("sessionId");
                that.$el.html(that.login());
            })

            return menu;
        },
        render: function() {
            var that = this;
            StudioClient.isConnected(function() {
                // logged in successfully - show user name
                console.log("Logged in");
                that.$el.html(that.logout());
                projects.sync();

                var workflowJson = projects.getCurrentWorkFlowAsJson()
                if (workflowJson) {
                    workflowView.import(workflowJson);
                }

            }, function() {
                // failed to login - show login form
                console.log("Login Required")
                that.$el.html(that.login());
            })
            return this;
        }
    });

    var projects = new Projects();
	var jobModel = new Job();

	var palleteView = undefined;
	var workflowView = undefined;
	var propertiesView = undefined;
	var xmlView = undefined;
    var loginView = undefined;

    jsPlumb.bind("ready", function() {

        palleteView = new PaletteView({el: $("#palette-container")});
        workflowView = new WorkflowView({el: $("#workflow-designer"), model: jobModel});
        propertiesView = new PropertiesView({el: $("#properties-container")});
        xmlView = new JobXmlView({el: $("#workflow-xml-container"), model: jobModel});
        loginView = new LoginView({el: $("#login-view")});

        projects.init();

        var workflowJson = projects.getCurrentWorkFlowAsJson()
        if (workflowJson) {
            workflowView.import(workflowJson);
        } else {
            var jobXml = xmlView.xml(jobModel);
            var jobName = jobModel.get("Job Name")
            projects.addEmptyWorkflow(jobName, jobXml);
        }
        workflowView.$el.click();
    })

	$("#import-button").click(function() {
		$('#import-file').click();
	})

	$('#import-file').change(function(env) {
		var files = env.target.files;
		if (files.length > 0) {
			var file = files[0];
			if (!file.type.match('text/xml')) {
				return;
			}
			var reader = new FileReader();
			reader.onloadend = function(evt) {
				
				if (evt.target.readyState == FileReader.DONE) {
                    var json = xmlToJson(parseXml(evt.target.result))
                    workflowView.import(json, true);
                }
			}
			reader.readAsBinaryString(file);						
		}
	})

	$("#export-button").click(function() {
		xmlView.render();
		$('#xml-view-modal').modal();
	})
	
	$("#layout-button").click(function() {
		workflowView.autoLayout();
	});
	$("#zoom-in-button").click(function() {
		workflowView.zoomIn();
	});
	$("#zoom-out-button").click(function() {
		workflowView.zoomOut();		
	});
	$("#zoom-reset-button").click(function() {
		workflowView.setZoom(1);		
	});
	
	$("#submit-button").click(function() {

        StudioClient.isConnected(function() {
            // submitting
            xmlView.render();

            var button = $(this);
            var xml = "";
            // make it in this ugly way to have a right line number for the xml in case of error
            $('#workflow-xml .container').find('.line').each(function(i,line) { xml += $(line).text().trim()+"\n"; })

            var htmlVisualization = xmlView.generateHtml();
            StudioClient.submit(xml, htmlVisualization)
        }, function() {
            // ask to login first
            $('#scheduler-connect-modal').modal();
        })

	});

    $("#clear-button").click(function() {
        console.log("Removing the workflow");
        localStorage.removeItem('job-model');
        jobModel = new Job();
        var that = this;
        workflowView.clean();
        workflowView.model = jobModel;
        xmlView.model = jobModel;
        jobModel.trigger('change');
        workflowView.$el.click();
    });

    $("#save-button").click(function() {
        save_workflow_to_storage();
    });

    $("#download-xml-button").click(function() {
        console.log("Saving xml");
        var jobName = jobModel.get("Job Name")
        var blob = new Blob([xmlView.generatedXml]);
        saveAs(blob, jobName+".xml")
    })

    // removing a task by del
    $('body').keyup(function(e){
        if (e.keyCode == 46) {
            // del pressed
            var selectedTask = $(".selected-task");
            if (selectedTask.length > 0) {
                selectedTask.each(function(i, t) {
                    var taskView = $(t).data('view');
                    workflowView.removeView(taskView);
                })
            }
        }
    })

    $('body').click(function(e) {

        console.log("clearing all selected tasks", e)
        if (e.isPropagationStopped()) {return;}

        $(".selected-task").removeClass("selected-task");
    })

    // submitting job by pressing enter
    $('#scheduler-connect-modal').on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $("#submit-button-dialog").click();
        }
    } );

    $('#script-save-modal').on( 'keypress', function( e ) {
        if( e.keyCode === 13 ) {
            e.preventDefault();
            $("#script-save-button").click();
        }
    } );

    function save_workflow_to_storage() {
        projects.saveCurrentWorkflow(jobModel.get("Job Name"), xmlView.generateXml(), getOffsetsFromDOM());
    }

    function getOffsetsFromDOM() {
        return _.object(
            _.map($('.task'), function(t) {
                var $t = $(t)
                var taskName = $t.find("span.name").text()
                var offset = $t.offset()
                return [taskName, offset]
            })
        )
    }

    function validate_job() {
        console.log("Validating");
        $(".invalid-task").removeClass("invalid-task");
        StudioClient.validate(xmlView.generateXml(), jobModel);
    }

    $("#validate-button").click(function() {
        StudioClient.resetLastValidationResult()
        validate_job();
    });

    (function scriptManagement() {

        function loadSelectedScript() {
            var scriptName = $(this).find(":selected").text();
            var form = $(this).parents('form')
            var textarea = form.find('textarea');
            var libraryPath = form.find('input[name="Library Path"]');
            var arguments = form.find('div[placeholder="file->arguments->argument"]');
            var engine = form.find('div[placeholder="code->@attributes->language"]')
            var saveButton = form.find('button.save-script')
            if (!scriptName) {
                textarea.val('');
                libraryPath.val('');
                arguments.hide();
                engine.show();
                saveButton.attr("disabled", true);
            } else {
                var script = StudioClient.getScript(scriptName);
                textarea.val(script.content);
                libraryPath.val(script.absolutePath);
                arguments.show();
                engine.hide();
                saveButton.attr("disabled", false);
            }
            getCurrentForm().commit();
        }

        function getCurrentTaskView() {
            var taskName = $("#properties-container").find('#breadcrumb-task-name').text();
            return workflowView.getTaskViewByName(taskName)
        }

        function getCurrentForm() {
            return propertiesView.$el.data('form')
        }

        $(document).on("click", 'select[name="Library"]', loadSelectedScript)

        $(document).on("click", '.save-script', function () {
            var scriptName = $(this).parents("form").find('select[name="Library"] :selected').text();
            if (!scriptName) {
                return;
            }
            var content = $(this).parents('form').find('textarea').val();
            StudioClient.saveScriptSynchronously(scriptName, content);
            getCurrentForm().commit();
        })

        $(document).on("click", '.save-script-as', function () {
            var content = $(this).parents('form').find('textarea').val();
            var placeholder = $(this).parents('form').find("div[placeholder]").attr("placeholder");
            $("#script-save-modal").modal()
            $("#script-save-button").unbind("click").click(function () {

                var scriptName = $('#script-save-modal input').val();

                StudioClient.saveScriptSynchronously(scriptName, content);

                getCurrentTaskView().renderForm();

                var select = $('div[placeholder=' + placeholder + '] select[name=Library]');
                select.val(scriptName);
                loadSelectedScript.call(select);
            })
        })

    })();

    (function jobClassPathManagement() {
        $(document).on("click", '.choose-job-classpath', function() {
            var inputFile = $(this).parents("li").find("input[type='file']");
            inputFile.click();

            inputFile.unbind("change");
            inputFile.change(function(env) {

                if ($(this)[0].files.length==0) {
                    // no files selected
                    return;
                }

                var selectedFileName = undefined;
                var data = new FormData();
                jQuery.each($(this)[0].files, function(i, file) {
                    data.append(file.name, file);
                    selectedFileName = file.name;
                });

                StudioClient.uploadBinaryFile(data, function(fullPath) {
                    if (selectedFileName) {

                        var fullJobClassPath = inputFile.parents("li").find("input[name='Job Classpath']");
                        fullJobClassPath.val(fullPath);

                        var fileName = fullPath.replace(/^.*[\\\/]/, '')
                        var shortJobClassPath = inputFile.parents("li").find(".visible-job-classpath input");
                        shortJobClassPath.val(fileName);
                        shortJobClassPath.attr('readonly', true);

                        if (propertiesView.$el.data('form')) {
                            propertiesView.$el.data('form').commit();
                        }
                    }
                }, function() {
                    // TODO hide loading icon
                });
            })
        })

        $(document).on('click', 'input[name="Class"]', function() {
            if (!classes) {
                var classes = StudioClient.getClassesSynchronously();
                $(this).autocomplete({
                    source: classes,
                    messages: {
                        noResults: '',
                        results: function() {}
                    }
                });
            }
        })

        $(document).ready(function()
        {
            var ctrlDown = false;
            var ctrlKey = 17, vKey = 86, cKey = 67;
            var copied = false;

            $(document).keydown(function(e) {
                if (e.keyCode == ctrlKey) ctrlDown = true;
            }).keyup(function(e) {
                if (e.keyCode == ctrlKey) ctrlDown = false;
            });

            $(document).keydown(function(e) {
                if (ctrlDown && e.keyCode == cKey) {
                    console.log("copy");
                    copied = true;
                };
                if (ctrlDown && e.keyCode == vKey) {
                    if (copied) {
                        console.log("paste");
                        copied = false;
                        workflowView.copyPasteSelected();
                    }
                };
            });
        });
    })();

    // saving job xml every min to local store
    setInterval(save_workflow_to_storage, 10000);
    // validating job periodically
    setInterval(validate_job, 30000);

})(jQuery)
