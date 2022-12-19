define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'pnotify',
        'proactive/rest/studio-client',
        'proactive/model/Task',
        'proactive/model/script/Script',
        'proactive/model/script/ScriptCode',
        'proactive/model/script/ScriptFile',
        'proactive/view/ViewWithProperties',
        'proactive/model/NativeExecutable',
        'proactive/model/JavaExecutable',
        'proactive/model/ScriptExecutable',
        'proactive/view/utils/undo'
    ],

    function ($, Backbone, config, PNotify, StudioClient, Task, Script, ScriptCode, ScriptFile, ViewWithProperties, NativeExecutable, JavaExecutable, ScriptExecutable, undoManager) {

    "use strict";

    return ViewWithProperties.extend({

        icons: {"JavaExecutable": "images/Java.png", "NativeExecutable": "images/command.png", "ScriptExecutable": "images/script.png", "ScriptCode": "images/script.png", "ScriptFile": "images/url.png"},
        iconsPerLanguage: {"java": "images/Java.png", "groovy": "images/Groovy.png", "docker-compose": "images/Docker.png", "dockerfile": "images/Docker.png", "kubernetes": "images/Kubernetes.png",
            "bash": "images/LinuxBash.png", "shell": "images/Shell.png", "scalaw": "images/Scalaw.png", "javascript": "images/Javascript.png", "PHP" : "images/PHP.png", "cmd": "images/WindowsCmd.png", "ruby": "images/Ruby.png",
                   "R": "images/R.png", "python": "images/Jython.png", "cpython": "images/Python.png", "perl": "images/Perl.png",
                   "powershell": "images/PowerShell.png", "vbscript": "images/VBScript.png", "php" : "images/PHP.png"},
        controlFlows: {"dependency": true, "if": false, "replicate": false, "loop": false},

        initialize: function () {
            if (!this.model) {
                // creating a default task model
                this.model = new Task();
                this.model.set("Type", "ScriptExecutable");
                this.model.set("ScriptExecutable", { "ScriptType": "ScriptCode", "ScriptCode": {"Code" : "println variables.get(\"PA_TASK_NAME\")", "Language" : "groovy" }});
                // remove copyright on parent job
                var StudioApp = require('StudioApp');
                if (StudioApp.models.jobModel) {
                    StudioApp.models.jobModel.set({
                        "Copyright": null
                    });
                }
            }

            var base_studio_url = "/studio" ;
            this.modelType = this.model.get("Type");
            var iconPath = base_studio_url+ "/" +this.icons[this.modelType];
            var hasGenericInfoIcon = false;
            
            var genericInformation = this.model.get("Generic Info");
            if (genericInformation){
                for (var i in genericInformation) {
                    if (genericInformation[i]["Property Name"].toLowerCase() === 'task.icon'){
                        hasGenericInfoIcon = true;
                        iconPath = genericInformation[i]["Property Value"];
                    }
                }
            }

            if (!hasGenericInfoIcon){
                if(this.model.get("Type") === "ScriptExecutable") {
                    var language;
                    if (this.model.get("ScriptExecutable").hasOwnProperty("ScriptType")) {
                        if (this.model.get("ScriptExecutable").ScriptType === "ScriptCode" && this.model.get("ScriptExecutable").ScriptCode) {
                            language = this.model.get("ScriptExecutable").ScriptCode.Language;
                        } else if (this.model.get("ScriptExecutable").ScriptFile) {
                            language = this.model.get("ScriptExecutable").ScriptFile.Language;
                        }
                    } else {
                        if (this.model.get("ScriptExecutable").get("ScriptType") === "ScriptCode" && this.model.get("ScriptExecutable").get("ScriptCode")) {
                            language = this.model.get("ScriptExecutable").get("ScriptCode").get("Language");
                        } else if (this.model.get("ScriptExecutable").get("ScriptFile")) {
                            language = this.model.get("ScriptExecutable").get("ScriptFile").get("Language");
                        }
                    }
                    if (language && language.length > 0) {
                        iconPath =  base_studio_url+ "/" + this.iconsPerLanguage[language];
                    }
                }
            }
            
            this.model.on("change:ScriptExecutable", this.updateIcon, this);
            this.model.on("change:Task Name", this.updateTaskName, this);
            this.model.on("change:Description", this.updateTaskDescription, this);
            this.model.on("change:Type", this.updateIcon, this);
            this.model.on("change:Control Flow", this.controlFlowChanged, this);
            this.model.on("change:Block", this.showBlockInTask, this);
            this.model.on("change:Fork", this.updateFork, this);
            // Register a handler, listening for changes on Fork Execution Environment,
            // sadly it gets executed at different change events as well.
            this.model.on("change:Fork Execution Environment", this.updateForkEnvironment, this);
            
            this.model.on("change:Generic Information", this.updateIcon, this);
            this.model.on("change:Variables", this.updateButtonRightIcon, this);

            this.model.on("invalid", this.setInvalid, this);
            var description = this.model.get("Description") ? this.model.get("Description") : "This task has no description";
            this.element = $('<div class="task"><a class="task-name" data-toggle="tooltip" data-placement="right" title="' +
                description.replace(/"/g, '&quot;') + '"><img src="' + iconPath + '" width="20px">&nbsp;<span class="name">' +
                this.model.get("Task Name") + '</span></a>&nbsp;&nbsp;<a id="called-icon-a" href="javascript:void(0)" class="pointer" style=" position: inherit; top: 17px; right: 3px;"><i id="called-icon"></i></a></div>');

            //we add an arrow Icon to special tasks that contain at least one PA:CATALOG_OBJECT variable
            updateIconsOnTasksCallingObjects(this.element);
            this.showBlockInTask();

            // convert model fork value from String to boolean
            this.model.set("Fork", JSON.parse(this.model.get('Fork')));

            //Show the task description on a modal.
            $(".task-descritption").click(function (event) {
                $('#task-description-modal').modal();
                $("#task-description-container").html($(".selected-task").find(".task-name").attr('title')
                                                .replace(/</g, "&lt;")
                                                .replace(/\n/g, "<br/>"));/*Keep line breaks*/
            })
        },

        updateTaskName: function () {
            // To avoid executing HTML code, we replace < and > by empty string
            if(undoManager.isHTML(this.model.get("Task Name"))){
              this.model.set("Task Name", this.model.get("Task Name").replace(/<|>/g, ""));
            }
            var newTaskName = this.model.get("Task Name");
            var existingTasks = $('.task-name .name');
            var that = this;

            var duplicated = false;
            var taskNameInputField = $("input[id='" + this.model.cid + "_Task Name']");

            PNotify.removeAll();
            taskNameInputField.css({ "border": "" });

            // Prevent having empty task names. Nameless tasks do not affect the scheduler but cannot be removed from studio unless they get a name.
            if (!newTaskName) {
                StudioClient.alert('Task name is empty','Task Name should not be empty','error');
                taskNameInputField.css({ "border": "1px solid #D2322D"});
            }

            // if there is another task with same name as the current one
            // there will be at least two tasks detected with same name
            // since variable existingTasks contains all tasks, including
            // the one for which duplicated names are checked
            existingTasks.each(function (index) {
                if ($(this).text() == newTaskName && $(this).text()) {
                    if (duplicated) {
                        StudioClient.alert('Duplicated task name detected','Task name must be unique per workflow.\nPlease fix the issue before submitting.','error');

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
        /*
            Update the tooltip when the user changes the description.
        */
        updateTaskDescription: function(){
            var newTaskDescription = this.model.get("Description");
            this.element.find(".task-name").attr('title', newTaskDescription);
        },
        /**
         * This function is invoked when the task fork mode is changed,
         * The fork environment elements status are configured (enabled/disabled) based on whether fork is enabled
         * @param changed
         */
        updateFork: function (changed) {
            var forkChanged = changed.changed['Fork'];
            if (typeof forkChanged == 'undefined') {
                // when fork value is not changed, no need to configure fork environment elements
                return;
            }
            if (this.model.get('Fork')) {
                console.debug("fork enabled");
                this.updateForkEnvironmentDisableStatus(false);
            } else {
                console.debug("fork disabled");
                // when the task is non-forked, it can't be in runAsMe mode
                this.model.set("Run as me", false);
                $("[id='" + this.model.cid + "_Run as me']").prop('checked', false);
                this.updateForkEnvironmentDisableStatus(true);
            }
        },

        //we update the task icons when we add/remove a PA:CATALOG_OBJECT variable
        updateButtonRightIcon: function(changed) {
            updateIconsOnTasksCallingObjects(this.element);
        },

        /**
        * enable or disable editing of all the related fork environment elements
        * @param disabled whether the fork environment elements should be disabled
        */
        updateForkEnvironmentDisableStatus: function (disabled) {
          $("[id='" + this.model.cid + "_Run as me']").prop('disabled', disabled);
          $("[id='" + this.model.cid + "_Fork Execution Environment']").prop('disabled', disabled);
          $("[id='" + this.model.cid + "_Fork Environment']").prop('disabled', disabled);
          // List elements cannot be directly enabled/disabled, need to search all the input and button elements to enable or disable them
          $("[id='" + this.model.cid + "_Fork Environment'] :input").prop('disabled', disabled);
          $("[id='" + this.model.cid + "_Fork Environment'] :button").prop('disabled', disabled);
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
            var javaHome = '/usr';
            var prefixCommandLanguage = 'groovy';
            var prefixContainerCommandString;
            // So the Fork Execution Environment was changed. Check if it was changed for Docker
            switch (this.model.get('Fork Execution Environment')) {
                case "Docker":
                    prefixContainerCommandString = config.docker_env_script;
                    break;
                case "Singularity":
                    prefixContainerCommandString = config.singularity_env_script;
                    break;
                case "Podman":
                    prefixContainerCommandString = config.podman_env_script;
                    break;
            }
            switch (this.model.get('Fork Execution Environment')) {
                case "Docker":
                case "Singularity":
                case "Podman":
                    // A container was selected on the dropdown list, insert a template script in the language groovy
                    // Set the script and language inside the Browser, this will render it immediately.
                    // We did not find a way to render the model, so the last possibility was to
                    // just set it in the DOM.
                    $('[id*="_Fork Environment_Java Home"]').val(javaHome);
                    $('[id*="_Fork Environment_Environment Script_ScriptCode_Language"]').val(prefixCommandLanguage);
                    $('[id*="_Fork Environment_Environment Script_ScriptCode_Code"]').val( prefixContainerCommandString);
                    // Set the script and language in the model. This persists the changes but does not render
                    // them immediately.
                    this.model.get('Fork Environment')['Java Home'] = javaHome;
                    this.model.get('Fork Environment')['Environment Script'] = {ScriptType : "ScriptCode", ScriptCode: {Code : prefixContainerCommandString, Language : prefixCommandLanguage}};
                    break;
            }
            // Function is done. If the Fork Execution Environment was set to something not handled above,
            // then the previous inputs will just be kept.
        },

        updateIcon: function (changed) {
            var executableTypeStr = this.model.get("Type");
            var iconPath = this.icons[executableTypeStr];

            var hasAlreadyIconInGenericInfo = false
            if (executableTypeStr == "ScriptExecutable") {
                var language;
                if (this.model.get("ScriptExecutable").ScriptType === "ScriptCode" ) {
                    language = this.model.get("ScriptExecutable").ScriptCode.Language;
                } else if (this.model.get("ScriptExecutable").ScriptFile.Language) {
                    language = this.model.get("ScriptExecutable").ScriptFile.Language;
                }
                if (language && language.length > 0) {
                    iconPath = this.iconsPerLanguage[language];
                }
            }
            var genericInformation = this.model.get("Generic Info");
            if (genericInformation.length){
                for (var i in genericInformation) {
                    if (genericInformation[i]["Property Name"].toLowerCase() === 'task.icon'){
                        iconPath = genericInformation[i]["Property Value"];
                        hasAlreadyIconInGenericInfo = true;
                    }
                }
            }
            // Add "/studio/" only for tasks stored in Studio project : when generic info doesn't include task.icon
            if(!hasAlreadyIconInGenericInfo){
                iconPath = "/studio/" + iconPath;
            }
            this.$el.find("img").attr('src', iconPath);
        },

        setInvalid: function () {
            this.$el.addClass("invalid-task")
        },

        controlFlowChanged: function (changed, valu, handler) {
            var fromFormChange = handler.error; // its defined when form was
                                                // changed
            var control = this.model.get("Control Flow");
            if (fromFormChange && control) {

                var endPoints = jsPlumb.getEndpoints(this.$el);
                if (endPoints) {
                    $.each(endPoints, function (i, endPoint) {
                        if (endPoint.scope != 'dependency') {
                            var connectionDetached = false;
                            if (endPoint.connections) {
                                var initialConnections = endPoint.connections;
                                for (var j = initialConnections.length - 1; j >= 0; j--) {
                                    jsPlumb.detach(initialConnections[j]);
                                    connectionDetached = true;
                                }
                            }
                            if (!connectionDetached) {
                                // if an endpoint had a connection it will be
                                // already removed at this point
                                jsPlumb.deleteEndpoint(endPoint)
                            }
                        }
                    })
                }
                if(control != 'none'){
                   this.addSourceEndPoint(control)
                } else {
                    this.model.controlFlow = {};
                }
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
            var controlFlow = this.model.controlFlow[modelType];

            if (!controlFlow) return;

            // add a reference to the parent task model in the control flow model
            controlFlow.model.parentModel = this.model;

            var modelView = new ViewWithProperties({el: labelElem, model: controlFlow.model})
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
                                if (!ifModel || !ifModel.model || !ifModel.task) return 'if'
                                else if (!ifModel['else']) return 'else'
                                else if (!ifModel['continuation']) return 'continuation'
                                else return "";
                            },
                            id: "ifLabel",
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
                }
            }
            if (ifFlow.else && ifFlow.else.task) {
                var taskElse = views[ifFlow.else.task.get('Task Name')];
                if (taskElse) {
                    var endpointElse = taskElse.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'else';
                    jsPlumb.connect({source: endpointIf, target: endpointElse, overlays: this.overlays()});
                }
            }
            if (ifFlow.continuation && ifFlow.continuation.task) {
                var taskContinuation = views[ifFlow.continuation.task.get('Task Name')];
                if (taskContinuation) {
                    var endpointContinuation = taskContinuation.addTargetEndPoint('if')
                    endpointIf.connectorOverlays[1][1].label = 'continuation';
                    jsPlumb.connect({source: endpointIf, target: endpointContinuation, overlays: this.overlays()});
                }
            }
            // specify the next connection label based on its model
            endpointIf.connectorOverlays[1][1].label = function() {
                if (!ifFlow || !ifFlow.task || !ifFlow.model) return 'if'
                else if (!ifFlow['else']) return 'else'
                else if (!ifFlow['continuation']) return 'continuation'
                else return '';
            };
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
        render: function() {
            var that = this;
            ViewWithProperties.prototype.render.call(this);
            //fill up the modal of called workflows and objects when we click on the "arrow" icon on the buttom right
            this.$el.find("#called-icon-a").on("click", function() {
                generateCalledWorkflowModal(that.$el);
                //show up the modal
                $('#called-workflow-modal').modal();
            });

            //fill up the modal of called workflows and objects when we click on the contextual menu "Called Workflow"
            $("#called-workflow").click(function(event) {
                if (that.$el.hasClass("selected-task")) {
                    //fill up the modal of called workflows and objects
                    generateCalledWorkflowModal(that.$el);
                    //show up the modal
                    $('#called-workflow-modal').modal();
                }
            });
            this.$el.mousedown(function(e) {
                if (!e.ctrlKey && !that.$el.hasClass("selected-task")) {
                    $(".selected-task").removeClass("selected-task");
                }

                if (e.ctrlKey && that.$el.hasClass("selected-task")) {
                    // unselecting the current task
                    that.$el.removeClass("selected-task");
                } else {
                    // selecting the current task
                    that.$el.addClass("selected-task");
                    $('.selected-task').on('contextmenu', function(e) {
                        //add the contextual menu "Called Workflow"
                        addCalledWorkflowMenu(that.$el);
                        var top = that.$el[0].offsetTop + 54;
                        var left = that.$el[0].offsetLeft + 50;
                        $(".context-menu-canvas").hide();
                        $(".context-menu-task").css({
                            top: top,
                            left: left
                        }).show();
                        return false; //blocks default Webbrowser right click menu
                    }).on("click", function() {
                        $(".context-menu-task").hide();
                    });
                    $("#workflow-designer, #breadcrumb-list-workflows").on("click", function() {
                        $(".context-menu-task").hide();
                    });

                    $(".context-menu-task li").on("click", function() {
                        $(".context-menu-task").hide();
                    });
                }

                $(".active-task").removeClass("active-task");
                that.$el.addClass("active-task");

                //Show task Implementation of the selected Task after double click
                that.$el.dblclick(function() {
                    //Hide the current panel
                    $('.panel-body.in').collapse('hide')
                    //Show task implementation
                    $('#accordion-properties > div:nth-child(4)').children().last().collapse('show')
                })
                e.stopPropagation();

            })
            return this;
        }
    }
    )

       function generateCalledWorkflowModal(element) {
       `   //remove the previous task name from the modal title if it exists
           $('#called-workflows-title').find("span").remove();
           //add the current task name to the modal title
           $("#called-workflows-title").append("<span style='background-color: #DCDCDC;'>"+element.find(".task-name").text().trim()+"</span>");
           //delete all table rows except the first
           $('#called-description-container-table').find("tr:gt(0)").remove();
           //get current task variables that calls another workflow or object from the model
           var currentTaskVariables = getTaskVariablesCallingWorkflowsInModel(element);
           for (var key of Object.keys(currentTaskVariables)) {
               var currentTaskName = key.split(":")[0];
               var currentVariable = currentTaskVariables[key];
               var hrefEyeIcon;
               var variablePathValue = "<td>" + currentVariable.Value + "</td>";
               if (currentVariable.Value) {
                   var calledObjectDetails = getCalledObjectDetails(currentVariable.Value)
                   var objectKind = getObjectKind(calledObjectDetails["bucketName"], calledObjectDetails["objectName"])
                   if (objectKind == 'Workflow/standard' || objectKind == 'Workflow/psa') {
                       hrefEyeIcon = "<a href='javascript:void(0)' class='open-in-studio' ><i title='Open the workflow in a new Studio Tab' class='visu-icon glyphicon glyphicon-eye-open'></i></a>"
                   } else if (objectKind == null){
                       objectKind = "";
                       variablePathValue = "<td title='The provided workflow/object path does not exist in the Catalog' style='color: red;'>" + currentVariable.Value + "</td>";
                       hrefEyeIcon = "<i title='The selected workflow does not exist in the Catalog' class='visu-icon disabled glyphicon glyphicon-eye-close'></i>";
                   } else {
                       hrefEyeIcon = "<i title='You cannot open non-workflows objects in the Studio' class='visu-icon disabled glyphicon glyphicon-eye-close'></i>"
                   }
               } else {
                   hrefEyeIcon = "<i title='You cannot open empty objects in the Studio, select a workflow first' class='visu-icon disabled glyphicon glyphicon-eye-close'></i>"
                   variablePathValue = "<td></td>";
                   objectKind = "";
               }
               var markup = "<tr><td>" + currentVariable.Name + "</td>" + variablePathValue + "<td><button title='Select one catalog object' class='called-catalogobject-button btn' type='button' style='background-color:Transparent'><img src='images/catalog-portal.png' height='20'></button></td><td>" + objectKind + "</td><td style='text-align: center'>" + hrefEyeIcon + "</td><td style='display:none;'>" + currentVariable.Model + "</td></tr>";
               $("#called-description-container-table").append(markup);
           }
           //event to activate the visualization on another tab
           visuIconEvent();

           //action on the change button to modify the catalog object in the called workflow modal
           $(".called-catalogobject-button").click(function(event) {
               event.preventDefault();
               var studioApp = require('StudioApp');
               var parentVariableValue = $(event.currentTarget).parent().parent().children()[1].innerHTML;
               var parentVariableName = $(event.currentTarget).parent().parent().children()[0].innerHTML;
               var parentVariableModel = $(event.currentTarget).parent().parent().children()[5].innerHTML;
               var parentObjectDetails = getCalledObjectDetails(parentVariableValue);

               studioApp.views.catalogGetView.setKind("all", "Object");
               studioApp.views.catalogGetView.setVarKey(event.currentTarget.getAttribute('value'));
               var matches = parentVariableModel.match(/\((.*)\)/); //matches[1] contains the value between the parentheses
               if (matches && matches.length > 1) {
                   var params = matches[1].split(',');
                   studioApp.views.catalogGetView.setFilter(params[0], params[1]); //filterKind, filterContentType
               }
               studioApp.views.catalogGetView.render(parentObjectDetails["bucketName"], parentObjectDetails["objectName"]);
               var previousZIndex = $("#catalog-get-modal").css("z-index");
               studioApp.views.catalogGetView.setPreviousZIndex(previousZIndex);
               var zIndexModal = parseInt($("#catalog-get-modal").parents().find(".modal").css("z-index")); // #execute-workflow-modal
               $("#catalog-get-modal").css("z-index", (zIndexModal + 1).toString());
               $("#catalog-get-select-button").hide();
               $("#catalog-get-browse-button").show();
               $('#catalog-get-modal').modal();

               //to avoid to fire the next event two times
               let firstCall = true
               //action on click on the select button of the get catalog view
               $("#catalog-get-browse-button").click(function(e) {
                   e.preventDefault();
                   if (!firstCall) {
                       return;
                   }
                   firstCall = false;
                   var splitRawUrl = ($(($("#catalog-get-revisions-table .catalog-selected-row"))[0])).data("rawurl").split('/');
                   var newBucketName = splitRawUrl[1];
                   //we use decode to preserve the variable references inside the objects name
                   var newObjectName = decodeURIComponent(splitRawUrl[3]);
                   var newRevisionId = "";
                   //revision is added at the 4th and 5th element of splitRawUrl
                   if (splitRawUrl.length > 4) {
                       newRevisionId = splitRawUrl[5];
                   }
                   var newVariableValue = newBucketName + '/' + newObjectName;
                   if (newRevisionId != "") {
                       newVariableValue += "/" + newRevisionId;
                   }
                   //update the task variables model based on the new selected object values (bucket, object, and revision)
                   updateVariablesCallingWorkflowsInModel(currentTaskName, parentVariableName, parentVariableValue, newVariableValue);
                   $('#catalog-get-modal').modal('hide');

                   //update the variable value based on the new select catalog object
                   $(event.currentTarget).parent().parent().children()[1].innerHTML = newVariableValue;
                   var selectedObjectKind = getObjectKind(newBucketName, newObjectName);
                   //update the variable type based on the new object kind
                   $(event.currentTarget).parent().parent().children()[3].innerHTML = selectedObjectKind;
                   var SelectedHrefEyeIcon;
                   if (selectedObjectKind == 'Workflow/standard' || selectedObjectKind == 'Workflow/psa') {
                       SelectedHrefEyeIcon = "<a href='javascript:void(0)' class='open-in-studio' ><i title='Open the workflow in a new Studio Tab' class='visu-icon glyphicon glyphicon-eye-open'></i></a>";
                   } else {
                       SelectedHrefEyeIcon = "<i title='You cannot open non-workflows objects in the Studio' class='visu-icon disabled glyphicon glyphicon-eye-close'></i>";
                   }
                   //update the icon based on the new kind
                   $(event.currentTarget).parent().parent().children()[4].innerHTML = SelectedHrefEyeIcon;
                   $(event.currentTarget).parent().parent().children().css("color", "#333");
                   //update the visualization
                   visuIconEvent();
                   //click again on the current task to refresh variables with the new model values
                   element.find(".task-name").click();
               });
           });
       }

       //action on click on the eye icon to open the workflow on another tab in the studio
       function visuIconEvent() {
           $(".visu-icon").click(function(evt) {
               var parentVariableValue = $(evt.currentTarget).parent().parent().parent().children()[1].innerHTML;
               var parentObjectDetails = getCalledObjectDetails(parentVariableValue);
               var url = '/studio/#workflowcatalog/' + parentObjectDetails["bucketName"] + '/workflow/' + parentObjectDetails["objectName"];
               var parentObjectKind = $(evt.currentTarget).parent().parent().parent().children()[3].innerHTML;
               if (parentObjectKind == 'Workflow/standard' || parentObjectKind == 'Workflow/psa') {
                   var win = window.open(url);
               }
           });
       }

       //update variable models with newly selected bucket/object/revision
       function updateVariablesCallingWorkflowsInModel(currentTaskName, parentVariableName, parentVariableValue, newVariableValue) {
           var studioApp = require('StudioApp');
           var tasks = studioApp.models.jobModel.tasks;
           var TasksArray = [];
           for (var i = 0; i < tasks.length; i++) {
               TasksArray[i] = tasks[i];
           }
           for (var i = 0; i < TasksArray.length; i++) {
               var task = TasksArray[i];
               if (task.has('Variables') && task.get('Task Name') == currentTaskName) {
                   var variables = task.get('Variables');
                   for (var j = 0; j < variables.length; j++) {
                       var variable = variables[j];
                       if (variable.Value == parentVariableValue && variable.Name == parentVariableName) {
                           variable.Value = newVariableValue;
                       }
                   }
               }
           }
       }

       //returns the kind of a given objectName from a given bucketName
       function getObjectKind(bucketName, objectName) {
           var objectKind = null;
           $.ajax({
               'async': false,
               'type': "GET",
               'url': "/catalog/buckets/" + bucketName + "/resources/" + objectName + "/revisions",
               'beforeSend': function(xhr) {
                   xhr.setRequestHeader('sessionid', localStorage['pa.session'])
               },
               'success': function(data) {
                   console.debug("Request catalog object data", data);
                   var map = JSON.parse(JSON.stringify(data));
                   var kind = map[0].kind;
                   objectKind = kind;
               },
               'error': function(data) {
                   console.log("Failed to get object kind", data);
               }
           });
           return objectKind;
       }

       //add "Called Workflow" in the contextual menu of the selected task when there are called objects
       function addCalledWorkflowMenu(element) {
           $("#called-workflow").hide();
           var currentTaskVariables = getTaskVariablesCallingWorkflowsInModel(element);
           if (Object.keys(currentTaskVariables).length > 0) {
               $("#called-workflow").show();
           }
       }

       //add "arrow" icons to the tasks that call other objects
       function updateIconsOnTasksCallingObjects(element) {
           element.find("#called-icon").removeClass("glyphicon glyphicon-share-alt");
           var currentTaskVariables = getTaskVariablesCallingWorkflowsInModel(element);
           if (Object.keys(currentTaskVariables).length > 0) {
               element.find("#called-icon").addClass("glyphicon glyphicon-share-alt");
           }
       }

       //parse the given string and return an object of 3 elements (bucketName, objectName, objectRevision)
       function getCalledObjectDetails(variableValue) {
           var calledObjectDetails = {};
           calledObjectDetails["bucketName"] = variableValue.substr(0, variableValue.indexOf('/'));
           calledObjectDetails["objectName"] = variableValue.substr(variableValue.indexOf('/') + 1);
           if (calledObjectDetails["objectName"].includes("/")) {
               calledObjectDetails["objectRevision"] = calledObjectDetails["objectName"].substr(calledObjectDetails["objectName"].indexOf('/') + 1);
               calledObjectDetails["objectName"] = calledObjectDetails["objectName"].substr(0, calledObjectDetails["objectName"].indexOf('/'));
           }
           return calledObjectDetails;
       }

       //Returns a key value array (from the model) containing the list of PA:CATALOG_OBJECT variables of the input element task
       //The returned form is: taskVariables[TASK_NAME:VARIABLE_NAME] = Variable Object (containing the variable Name, Value, and Model)
       function getTaskVariablesCallingWorkflowsInModel(element) {
           var taskVariables = {};
           var studioApp = require('StudioApp');
           var tasks = studioApp.models.jobModel.tasks;
           var TasksArray = [];
           for (var i = 0; i < tasks.length; i++) {
               TasksArray[i] = tasks[i];
           }
           for (var i = 0; i < TasksArray.length; i++) {
               var task = TasksArray[i];
               var taskname = element.find(".task-name").text().trim()
               if (task.has('Variables') && task.get('Task Name') == taskname) {
                   var variables = task.get('Variables');
                   for (var j = 0; j < variables.length; j++) {
                       var variable = variables[j];
                       if (variable.Model && variable.Model.includes("PA:CATALOG_OBJECT")) {
                           taskVariables[task.get('Task Name') + ":" + variable.Name] = variable;
                       }
                   }
               }
           }
           return taskVariables;
       }
})
