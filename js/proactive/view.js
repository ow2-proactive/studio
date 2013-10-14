(function($){

	Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;

    var ENABLE_WORKFLOWS = true;

	PaletteView = Backbone.View.extend({
		initialize: function() {
            this.render();
        },
        render: function() {
        	var taskWidget = $(
        			'<span class="label draggable ui-draggable job-element" title="Computational task">'+
        			'<img src="img/gears.png" width="40px">Task</span>');

            if (ENABLE_WORKFLOWS) {
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
            } else {
                this.$el.append(taskWidget);
            }

        	$(".draggable").draggable({helper: "clone"});
	    }	
	});
	
	PropertiesView = Backbone.View.extend({
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

        		var form = new Backbone.Form({
        		    'model': that.model
        		}).render();

        		var breadcrumb = $('<ul id="breadcrumb" class="breadcrumb"></ul>');
        		breadcrumb.append('<li class="active"><span id="breadcrumb-project-name">'+jobModel.get("Project Name")+'</span> <span class="divider">/</span></li>')        			
        		breadcrumb.append('<li class="active"><span id="breadcrumb-job-name">'+jobModel.get("Job Name")+'</span> <span class="divider">/</span></li>')
        		if (that.model.get("Task Name")) {
            		breadcrumb.append('<li class="active"><span id="breadcrumb-task-name">'+that.model.get("Task Name")+'</span></li>')
        		}

        		that.form = form;
        		form.on('change', function(f, changed) {
        			form.commit();
        		})

        		var tabs = form.$el.find("[data-tab]");
        		if (tabs.length > 0) {
            		var accordion = $('<div class="accordion" id="accordion-properties">');
            		var currentAccordionGroup = undefined;
            		var curLabel = "";
            		
            		$.each(form.$el.children().children(), function(i, elem) {
            			var el = $(elem);
            			if (el.attr("data-tab")) {
            				var accId = "acc-"+i;
            				var accordionGroup = $('<div class="accordion-group"><div class="accordion-heading"><a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion-properties" href="#'+accId+'">'+el.attr("data-tab")+'</a></div></div>');
            				currentAccordionGroup = $('<div id="'+accId+'" class="accordion-body collapse '+(i==0?"in":"")+'"></div>');
            				accordionGroup.append(currentAccordionGroup);
            				accordion.append(accordionGroup);
            				curLabel = el.attr("data-tab").replace(/ /g, '');
            			}
        				
            			// remove duplicate labels that comes from nested types
        				el.find("label").each(function(i, label) {
            				var labelName = $(label).text().replace(/ /g, '');
            				if (labelName && labelName==curLabel) {
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

            			currentAccordionGroup.append($('<div class="form-wrap"></div>').append(el));
            		})
            		
            		propertiesView.$el.html(breadcrumb);
            		propertiesView.$el.append(accordion);
        		} else {
                    propertiesView.$el.html(breadcrumb);
                    propertiesView.$el.append(form.$el);
        		}
        		
        		if (that.model.get("Task Name")) {
        			var removeButton = $('<button type="button" class="btn btn-danger remove-button">Remove Task</button>');
        			removeButton.click(function() {
                        workflowView.removeView(that)
        			})
        			propertiesView.$el.append(removeButton);
        		}
        		
        	});

            return this;
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

            this.initJsPlumb();
            this.$el.html(this.zoomArea);
            this.model.on("change:Project Name", this.updateProjectName, this);
        },
        initJsPlumb: function() {
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
            });


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

            var position = {top: ui.offset.top-offset.top, left: ui.offset.left-offset.left};
            var rendering = this.addView(view, position);

            this.model.addTask(rendering.model);
            this.model.trigger('change');
        },
        createIfWorkflow: function(ui) {
            var offset = this.$el.offset();

            console.log("Initializing If Workflow")
            var taskIf = new TaskView();
            var taskTarget = new TaskView();
            var taskElse = new TaskView();
            var taskContinuation = new TaskView();

            var positionIf = {top: ui.offset.top-offset.top, left: ui.offset.left-offset.left};
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

            var positionDo = {top: ui.offset.top-offset.top, left: ui.offset.left-offset.left};
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

            var positionInit = {top: ui.offset.top-offset.top, left: ui.offset.left-offset.left};
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
	    updateProjectName: function() {
	    	$("#breadcrumb-project-name").text(this.model.get("Project Name"))			
	    	$("#breadcrumb-job-name").text(this.model.get("Job Name"))			
	    },
	    clean: function() {
	    	this.zoomArea.empty();
	    	jsPlumb.reset()
            this.initJsPlumb()
	    },
        addView: function(view, position) {

  			var rendering = view.render();
    		rendering.$el.offset(position);
    		this.zoomArea.append(rendering.$el);

            view.addSourceEndPoint('dependency')
    		jsPlumb.draggable(rendering.$el);
            this.taskViews.push(view);
    		
            rendering.$el.data("view", view);
			return rendering;
        },
        removeView: function(view) {
            jobModel.removeTask(view.model);
            view.$el.remove();
            jsPlumb.remove(view.$el);

            index = this.taskViews.indexOf(view);
            if (index!=-1) {
                this.taskViews.splice(index, 1);
            }

            this.$el.click();
        },
        import: function(json) {
            jobModel = new Job();
            jobModel.populate(json.job)

            var that = this;
            this.clean();
            console.log("Changing job model from", this.model);
            this.model = jobModel;
            xmlView.model = jobModel;
            console.log("To", this.model);

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
                            var dependency = task2View[task.get('Task Name')];
                            jsPlumb.connect({source:taskView.$el, target:dependency.$el, overlays:taskView.overlays()});
                        }
                    })
                }
                if (task.controlFlow) {
                    if (task.controlFlow.if) {
                        var ifFlow = task.controlFlow.if;

                        var taskIf = task2View[task.get('Task Name')];
                        var endpointIf = taskIf.addSourceEndPoint('if')
                        if (ifFlow.task) {
                            var taskTarget = task2View[ifFlow.task.get('Task Name')];
                            var endpointTarget = taskTarget.addTargetEndPoint('if')
                            endpointIf.connectorOverlays[1][1].label = 'if';
                            jsPlumb.connect({source:endpointIf, target:endpointTarget, overlays:taskIf.overlays()});
                        }
                        if (ifFlow.else) {
                            var taskElse = task2View[ifFlow.else.task.get('Task Name')];
                            var endpointElse = taskElse.addTargetEndPoint('if')
                            endpointIf.connectorOverlays[1][1].label = 'else';
                            jsPlumb.connect({source:endpointIf, target:endpointElse, overlays:taskIf.overlays()});
                        }
                        if (ifFlow.continuation) {
                            var taskContinuation = task2View[ifFlow.continuation.task.get('Task Name')];
                            var endpointContinuation = taskContinuation.addTargetEndPoint('if')
                            endpointIf.connectorOverlays[1][1].label = 'continuation';
                            jsPlumb.connect({source:endpointIf, target:endpointContinuation, overlays:taskIf.overlays()});
                        }
                    }
                    if (task.controlFlow.replicate) {
                        var taskReplicateView = task2View[task.get('Task Name')];
                        var taskDepView = task2View[jobModel.getDependantTask(task.get('Task Name'))];
                        var endpointSource = taskReplicateView.addSourceEndPoint('replicate')
                        var endpointTarget = taskDepView.addTargetEndPoint('replicate')
                        jsPlumb.connect({source:endpointSource, target:endpointTarget, overlays:taskReplicateView.overlays()});
                    }
                    if (task.controlFlow.loop) {
                        var loopTarget = task.controlFlow.loop.task;
                        var taskLoopView = task2View[task.get('Task Name')];
                        var targetView = task2View[loopTarget.get('Task Name')];
                        var endpointSource = taskLoopView.addSourceEndPoint('loop')
                        var endpointTarget = targetView.addTargetEndPoint('loop')
                        jsPlumb.connect({source:endpointSource, target:endpointTarget, overlays:taskLoopView.overlays()});
                    }
                }
            })

            jobModel.trigger('change');
            this.autoLayout();
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
            this.model.on("change:Control Flow", this.changeControlFlow, this);
            this.model.on("change:Block", this.showBlockInTask, this);

			this.element = $('<div class="task"><a href="#" class="task-name"><img src="'
                +this.icons[this.modelType]+'" width="20px">&nbsp;<span class="name">'
                +this.model.get("Task Name")+'</span></a></div>');

            this.showBlockInTask();
        },

        updateTaskName: function() {
        	this.element.find(".name").text(this.model.get("Task Name"))
	    	$("#breadcrumb-task-name").text(this.model.get("Task Name"))
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
        changeControlFlow: function() {
            var control = this.model.get("Control Flow");
            if (control && control != 'none') {
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
	    validateForm: function() {
			var executable = this.model.get("Parameters");
			if (executable) {
				var forkEnvTitle = "Fork Environment";
				var forkEnvDiv = propertiesView.$el.find('[placeholder="forkEnvironment"]')
				if (!executable[forkEnvTitle]==undefined) { return; }
	
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
	    render: function() {
	    	var that = this;
	    	ViewWithProperties.prototype.render.call(this);
	    	this.$el.click(function() {
	    		that.form.on('Parameters:change', function(f, task) {
	    			that.form.commit();
	    			that.validateForm();
	    		})
	    		that.validateForm();
	    	})
	    	return this;
	    }
	});

	JobXmlView = Backbone.View.extend({
		initialize: function() {
			var that = this;
			$('#workflow-xml-tab').on('shown', function (e) {
				that.render();
			})
        },
        generateXml: function() {
            var that = this;
            var job = this.model.toJSON();

            var tasks = [];
            if (this.model.tasks) {
                $.each(this.model.tasks, function(i, task) {
                    var view = new TaskXmlView({model:task, jobView:that}).render();
                    tasks.push(view.$el.text());
                });
            }
            console.log("Generating job xml", job);
            console.log("Job model", this.model);

            var jobRendering = _.template($("#job-template").html(), {'job': job, 'tasks':tasks});

            // beautifying the job xml - removing multiple spaces
            jobRendering = jobRendering.replace(/ {2,}/g, ' ');
            // removing multiple \n before closing xml element tag
            jobRendering = jobRendering.replace(/\n+\s+>/g, '>\n');
            // indenting using vkbeautify
            return vkbeautify.xml(jobRendering.trim());
        },
        render: function() {
        	// indenting using vkbeautify
        	this.$el.empty()
        	var pre = $('<pre class="brush:xml;toolbar:false;" id="workflow-xml"></pre>');
        	pre.text(vkbeautify.xml(this.generateXml()))
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
        	var script = undefined;
        	if (this.model["Environment Script"]) {
        		script = new TemplateView({model:this.model["Environment Script"], template:"#script-template"}).render().$el.text();
        		script = script.trim();
        	}
        	var template = _.template($("#java-executable-template").html(), {model: this.model.toJSON(), 'script': script});
        	this.$el.text(template);
        	return this;
        }
	});

	NativeExecutableXmlView = Backbone.View.extend({
        render: function() {
        	var script = undefined;
        	if (this.model["Or Dynamic Command"]) {
        		script = new TemplateView({model:this.model["Or Dynamic Command"], template:"#script-template"}).render().$el.text();
        		script = script.trim();
        	}
        	var template = _.template($("#native-executable-template").html(), {model: this.model, 'script': script});
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
            	var template = _.template($(this.options.template).html(), {'model': this.model});
            	this.$el.text(template);
        	}
        	return this;
        }
	});

	var jobModel = new Job();

	var palleteView = new PaletteView({el: $("#palette-container")});
	var workflowView = new WorkflowView({el: $("#workflow-designer"), model: jobModel});
	var propertiesView = new PropertiesView({el: $("#properties-container")});
	var xmlView = new JobXmlView({el: $("#workflow-xml-container"), model: jobModel});

    jsPlumb.bind("ready", function() {
        if (supports_html5_storage() && typeof localStorage["job-model"] === 'string') {
//            console.log("Restoring model from the local storage", localStorage["job-model"])
            var json = xmlToJson(parseXml(localStorage["job-model"]))
            workflowView.import(json);
        }
        workflowView.$el.click();
    })

	workflowView.$el.click();
	
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
                    workflowView.import(json);
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
		xmlView.render();

		var button = $(this);
		var xml = "";
		$('#workflow-xml .container').find('.line').each(function(i,line) { xml += $(line).text().trim()+"\n"; })

		$('#scheduler-connect-modal').modal();
		$('#submit-button-dialog').unbind('click');
		$('#submit-button-dialog').click(function() {
			creds = {};
			$.each($("#scheduler-connect-modal").find("input"), function(i, input) {
				creds[$(input).attr("data-name")] = $(input).val()
			})
			SchedulerClient.submit(creds, xml)
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


    function save_workflow_to_storage() {
        if (supports_html5_storage() && xmlView) {
            localStorage["job-model"] = xmlView.generateXml()
            console.log("Saving job model into the local storage");
            //console.log(localStorage["job-model"]);
        }
    }

    function supports_html5_storage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }

    // saving job xml every min to local store
    setInterval(save_workflow_to_storage, 5000);
})(jQuery)