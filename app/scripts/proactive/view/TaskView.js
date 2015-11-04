define(
    [
        'jquery',
        'backbone',
        'proactive/model/Task',
        'proactive/model/Script',
        'proactive/view/ViewWithProperties',
        'proactive/model/NativeExecutable',
        'proactive/model/JavaExecutable',
        'proactive/model/ScriptExecutable'
    ],

    function ($, Backbone, Task, Script, ViewWithProperties, NativeExecutable, JavaExecutable, ScriptExecutable) {

    "use strict";

    return ViewWithProperties.extend({

        icons: {"JavaExecutable": "images/Java.png", "NativeExecutable": "images/command.png", "ScriptExecutable": "images/script.png"},
        iconsPerLanguage: {"java": "images/Java.png", "groovy": "images/Groovy.png", "docker-compose": "images/Docker.png",
        	"bash": "images/LinuxBash.png", "javascript": "images/Javascript.png", "cmd": "images/WindowsCmd.png", "ruby": "images/Ruby.png", 
        	"Language R": "images/LanguageR.png", "python": "images/Python.png" },
        controlFlows: {"dependency": true, "if": false, "replicate": false, "loop": false},

        initialize: function () {
            if (!this.model) {
                // creating a default task model
                this.model = new Task();
                var script = new Script()
                script.set("Script", "print(java.lang.System.getProperty('pas.task.name'))");
                script.set("Language", "javascript");
                this.model.get("Execute").set("Script", script)
            }
            
            
            this.modelType = this.model.get("Type");
            var iconPath = this.icons[this.modelType];
            if(this.model.get("Execute") && this.model.get("Execute").get("Script") && this.model.get("Execute").get("Script").get("Language")){
	            iconPath = this.iconsPerLanguage[this.model.get("Execute").get("Script").get("Language")];
	            this.model.on("change:Execute", this.updateIcon, this);
            }
            this.model.on("change:Task Name", this.updateTaskName, this);
            this.model.on("change:Type", this.changeTaskType, this);
            this.model.on("change:Control Flow", this.controlFlowChanged, this);
            this.model.on("change:Block", this.showBlockInTask, this);

            this.model.on("invalid", this.setInvalid, this);
                   	            
            this.element = $('<div class="task"><a class="task-name"><img src="'
                + iconPath + '" width="20px">&nbsp;<span class="name">'
                + this.model.get("Task Name") + '</span></a></div>');

            this.showBlockInTask();
        },

        updateTaskName: function () {
            this.element.find(".name").text(this.model.get("Task Name"))
            $("#breadcrumb-task-name").text(this.model.get("Task Name"))
        },
        
        updateIcon: function (changed) {
        	
           var changedLanguage = changed.attributes.Execute.Script.Language;
 	       var iconPath = this.iconsPerLanguage[changedLanguage]; 
 	       this.$el.find("img").attr('src', iconPath)
	 	        
        	
        },

        setInvalid: function () {
            this.$el.addClass("invalid-task")
        },
        
        

        changeTaskType: function () {
            var executableTypeStr = this.model.get("Type");
            
            if (this.modelType && this.modelType != executableTypeStr) {
                var executableType = require('proactive/model/'+executableTypeStr);
                var executable = new executableType();

                this.model.schema = $.extend(true, {}, this.model.schema);
                // TODO beautify
                if (executableTypeStr == "JavaExecutable") {
                    this.model.schema['Execute'] = {type: 'NestedModel', model: JavaExecutable};
                } else if (executableTypeStr == "NativeExecutable") {
                    this.model.schema['Execute'] = {type: 'NestedModel', model: NativeExecutable};
                } else {
                    this.model.schema['Execute'] = {type: 'NestedModel', model: ScriptExecutable};
                }
                this.$el.find("img").attr('src', this.icons[executableTypeStr])
                this.model.set({"Execute": executable});
                this.$el.click();
            }
            this.modelType = executableTypeStr;
        },
        controlFlowChanged: function (model, valu, handler) {
            var fromFormChange = handler.error; // its defined when form was
												// changed
            var control = this.model.get("Control Flow");
            if (fromFormChange && control && control != 'none') {

                this.model.controlFlow = {};
                $.each(jsPlumb.getEndpoints(this.$el), function (i, endPoint) {
                    if (endPoint.scope != 'dependency') {
                        var connectionDetached = false;
                        if (endPoint.connections) {
                            $.each(endPoint.connections, function(j, connection) {
                                jsPlumb.detach(connection);
                                connectionDetached = true;
                            })
                        }
                        if (!connectionDetached) {
                            // if an endpoint had a connection it will be
							// already removed at this point
                            jsPlumb.deleteEndpoint(endPoint)
                        }
                    }
                })

                this.addSourceEndPoint(control)
                jsPlumb.repaintEverything();
            }
        },
        showBlockInTask: function () {
            var block = this.model.get("Block");
            if (block && block != 'none') {
                if (block == 'start') this.element.removeClass('block-end').addClass('block-start');
                else this.element.removeClass('block-start').addClass('block-end');
            } else {
                this.element.removeClass('block-end').removeClass('block-start');
            }
        },
        overlays: function () {
            var arrowCommon = { foldback: 0.7, fillStyle: "gray", width: 14 };
            return [
                [ "Arrow", { location: 0.7 }, { foldback: 0.7, fillStyle: "gray", width: 14 } ]
            ];
        },
        showControlFlowScript: function (label, evn) {

            if (!evn.stopBubble) {
                evn.stopBubble = true;
                evn.isPropagationStopped = function() {return true;}
            } else {
                return;
            }

            var labelElem = $(label.canvas);
            var modelType = labelElem.text();
            var model = this.model.controlFlow[modelType];

            if (!model) return;

            var modelView = new ViewWithProperties({el: labelElem, model: model.model})
            modelView.render();
            modelView.$el.click();
        },
        endpointsParams: function (type) {
            var that = this;
            if (type == 'if') {
                var params = {
                    color: '#00f', anchorSource: 'BottomLeft', anchorTarget: 'TopLeft', scope: "if",
                    overlays: [
                        [ "Arrow", { location: 0.7 }, { foldback: 0.7, fillStyle: "gray", width: 14 } ],
                        [ "Label", {
                            label: function () {
                                var ifModel = that.model.controlFlow['if'];
                                if (!ifModel || ifModel && !ifModel.model) return 'if'
                                else if (!ifModel['else']) return 'else'
                                else if (!ifModel['continuation']) return 'continuation'
                                else return "";
                            },
                            cssClass: "l1 component label",
                            events: {'click': function (label, evn) {
                                that.showControlFlowScript(label, evn)
                            }}
                        }]
                    ]
                }
                return params;
            } else {
                var endpointTypes = {
                    'dependency': {
                        color: '#666', anchorSource: 'BottomCenter', anchorTarget: 'TopCenter', scope: "dependency",
                        overlays: [
                            [ "Arrow", { location: 0.7 }, { foldback: 0.7, fillStyle: "gray", width: 14 } ]
                        ]
                    },
                    'loop': {
                        color: '#316b31', anchorSource: 'TopRight', anchorTarget: 'BottomRight', scope: "loop",
                        overlays: [
                            [ "Arrow", { location: 0.7 }, { foldback: 0.7, fillStyle: "gray", width: 14 } ],
                            [ "Label", {
                                label: 'loop',
                                cssClass: "l1 component label",
                                events: {'click': function (label, evn) {
                                    that.showControlFlowScript(label, evn)
                                }}
                            }]
                        ]
                    },
                    'replicate': {
                        color: 'rgba(229,219,61,0.5)', anchorSource: [0.8, 1, 0, 1], anchorTarget: [0.8, 0], scope: "replicate",
                        overlays: [
                            [ "Arrow", { location: 0.7 }, { foldback: 0.7, fillStyle: "gray", width: 14 } ],
                            [ "Label", {
                                label: 'replicate',
                                cssClass: "l1 component label",
                                events: {'click': function (label, evn) {
                                    that.showControlFlowScript(label, evn)
                                }}
                            }]
                        ]
                    }

                }
                return endpointTypes[type];
            }
        },
        addSourceEndPoint: function (type) {
            var that = this;
            var params = this.endpointsParams(type);

            var sourceEndpoint = {
                paintStyle: { width: 15, height: 15, fillStyle: params.color },
                connectorStyle: { strokeStyle: params.color },
                connectorOverlays: params.overlays,
                cssClass: "source-endpoint " + params.scope + "-source-endpoint " + (params.scope == "dependency" ? "connected" : ""),
                scope: params.scope,
                isSource: true,
                maxConnections: type == 'if' ? 3 : type == 'loop' || type == 'replicate' ? 1 : -1
            };

            return jsPlumb.addEndpoint(that.$el, sourceEndpoint, { 'anchor': params.anchorSource });
        },
        addTargetEndPoint: function (type) {
            var that = this;
            var params = this.endpointsParams(type);

            function alreadyHasSuchEndpoint() {
                return _.some(jsPlumb.getEndpoints(that.$el), function (point) {
                    return point.isTarget && point.scope == params.scope;
                })
            }

            if (alreadyHasSuchEndpoint()) {
                return;
            }

            var targetEndpoint = {
                paintStyle: { width: 15, height: 15, fillStyle: params.color },
                connectorStyle: { strokeStyle: params.color },
                scope: params.scope,
                cssClass: "target-endpoint " + params.scope + "-target-endpoint",
                dropOptions: { hoverClass: "hover", activeClass: "active" },
                isTarget: true,
                maxConnections: (type == 'dependency' ? -1 : 1)
            };
            return jsPlumb.addEndpoint(that.$el, targetEndpoint, { 'anchor': params.anchorTarget });
        },
        getSourceEndPoint: function (type) {
            var endpoints = jsPlumb.getEndpoints(this.$el);

            for (var i in endpoints) {
                var ep = endpoints[i];
                if (ep.scope == type && ep.isSource) {
                    return ep;
                }
            }
        },
        getTargetEndPoint: function (type) {
            var endpoints = jsPlumb.getEndpoints(this.$el);

            for (var i in endpoints) {
                var ep = endpoints[i];
                if (ep.scope == type && ep.isTarget) {
                    return ep;
                }
            }
        },
        addDependency: function (dependencyView) {
            var sourceEndPoint = this.getSourceEndPoint("dependency")
            if (!sourceEndPoint) {
                sourceEndPoint = this.addSourceEndPoint("dependency")
            }
            var targetEndPoint = dependencyView.getTargetEndPoint("dependency")
            if (!targetEndPoint) {
                targetEndPoint = dependencyView.addTargetEndPoint("dependency")
            }

            jsPlumb.connect({source: sourceEndPoint, target: targetEndPoint, overlays: this.overlays()});
        },
        addIf: function (ifFlow, views) {
            var endpointIf = this.addSourceEndPoint('if')

            if (ifFlow.task) {
                var taskTarget = views[ifFlow.task.get('Task Name')];
                if (taskTarget) {
                    var endpointTarget = taskTarget.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'if';
                    jsPlumb.connect({source: endpointIf, target: endpointTarget, overlays: this.overlays()});
                    endpointIf.connectorOverlays[1][1].label = 'else';
                }
            }
            if (ifFlow.else && ifFlow.else.task) {
                var taskElse = views[ifFlow.else.task.get('Task Name')];
                if (taskElse) {
                    var endpointElse = taskElse.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'else';
                    jsPlumb.connect({source: endpointIf, target: endpointElse, overlays: this.overlays()});
                    endpointIf.connectorOverlays[1][1].label = 'continuation';
                }
            }
            if (ifFlow.continuation && ifFlow.continuation.task) {
                var taskContinuation = views[ifFlow.continuation.task.get('Task Name')];
                if (taskContinuation) {
                    var endpointContinuation = taskContinuation.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'continuation';
                    jsPlumb.connect({source: endpointIf, target: endpointContinuation, overlays: this.overlays()});
                    endpointIf.connectorOverlays[1][1].label = '';
                }
            }
        },
        addReplicate: function (view) {
            if (!view) return;
            var endpointSource = this.addSourceEndPoint('replicate')
            var endpointTarget = view.addTargetEndPoint('replicate')
            jsPlumb.connect({source: endpointSource, target: endpointTarget, overlays: this.overlays()});
        },
        addLoop: function (view) {
            if (!view) return;
            var endpointSource = this.addSourceEndPoint('loop')
            var endpointTarget = view.addTargetEndPoint('loop')
            jsPlumb.connect({source: endpointSource, target: endpointTarget, overlays: this.overlays()});
        },
        render: function () {
            var that = this;
            ViewWithProperties.prototype.render.call(this);
            this.$el.mousedown(function (e) {
                if (!e.ctrlKey && !that.$el.hasClass("selected-task")) {
                    $(".selected-task").removeClass("selected-task");
                }

                if (e.ctrlKey && that.$el.hasClass("selected-task")) {
                    // unselecting the current task
                    that.$el.removeClass("selected-task");
                } else {
                    // selecting the current task
                    that.$el.addClass("selected-task");
                }

                $(".active-task").removeClass("active-task");
                that.$el.addClass("active-task");

                e.stopPropagation();

            })
            return this;
        }

    })

})
