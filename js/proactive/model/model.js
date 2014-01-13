(function ($) {

    // populates model according to the schema (xml import)
    // it uses placeholder of the model schema to find values in xml
    SchemaModel = Backbone.Model.extend({

        getValue: function (placeholder, obj) {
            if (!placeholder) return;
            placeholder = placeholder.split("->");
            var val = obj;
            for (i in placeholder) {
                var ph = placeholder[i];
                if (val[ph]) {
                    val = val[ph];
                } else {
                    val = undefined;
                    break;
                }
            }
            return val;
        },
        getListElementValue: function (listSchema, listElemObj) {

            if (listSchema.model) {
                var model = new listSchema.model();
                model.populateSchema(listElemObj)
                return model.toJSON();
            } else if (listSchema.subSchema) {
                var model = new SchemaModel();
                model.schema = listSchema.subSchema;
                model.populateSchema(listElemObj)
                return model.toJSON();
            } else {
                return this.getValue(listSchema.fieldAttrs.itemplaceholder, listElemObj);
            }
        },
        populateSchema: function (obj) {
            console.log("Populating", obj, this.schema)
            var that = this;

            for (var prop in this.schema) {
                if (this.schema[prop] && this.schema[prop].fieldAttrs && this.schema[prop].fieldAttrs.placeholder) {

                    var placeholder = this.schema[prop].fieldAttrs.placeholder;

                    if (this.schema[prop].type && this.schema[prop].type == 'List') {
                        var list = []
                        this.set(prop, list);
                        var value = this.getValue(placeholder, obj);
                        if (value) {
                            if (!Array.isArray(value)) {
                                value = [value];
                            }
                            $.each(value, function (i, v) {
                                var listElemValue = that.getListElementValue(that.schema[prop], v)
                                if (listElemValue) {
                                    list.push(listElemValue)
                                    console.log("Adding to list", prop, listElemValue)
                                }
                            })
                        }
                    } else {
                        var value = null;
                        if (!value && placeholder instanceof Array) {
                            for (ph in placeholder) {
                                value = this.getValue(placeholder[ph], obj)
                                if (value) {
                                    break;
                                }
                            }
                        } else {
                            var value = this.getValue(placeholder, obj);
                        }
                        if (value) {
                            if (typeof value === 'object') {
                                if (this.schema[prop].type == "Select") {
                                    // looking for a filed in the value matching select options
                                    if (this.schema[prop].fieldAttrs.strategy && this.schema[prop].fieldAttrs.strategy == 'checkpresence') {
                                        if (value) {
                                            console.log("Setting", prop, "from", placeholder, "to", "true")
                                            that.set(prop, "true")
                                        }
                                    } else {
                                        $.each(this.schema[prop].options, function (i, option) {
                                            if (value[option] || value[option.val]) {
                                                console.log("Setting", prop, "from", placeholder, "to", option.val ? option.val : option)
                                                that.set(prop, option.val ? option.val : option)
                                                return false;
                                            }
                                        });
                                    }
                                } else if (this.schema[prop].type == "NestedModel") {
                                    var model = new this.schema[prop].model();
                                    console.log(model)
                                    model.populateSchema(value)
                                    console.log("Setting", prop, "from", placeholder, "to", model)
                                    that.set(prop, model)
                                } else {
                                    console.log("Should no be here", prop, value);
                                }
                            } else {
                                console.log("Setting", prop, "from", placeholder, "to", value)
                                value = value.trim()
                                that.set(prop, value)
                            }
                        }
                    }
                }
            }
        }
    });

    var jobClasspathTemplate = _.template(Template.get('job-classpath-template'));

    Job = SchemaModel.extend({
        schema: {
//			"Project Name": {type:"Text", fieldAttrs: {"data-tab":"General Parameters", 'placeholder':'@attributes->projectName'}},
            "Job Name": {type: "Text", fieldAttrs: {"data-tab": "General Parameters", 'placeholder': '@attributes->name'}},
            "Description": {type: "Text", fieldAttrs: {'placeholder': ['description->#cdata-section', 'description->#text']}},
            "Job Classpath": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'jobClasspath->pathElement', 'itemplaceholder': '@attributes->path'}, itemTemplate: jobClasspathTemplate},
            "Job Priority": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->priority'}, options: ["low", "normal", "high", { val: "highest", label: 'highest (admin only)' }]},
            "Local Variables": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'variables->variable'}, itemToString: inlineName, subSchema: {
                "Name": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->name'} },
                "Value": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->value'} }
            }},
            "Generic Info": {type: 'List', itemType: 'Object', fieldAttrs: {"data-tab": "Generic Info", 'placeholder': 'genericInformation->info'}, itemToString: inlineName, subSchema: {
                "Property Name": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->name'} },
                "Property Value": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->value'} }
            }},
            "Input Space Url": {type: "Text", fieldAttrs: {"data-tab": "File Transfer", 'placeholder': 'inputSpace->@attributes->url'}},
            "Output Space Url": {type: "Text", fieldAttrs: {'placeholder': 'outputSpace->@attributes->url'}},
            "Global Space Url": {type: "Text", fieldAttrs: {'placeholder': 'globalSpace->@attributes->url'}},
            "User Space Url": {type: "Text", fieldAttrs: {'placeholder': 'userSpace->@attributes->url'}},
            "Max Number Of Executions For Task": {type: 'Number', fieldAttrs: {"data-tab": "Error Handling", 'placeholder': '@attributes->maxNumberOfExecution'}},
            "Cancel Job On Error Policy": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->cancelJobOnError'}, options: [
                {val: "true", label: "cancel job as soon as one task fails"},
                {val: "false", label: "continue job execution when a task fails"}
            ]},
            "If An Error Occurs Restart Task": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->restartTaskOnError'}, options: ["anywhere", "elsewhere"]}
        },
        initialize: function () {
//            this.set({"Project Name": "Project"});
            this.set({"Job Name": "MyJob"});
            this.set({"Job Priority": "normal"});
            this.set({"Cancel Job On Error Policy": "false"});
            this.set({"Max Number Of Executions For Task": 1});
            this.set({"If An Error Occurs Restart Task": "anywhere"});
            this.tasks = [];
            this.on("change", function (eventName, event) {
                undoManager.save()
            });

        },
        addTask: function (task) {
            console.log("Adding task", task)
            this.tasks.push(task)
        },
        removeTask: function (task) {
            console.log("Removing task", task)
            var index = this.tasks.indexOf(task)
            if (index != -1) this.tasks.splice(index, 1)
            $.each(this.tasks, function (i, t) {
                t.removeControlFlow(task);
            })
        },
        getDependantTask: function (taskName) {
            for (i in this.tasks) {
                var task = this.tasks[i];
                if (task.dependencies) {
                    for (j in task.dependencies) {
                        var dep = task.dependencies[j];
                        if (taskName == dep.get('Task Name')) {
                            return task.get('Task Name');
                        }
                    }
                }
            }

            return;
        },
        getTaskByName: function (taskName) {
            for (i in this.tasks) {
                var task = this.tasks[i];
                if (taskName == task.get('Task Name')) {
                    return task;
                }
            }
        },
        populate: function (obj) {
            this.populateSchema(obj);
            var that = this;
            if (obj.taskFlow && obj.taskFlow.task) {

                if (!Array.isArray(obj.taskFlow.task)) {
                    obj.taskFlow.task = [obj.taskFlow.task];
                }
                var name2Task = {};
                $.each(obj.taskFlow.task, function (i, task) {
                    var taskModel = new Task();
                    if (task.javaExecutable) {
                        taskModel.schema['Parameters']['model'] = JavaExecutable;
                        taskModel.schema['Parameters']['fieldAttrs'] = {placeholder: 'javaExecutable'}
                        taskModel.set({Parameters: new JavaExecutable()});
                        taskModel.set({Type: "JavaExecutable"});
                    } else if (task.nativeExecutable) {
                        taskModel.schema['Parameters']['model'] = NativeExecutable;
                        taskModel.schema['Parameters']['fieldAttrs'] = {placeholder: 'nativeExecutable'}
                        taskModel.set({Parameters: new NativeExecutable()});
                        taskModel.set({Type: "NativeExecutable"});
                    } else if (task.scriptExecutable) {
                        taskModel.schema['Parameters']['model'] = ScriptExecutable;
                        taskModel.schema['Parameters']['fieldAttrs'] = {placeholder: 'scriptExecutable'}
                        taskModel.set({Parameters: new ScriptExecutable()});
                        taskModel.set({Type: "ScriptExecutable"});
                    }

                    taskModel.populateSchema(task);
                    console.log("Pushing task", taskModel)
                    that.tasks.push(taskModel);
                    name2Task[taskModel.get("Task Name")] = taskModel;
                });
                // adding dependencies after all tasks are populated
                $.each(obj.taskFlow.task, function (i, task) {
                    var taskModel = name2Task[task['@attributes']['name']]
                    if (taskModel && task.depends && task.depends.task) {
                        if (!Array.isArray(task.depends.task)) {
                            task.depends.task = [task.depends.task];
                        }
                        $.each(task.depends.task, function (i, dep) {
                            if (name2Task[dep['@attributes']['ref']]) {
                                var depTaskModel = name2Task[dep['@attributes']['ref']];
                                taskModel.addDependency(depTaskModel);
                            }
                        })
                    }
                })
                // adding controlFlows after all dependencies are set
                $.each(obj.taskFlow.task, function (i, taskJson) {
                    var taskModel = name2Task[taskJson['@attributes']['name']]
                    if (taskJson.controlFlow) {
                        if (taskJson.controlFlow.if) {
                            var ifFlow = taskJson.controlFlow.if['@attributes'];
                            taskModel.setif(name2Task[ifFlow['target']])
                            taskModel.controlFlow.if.model.populateSchema(taskJson.controlFlow.if);
                            taskModel.setelse(name2Task[ifFlow['else']])
                            taskModel.setcontinuation(name2Task[ifFlow['continuation']])
                        }
                        if (taskJson.controlFlow.replicate) {
                            taskModel.setreplicate(null);
                            taskModel.controlFlow.replicate.model.populateSchema(taskJson.controlFlow.replicate);
                        }
                        if (taskJson.controlFlow.loop) {
                            var branch = new BranchWithScript();
                            branch.populateSchema(taskJson.controlFlow.loop);
                            var loopTarget = taskJson.controlFlow.loop['@attributes']['target'];
                            var targetTask = name2Task[loopTarget];
                            taskModel.controlFlow = {'loop': {task: targetTask, model: branch}};
                        }
                    }
                })
                delete name2Task;
            }
        }
    });

    var scriptTemplate = _.template(Template.get('script-form-template'));
    var serverScripts = function (callback) {
        callback([""].concat(StudioClient.listScripts()));
    }

    Script = SchemaModel.extend({
        schema: {
            "Library": {type: "Select", options: serverScripts},
            "Library Path": {type: "Hidden"},
            "Script": {type: "TextArea", fieldAttrs: {'placeholder': ['code->#cdata-section', 'code->#text']}, template: scriptTemplate},
            "Engine": {type: 'Select', options: ["javascript", "groovy", "ruby", "python"], fieldAttrs: {'placeholder': 'code->@attributes->language'}},
            "Or Path": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->path'}},
            "Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'file->arguments->argument', 'itemplaceholder': '@attributes->value'}},
            "Or Url": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->url'}}
        },

        populateSchema: function (obj) {
            SchemaModel.prototype.populateSchema.call(this, obj);
            var path = this.get("Or Path");
            if (path) {
                var fileName = path.replace(/^.*[\\\/]/, '');
                this.set("Library", fileName);
            }
        }
    });

    SelectionScript = SchemaModel.extend({
        // TODO inherit from Script - first attempt did not work because schema is shared - type appears in pre/post scripts as well
        schema: {
            "Library": {type: "Select", options: serverScripts},
            "Library Path": {type: "Hidden"},
            "Script": {type: "TextArea", fieldAttrs: {'placeholder': ['code->#cdata-section', 'code->#text']}, template: scriptTemplate},
            "Engine": {type: 'Select', options: ["javascript", "groovy", "ruby", "python"], fieldAttrs: {'placeholder': 'code->@attributes->language'}},
            "Or Path": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->path'}},
            "Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'file->arguments->argument', 'itemplaceholder': '@attributes->value'}},
            "Or Url": {type: "Hidden", fieldAttrs: {'placeholder': 'file->@attributes->url'}},
            "Type": {type: 'Select', options: ["dynamic", "static"], fieldAttrs: {'placeholder': '@attributes->type'}}
        },

        populateSchema: function (obj) {
            SchemaModel.prototype.populateSchema.call(this, obj);
            var path = this.get("Or Path");
            if (path) {
                var fileName = path.replace(/^.*[\\\/]/, '');
                this.set("Library", fileName);
            }
        }

    });

    JavaExecutable = SchemaModel.extend({
        schema: {
            "Class": {type: "Text", fieldAttrs: {'placeholder': '@attributes->class'}},
            "Application Parameters": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'parameters->parameter'}, itemToString: inlineName, subSchema: {
                "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}}
            }},
            "Fork Environment": {type: 'Select', fieldAttrs: {'placeholder': 'forkEnvironment', 'strategy': 'checkpresence'},
                options: [
                    {val: "false", label: "Use the Proactive Node JVM"},
                    {val: "true", label: "Fork a new JVM"}
                ]},
            "Java Home": {type: "Text", fieldAttrs: {'placeholder': 'forkEnvironment->@attributes->javaHome'}},
            "Jvm Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'forkEnvironment->jvmArgs->jvmArg', 'itemplaceholder': '@attributes->value'}},
            "Working Dir": {type: "Text", fieldAttrs: {'placeholder': 'forkEnvironment->@attributes->workingDir'}},
            "Additional Classpath": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'forkEnvironment->additionalClasspath->pathElement', 'itemplaceholder': '@attributes->path'}},
            "Environment Variables": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'forkEnvironment->SystemEnvironment->variable'}, subSchema: {
                "Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name'}},
                "Value": {type: "Text", fieldAttrs: {'placeholder': '@attributes->value'}},
                "Append": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->append'}},
                "Append Char": {type: "Text", fieldAttrs: {'placeholder': '@attributes->appendChar'}}
            }},
            "Environment Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'forkEnvironment->envScript->script'}}
        },
        initialize: function () {
            this.set({"Fork Environment": "false"});
        }
    });

    NativeExecutable = SchemaModel.extend({
        schema: {
            "Static Command": {type: "Text", fieldAttrs: {'placeholder': 'staticCommand->@attributes->value'}},
            "Working Folder": {type: "Text", fieldAttrs: {'placeholder': 'staticCommand->@attributes->workingDir'}},
            "Arguments": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'staticCommand->arguments->argument', 'itemplaceholder': '@attributes->value'}},
            "Or Dynamic Command": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'dynamicCommand->generation->script'}},
            "Working Dir": {type: "Text", fieldAttrs: {'placeholder': 'dynamicCommand->@attributes->workingDir'}}
        }
    });

    ScriptExecutable = SchemaModel.extend({
        schema: {
            "Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'script'}}
        }
    });

    Task = SchemaModel.extend({
        schema: {
            "Task Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name', "data-tab": "Execution"}},
            "Type": {type: 'TaskTypeRadioEditor', fieldAttrs: {}, fieldClass: 'task-type',
                options: [
                    {val: "ScriptExecutable", label: "Script"},
                    {val: "NativeExecutable", label: "Native"},
                    {val: "JavaExecutable", label: "Java"}
                ]},
            "Parameters": {type: 'NestedModel', model: ScriptExecutable},
            "Description": {type: "Text", fieldAttrs: {"data-tab": "General Parameters", 'placeholder': ['description->#cdata-section', 'description->#text']}},
            "Maximum Number of Execution": {type: 'Number', fieldAttrs: {'placeholder': '@attributes->maxNumberOfExecution'}},
            "Maximum Execution Time (hh:mm:ss)": {type: "Text", fieldAttrs: {'placeholder': '@attributes->walltime'}},
            "Result Preview Class": {type: "Text", fieldAttrs: {'placeholder': '@attributes->resultPreviewClass'}},
            "Run as me": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->runAsMe'}},
            "Precious Result": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->preciousResult'}},
            "Cancel Job On Error Policy": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->cancelJobOnError'}, options: [
                {val: "true", label: "cancel job as soon as one task fails"},
                {val: "false", label: "continue job execution when a task fails"}
            ]},
            "If An Error Occurs Restart Task": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->restartTaskOnError'}, options: ["anywhere", "elsewhere"]},
            "Store Task Logs in a File": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->preciousLogs'}},
            "Generic Info": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'genericInformation->info'}, subSchema: {
                "Property Name": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->name'} },
                "Property Value": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->value'} }
            }},
            "Number of Nodes": {type: 'Number', fieldAttrs: {"data-tab": "Multi-Node Execution", 'placeholder': 'parallel->@attributes->numberOfNodes'}},
            "Topology": { type: 'Select', fieldAttrs: {'placeholder': 'parallel->topology'}, options: ["none", "arbitrary",
                {val: "bestProximity", label: "best proximity"},
                {val: "singleHost", label: "single host"},
                {val: "singleHostExclusive", label: "single host exclusive"},
                {val: "multipleHostsExclusive", label: "multiple host exclusive"},
                {val: "differentHostsExclusive", label: "different host exclusive"}]  },
            "Or Topology Threshold Proximity": {type: "Number", fieldAttrs: {'placeholder': 'parallel->topology->thresholdProximity->@attributes->threshold'}},
            "Control Flow": {type: 'Select', options: ["none", "if", "replicate", "loop"], fieldAttrs: {"data-tab": "Control Flow"}},
            "Block": {type: 'Select', options: ["none", {val: "start", label: "start block"}, {val: "end", label: "end block"}], fieldAttrs: {"placeholder": "controlFlow->@attributes->block"}},
            "Selection Scripts": {type: 'List', itemType: 'NestedModel', model: SelectionScript, itemToString: function () {
                return "Selection Script"
            }, fieldAttrs: {"data-tab": "Selection Scripts", 'placeholder': 'selection->script'}},
            "Pre Script": {type: 'NestedModel', model: Script, fieldAttrs: {"data-tab": "Pre Script", 'placeholder': 'pre->script'}},
            "Post Script": {type: 'NestedModel', model: Script, fieldAttrs: {"data-tab": "Post Script", 'placeholder': 'post->script'}},
            "Clean Script": {type: 'NestedModel', model: Script, fieldAttrs: {"data-tab": "Clean Script", 'placeholder': 'cleaning->script'}},
            "Input Files": {type: 'List', itemType: 'Object', fieldAttrs: {"data-tab": "File Transfer", 'placeholder': 'inputFiles->files'}, subSchema: {
                "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}},
                "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}},
                "Access Mode": {type: 'Select',
                    fieldAttrs: {'placeholder': '@attributes->accessMode'},
                    options: ["transferFromInputSpace", "transferFromOutputSpace", "transferFromGlobalSpace", "transferFromUserSpace", "none"]},
            }},
            "Output Files": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'outputFiles->files'}, subSchema: {
                "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}},
                "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}},
                "Access Mode": {type: 'Select',
                    fieldAttrs: {'placeholder': '@attributes->accessMode'},
                    options: ["transferToOutputSpace", "transferToGlobalSpace", "transferToUserSpace", "none"]}
            }}
        },

        initialize: function () {
            if (!Task.counter) {
                Task.counter = 0
            }

            this.schema = $.extend(true, {}, this.schema);

            this.set({"Type": "ScriptExecutable"});
            this.set({"Parameters": new ScriptExecutable()});
            this.set({"Task Name": "Task" + (++Task.counter)});
            this.set({"Maximum Number of Execution": 1});
            this.set({"Run as me": false});
            this.set({"Precious Result": false});
            this.set({"Cancel Job On Error Policy": "false"});
            this.set({"If An Error Occurs Restart Task": "anywhere"});
            this.set({"Store Task Logs in a File": false});
            this.set({"Number of Nodes": 1});

            this.controlFlow = {};
            this.on("change", function (eventName, event) {
                undoManager.save()
            });
        },

        addDependency: function (task) {
            if (!this.dependencies) this.dependencies = [];

            index = this.dependencies.indexOf(task);
            if (index == -1) {
                this.dependencies.push(task)
                this.trigger("change")
                console.log("Adding dependency to", this, "from", task)
            }
        },
        removeDependency: function (task) {
            index = this.dependencies.indexOf(task);
            if (index != -1) {
                this.dependencies.splice(index, 1);
                this.trigger("change")
                console.log("Removing dependency", task, "from", this)
            }
        },
        setControlFlow: function (controlFlowType, task) {
            if (controlFlowType == 'if') {
                if (this.controlFlow['if'] && this.controlFlow['if'].task) {
                    if (this.controlFlow['if']['else']) {
                        controlFlowType = 'continuation';
                    } else {
                        controlFlowType = 'else';
                    }
                }
            }

            if (this['set' + controlFlowType]) this['set' + controlFlowType](task);
        },
        removeControlFlow: function (controlFlowType, task) {
            if (this['remove' + controlFlowType]) this['remove' + controlFlowType](task);
        },
        setif: function (task) {
            if (!task) {
                return;
            }
            this.set({'Control Flow': 'if'});
            if (!this.controlFlow['if']) {
                this.controlFlow = {'if': {}}
            }

            this.controlFlow['if'].task = task;
            this.controlFlow['if'].model = new BranchWithScript();
            console.log('Adding if branch', this.controlFlow['if'], 'to', this)
        },
        setelse: function (task) {
            if (!task) {
                return;
            }
            this.controlFlow['if']['else'] = {task: task};
            console.log('Adding else branch', this.controlFlow['if']['else'], 'to', this)
        },
        setcontinuation: function (task) {
            if (!task) {
                return;
            }
            this.controlFlow['if']['continuation'] = {task: task};
            console.log('Adding continuation branch', this.controlFlow['if']['continuation'], 'to', this)
        },
        removeif: function (task) {
            this.set({'Control Flow': 'none'});
            if (this.controlFlow['if'].task == task) {
                console.log('Removing IF')
                this.controlFlow['if'].model = undefined;
                this.controlFlow['if'].task = undefined;
            } else if (this.controlFlow['if']['else'] && this.controlFlow['if']['else'].task == task) {
                console.log('Removing ELSE')
                delete this.controlFlow['if']['else'];
            } else if (this.controlFlow['if']['continuation'] && this.controlFlow['if']['continuation'].task == task) {
                console.log('Removing CONTINUATION')
                delete this.controlFlow['if']['continuation'];
            }
            console.log('Removing if branch', this.controlFlow, task)
        },
        setloop: function (task) {
            console.log('Adding loop')
            this.set({'Control Flow': 'loop'});
            this.controlFlow = {'loop': {task: task, model: new BranchWithScript()}}
        },
        removeloop: function (controlFlow, task) {
            console.log('Removing loop')
            this.set({'Control Flow': 'none'});
            delete this.controlFlow['loop']
        },
        setreplicate: function (task) {
            console.log('Adding replicate')
            this.set({'Control Flow': 'replicate'});
            this.controlFlow = {'replicate': {model: new BranchWithScript()}}
        },
        removereplicate: function (controlFlow, task) {
            console.log('Removing replicate')
            this.set({'Control Flow': 'none'});
            delete this.controlFlow['replicate']
        }
    });

    BranchWithScript = SchemaModel.extend({
        schema: {
            "Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'script'}}
        }
    });

    function inlineName(prop) {
        var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
        return name;
    }

    Projects = Backbone.Model.extend({
        supports_html5_storage: function () {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },
        init: function () {
            if (this.supports_html5_storage() && !localStorage["workflows"]) {
                localStorage["workflows"] = "[]";
            }
        },
        addEmptyWorkflow: function (name, xml) {
            if (this.supports_html5_storage() && localStorage["workflows"]) {

                var localJobs = JSON.parse(localStorage["workflows"]);
                var workflow = {'name': name, 'xml': xml,
                    metadata: JSON.stringify({
                        created_at: new Date().getTime(),
                        updated_at: new Date().getTime()
                    })};
                var id = StudioClient.createWorkflowSynchronously(workflow);
                if (id) workflow.id = id;

                localJobs.push(workflow);
                localStorage["workflow-selected"] = localJobs.length - 1;
                localStorage["workflows"] = JSON.stringify(localJobs);
            }
        },
        getWorkFlows: function () {
            if (this.supports_html5_storage() && localStorage["workflows"]) {
                return JSON.parse(localStorage["workflows"])
            }
            return [];
        },
        getCurrentWorkFlowAsJson: function () {
            if (this.supports_html5_storage() && localStorage["workflows"] && localStorage["workflow-selected"] != undefined) {
                var selectedIndex = localStorage["workflow-selected"];
                if (!localStorage["workflows"]) return;

                var localJobs = JSON.parse(localStorage["workflows"]);

                if (!localJobs[selectedIndex] && localJobs.length > 0) {
                    selectedIndex = localJobs.length - 1;
                    localStorage["workflow-selected"] = selectedIndex;
                    console.log("Selected index out of range - selecting the latest workflow");
                }

                if (localJobs[selectedIndex]) {
                    return xmlToJson(parseXml(localJobs[selectedIndex].xml))
                }
            }
        },
        saveCurrentWorkflow: function (name, workflowXml, offsets) {
            if (this.supports_html5_storage() && workflowXml) {

                if (!localStorage["workflows"]) {
                    this.init();
                    this.addEmptyWorkflow(name, workflowXml);
                }

                var selectedIndex = localStorage["workflow-selected"];
                var localJobs = JSON.parse(localStorage['workflows']);

                var meta = JSON.parse(localJobs[selectedIndex].metadata);

                if (localJobs[selectedIndex].name != name || localJobs[selectedIndex].xml != workflowXml || meta.offsets != offsets) {

                    localJobs[selectedIndex].name = name;
                    localJobs[selectedIndex].xml = workflowXml;

                    meta.offsets = offsets;
                    meta.updated_at = new Date().getTime();
                    localJobs[selectedIndex].metadata = JSON.stringify(meta);

                    localStorage['workflows'] = JSON.stringify(localJobs);

                    var workflow = localJobs[selectedIndex];
                    StudioClient.updateWorkflow(workflow.id, workflow, true);
                }
            }
        },
        setSelectWorkflowIndex: function (index) {
            if (this.supports_html5_storage()) {
                localStorage["workflow-selected"] = index;
            }
        },
        getSelectWorkflowIndex: function () {
            if (this.supports_html5_storage() && localStorage["workflow-selected"]) {
                return localStorage["workflow-selected"]
            }
        },
        removeWorkflow: function (index) {
            if (this.supports_html5_storage() && localStorage["workflow-selected"]) {
                var localJobs = JSON.parse(localStorage['workflows']);
                var workflow = localJobs[index];
                localJobs.splice(index, 1);
                localStorage['workflows'] = JSON.stringify(localJobs);

                if (localJobs.length <= localStorage["workflow-selected"]) {
                    localStorage['workflow-selected'] = localJobs.length - 1;
                }
                StudioClient.removeWorkflow(workflow.id);
            }
        },
        cloneWorkflow: function (index) {
            if (this.supports_html5_storage() && localStorage["workflow-selected"]) {
                var localJobs = JSON.parse(localStorage['workflows']);
                var workflow = localJobs[index];
                var id = StudioClient.createWorkflowSynchronously(workflow);
                if (id) workflow.id = id;

                localJobs.push(localJobs[index]);
                localStorage['workflows'] = JSON.stringify(localJobs);
            }
        },
        updatedAt: function (workflow) {
            return JSON.parse(workflow.metadata).updated_at;
        },
        sync: function () {
            if (this.supports_html5_storage()) {
                if (!this.remoteJobs) {
                    // TODO loading indicator

                    this.remoteJobs = StudioClient.getWorkflowsSynchronously();

                    if (this.remoteJobs) {

                        var remoteJobIds = {};
                        for (var i in this.remoteJobs) {
                            remoteJobIds[this.remoteJobs[i].id] = this.remoteJobs[i];
                        }

                        var localJobs = JSON.parse(localStorage['workflows']);
                        var reload = false;

                        for (i in localJobs) {
                            var localJob = localJobs[i];
                            if (!localJob.id) {
                                // creating new job
                                StudioClient.createWorkflowSynchronously(localJob)
                                reload = true;
                            } else if (!remoteJobIds[localJob.id]) {
                                // job was removed from the server
                            } else if (this.updatedAt(localJob) > this.updatedAt(remoteJobIds[localJob.id])) {
                                // job was updated locally - updating on the server
                                StudioClient.updateWorkflow(localJob.id, localJob, false);
                                reload = true;
                            }
                        }

                        if (reload) {
                            this.remoteJobs = StudioClient.getWorkflowsSynchronously();
                            console.log("Reloading remote workflows", this.remoteJobs)
                        }

                        localStorage['workflows'] = JSON.stringify(this.remoteJobs);
                    }
                }
            }
        },
        getOffsetsFromLocalStorage: function () {
            if (this.supports_html5_storage()) {
                var selectedIndex = localStorage["workflow-selected"];
                var localJobs = JSON.parse(localStorage['workflows']);
                var meta = JSON.parse(localJobs[selectedIndex].metadata);
                return meta.offsets;
            }
        }

    })

})(jQuery);
