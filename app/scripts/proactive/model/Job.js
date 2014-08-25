define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'text!proactive/templates/job-classpath-template.html',
        'proactive/model/Task',
        'proactive/model/ScriptExecutable',
        'proactive/model/NativeExecutable',
        'proactive/model/JavaExecutable',
        'proactive/model/BranchWithScript',
        'proactive/model/utils',

        'proactive/view/utils/undo' // TODO remove
    ],

    // TODO REMOVE undoManager dependency - comes from view
    function (Backbone, SchemaModel, tpl, Task, ScriptExecutable, NativeExecutable, JavaExecutable, BranchWithScript, Utils, undoManager) {

    "use strict";

    var jobClasspathTemplate = _.template(tpl);

    return SchemaModel.extend({
        schema: {
            "Job Name": {type: "Text", fieldAttrs: {"data-tab": "General Parameters", 'placeholder': '@attributes->name', "data-help":'The name of your workflow.'}},
            "Project": {type: "Text", fieldAttrs: {'placeholder': '@attributes->projectName', "data-help":'Set a name of a project to be able to group different jobs of the same project later.'}},
            "Description": {type: "Text", fieldAttrs: {'placeholder': ['description->#cdata-section', 'description->#text'], "data-help": "Small textual explanation of what this job does."}},
            "Job Classpath": {type: 'List', itemType: 'Text', fieldAttrs: {'placeholder': 'jobClasspath->pathElement', 'itemplaceholder': '@attributes->path', "data-help":"Add jars with your classes that are used in Java or Script tasks. They will be transferred automatically to computing nodes."}, itemTemplate: jobClasspathTemplate},
            "Job Priority": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->priority', "data-help":"Scheduling priority level of the job. A user can only set the priority of his jobs and can only use the values \"lowest\", \"low\", or \"normal\". There are two higher priority levels \"high\" and \"highest\" which can be only set by the administrator."}, options: ["low", "normal", "high", { val: "highest", label: 'highest (admin only)' }]},
            "Local Variables": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'variables->variable', "data-help":"On the job level you can define variables that are available in all tasks. Then anywhere in your tasks you can reference them."}, itemToString: Utils.inlineName, subSchema: {
                "Name": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->name'} },
                "Value": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->value'} }
            }},
            "Generic Info": {type: 'List', itemType: 'Object', fieldAttrs: {"data-tab": "Generic Info", 'placeholder': 'genericInformation->info', "data-help":"Some extra information about your job often used to change the scheduling behavior for a job. E.g. NODE_ACCESS_TOKEN=rack1 will assign this job to a node with token \"rack1\"."}, itemToString: Utils.inlineName, subSchema: {
                "Property Name": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->name'} },
                "Property Value": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->value'} }
            }},
            "User Space Url": {type: "Text", fieldAttrs: {"data-tab": "Data Management", 'placeholder': 'userSpace->@attributes->url', "data-help":"A User Space which is a personal user data storage. Usually you set this url if you want to use your own dataspace server, not the one that is included into the Scheduler."}},
            "Global Space Url": {type: "Text", fieldAttrs: {'placeholder': 'globalSpace->@attributes->url', "data-help":"A Global Space where anyone can read/write files. Usually you set this url if you want to use your own dataspace server, not the one that is included into the Scheduler."}},
            "Input Space Url": {type: "Text", fieldAttrs: {'placeholder': 'inputSpace->@attributes->url', "data-help":"A private read-only Data Space started manually by user with the proactive-dataserver command."}},
            "Output Space Url": {type: "Text", fieldAttrs: {'placeholder': 'outputSpace->@attributes->url', "data-help":"A private Data Space started manually by user with the proactive-dataserver command."}},
            "Max Number Of Executions For Task": {type: 'Number', fieldAttrs: {"data-tab": "Error Handling", 'placeholder': '@attributes->maxNumberOfExecution', "data-help":"Defines how many times tasks are allowed to be restarted."}},
            "Cancel Job On Error Policy": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->cancelJobOnError', "data-help":"Defines whether the job must continue when a user exception or error occurs during the job process."}, options: [
                {val: "true", label: "cancel job as soon as one task fails"},
                {val: "false", label: "continue job execution when a task fails"}
            ]},
            "If An Error Occurs Restart Task": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->restartTaskOnError', "data-help":"Defines whether tasks that have to be restarted will restart on an other computing node."}, options: ["anywhere", "elsewhere"]}
        },
        initialize: function () {
//            this.set({"Project Name": "Project"});
            this.set({"Job Name": "Job"});
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
            for (var i in this.tasks) {
                var task = this.tasks[i];
                if (task.dependencies) {
                    for (var j in task.dependencies) {
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
            for (var i in this.tasks) {
                var task = this.tasks[i];
                if (taskName == task.get('Task Name')) {
                    return task;
                }
            }
        },
        populate: function (obj, merging) {
            this.populateSchema(obj, merging);
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

                    // check for unique task name to keep the job valid
                    var originalName = taskModel.get("Task Name");
                    if (merging && that.getTaskByName(taskModel.get("Task Name"))) {
                        var counter = 2;
                        while (that.getTaskByName(taskModel.get("Task Name") + counter)) {
                            counter++;
                        }
                        taskModel.set({"Task Name": originalName + counter});
                    }
                    console.log("Adding task to workflow", taskModel)
                    that.tasks.push(taskModel);
                    name2Task[taskModel.get("Task Name")] = taskModel;
                    name2Task[originalName] = taskModel;
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
            }
        }
    })
})
