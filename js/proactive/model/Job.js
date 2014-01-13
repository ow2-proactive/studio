(function ($) {
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
})(jQuery);
