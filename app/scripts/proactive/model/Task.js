define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'proactive/model/ScriptExecutable',
        'proactive/model/NativeExecutable',
        'proactive/model/JavaExecutable',
        'proactive/model/Script',
        'proactive/model/SelectionScript',
        'proactive/model/BranchWithScript',
        'proactive/view/utils/undo',
        'text!proactive/templates/selection-script-host-template.html',
        'text!proactive/templates/selection-script-os-template.html',
        'text!proactive/templates/selection-script-totalmem-template.html'
    ],

    // TODO REMOVE undoManager dependency - comes from view
    function (Backbone, SchemaModel, ScriptExecutable, NativeExecutable, JavaExecutable, Script, SelectionScript,
              BranchWithScript, undoManager, ssHostTemplate, ssOSTemplate, ssTotalMemTemplate) {

    "use strict";

    var Task = SchemaModel.extend({
        schema: {
            "Task Name": {type: "Text", fieldAttrs: {'placeholder': '@attributes->name', "data-tab": "Execution", 'data-tab-help': 'Execution parameters', "data-help":'Unique name of a task without spaces.'}},
            "Type": {type: 'TaskTypeRadioEditor', fieldAttrs: {"data-help":'<b>Script Task</b>, a script written in Groovy, Ruby, Python and other languages supported by the JSR-223.<br/><b>Native Task</b>, an executable with eventual parameters to be executed.<br/><b>Java Task</b>, a task written in Java extending the Scheduler API.'}, fieldClass: 'task-type',
                options: [
                    {val: "ScriptExecutable", label: "Script"},
                    {val: "NativeExecutable", label: "Native"},
                    {val: "JavaExecutable", label: "Java"}
                ]},
            "Execute": {type: 'NestedModel', model: ScriptExecutable},
            "Description": {type: "Text", fieldAttrs: {"data-tab": "General Parameters", 'data-tab-help': 'General task parameters (description, execution control, error handling...)', 'placeholder': ['description->#cdata-section', 'description->#text'], "data-help":'A small textual description of what task does.'}},
            "Maximum Number of Execution": {type: 'Number', fieldAttrs: {'placeholder': '@attributes->maxNumberOfExecution', "data-help":'Defines how many times this task is allowed to be restarted.'}},
            "Maximum Execution Time (hh:mm:ss)": {type: "Text", fieldAttrs: {'placeholder': '@attributes->walltime', "data-help":'Task execution timeout. Format is the following:<br/><br/>5 means 5 seconds<br/><br/>10:5 means 10 minutes 5 seconds<br/><br/>1:02:03 is 1 hour 2 minutes and 3 seconds.'}},
            "Result Preview Class": {type: "Text", fieldAttrs: {'placeholder': '@attributes->resultPreviewClass', "data-help":'A class that defines how the result of a task should be displayed in the Scheduler Web Interface.'}},
            "Run as me": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->runAsMe', "data-help":'Executes the task under your system account.'}},
            "Precious Result": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->preciousResult', "data-help":'Indicates if you want to save the result of this task in the job result.'}},
            "Cancel Job On Error Policy": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->cancelJobOnError', "data-help":'Defines whether the job must continue when a user exception or error occurs during the job process.'}, options: [
                {val: "true", label: "cancel job as soon as one task fails"},
                {val: "false", label: "continue job execution when a task fails"}
            ]},
            "If An Error Occurs Restart Task": {type: 'Select', fieldAttrs: {'placeholder': '@attributes->restartTaskOnError', "data-help":'Defines whether tasks that have to be restarted will restart on an other computing node.'}, options: ["anywhere", "elsewhere"]},
            "Store Task Logs in a File": {type: "Checkbox", fieldAttrs: {'placeholder': '@attributes->preciousLogs', "data-help":'Defines if all the task logs must be kept even if it produces a lot of output. Data spaces are required in this case.'}},
            "Generic Info": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'genericInformation->info', "data-help":'Some extra information about your job often used to change the scheduling behavior for a job. E.g. NODE_ACCESS_TOKEN=rack1 will assign this task to a node with token \"rack1\".'}, subSchema: {
                "Property Name": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->name'} },
                "Property Value": { validators: ['required'], fieldAttrs: {'placeholder': '@attributes->value'} }
            }},
            "Number of Nodes": {type: 'Text', fieldAttrs: {"data-tab": "Multi-Node Execution", 'data-tab-help': 'Configuration of resources requirements', 'placeholder': 'parallel->@attributes->numberOfNodes', "data-help":'Usually a task require one computing node to be executed. Sometimes task can be a distributed program itself (e.g. MPI computations).<br/><br/>If number of nodes is more than 1 scheduler will run the task on one of reserved nodes passing all other as parameters.'}},
            "Topology": { type: 'Select', fieldAttrs: {'placeholder': 'parallel->topology', "data-help":'The topology of computing nodes in the network in terms of network latency.'}, options: ["none", "arbitrary",
                {val: "bestProximity", label: "best proximity"},
                {val: "singleHost", label: "single host"},
                {val: "singleHostExclusive", label: "single host exclusive"},
                {val: "multipleHostsExclusive", label: "multiple host exclusive"},
                {val: "differentHostsExclusive", label: "different host exclusive"}]  },
            "Or Topology Threshold Proximity": {type: "Number", fieldAttrs: {'placeholder': 'parallel->topology->thresholdProximity->@attributes->threshold', "data-help":'Hosts in the network with predefined max latency between all of them.'}},
            "Control Flow": {type: 'Select', options: ["none", "if", "replicate", "loop"], fieldAttrs: {"data-tab": "Control Flow", "data-help":'Advanced control flow constructions, such as if, loop and replicate.'}},
            "Block": {type: 'Select', options: ["none", {val: "start", label: "start block"}, {val: "end", label: "end block"}], fieldAttrs: {"placeholder": "controlFlow->@attributes->block", "data-help":"Task blocks are defined by pairs of start and end tags.<br/>The role of task blocks is to restrain the expressiveness of the system so that a workflow can be statically checked and validated."}},
            "Node Selection": {type: 'List', itemType: 'NestedModel', model: SelectionScript, itemToString: function () {
                return "Node Selection"
            }, fieldAttrs: {"data-tab": "Node Selection", 'placeholder': 'selection->script', "data-help":'A node selection provides an ability for the scheduler to execute tasks on particular ProActive nodes. E.g. you can specify that a task must be executed on a Unix/Linux system.'}},
            "Pre Script": {type: 'NestedModel', model: Script, fieldAttrs: {"data-tab": "Pre/Post/Clean scripts", 'data-tab-help': 'Scripts executed before and after the task', 'placeholder': 'pre->script', "data-help":'A script that is executed on computing node before executing the task. A script can be saved into a library when you are logged in.'}},
            "Post Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'post->script', "data-help":'A script that is executed on computing node after the task execution (if task is finished correctly). A script can be saved into a library when you are logged in.'}},
            "Clean Script": {type: 'NestedModel', model: Script, fieldAttrs: {'placeholder': 'cleaning->script', "data-help":'A script that is executed on computing node after the task execution even if task failed. A script can be saved into a library when you are logged in.'}},
            "Input Files": {type: 'List', itemType: 'Object', fieldAttrs: {"data-tab": "Data Management", 'data-tab-help': 'Input and output files transferred before and after the task execution', 'placeholder': 'inputFiles->files', "data-help":'Files from your user or global spaces that will be transferred to computing nodes automatically.'}, subSchema: {
                "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}},
                "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}},
                "Access Mode": {type: 'Select',
                    fieldAttrs: {'placeholder': '@attributes->accessMode'},
                    options: ["transferFromUserSpace", "transferFromGlobalSpace", "transferFromInputSpace", "transferFromOutputSpace", "none"]}
            }},
            "Output Files": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'outputFiles->files', "data-help":'Files produced by task that that will be transferred from computing nodes to your user or global spaces automatically.'}, subSchema: {
                "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}},
                "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}},
                "Access Mode": {type: 'Select',
                    fieldAttrs: {'placeholder': '@attributes->accessMode'},
                    options: ["transferToUserSpace", "transferToGlobalSpace", "transferToOutputSpace", "none"]}
            }},
            // extra parameters for the simple view
            "Host Name": {type: "Text", fieldAttrs: {"data-help":'A host name or a part of host name on which this task must be executed', "simple-view": true}},
            "Operating System": {type: 'Select', fieldAttrs: { "data-help":'An operating system name where this task must be executed.', "simple-view": true}, options: [
                {val: "any", label: "Any"},
                {val: "linux", label: "Linux"},
                {val: "windows", label: "Windows"},
                {val: "mac", label: "Mac"}
            ]},
            "Required amount of memory (in mb)": {type: "Text", fieldAttrs: {"data-help":'A host with this amount of memory.',  "simple-view": true}},
            "Dedicated Host": {type: "Checkbox", fieldAttrs: {"data-help":'Run the task exclusively on host - no other tasks will be executed in parallel on the same host.',  "simple-view": true}}
        },

        initialize: function () {
            if (!Task.counter) {
                Task.counter = 0
            }

            this.schema = $.extend(true, {}, this.schema);

            this.set({"Type": "ScriptExecutable"});
            this.set({"Execute": new ScriptExecutable()});
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

            var index = this.dependencies.indexOf(task);
            if (index == -1) {
                this.dependencies.push(task)
                this.trigger("change")
                console.log("Adding dependency to", this, "from", task)
            }
        },
        removeDependency: function (task) {
            var index = this.dependencies.indexOf(task);
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
        setreplicate: function () {
            console.log('Adding replicate')
            if (!this.controlFlow['replicate']) { // keep existing script if it is already defined
                this.set({'Control Flow': 'replicate'});
                this.controlFlow = {'replicate': {model: new BranchWithScript()}}
           }
        },
        removereplicate: function (controlFlow, task) {
            console.log('Removing replicate')
            this.set({'Control Flow': 'none'});
            delete this.controlFlow['replicate']
        },

        getBasicFields: function() {
            return [
                "Task Name",
                "Execute",
                "Host Name",
                "Operating System",
                "Required amount of memory (in mb)",
                "Dedicated Host"]
        },
        addOrReplaceGenericInfo: function(key, value) {

            var genericInfo = this.get("Generic Info");
            if (!genericInfo) {genericInfo = []}

            var found = false;
            for (var i in genericInfo) {
                if (genericInfo[i]["Property Name"] == key) {
                    genericInfo[i]["Property Value"] = value;
                    found = true;
                }
            }
            if (!found) {
                genericInfo.push({"Property Name": key, "Property Value":value})
            }
            this.set("Generic Info", genericInfo)

        },
        commitSimpleForm: function(form) {
            var data = form.getValue();
            var selectionScripts = [];

            var name = "Host Name"
            if (data[name]) {
                var selectionScript = {
                    Script:_.template(ssHostTemplate, {hostName:data[name]}),
                    "Written in":"javascript",
                    Type:"dynamic"};

                selectionScripts.push(selectionScript)
            }
            this.addOrReplaceGenericInfo(name, data[name])

            name = "Operating System"
            if (data[name] && data[name] != 'any') {
                var selectionScript = {
                    Script:_.template(ssOSTemplate, {os:data[name]}),
                    "Written in":"javascript",
                    Type:"dynamic"};

                selectionScripts.push(selectionScript)
            }
            this.addOrReplaceGenericInfo(name, data[name])

            name = "Required amount of memory (in mb)"
            if (data[name]) {
                var selectionScript = {
                    Script:_.template(ssTotalMemTemplate, {mem:data[name]}),
                    "Written in":"javascript",
                    Type:"dynamic"};

                selectionScripts.push(selectionScript)
            }
            this.addOrReplaceGenericInfo(name, data[name])

            name = "Dedicated Host"
            if (data[name]) {
                this.set({"Topology": "singleHostExclusive"});
                this.set({"Number of Nodes": 2});
            } else {
                this.set({"Topology": "arbitrary"});
                this.set({"Number of Nodes": 1});
            }
            this.addOrReplaceGenericInfo(name, data[name])

            this.set({"Selection Scripts": selectionScripts});
        },
        populateSimpleForm: function() {
            // initializing filed for simple form from generic info
            var genericInfo = this.get("Generic Info");
            if (!genericInfo) {genericInfo = []}

            for (var i in genericInfo) {
                var key = genericInfo[i]["Property Name"];
                var value = genericInfo[i]["Property Value"];

                if (key == "Dedicated Host") {
                    value = (value === 'true')
                }
                this.set(key, value)
            }
        }
    })

    return Task;
})
