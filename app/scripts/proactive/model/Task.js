define(
    [
        'backbone',
        'proactive/model/SchemaModel',
        'text!proactive/templates/job-classpath-template.html',
        'proactive/model/ScriptExecutable',
        'proactive/model/NativeExecutable',
        'proactive/model/JavaExecutable',
        'proactive/model/Script',
        'proactive/model/SelectionScript',
        'proactive/model/BranchWithScript',
        'proactive/view/utils/undo'
    ],

    // TODO REMOVE undoManager dependency - comes from view
    function (Backbone, SchemaModel, tpl, ScriptExecutable, NativeExecutable, JavaExecutable, Script, SelectionScript, BranchWithScript, undoManager) {

    "use strict";

    var Task = SchemaModel.extend({
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
            "Number of Nodes": {type: 'Text', fieldAttrs: {"data-tab": "Multi-Node Execution", 'placeholder': 'parallel->@attributes->numberOfNodes'}},
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
            "Input Files": {type: 'List', itemType: 'Object', fieldAttrs: {"data-tab": "Data Management", 'placeholder': 'inputFiles->files'}, subSchema: {
                "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}},
                "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}},
                "Access Mode": {type: 'Select',
                    fieldAttrs: {'placeholder': '@attributes->accessMode'},
                    options: ["transferFromUserSpace", "transferFromGlobalSpace", "transferFromInputSpace", "transferFromOutputSpace", "none"]}
            }},
            "Output Files": {type: 'List', itemType: 'Object', fieldAttrs: {'placeholder': 'outputFiles->files'}, subSchema: {
                "Excludes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->excludes'}},
                "Includes": {type: "Text", fieldAttrs: {'placeholder': '@attributes->includes'}},
                "Access Mode": {type: 'Select',
                    fieldAttrs: {'placeholder': '@attributes->accessMode'},
                    options: ["transferToUserSpace", "transferToGlobalSpace", "transferToOutputSpace", "none"]}
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
    })

    return Task;
})
