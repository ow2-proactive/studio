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
                var script = new Script();
                script.set("Script", "print(java.lang.System.getProperty('pas.task.name'))");
                script.set("Language", "javascript");
                this.model.get("Execute").set("Script", script);
            }
            
            
            this.modelType = this.model.get("Type");
            var iconPath = this.icons[this.modelType];
            try{
	            iconPath = this.iconsPerLanguage[this.model.get("Execute").get("Script").get("Language")];
            }catch(err){
            	 try{
     	            iconPath = this.iconsPerLanguage[this.model.get("Execute").Script.Language];
                 }catch(err){}
            }
            this.model.on("change:Execute", this.updateIcon, this);
            this.model.on("change:Task Name", this.updateTaskName, this);
            this.model.on("change:Type", this.changeTaskType, this);
            this.model.on("change:Control Flow", this.controlFlowChanged, this);
            this.model.on("change:Block", this.showBlockInTask, this);
            // Register a handler, listening for changes on Fork Execution Environment,
            // sadly it gets executed at different change events as well.
            this.model.on("change:Fork Execution Environment", this.updateForkEnvironment, this);

            this.model.on("invalid", this.setInvalid, this);
            
            var base_studio_url = window.location.origin + "/studio" ;

                   	            
            this.element = $('<div class="task"><a class="task-name"><img src="'
            	+ base_studio_url+ "/" + iconPath + '" width="20px">&nbsp;<span class="name">'
                + this.model.get("Task Name") + '</span></a></div>');

            this.showBlockInTask();
        },

        updateTaskName: function () {
            var newTaskName = this.model.get("Task Name");
            var existingTasks = $('.task-name .name');

            var duplicated = false;
            var taskNameInputField = $("input[id='" + this.model.cid + "_Task Name']");

            PNotify.removeAll();
            taskNameInputField.css({ "border": "" });

            // if there is another task with same name as the current one
            // there will be at least two tasks detected with same name
            // since variable existingTasks contains all tasks, including
            // the one for which duplicated names are checked
            existingTasks.each(function (index) {
                if ($(this).text() == newTaskName) {
                    if (duplicated) {
                        PNotify.removeAll();

                        new PNotify({
                            title: "Duplicated task name detected",
                            text: "Task name must be unique per workflow.\nPlease fix the issue before submitting.",
                            type: "error",
                            text_escape: false,
                            buttons: {
                                closer: true,
                                sticker: false
                            },
                            opacity: .8,
                            width: '20%'
                        });

                        // TODO: improve by retrieving input text using Backbonejs methods
                        // and style using existing Bootstrap styles
                        // http://getbootstrap.com/css/?#forms-control-validation
                        taskNameInputField.css({ "border": "1px solid #D2322D"});

                        return false;
                    } else {
                        duplicated = true;
                    }
                }
            });

            this.element.find(".name").text(newTaskName);
            $("#breadcrumb-task-name").text(newTaskName);
        },

        /**
         * This function is invoked when changes occur in the fork environment section.
         * @param changed
         */
        updateForkEnvironment: function (changed) {
            // Query changed for Fork Execution Environment. If it contains Fork Execution Environment,
            // then it was altered. If it was not altered, then changed will not contain
            // Fork Execution Environment, then jump out of this function.
            // Otherwise the script will be overwritten that means that the user's input will be overwritten.
            var forkExecutionEnvironmentSelector = changed.changed['Fork Execution Environment'];
            if (typeof forkExecutionEnvironmentSelector == 'undefined') {
                // Fork Execution Environment was not altered -> don't change (overwrite)
                // anything in this case.
                return;
            }
            // So the Fork Execution Environment was changed. Check if it was changed for Docker
            if (this.model.get('Fork Execution Environment') == "Docker") {
                // Docker was selected on the dropdown, insert a template script in the language python
                var javaHome = '/usr';
                var prefixCommandLanguage = 'python';
                var prefixDockerCommandString = "#Be aware, that the prefix command is internally split by spaces. So paths with spaces won't work.\n# Prepare Docker parameters \ncontainerName = 'java' \ndockerRunCommand =  'docker run ' \ndockerParameters = '--rm ' \n# Prepare ProActive home volume \npaHomeHost = variables.get(\"PA_SCHEDULER_HOME\") \npaHomeContainer = variables.get(\"PA_SCHEDULER_HOME\") \nproActiveHomeVolume = '-v '+paHomeHost +':'+paHomeContainer+' ' \n# Prepare working directory (For Dataspaces and serialized task file) \nworkspaceHost = localspace \nworkspaceContainer = localspace \nworkspaceVolume = '-v '+localspace +':'+localspace+' ' \n# Prepare container working directory \ncontainerWorkingDirectory = '-w '+workspaceContainer+' ' \n# Save pre execution command into magic variable 'preJavaHomeCmd', which is picked up by the node \npreJavaHomeCmd = dockerRunCommand + dockerParameters + proActiveHomeVolume + workspaceVolume + containerWorkingDirectory + containerName";
                // Set the script and language inside the Browser, this will render it immediately.
                // We did not find a way to render the model, so the last possibility was to
                // just set it in the DOM.
                $('[id*="_Fork Environment_Java Home"]').val(javaHome);
                $('[id*="_Fork Environment_Environment Script_Language"]').val(prefixCommandLanguage);
                $('[id*="_Fork Environment_Environment Script_Script"]').val( prefixDockerCommandString);
                // Set the script and language in the model. This persists the changes but does not render
                // them immediately.
                this.model.get('Fork Environment')['Java Home'] = javaHome;
                var replacedScript = new Script();
                replacedScript.set({Script :prefixDockerCommandString, Language : prefixCommandLanguage });
                this.model.get('Fork Environment')['Environment Script'] = replacedScript;
            }
            // Function is done. If the Fork Execution Environment was set to something not handled above,
            // then the previous inputs will just be kept.
        },
        
        updateIcon: function (changed) {
            var executableTypeStr = this.model.get("Type");
            var iconPath = this.icons[executableTypeStr];
            if (executableTypeStr == "ScriptExecutable") {
                var language = this.model.get("Execute").Script.Language;
                iconPath = this.iconsPerLanguage[language];
            }

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
                    executable["Script"] = {"Language": "bash"};
                }
                this.$el.find("img").attr('src', this.icons[executableTypeStr]);
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
