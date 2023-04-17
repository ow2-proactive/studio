define(
  [
    'backbone',
    'proactive/editor/Link',
    'proactive/model/SchemaModel',
    'proactive/model/Task',
    'proactive/model/ScriptExecutable',
    'proactive/model/NativeExecutable',
    'proactive/model/JavaExecutable',
    'proactive/model/script/FlowScript',
    'proactive/model/utils',
    'proactive/view/utils/undo', // TODO remove
    'proactive/config',
    'proactive/rest/studio-client',
    'pnotify',
    'pnotify.buttons'

  ],

  // TODO REMOVE undoManager dependency - comes from view
  function(Backbone, Link, SchemaModel, Task, ScriptExecutable, NativeExecutable, JavaExecutable, FlowScript, Utils, undoManager, config, StudioClient, PNotify, scriptArgumentsClass) {

    "use strict";

    var that = this;

    const myStack = {"dir1": "up", "firstpos1": "1", "dir2": "left", "push": "bottom"};
    const GENERIC_INFORMATION = "genericInformation";
    const INFO = "info"
    const NAME = "name"
    return SchemaModel.extend({
      schema: {
        "Name": {
          type: "Text",
          fieldAttrs: {
            "data-tab": 'Workflow General Parameters',
            'data-tab-help': 'General workflow parameters (name, description, priority...)',
            'placeholder': '@attributes->name',
            "data-help": 'The name of your workflow.'
          }
        },
        "Project": {
          type: "Text",
          fieldAttrs: {
            'placeholder': '@attributes->projectName',
            "data-help": 'Set a name of a project to be able to group different jobs of the same project later.'
          }
        },
        "Tags": {
            type: 'List',
            itemType: 'Text',
            editorClass: scriptArgumentsClass,
            fieldAttrs: {
                'placeholder': '@attributes->tags',
                'listseparator': /\s*,\s*/,
                'data-help' : 'Tags given to the workflow.'
                },
            itemTemplate: Utils.bigCrossTemplate
        },
        "Description": {
          type: "TextArea",
          editorClass: "textareaworkflowdescription",
          fieldAttrs: {
            'placeholder': ['description->#cdata-section', 'description->#text'],
            "data-help": "Small textual explanation of what this job does."
          }
        },

        "Copyright": {
          type: "Hidden"
        },

        "Generic Info Documentation": {
          type: "Link",
          fieldAttrs: {
            "id": "gidoc",
            'placeholder': ['description->#cdata-section', 'description->#text'],
            "data-help": "Link to Workflow Documentation. Set value in Generic Information named \"DOCUMENTATION\""
          },
          title: 'Documentation'
        },

        "Job Priority": {
          type: 'Select',
          fieldAttrs: {
            'placeholder': '@attributes->priority',
            "data-help": "Scheduling priority level of the job. A user can only set the priority of his jobs and can only use the values \"lowest\", \"low\", or \"normal\". There are two higher priority levels \"high\" and \"highest\" which can be only set by the administrator."
          },
          options: ["low", "normal", {
            val: "high",
            label: 'high (admin only)'
          }, {
            val: "highest",
            label: 'highest (admin only)'
          }]
        },
        "Variables": {
          type: 'List',
          itemType: 'Object',
          title: "Workflow Variables",
          fieldAttrs: {
            "data-tab": "Workflow Variables",
            'placeholder': 'variables->variable',
            "data-tab-help": "Workflow variables that will be available in all tasks."
          },
          confirmDelete: 'You are about to remove a variable.',
          itemToString: Utils.inlineNameValue,
          itemTemplate: Utils.bigCrossTemplate,
          subSchema: {
            "Name": {
              validators: ['required'],
              fieldAttrs: {
                'placeholder': '@attributes->name',
                'data-help': "Name of the variable. It must start with a letter and it can contain only alphanumeric and -, _ or . characters."
              },
              type: 'Text',
              editorClass: 'popup-input-text-field'
            },
            "Value": {
              fieldAttrs: {
                'placeholder': '@attributes->value',
                'data-help': 'Value of the variable.'
              },
              type: 'TextArea',
              editorClass: 'popup-input-text-field textareavalues',
              editorAttrs: {'rows': '1'}
            },
            "Model": {
              fieldAttrs: {
                'placeholder': '@attributes->model'
              },
              title: '<br>Model or Data Type (PA:Integer, PA:Boolean, ...)<br>see <a target="_blank" href="' + config.docUrl + '/user/ProActiveUserGuide.html#_variable_model">documentation</a>.',
              type: 'TextArea',
              editorClass: 'popup-input-text-field textareavalues',
              editorAttrs: {'rows': '1'}
            },
            "Description": {
              fieldAttrs: {
                'placeholder': '@attributes->description',
                'data-help': "Html Description of the variable. It can contain html tags."
              },
              type: 'TextArea',
              editorClass: 'popup-input-text-field textareavalues',
              editorAttrs: {'rows': '1'}
            },
            "Group": {
              fieldAttrs: {
                'placeholder': '@attributes->group',
                'data-help': 'The variable can be assigned to a group. Variables of the same group will appear together in the workflow submission form.'
              },
              type: 'Text',
              editorClass: 'popup-input-text-field'
            },
            "Advanced": {
              fieldAttrs: {
                'placeholder': '@attributes->advanced',
                'data-help': 'An advanced variable is not shown by default in the submission form, but can be displayed if needed.'
              },
              type: 'Checkbox',
              editorClass: 'popup-input-text-field textareavalues',
              editorAttrs: {'rows': '1'}
            },
            "Hidden": {
              fieldAttrs: {
                'placeholder': '@attributes->hidden',
                'data-help': 'A hidden variable is never shown in the submission form, but the hidden status can be modified using a model SpEL expression. This can be used to produce dynamic forms.'
              },
              type: 'Checkbox',
              editorClass: 'popup-input-text-field textareavalues',
              editorAttrs: {'rows': '1'}
            }
          }
        },
        "Generic Info": {
          title: 'Workflow Generic Info',
          type: 'List',
          itemType: 'Object',
          fieldAttrs: {
            "data-tab": "Workflow Generic Info",
            'placeholder': 'genericInformation->info',
            "data-help": "Some extra information about your job often used to change the scheduling behavior for a job. E.g. NODE_ACCESS_TOKEN=rack1 will assign this job to a node with token \"rack1\"."
          },
          itemToString: Utils.inlineNameValue,
          itemTemplate: Utils.bigCrossTemplate,
          confirmDelete: 'You are about to remove a property.',
          subSchema: {
            "Property Name": {
              validators: ['required'],
              fieldAttrs: {
                'placeholder': '@attributes->name'
              },
              title: '<br><a target="_blank" href="' + config.docUrl + '/user/ProActiveUserGuide.html#_generic_information">Documentation</a><br><br>Property Name'
            },
            "Property Value": {
              type: 'TextArea',
              validators: ['required'],
              fieldAttrs: {
                'placeholder': '@attributes->value'
              },
              editorClass: 'textareavalues',
              editorAttrs: {'rows': '1'}
            }
          }
        },
        "User Space Url": {
          type: "Text",
          fieldAttrs: {
            "data-tab": "Workflow Data Management",
            'data-tab-help': 'DataSpaces allow to automatically manage File transfer at the level of Job and Tasks.',
            'placeholder': 'userSpace->@attributes->url',
            "data-help": "A User Space which is a personal user data storage. Usually you set this url if you want to use your own dataspace server, not the one that is included into the Scheduler."
          }
        },
        "Global Space Url": {
          type: "Text",
          fieldAttrs: {
            'placeholder': 'globalSpace->@attributes->url',
            "data-help": "A Global Space where anyone can read/write files. Usually you set this url if you want to use your own dataspace server, not the one that is included into the Scheduler."
          }
        },
        "Input Space Url": {
          type: "Text",
          fieldAttrs: {
            'placeholder': 'inputSpace->@attributes->url',
            "data-help": "A private read-only Data Space started manually by user with the proactive-dataserver command."
          }
        },
        "Output Space Url": {
          type: "Text",
          fieldAttrs: {
            'placeholder': 'outputSpace->@attributes->url',
            "data-help": "A private Data Space started manually by user with the proactive-dataserver command."
          }
        },
        "Number of Execution Attempts": {
          type: 'Number',
          fieldAttrs: {
            "data-tab": "Workflow Error Management Policy",
            'data-tab-help': 'Configure workflow behavior upon errors',
            'placeholder': '@attributes->maxNumberOfExecution',
            "data-help": "Defines the maximum number of execution attempts for the tasks."
          }
        },
        "On Task Error Policy": {
          type: 'Select',
          fieldAttrs: {
            'placeholder': '@attributes->onTaskError',
            "data-help": "Actions to take if an error occurs in a task. Setting this property in the job defines the behavior for every task. Each task can overwrite this behavior.<br><br>The actions that are available at the Job level are:<br>&nbsp;&nbsp;- Default: Ignore Error and continue Job execution <br>&nbsp;&nbsp;- In-Error: Continue Job execution, but suspend error-dependent Tasks <br>&nbsp;&nbsp;- Pause: Continue running Tasks, and suspend all others <br>&nbsp;&nbsp;- Cancel: Running Tasks are aborted, and others not started."
          },
          options: [{
              val: "continueJobExecution",
              label: "Default: Ignore Error and continue Job execution"
            },
            {
              val: "suspendTask",
              label: "In-Error: Continue Job execution, but suspend error-dependent Tasks"
            },
            {
              val: "pauseJob",
              label: "Pause: Continue running Tasks, and suspend all others"
            },
            {
              val: "cancelJob",
              label: "Cancel: Running Tasks are aborted, and others not started"
            }
          ]
        },
        "If An Error Occurs Restart Task": {
          type: 'Select',
          fieldAttrs: {
            'placeholder': '@attributes->restartTaskOnError',
            "data-help": "Defines whether tasks that have to be restarted will restart on an other computing node."
          },
          options: ["anywhere", "elsewhere"]
        },
        "Delay Before Retry Task (hh:mm:ss)": {
            type: "Text",
            fieldAttrs: {
                'placeholder': '@attributes->taskRetryDelay',
                "data-help": 'Specifies how long to wait before restart the task in error. <br/><br/>Format is the following:<br/><br/>5 means 5 seconds<br/><br/>10:5 means 10 minutes 5 seconds<br/><br/>1:02:03 is 1 hour 2 minutes and 3 seconds.'
            }
        }
      },
      initialize: function() {

        var StudioApp = require('StudioApp');
        $(function() {
                 $('#workflow-designer-outer').focus();
              });
        this.set({
          "Name": "Untitled Workflow 1"
        });
        this.set({
          "Job Priority": "normal"
        });
        this.set({
          "On Task Error Policy": "continueJobExecution"
        });
        this.set({
          "Number of Execution Attempts": 2
        });
        this.set({
          "If An Error Occurs Restart Task": "anywhere"
        });
        // Generic Info
        this.set({
          "Generic Info": new Array()
        });

        this.set({
          "Generic Info Documentation": "{\"name\":\"Undefined\",\"url\":\"" + config.docUrl + "/user/ProActiveUserGuide.html#_generic_information\"}"
        });

        var that = this;
        this.schema.Variables.subSchema.Model.validators = [
          function checkVariableValue(value, formValues, form) {
            if (formValues.Model.length > 0) {
              if (StudioApp.isWorkflowOpen()) {
                that.updateVariable(formValues);
                var validationData = StudioClient.validate(StudioApp.views.xmlView.generateXml(), StudioApp.models.jobModel, false);
                if (!validationData.valid) {
                  var err = {
                    type: 'Validation',
                    message: "<br><br>" + validationData.errorMessage
                  };
                  return err;
                } else if (formValues.Model && formValues.Model.toUpperCase() === "PA:HIDDEN" && formValues.Value.trim().length > 0) {
                    formValues.Value = validationData.updatedVariables[formValues.Name];
                    if (form) {
                        form.setValue(formValues);
                    }
                }
                delete that.attributes.BackupVariables;
              }
            }
            if(undoManager.isHTML(formValues.Name)){
                var err = {
                    type: 'Validation',
                    message: "<br><br> HTML code is not allowed"
                  };
                  return err;
            }
          }
        ]

        this.schema["Generic Info"].subSchema["Property Value"].validators = [
            function checkInputGenericINfo(value, formValues, form){
                if(undoManager.isHTML(formValues["Property Name"])){
                    var err = {
                        type: 'Validation',
                        message: "<br><br> HTML code is not allowed"
                      };
                      return err;
                }
            }
        ]

        this.schema["Number of Execution Attempts"].validators = [
            function checkNumberOfExecution(value, formValues, form){
                if(value < 1){
                    var err = {
                        type: 'Validation',
                        message: "<br>The value cannot be lower than 1"
                        };
                        return err;
                }
           }
        ];

        this.tasks = [];

        this.on("change", function(updatedData, error) {
          if (updatedData) {
            if (updatedData._changing) {
              // Check if Generic Info doc has been changed and generate new link if needed
              if (updatedData.changed.hasOwnProperty('Generic Info') && updatedData.changed["Generic Info"]["Property Value"] != "") {

                var genericInformation = updatedData.changed["Generic Info"];
                var hasDocumentation;

                // Regenerate new documentation url
                for (var i in genericInformation) {
                  if (genericInformation[i]["Property Name"].toLowerCase() === 'documentation') {
                    hasDocumentation = true;
                    var linkName = genericInformation[i]["Property Value"];
                    var documentationValue = genericInformation[i]["Property Value"];
                    break;
                  } else {
                    hasDocumentation = false;
                  }
                }

                if (hasDocumentation) {
                  // Set New Value, needed for persistance
                  this.set({
                    "Generic Info Documentation": "{\"name\":\"" + linkName + "\",\"url\":\"" + documentationValue + "\"}"
                  });

                  // Needed to update UI
                  $('a[name="Generic Info Documentation"]').text(documentationValue);
                  if (documentationValue.indexOf('://') > 0) {
                    $('a[name="Generic Info Documentation"]').attr("href", documentationValue);
                  } else {
                    if (!documentationValue.startsWith("/")) {
                       documentationValue = "/" + documentationValue;
                    }
                    $('a[name="Generic Info Documentation"]').attr("href", config.docUrl + documentationValue);
                  }

                } else {
                  if ($('a[name="Generic Info Documentation"]')) {
                    $('a[name="Generic Info Documentation"]').text("Undefined");
                    $('a[name="Generic Info Documentation"]').attr("href", "#");
                  }
                }

              } else if (updatedData.changed.hasOwnProperty('Generic Info')) {
                var genericInformation = updatedData.changed["Generic Info"];
                if (genericInformation.length == 0) {
                  // Documentation has been deleted, make sure to update link
                  this.set({
                    "Generic Info Documentation": "{\"name\":\"Undefined\",\"url\":\"#\"}"
                  });

                  if ($('a[name="Generic Info Documentation"]')) {
                    $('a[name="Generic Info Documentation"]').text("Undefined");
                    $('a[name="Generic Info Documentation"]').attr("href", "#");
                  }
                }
              }

              if (StudioApp.views.xmlView) {
                undoManager.save(true);
              }
            }
          } else {
            undoManager.save();
          }
        });
      },

      updateVariable: function(variable) {
        if (!variable.hasOwnProperty('Value') || !variable.Value) {
          variable.Value = "";
        }

        if (this.attributes.hasOwnProperty('Variables')) {
          var variables;
          // we save the original Variables attribute in BackupVariables, and use this afterwards
          // This way, any modification will only be applied to the original Variables object
          // This prevents piling up modifications in the variable list
          if (this.attributes.hasOwnProperty('BackupVariables')) {
            this.attributes.Variables = JSON.parse(JSON.stringify(this.attributes.BackupVariables));
          } else {
            this.attributes.BackupVariables = JSON.parse(JSON.stringify(this.attributes.Variables));
          }
          variables = this.attributes.Variables;
          var index = -1
          for (var i = 0; i < variables.length; i++) {
            if (variables[i].Name == variable.Name) {
              index = i;
              break;
            }
          }
          if (index == -1) {
            variables.push(variable)
          } else {
            variables[index] = variable
          }
        } else {
          this.attributes.Variables = [variable];
        }
      },

      addTask: function(task) {
        this.tasks.push(task);
        // We call these methods in order to save the last state of the workflow
        undoManager._enable();
        undoManager.save();
      },
      removeTask: function(task) {
        var index = this.tasks.indexOf(task)
        if (index != -1) this.tasks.splice(index, 1)
        $.each(this.tasks, function(i, t) {
          t.removeControlFlow(task);
        })
      },
      getDependantTask: function(taskName) {
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
      getTaskByName: function(taskName) {
        for (var i in this.tasks) {
          var task = this.tasks[i];
          if (taskName == task.get('Task Name')) {
            return task;
          }
        }
      },
      getTasksCount: function() {
        return this.tasks.length;
      },
      updateWorkflowName: function(job) {
        this.set({
          "Name": job["@attributes"].name.trim()
        });
      },
      populate: function(obj, merging, isTemplate) {
        var StudioApp = require('StudioApp');
        // remove the unnecessary GI in case of appending workflow to the current one.
        const COMMON_GI = ["bucketname","documentation", "group", "workflow.icon"];
        this.isDragAndDrop = isTemplate;
        if (isTemplate) {
            if(obj[GENERIC_INFORMATION]){
                var jobGenericInfos =  StudioApp.models.jobModel.get("Generic Info");
                if(jobGenericInfos !== 'null' && jobGenericInfos !== 'undefined'){
                    var ExistingCommonGI = jobGenericInfos.filter(info => COMMON_GI.includes(info["Property Name"].toLowerCase())).map(a => a["Property Name"].toLowerCase());
                }
                if(obj[GENERIC_INFORMATION][INFO] instanceof Array){
                   obj[GENERIC_INFORMATION][INFO] = obj[GENERIC_INFORMATION][INFO].filter(info => !ExistingCommonGI.includes(info["@attributes"][NAME].toLowerCase()));
                }else{ // This is a workaround for "Controls tasks"
                   if(Object.keys(obj[GENERIC_INFORMATION][INFO]).map(name => obj[GENERIC_INFORMATION][INFO][name]).filter(info => !ExistingCommonGI.includes(info[NAME].toLowerCase())).length == 0){
                      obj[GENERIC_INFORMATION][INFO] = [];
                   }
                }
            }
            this.populateTemplate(obj, merging);
        } else {
            this.populateSchema(obj, merging);
        }
        this.convertCancelJobOnErrorToOnTaskError(obj);

        var that = this;

        if (obj.taskFlow && obj.taskFlow.task) {

          if (!Array.isArray(obj.taskFlow.task)) {
            obj.taskFlow.task = [obj.taskFlow.task];
          }
          var name2Task = {};
          $.each(obj.taskFlow.task, function(i, task) {
            var taskModel = new Task();
            taskModel.isDragAndDrop = isTemplate;
            taskModel.convertCancelJobOnErrorToOnTaskError(task);
            taskModel.populateSchema(task, merging, isTemplate);
            taskModel.populateSimpleForm();

            // check for unique task name to keep the job valid
            var originalName = taskModel.get("Task Name");

            if (merging && that.getTaskByName(taskModel.get("Task Name"))) {
              var counter = 2;
              while (that.getTaskByName(taskModel.get("Task Name") + counter)) {
                counter++;
              }
              taskModel.set({
                "Task Name": originalName + counter
              });
            }
            that.tasks.push(taskModel);
            name2Task[taskModel.get("Task Name")] = taskModel;
            name2Task[originalName] = taskModel;
            taskModel.isDragAndDrop = false;
          });
          // adding dependencies after all tasks are populated
          $.each(obj.taskFlow.task, function(i, task) {
            var taskModel = name2Task[task['@attributes']['name']]
            if (taskModel && task.depends && task.depends.task) {
              if (!Array.isArray(task.depends.task)) {
                task.depends.task = [task.depends.task];
              }
              $.each(task.depends.task, function(i, dep) {
                if (name2Task[dep['@attributes']['ref']]) {
                  var depTaskModel = name2Task[dep['@attributes']['ref']];
                  taskModel.addDependency(depTaskModel);
                }
              })
            }
          })
          // adding controlFlows after all dependencies are set
          $.each(obj.taskFlow.task, function(i, taskJson) {
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
                taskModel.setreplicate();
                taskModel.controlFlow.replicate.model.populateSchema(taskJson.controlFlow.replicate);
              }
              if (taskJson.controlFlow.loop) {
                var branch = new FlowScript();
                branch.populateSchema(taskJson.controlFlow.loop);
                var loopTarget = taskJson.controlFlow.loop['@attributes']['target'];
                var targetTask = name2Task[loopTarget];
                taskModel.set({
                  'Task Control Flow': 'loop'
                });
                taskModel.controlFlow = {
                  'loop': {
                    task: targetTask,
                    model: branch
                  }
                };
              }
            }
          })
        }

        this.isDragAndDrop = false;

        var genericInformation = this.attributes["Generic Info"];
        var workflowVariables = this.attributes["Variables"];
        // Find duplicates in generic information
        PNotify.removeAll();
        this.findDuplicates("Generic Info", genericInformation, "Property Name", "Property Value");
        // Find duplicates in workflow variables
        this.findDuplicates("Variables", workflowVariables, "Name", "Value");
        // Generate Urls for documentation
        this.generateDocumentUrl(genericInformation);
      },

      getBasicFields: function() {
        return ["Name", "Variables"]
      },

      sortByKey: function(array, key) {
          return array.slice(0).sort((a, b) => a[key].localeCompare(b[key]));
      },

      filterByName: function(array, property, valeur){
          var groupedByName = new Map();
          array.forEach(function(gi) {
            if (gi[property]){
              if (gi[property] && !groupedByName.has(gi[property].toLowerCase())) {
                groupedByName.set(gi[property].toLowerCase(), new Array());
              }
              groupedByName.get(gi[property].toLowerCase()).push(gi[valeur]);
            }
          });
          groupedByName.forEach(function(v, k, map){if(v.length<=1) {map.delete(k);}});
          return groupedByName;
      },

      findDuplicates: function(type, inputArray, property, valeur){
         if (inputArray != null) {
            var myArray = this.sortByKey(inputArray, property);
            var mapResult = this.filterByName(myArray, property, valeur);
            if(mapResult.size>0){
                  this.alertUI('Duplicated ' + type + ' are detected',this.formatObjectsList(mapResult, property, valeur),'notice');
            }
          }
      },

      formatObjectsList: function(inputMap, propertyName, propertyValue) {
          var message = '<span><table cellpadding = "5">';
          var first = true;
          inputMap.forEach(function(value, key, map){ first = true; message = message + '<tr valign = "top"><td><b>'+key+'</b></td><td>'+
            value.map(function(v){
              var str = "";
              if (first){
                   str = ("Initial Value present: ").bold() + v;
                   first=false;
              }
              else{
                  str = ("New Value imported: ").bold() + v;
              }
            return '<table style="width: 100%; max-width: 450px; table-layout: auto; word-break: break-word;"> <tr valign = "top"><td>&#8226;</td><td>'+str+'</td></tr></table>';}).join('')+'</td></tr>';}
          );
          message = message + '</table></span><br><b><i>Please chose which value is appropriate and remove the other(s).</i></b>';
          return message;
      },

      alertUI: function (caption, message, type) {
            new PNotify({
                title: caption,
                text: message,
                textTrusted: true,
                type: type,
                opacity: .8,
                width: '450px',
                stack: myStack,
                addclass: "myStack",
                hide: false,
                buttons: {
                   sticker: false
                }
            });
      },

      generateDocumentUrl: function(genericInformation) {
        var linkName = "Undefined";
        var documentationValue = "Undefined";
        if (this.attributes.hasOwnProperty('Generic Info') && this.attributes["Generic Info"] != "") {
          for (var i in genericInformation) {
            if (genericInformation[i]["Property Name"].toLowerCase() === 'documentation') {
              linkName = genericInformation[i]["Property Value"];
              documentationValue = genericInformation[i]["Property Value"];
            }
          }
        } else {
          console.log("No generic information defined for this job");
        }

        // Set Value
        this.set({
          "Generic Info Documentation": "{\"name\":\"" + linkName + "\",\"url\":\"" + this.generateUrl(documentationValue) + "\"}"
        });
      },

      generateUrl: function(data) {
        var url;

        if (data) {
          if (data.toLowerCase() === 'undefined') {
            url = config.docUrl + '/user/ProActiveUserGuide.html#_a_simple_example';
          } else if (data.indexOf('://') > 0) {
            url = data;
          } else {
            if (!data.startsWith("/")) {
               data = "/" + data;
            }
            url = config.docUrl + data;
          }
        }

        return url;
      }
    })
  })
