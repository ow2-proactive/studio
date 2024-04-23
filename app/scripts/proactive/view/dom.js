define(
    [
        'underscore',
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/view/utils/undo',
        'proactive/view/FileBrowserView',
        'proactive/view/ThirdPartyCredentialView',
        'proactive/rest/studio-client',
        'proactive/model/Task',
        'proactive/view/xml/TaskXmlView',
        'proactive/view/WorkflowView',
        'proactive/view/xml/JobXmlView',
        'xml2json',
        'codemirror',
        'proactive/view/BeautifiedModalAdapter',
        'pnotify',
        'pnotify.buttons',
        'codemirror/mode/shell/shell',
        'codemirror/mode/clike/clike',
        'codemirror/mode/javascript/javascript',
        'codemirror/mode/groovy/groovy',
        'codemirror/mode/ruby/ruby',
        'codemirror/mode/python/python',
        'codemirror/mode/perl/perl',
        'codemirror/mode/php/php',
        'codemirror/mode/powershell/powershell',
        'codemirror/mode/r/r',
        'codemirror/mode/yaml/yaml',
        'codemirror/mode/vbscript/vbscript',
        'codemirror/addon/mode/simple',
        'codemirror/mode/dockerfile/dockerfile',
        'codemirror/addon/comment/comment',
        'codemirror/addon/edit/matchbrackets',
        'codemirror/addon/edit/closebrackets',
        'codemirror/addon/fold/foldcode',
        'codemirror/addon/fold/foldgutter',
        'codemirror/addon/fold/brace-fold',
        'codemirror/addon/fold/indent-fold',
        'codemirror/addon/fold/comment-fold',
        'codemirror/addon/dialog/dialog',
        'codemirror/addon/scroll/annotatescrollbar',
        'codemirror/addon/scroll/simplescrollbars',
        'codemirror/addon/search/searchcursor',
        'codemirror/addon/search/matchesonscrollbar',
        'codemirror/addon/search/search',
        'codemirror/addon/search/jump-to-line',
        'codemirror/addon/search/match-highlighter',
        'codemirror/addon/hint/show-hint',
        'codemirror/addon/hint/anyword-hint',
        'codemirror/addon/selection/active-line',
        'codemirror/keymap/sublime',
        'backbone-forms',
        'list',
        'backboneFormsAdapter',
        'StudioApp',
        'bootstrap',
        'filesaver'
    ],

    function (_, $, Backbone, config, undoManager, FileBrowserView, ThirdPartyCredentialView, StudioClient, Task, TaskXmlView, WorkflowView, JobXmlView, xml2json, CodeMirror, BeautifiedModalAdapter, PNotify) {

        "use strict";

        Backbone.Form.editors.List.Modal.ModalAdapter = BeautifiedModalAdapter;

        Backbone.Form.editors.TaskTypeRadioEditor = Backbone.Form.editors.Radio.extend({
            /** An override which adds onclick handlers to display or hide nested forms, based on the current radio selection. It also adds a custom class to the label */
            _arrayToHtml: function (array) {
                var html = [];
                var self = this;
                var thatArray = array;

                _.each(array, function (option, index) {
                    var itemHtml = '<li';
                    if (_.isObject(option) && option.val) {
                        itemHtml += ' onclick=\'';
                        itemHtml += self._generateHandler.call(self, thatArray, option, index);
                        itemHtml += '\'';
                    }
                    itemHtml += '>';
                    if (_.isObject(option)) {
                        var val = (option.val || option.val === 0) ? option.val : '';
                        itemHtml += ('<input type="radio" name="' + self.getName() + '" value="' + val + '" id="' + self.id + '-' + index + '" />');
                        itemHtml += ('<label class="' + val + '" for="' + self.id + '-' + index + '">' + option.label + '</label>');
                    }
                    else {
                        itemHtml += ('<input type="radio" name="' + self.getName() + '" value="' + option + '" id="' + self.id + '-' + index + '" />');
                        itemHtml += ('<label class="' + val + '" for="' + self.id + '-' + index + '">' + option + '</label>');
                    }
                    itemHtml += '</li>';
                    html.push(itemHtml);
                });

                return html.join('');
            },

            _generateHandler(array, option, index) {
                var handler = "";
                var self = this;
                _.each(array, function (other_option, other_index) {
                    // find the backbone-forms generated id associated with this form
                    var root_id = self.id.substring(0, self.id.lastIndexOf("_"));
                    // find the sibling nested form which must have the same name as the option value, with a _Div suffix
                    var associatedFormId = root_id + ( root_id.length > 0 ? '_' : '') + other_option.val + "_Div";
                    if (other_index == index) {
                       // set the corresponding nested form as visible
                    handler += 'document.getElementById("' + associatedFormId + '").classList.add("displayed");document.getElementById("' + associatedFormId + '").classList.remove("hidden");';
                    } else {
                    // hide all other nested forms
                    handler += 'document.getElementById("' + associatedFormId + '").classList.remove("displayed");document.getElementById("' + associatedFormId + '").classList.add("hidden");';
                    }
                });
                return handler;
            }
        });


        Backbone.Form.editors.Text.prototype.setValue = function(value) {
            this.previousValue = value;
            this.$el.val(value);
        };

        function closeCollapsedMenu() {
            $('.navbar-collapse.in').collapse('hide');
        }

        $("#import-button").click(function (event) {
            add_or_import(event, '#import-file');
        });

        $("#add-button").click(function (event) {
            add_or_import(event, '#add-file');
        });

        function add_or_import(event, buttonSelector){
            event.preventDefault();
            var studioApp = require('StudioApp');
            if (!studioApp.models.currentWorkflow) {
                $('#select-workflow-modal').modal();
                return;
            }
            closeCollapsedMenu();
            $(buttonSelector).parent('form').trigger('reset');
            $(buttonSelector).click();
        }

        $('#import-file').change(function (env) {
            import_file(env, true);
            PNotify.removeAll();

        });

        $('#add-file').change(function (env) {
            import_file(env, false);
        });

        function import_file(env, clearFirst){
            var studioApp = require('StudioApp');
            if (clearFirst){
                studioApp.clear();
            }
            var files = env.target.files;
            if (files.length > 0) {
                var file = files[0];
                if (!file.type.match('text/xml')) {
                   StudioClient.alert("Job descriptor must be a valid XML. Content is not allowed in prolog", "", 'error');
                    return;
                }
                var reader = new FileReader();
                reader.onloadend = function (evt) {

                    if (evt.target.readyState == FileReader.DONE) {
                        var json = xml2json.xmlToJson(xml2json.parseXml(evt.target.result));
                        StudioClient.resetLastValidationResult();
                        if(!StudioClient.validateWithPopup(evt.target.result, json, false, true)){
                           return;
                        }
                        studioApp.merge(json, null);
                        studioApp.updateWorkflowName(json.job);
                        studioApp.views.workflowView.importNoReset();

                    }
                }
                reader.readAsText(file);
            }
        }

        $("#export-button").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }
            save_workflow();
            closeCollapsedMenu();
            studioApp.views.xmlView.render();
            $('#xml-view-modal').modal();
        });

        $("#global-files-button, #global-files-button-tool").click(function (){
            new FileBrowserView({dataspace: "global", varKey: undefined, selectFolder: false}).render();
        });

        $("#user-files-button, #user-files-button-tool").click(function (){
            new FileBrowserView({dataspace: "user", varKey: undefined, selectFolder: false}).render();
        });

        $("#get-from-catalog-button, #get-from-catalog-button-tool").click(function (event) {
            event.preventDefault();
            var studioApp = require('StudioApp');
            studioApp.views.catalogGetView.setKind("workflow/standard", "Workflow");
            studioApp.views.catalogGetView.setObjectNameFilter("") // ensure that the bucket buckets and objects are not filtered
            $("#catalog-get-browse-button").hide();
            studioApp.views.catalogGetView.render();
            $('#catalog-get-modal').modal();
        });

        $("#publish-to-catalog-button, #publish-to-catalog-button-tool").click(function (event) {
            event.preventDefault();
            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen()){
                save_workflow();
                studioApp.views.catalogPublishView.setKind("workflow/standard", "Workflow");
                studioApp.views.catalogPublishView.setContentToPublish(studioApp.views.xmlView.generateXml());
                studioApp.views.catalogPublishView.render();
                studioApp.views.catalogPublishView.triggerClickShowAll();
                $('#catalog-publish-modal').modal();
            }else{
                $('#open-a-workflow-modal').modal();
            }
        });

        function openAddPaletteBucketMenuModal(){
            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen()){
                studioApp.models.catalogBuckets.setKind("workflow");
                studioApp.models.catalogBuckets.fetch({reset: true, async: false});
                studioApp.views.catalogSetSecondaryTemplatesBucketView.render();
                $('#set-templates-secondary-bucket-modal').modal();
            }else{
                $('#open-a-workflow-modal').modal();
            }
        }

        function openSetPresetModal(){
            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen()){
                studioApp.views.setPresetView.render();
                $('#set-preset-modal').modal();
            }else{
                $('#open-a-workflow-modal').modal();
            }
        }

        $("#set-templates-secondary-bucket-button").click(function (event) {
            event.preventDefault();
            openAddPaletteBucketMenuModal();
        });

        $("#catalog-get-as-new-button").click(function (event) {
            workflowImport(event, '#import-workflow-confirmation-modal');
        });

        $("#catalog-get-append-button").click(function (event) {
            workflowImport(event, '#add-workflow-confirmation-modal');
        });

        $("#catalog-get-import-button").click(function (event) {
            $('#import-catalog-object-confirmation-modal').modal();
        });

        $("#catalog-get-select-button").click(function (event) {
            var splitRawUrl = ($(($("#catalog-get-revisions-table .catalog-selected-row"))[0])).data("rawurl").split('/');

            //when you select an object revision from the Import modal, its objectName is already encoded.
            var bucketName = splitRawUrl[1];
            var objectName = decodeURIComponent(splitRawUrl[3]);
            var revisionId;
            if (splitRawUrl.length > 4) {
                revisionId = splitRawUrl[5];
            }
            var selectedObjectValue;
            if (revisionId) {
                selectedObjectValue = `${bucketName}/${objectName}/${revisionId}`;
            } else {
                selectedObjectValue = `${bucketName}/${objectName}`;
            }

            var studioApp = require('StudioApp');
            var updatedVarKey = studioApp.views.catalogGetView.varKey;
            var updatedVar = {[updatedVarKey]: selectedObjectValue};
            if ($("#workflow-variables-modal").data('bs.modal') && $("#workflow-variables-modal").data('bs.modal').isShown) {
                studioApp.views.workflowVariablesView.updateVariableValue(updatedVar);
            } else {
                studioApp.views.jobVariableView.updateVariableValue(updatedVar);
            }

            $('#catalog-get-modal').modal('hide');
        });

        $('#catalog-get-modal').on('hidden.bs.modal', function() {
            var studioApp = require('StudioApp');
            studioApp.views.catalogGetView.clearFilter();
            var previousZIndex = studioApp.views.catalogGetView.previousZIndex;
            if (previousZIndex) {
                $("#catalog-get-modal").css("z-index", previousZIndex);
            }
        });

        function workflowImport(e, modalSelector) {
            var studioApp = require('StudioApp');
            var url = $("#catalog-get-revision-description").data("selectedrawurl");

            getWorkflowFromCatalog(url, function (response) {
                studioApp.xmlToImport = new XMLSerializer().serializeToString(response);
                $(modalSelector).modal();
            });
        }

         function getWorkflowFromCatalog(url, successCallback) {
            var headers = { 'sessionID': localStorage['pa.session'] };

            $.ajax({
                url: url,
                type: 'GET',
                headers: headers
            }).success(function (response) {
                successCallback(response);
            }).error(function (response) {
                StudioClient.alert('Error', 'Error importing selected Workflow: ' + JSON.stringify(response), 'error');
            });
        }

        $("#menu-reference").click(function(event) {
            event.preventDefault();
            //make the reference dropdown draggable
            $("#span-reference-draggable").draggable({
                helper: "original",
                distance: 20,
                stop: 200
            });
            //make the reference dropdown empty
            $("#ul-reference").empty();
            //add pin Open as first item in the dropdown
            var pinOpen = $('<li id="li-pin-reference" role="presentation" class="dropdown-header pipeline-header">' +
                          '<div id="ul-reference-toggle-pin"><img src="images/icon-pin.png"> Pin open </div> <div class="pipeline-title"> <span style="font-size: medium;">Scripts being Called by Current Workflow</span></div></li>');
            $("#ul-reference").append(pinOpen);
            var menuElement = $('#ul-reference').parent();
            if (!menuElement.hasClass('dropdown')) {
                $("#ul-reference-toggle-pin").html('<img src="images/icon-unpin.png"> Unpin');
            }
            //pinUnpin function pin/unpin the menu
            $("#li-pin-reference").click(function(event) {
                pinUnpin($("#ul-reference"), $("#ul-reference-toggle-pin"));
            });

            var studioApp = require('StudioApp');
            var tasks = studioApp.models.jobModel.tasks;
            var tasksArray = [];
            for (var i = 0; i < tasks.length; i++) {
                tasksArray[i] = tasks[i];
            }

            //isReferencingScripts becomes true when there is at least one called script
            var isReferencingScripts = false;
            var itemsReference = [];
            var liReferenceStyle = '<li class="sub-menu draggable ui-draggable job-element"><a style="color:#337ab7; display: table-cell; padding:3px 10px;min-width: 180px;"  class="select-task-reference"><span>';
            var liNoReferenceStyle = '<li class="sub-menu draggable ui-draggable job-element"><a style="display: table-cell; padding:3px 10px;min-width: 180px;">';
            for (var i = 0; i < studioApp.views.workflowView.taskViews.length; i++) {
                var taskViewModel = studioApp.views.workflowView.taskViews[i];
                var currentReferencedScripts = taskViewModel.getTaskReferencingScriptsInModel();
                if (JSON.stringify(currentReferencedScripts) != "{}") {
                    isReferencingScripts = true;
                    for (var key of Object.keys(currentReferencedScripts)) {
                        var currentTaskName = key.split(":")[0];
                        var currentScriptType = key.split(":")[1];
                        var currentUrl = currentReferencedScripts[key].replace("${PA_CATALOG_REST_URL}", window.location.origin);

                        var menuItemReference = $(liReferenceStyle + currentTaskName + '</span></a><span style="display: table-cell; padding:3px 10px;min-width: 150px"> ' + currentScriptType + ' </span><span style="color:#337ab7; display: table-cell; padding:3px 20px;"><div class="input-group" style="display:inline-flex;" id="direct-object-url"> <input tooltip="' + currentUrl + '" type="text" class="form-control" id="reference-object-url-input" ng-disable="true" style=" width: 500px; " value="' + currentUrl + '"> <button class="reference-object-url-button btn btn-default" data-toggle="tooltip" title="Copy to clipboard" style="padding:4px 12px;"> <i class="fa fa-clone"></i> </button> </div></span></li>');
                        itemsReference.push(menuItemReference);
                    }
                }
            }
            //If no references are detected, we add a simple message
            if (!isReferencingScripts) {
                var menuItemReference = $(liNoReferenceStyle + 'There are no called scripts</a></li>');
                $("#ul-reference").append(menuItemReference);
            } else {
                var menuHeadersReference = $('<li id="menuHeadersReference" class="sub-menu draggable ui-draggable job-element"><span style="font-weight: bold; display: table-cell; padding:3px 10px;min-width: 180px;">Task Name</span><span style="font-weight: bold; display: table-cell; padding:3px 10px;min-width: 159px">Task Section</span><span style="font-weight: bold; display: table-cell; padding:3px 10px">Script Reference URL</span></li>');
                $("#ul-reference").append(menuHeadersReference);
                itemsReference.forEach(function(item){
                    $("#ul-reference").append(item);
                })
            }
            $(".reference-object-url-button").click(function(event) {
                var parent = $(this).closest('#direct-object-url');
                var inputCopy = parent.find("#reference-object-url-input");
                inputCopy.select();
                document.execCommand("copy");
            });
            $(".select-task-reference").click(function(event) {
                var parent = $(event.currentTarget).parent().children().children()[0].innerHTML;
                var existingTasks = $('.task-name .name');
                existingTasks.each(function(index) {
                    $(this).parent().parent().removeClass("selected-task");
                    $(this).parent().parent().removeClass("active-task");
                    if ($(this).text() == parent) {
                        $(this).parent().parent().addClass("selected-task");
                        $(this).parent().parent().addClass("active-task");
                        $(this).parent().click();
                    }
                });

                var parent2 = $(event.currentTarget).parent().children()[1].innerHTML;
                var index = 1;
                switch (parent2.trim()) {
                    case 'Task Implementation':
                        index = 7;
                        break;
                    case 'Pre Script':
                        index = 8;
                        break;
                    case 'Post Script':
                        index = 8;
                        break;
                    case 'Clean Script':
                        index = 8;
                        break;
                    case 'Node Selection Script':
                        index = 10;
                        break;
                    case 'Environment Script':
                        index = 11;
                        break;
                    case 'Control Flow Script':
                        index = 12;
                        break;
                }
                //Hide the current panel
                $('.panel-body.in').collapse('hide')
                //Show the section
                $('#accordion-properties > div:nth-child(' + index + ')').children().last().collapse('show')


            });
        });

        $("#menu-calling").click(function(event) {
            event.preventDefault();
            //make the calling dropdown draggable
            $("#span-calling-draggable").draggable({
                helper: "original",
                distance: 20,
                stop: 200
            });
            //make the calling dropdown empty
            $("#ul-calling").empty();
            //add pin Open as first item in the dropdown
            var pinOpen = $('<li id="li-pin-calling" role="presentation" class="dropdown-header pipeline-header">'+
                           '<div id="ul-calling-toggle-pin"><img src="images/icon-pin.png"> Pin open </div><div class="pipeline-title"><span style="font-size: medium;">Workflows being Called by Current Workflow</span></div></li>');
            $("#ul-calling").append(pinOpen);
            var menuElement = $('#ul-calling').parent();
            if (!menuElement.hasClass('dropdown')) {
                $("#ul-calling-toggle-pin").html('<img src="images/icon-unpin.png"> Unpin');
            }
            //pinUnpin function pin/unpin the menu
            $("#li-pin-calling").click(function(event) {
                pinUnpin($("#ul-calling"), $("#ul-calling-toggle-pin"));
            });

            var studioApp = require('StudioApp');
            var tasks = studioApp.models.jobModel.tasks;
            var tasksArray = [];
            for (var i = 0; i < tasks.length; i++) {
                tasksArray[i] = tasks[i];
            }
            //isCallingObjects becomes true when there is at least one called catalog object
            var isCallingObjects = false;
            var liCallingStyle = '<li class="sub-menu draggable ui-draggable job-element"><a style="color:#337ab7; display: table-cell; padding:3px 10px;min-width: 250px;"  class="select-task"><span>';
            var liNoCallingStyle = '<li class="sub-menu draggable ui-draggable job-element"><a style="display: table-cell; padding:3px 10px;min-width: 180px;">';
            var itemsCalling = [];
            for (var i = 0; i < tasksArray.length; i++) {
                var task = tasksArray[i];
                if (task.has('Variables')) {
                    var variables = task.get('Variables');
                    var taskName = " ";
                    for (var j = 0; j < variables.length; j++) {
                        var variable = variables[j];
                        if (variable.Model && variable.Model.includes("PA:CATALOG_OBJECT")) {
                            isCallingObjects = true;
                            var tName = task.get('Task Name');
                            //we add the task name only the first time, else we print empty string
                            if (tName != taskName && taskName != "") {
                                taskName = tName;
                            } else {
                                taskName = "";
                            }
                            var variableValue = variable.Value;
                            if (variableValue) {
                                var taskViewModel = studioApp.views.workflowView.taskViews[0];
                                var calledObjectDetails = taskViewModel.getCalledObjectDetails(variableValue)
                                var objectKind = taskViewModel.getObjectKind(calledObjectDetails["bucketName"], calledObjectDetails["objectName"])
                                if (objectKind.indexOf('Workflow') == 0) {
                                    var menuItemCalling = $(liCallingStyle + taskName + '</span></a><span style="display: table-cell; padding:3px 10px;min-width: 300px"> ' + variableValue + '</span><a href="/studio/#workflowcatalog/' + calledObjectDetails["bucketName"] + '/workflow/' + calledObjectDetails["objectName"] + '" target="_blank" style="color:#337ab7; display: table-cell;"><span><i title="Open the workflow in a new Studio Tab" class="glyphicon glyphicon-eye-open"></i></span></a></li>');
                                } else if (objectKind == "null") {
                                    var menuItemCalling = $(liCallingStyle + taskName + '</a><a title="The selected workflow or object does not exist" style="color:red; display: table-cell; padding:3px 10px;min-width: 250px"> ' + variableValue + '</a><a style="display: table-cell;"><i title="The selected workflow or object does not exist" class="glyphicon glyphicon-eye-close"></i></a></li>');
                                } else {
                                    var menuItemCalling = $(liCallingStyle + taskName + '</a><span style="display: table-cell; padding:3px 10px;min-width: 300px"> ' + variableValue + '</span><a style="display: table-cell;"><i title="You cannot open non-workflows objects in the Studio" class="glyphicon glyphicon-eye-close"></i></a></li>');
                                }
                            } else {
                                var menuItemCalling = $(liCallingStyle + taskName + '</a><a title="The variable calling a catalog object is empty" style="color:red; display: table-cell; padding:3px 10px;min-width: 250px"> [Empty Catalog Object Variable] </a><a style="display: table-cell;"><i title="You cannot open empty workflows in the Studio, select a workflow first" class="glyphicon glyphicon-eye-close"></i></a></li>');
                            }
                            itemsCalling.push(menuItemCalling);
                        }
                    }
                }
            }
            //If no PA:CATALOG_OBJECT variable is detected, we add a simple message
            if (!isCallingObjects) {
                var menuItemCalling = $(liNoCallingStyle + 'There are no called workflows or objects</a></li>');
                $("#ul-calling").append(menuItemCalling);
            } else {
                var menuHeadersCalling = $('<li id="menuHeadersCalling" class="sub-menu draggable ui-draggable job-element"><span style="font-weight: bold; display: table-cell; padding:3px 10px;min-width: 250px;">Task Name</span><span style="font-weight: bold; display: table-cell; padding:3px 10px;min-width: 300px">Workflow Name</span><span style="font-weight: bold; display: table-cell; padding:3px 10px">Open</span></li>');
                $("#ul-calling").append(menuHeadersCalling);
                itemsCalling.forEach(function(item){
                   $("#ul-calling").append(item);
                })
            }

            $(".select-task").click(function(event) {
                var parent = $(event.currentTarget).parent().children().children()[0].innerHTML;
                var existingTasks = $('.task-name .name');
                existingTasks.each(function(index) {
                    $(this).parent().parent().removeClass("selected-task");
                    $(this).parent().parent().removeClass("active-task");
                    if ($(this).text() == parent) {
                        $(this).parent().parent().addClass("selected-task");
                        $(this).parent().parent().addClass("active-task");
                        $(this).parent().click();
                        //Hide the current panel
                        $('.panel-body.in').collapse('hide')
                        //Show the section
                        $('#accordion-properties > div:nth-child(3)').children().last().collapse('show')
                    }
                });
            });

        });

        $("#menu-called").click(function(event) {
            event.preventDefault();
            //make the called by dropdown draggable
            $("#span-called-draggable").draggable({
                helper: "original",
                distance: 20,
                stop: 200
            });
            //make the called by dropdown empty
            $("#ul-called").empty();
            //add pin Open as first item in the dropdown
            var pinOpen = $('<li id="li-pin" role="presentation" class="dropdown-header pipeline-header">' +
                          '<div id="ul-called-toggle-pin"><img src="images/icon-pin.png"> Pin open </div><div class="pipeline-title"><span style="font-size: medium;">Workflows Calling Current Workflow</span></div></li>')
            $("#ul-called").append(pinOpen);
            var menuElement = $('#ul-called').parent();
            if (!menuElement.hasClass('dropdown')) {
                $("#ul-called-toggle-pin").html('<img src="images/icon-unpin.png"> Unpin');
            }
            //pinUnpin function pin/unpin the menu
            $("#li-pin").click(function(event) {
                pinUnpin($("#ul-called"), $("#ul-called-toggle-pin"));
            });

            var studioApp = require('StudioApp');
            //get the workflow name from the model
            var jobName = studioApp.models.jobModel.get("Name");
            //we get the bucket name from the generic info of the model
            var genericInformation = studioApp.models.jobModel.get("Generic Info");
            if (genericInformation) {
                for (var i in genericInformation) {
                    if (genericInformation[i]["Property Name"].toLowerCase() === 'bucketname') {
                        var bucketName = genericInformation[i]["Property Value"];
                    }
                }
            }
            var urlCatalog = "/catalog/buckets/" + bucketName + "/resources/" + jobName + "/dependencies";
            //call the rest endpoint to get the list of workflows calling the current workflow
            getWorkflowDependencies(urlCatalog, function(res) {
                var liCalledStyle = '<li class="sub-menu draggable ui-draggable job-element"><a style="padding:3px 10px;">';
                if (res.called_by) {
                    var x = res.called_by + "";
                    if (x == "") {
                        var menuItemCalled = $(liCalledStyle + 'No parent workflows are identified</a></li>');
                        $("#ul-called").append(menuItemCalled);
                    } else {
                        // add the header
                        var menuHeadersCalled = $('<li id= "menuHeadersCalled" class="sub-menu draggable ui-draggable job-element"><span style="font-weight:bold;padding:3px 10px;">Workflow Name</span><span style="font-weight: bold;padding:3px 10px">Open</span></li>');
                        $("#ul-called").append(menuHeadersCalled);

                        const calledByWorkflowArray = x.split(",");
                        for (let i = 0; i < calledByWorkflowArray.length; i++) {
                            var menuItemCalled = $(liCalledStyle + calledByWorkflowArray[i].split("/")[0] + '/' + calledByWorkflowArray[i].split("/")[1] + '<a href="/studio/#workflowcatalog/' + calledByWorkflowArray[i].split("/")[0] + '/workflow/' + calledByWorkflowArray[i].split("/")[1] + '" target="_blank" style="color:#337ab7; display: table-cell;" href="javascript:void(0)"><i title="Open the workflow in a new Studio Tab" class="glyphicon glyphicon-eye-open"></i></a></a></li>');
                            $("#ul-called").append(menuItemCalled);
                        }
                    }
                } else {
                    var menuItemCalled = $(liCalledStyle + 'The current workflow does not exist in the Catalog</a></li>');
                    $("#ul-called").append(menuItemCalled);
                }
            });

        });

        function pinUnpin(element, liElement) {
            var menuElement = element.parent();
            var className = menuElement.attr('class');
            var keepFromClosing = function() {
                return false;
            };
            if (menuElement.hasClass('dropdown')) { //not pinned yet
                menuElement.removeClass('dropdown');
                menuElement.bind('hide.bs.dropdown', keepFromClosing);
                liElement.html('<img src="images/icon-unpin.png"> Unpin');
            } else { //pinned
                menuElement.addClass('dropdown');
                menuElement.unbind('hide.bs.dropdown');
                menuElement.removeClass('open'); //close the dropdown
                liElement.html('<img src="images/icon-pin.png"> Pin open');
            }
        }

        function getWorkflowDependencies(url, successCallback) {
            var headers = {
                'sessionID': localStorage['pa.session']
            };
            $.ajax({
                'url': url,
                type: 'GET',
                headers: headers
            }).success(function(response) {
                successCallback(response);
            }).error(function(response) {
                successCallback(response);
            });
        }

        function getWorkflowFromScheduler(url, successCallback) {
            $.ajax({
                url: url,
                type: 'GET',
                headers: {
                    'sessionId': localStorage['pa.session']
                }
            }).success(function (response) {
                successCallback(response);
            }).error(function (response) {
                StudioClient.alert('Error', 'Error importing selected Workflow from the Scheduler: ' + JSON.stringify(response), 'error');
            });
        }

        $("#catalog-publish-current").click(function (event) {
            $('#publish-current-confirmation-modal').modal();
        });

        $("#set-templates-main-bucket-select-button").click(function () {
            var bucketName = ($(($("#catalog-set-templates-main-bucket-table .catalog-selected-row"))[0])).text();
            var currentWfId = require('StudioApp').models.currentWorkflow.id;
            require('StudioApp').router.navigate('workflows/'+currentWfId+'/templates/'+bucketName, {trigger: true});
        });

        $("#set-templates-secondary-bucket-select-button").click(function () {
            var bucketName = ($(($("#catalog-set-templates-secondary-bucket-table .catalog-selected-row"))[0])).text();
            // Leave modal open if bucket could not be added (normally because it's already in the Palette)
            if (require('StudioApp').views.paletteView.addPaletteBucketMenu(bucketName, false)){
                $('#set-templates-secondary-bucket-modal').modal('hide');
            }
        });

        // Set default preset on startup
        if (!localStorage['palettePreset']){
            localStorage.setItem('palettePreset',config.default_preset);
        }

        $("#set-preset-button").click(function (event) {
            event.preventDefault();
            openSetPresetModal();
        });

        $("#set-preset-select-button").click(function () {
            var presetName = ($(($("#presets-set-preset-table .preset-selected-row"))[0])).text();
            var selectedIndex = config.palette_presets.findIndex(function(obj) {return obj.name==presetName});
            require('StudioApp').views.paletteView.render(selectedIndex, true);
        });

        $("#studio-bucket-title").on( 'click', '#preset-title > #presets-list > li > a', function () {
            var presetName = $(this).text();

            var selectedIndex = config.palette_presets.findIndex(function(obj) {return obj.name==presetName});
            require('StudioApp').views.paletteView.render(selectedIndex, true);
        });

        window.onresize = updateDimensions;

        window.onload = updateDimensions;

        function updateDimensions() {

            var windowWidth = document.documentElement.clientWidth;
            var right = document.getElementById('ae-logo').offsetWidth;
            var left = document.getElementById('shortcuts-toolbar').offsetWidth;
            var container = document.getElementById('preset-caret').offsetWidth; //20 is the left/right padding value of the container

            var presetTitle = document.getElementById('preset-title-text');
            var oldWidth = presetTitle.offsetWidth;
            var availableWidth = windowWidth - (right + left + container);

            if (windowWidth == 1200) {
                presetTitle.style.width = '31px';
            } else if (oldWidth >= availableWidth || availableWidth > 10) {
                presetTitle.style.width = (availableWidth-20) + 'px';
            }
        }

        $("#layout-button").click(function (event) {
            event.preventDefault();
            require('StudioApp').views.workflowView.autoLayout();
            save_workflow();
        });

        $("#add-bucket-button").click(function (event) {
            event.preventDefault();
            openAddPaletteBucketMenuModal();
        });

        $("#pin-palette-button").click(function (event) {
            event.preventDefault();
            require('StudioApp').views.paletteView.pinPalette();
        });
        $("#zoom-in-button").click(function (event) {
            event.preventDefault();
            require('StudioApp').views.workflowView.zoomIn();
        });
        $("#zoom-out-button").click(function (event) {
            event.preventDefault();
            require('StudioApp').views.workflowView.zoomOut();
        });
        $("#zoom-reset-button").click(function (event) {
            event.preventDefault();
            require('StudioApp').views.workflowView.setZoom(1);
        });

        function initializeSubmitFormForTaskVariables() {
            var toggler = document.getElementsByClassName("caretUL");
            var i;

            for (i = 0; i < toggler.length; i++) {
                toggler[i].addEventListener("click", function() {
                    this.parentElement.querySelector(".nestedUL").classList.toggle("activeUL");
                    this.classList.toggle("caretUL-down");
                });
            }
        }

        function getToggledTasks() {
            var toggler = document.getElementsByClassName("caretUL");
            var toggledTasks = [];
            for (let i = 0; i < toggler.length; i++) {
                if (toggler[i].classList.contains("caretUL-down")) {
                    var elementName = toggler[i].getAttribute("for");
                    toggledTasks.push(elementName);
                }
            }
            return toggledTasks;
        }

        function openSubmissionView(event){
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();

            var jobName = studioApp.models.jobModel.get("Name");
            var jobProjectName = studioApp.models.jobModel.get("Project");
            var jobTags = studioApp.models.jobModel.get("Tags");
            var jobDescription = studioApp.models.jobModel.get("Description");
            var jobDocumentation = studioApp.models.jobModel.get("Generic Info Documentation");
            var jobGenericInfos = studioApp.models.jobModel.get("Generic Info");

            var jobVariablesOriginal = readOrStoreVariablesInModel();

            var jobVariables = {};

            var validationData = validate();

            if (validationData.updatedModels && validationData.updatedVariables) {

                var jobVariablesByGroup = new Map();
                jobVariablesByGroup.set("NOGROUP", new Map());
                // first, add only job variables defined in the workflow
                for (var key of Object.keys(jobVariablesOriginal)) {
                    if (key.indexOf(":") < 0) {
                        var originalVar = jobVariablesOriginal[key];
                        var variable = { 'Name': originalVar.Name, 'Value': originalVar.Value, 'Model': originalVar.Model, 'Description': originalVar.Description, 'Group': originalVar.Group, 'Advanced': originalVar.Advanced, 'Hidden': originalVar.Hidden, 'resolvedModel': validationData.updatedModels[key], 'resolvedHidden': validationData.updatedHidden[key] }
                        addVariableToGroup(key, variable, jobVariablesByGroup);
                    }
                }
                // then, add global variables not defined in the workflow
                for (var key of Object.keys(validationData.updatedVariables)) {
                    if (key.indexOf(":") < 0 && !jobVariablesOriginal.hasOwnProperty(key)) {
                        var variable = { 'Name': key, 'Value': validationData.updatedVariables[key], 'Model': validationData.updatedModels[key], 'Description': validationData.updatedDescriptions[key], 'Group': validationData.updatedGroups[key], 'Advanced': validationData.updatedAdvanced[key], 'Hidden': validationData.updatedHidden[key], 'resolvedModel': validationData.updatedModels[key], 'resolvedHidden': validationData.updatedHidden[key] }
                        addVariableToGroup(key, variable, jobVariablesByGroup);
                    }
                }
                // Add all grouped variables to the final structure
                addVariablesInGroupOrder(jobVariablesByGroup, jobVariables);

                // finally, add task variables
                var lastTaskName = null;
                for (var key of Object.keys(jobVariablesOriginal)) {
                    if (key.indexOf(":") >= 0) {
                        var splitted = key.split(":");
                        var currentTaskName = splitted[0];
                        if (lastTaskName == null) {
                            lastTaskName = currentTaskName;
                            jobVariablesByGroup = new Map();
                            jobVariablesByGroup.set("NOGROUP", new Map());
                        } else if (lastTaskName !== currentTaskName) {
                            // new task found, add all collected variables
                            addVariablesInGroupOrder(jobVariablesByGroup, jobVariables);
                            jobVariablesByGroup = new Map();
                            jobVariablesByGroup.set("NOGROUP", new Map());
                            lastTaskName = currentTaskName;
                        }
                        var originalVar = jobVariablesOriginal[key];
                        var variable = { 'Name': originalVar.Name, 'Value': originalVar.Value, 'Model': originalVar.Model, 'Description': originalVar.Description, 'Group': originalVar.Group, 'Advanced': originalVar.Advanced, 'Hidden': originalVar.Hidden, 'resolvedModel': validationData.updatedModels[key], 'resolvedHidden': validationData.updatedHidden[key] }
                        addVariableToGroup(key, variable, jobVariablesByGroup);
                    }
                }
                addVariablesInGroupOrder(jobVariablesByGroup, jobVariables);
            }
            if ($.isEmptyObject(jobVariables)) {
                executeIfConnected(submit);
                return;
            }
            $('#execute-workflow-modal').modal();
            studioApp.views.jobVariableView.render({
                'jobVariables': jobVariables,
                'jobName': jobName,
                'jobProjectName': jobProjectName,
                'jobTags': jobTags,
                'jobDescription': jobDescription,
                'jobDocumentation': jobDocumentation,
                'jobGenericInfos': jobGenericInfos,
                'errorMessage': '',
                'infoMessage': '',
                'showAdvanced': false,
                'showHidden': false,
                'toggledTasks': []
            });

            initializeSubmitFormForTaskVariables();
        }

        function addVariableToGroup(key, variableToAdd, groupsAndVariables) {
            var group = "NOGROUP";
            if (variableToAdd.Group && variableToAdd.Group !== "") {
                group = variableToAdd.Group;
            }
            if (!groupsAndVariables.has(group)) {
                groupsAndVariables.set(group, new Map());
            }
            var groupSize = groupsAndVariables.get(group).size;
            if (groupSize === 0) {
                variableToAdd.isTop = true;
                variableToAdd.isBottom = true;
            } else {
                variableToAdd.isBottom = true;
                var previous = Array.from(groupsAndVariables.get(group).keys())[groupSize - 1];
                groupsAndVariables.get(group).get(previous).isBottom = false;
            }
            groupsAndVariables.get(group).set(key, variableToAdd);
        }

        function addVariablesInGroupOrder(groupsAndVariables, variablesJob) {
            for (var group of groupsAndVariables.keys()) {
                var groupVarsMap = groupsAndVariables.get(group);
                for (var key of groupVarsMap.keys()) {
                    variablesJob[key] = groupVarsMap.get(key);
                }
            }
        }

        function openVariablesView(event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();

            var jobModel = studioApp.models.jobModel;

            var jobVariables = {};

            var jobVariablesByGroup = new Map();
            jobVariablesByGroup.set("NOGROUP", new Map());
            // first, add only job variables defined in the workflow
            if (jobModel.attributes.Variables) {
                for (var variable of jobModel.attributes.Variables) {
                    addVariableToGroup(variable.Name, variable, jobVariablesByGroup);
                }
            }
            // Add all grouped variables to the final structure
            addVariablesInGroupOrder(jobVariablesByGroup, jobVariables);

            $('#workflow-variables-modal').modal();
            studioApp.views.workflowVariablesView.render({
                'jobModel': jobModel,
                'jobVariables': jobVariables,
                'showAdvanced': false,
                'showHidden': false
            });
        }

        function changeVariableOrder(variableName, order) {
            var studioApp = require('StudioApp');

            var variablesNewOrder = studioApp.views.workflowVariablesView.updateVariables();

            var actualVarIndex = variablesNewOrder.findIndex(function (variable) {
                return variable.Name === variableName
            });
            var actualVariable = variablesNewOrder[actualVarIndex];

            console.log(variablesNewOrder)

            for (var i = actualVarIndex + order; (order > 0) ? i < variablesNewOrder.length : i >= 0; i += order) {
                if (variablesNewOrder[i].Group === actualVariable.Group) {
                    variablesNewOrder.splice(actualVarIndex, 1);
                    variablesNewOrder.splice(i, 0, actualVariable);

                    studioApp.models.jobModel.set({"Variables": variablesNewOrder});
                    studioApp.views.workflowView = new WorkflowView({model: studioApp.models.jobModel, app: studioApp});
                    studioApp.views.xmlView = new JobXmlView({model: studioApp.models.jobModel});
                    studioApp.views.workflowView.importNoReset();

                    refreshVariablesView(variablesNewOrder)
                    break;
                }
            }
        }

        $("#plan-button").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();

            $("#plan-workflow-modal").modal();
        });

        $("#exec-button").click(function (event) {
            executeOrCheck(event, false, false)
        });

        $("#check-button").click(function (event) {
            executeOrCheck(event, true, false)
        });

        $("#workflow-variables-modal,#execute-workflow-modal,#variable-editor-modal").on('hidden.bs.modal', function () {
            $(this).data('bs.modal', null);
        });

        // show ThirdPartyCredential modal with updated value of the corresponding variable
        $(document).on("click", '.third-party-credential-button', function (event) {
            var varKey = event.currentTarget.getAttribute('value');
            var varValue = event.currentTarget.parentElement.querySelector('.variableValue').value;
            var isWorkflowVariablesView = $("#workflow-variables-modal").data('bs.modal') && $("#workflow-variables-modal").data('bs.modal').isShown
            executeOrCheck(event, true, false, function(response) {
                if (response && response.updatedVariables && varKey in response.updatedVariables) {
                    varValue = response.updatedVariables[varKey];
                }
                new ThirdPartyCredentialView({credKey: varValue}).render();
            },isWorkflowVariablesView);
        });

        function executeOrCheck(event, check, plan, handler,isWorkflowVariablesView) {
            var studioApp = require('StudioApp');
            executeIfConnected(function () {
                var oldVariables = readOrStoreVariablesInModel();
                var inputVariables = {};
                var inputReceived = isWorkflowVariablesView?$('#workflow-variables-mode .variableValue'):$('#job-variables .variableValue');
                var showAdvanced = $('#advanced-checkbox').is(":checked");
                var showHidden = $('#hidden-checkbox').is(":checked");
                var toggledTasks = getToggledTasks();

                var extractVariableName = function (key) { return (key.split(":").length === 2 ? key.split(":")[1] : key) };
                var isTaskVariable = function (key) { return (key.split(":").length === 2) };
                var checkBoolean = function (value) { return "true" === value || true === value };
                function setInheritedField(key) {
                  if (isTaskVariable(key)) {
                    inputVariables[key].Inherited = false;
                  }
                }
                for (var i = 0; i < inputReceived.length; i++) {
                    var input = inputReceived[i];
                    if ($(input).prop("tagName")==='SELECT') {
                        inputVariables[input.id] = {'Name': extractVariableName(input.name), 'Value':  $(input).find(':selected').text(), 'Model': $(input).data("variable-model"), 'Description': $(input).data("variable-description"), 'Group': $(input).data("variable-group"), 'Advanced': checkBoolean($(input).data("variable-advanced")), 'Hidden': checkBoolean($(input).data("variable-hidden"))};
                        setInheritedField(input.id);
                    } else if ($(input).prop("tagName")==='INPUT') {
                        inputVariables[input.id] = {'Name': extractVariableName(input.name), 'Value': input.value, 'Model': $(input).data("variable-model"), 'Description': $(input).data("variable-description"), 'Group': $(input).data("variable-group"), 'Advanced': checkBoolean($(input).data("variable-advanced")), 'Hidden': checkBoolean($(input).data("variable-hidden"))};
                        setInheritedField(input.id);
                    } else if ($(input).prop("tagName")==='DIV') {
                        var checkedRadio = $(input).find("input[type='radio']:checked");
                        var checkRadioValue = $(checkedRadio).val();
                        var inputName = $(checkedRadio).attr('name');
                        inputVariables[input.id] = {'Name': extractVariableName(inputName), 'Value': checkRadioValue, 'Model': $(input).data("variable-model"), 'Description': $(input).data("variable-description"), 'Group': $(input).data("variable-group"), 'Advanced': checkBoolean($(input).data("variable-advanced")), 'Hidden': checkBoolean($(input).data("variable-hidden"))};
                        setInheritedField(input.id);
                    } else if ($(input).prop("tagName")==='TEXTAREA') {
                        inputVariables[input.id] = {'Name': extractVariableName(input.name), 'Value': input.value, 'Model': $(input).data("variable-model"), 'Description': $(input).data("variable-description"), 'Group': $(input).data("variable-group"), 'Advanced': checkBoolean($(input).data("variable-advanced")), 'Hidden': checkBoolean($(input).data("variable-hidden"))};
                        setInheritedField(input.id);
                    }
                }
                readOrStoreVariablesInModel(inputVariables);
                var jobName = studioApp.models.jobModel.get("Name");
                var jobProjectName = studioApp.models.jobModel.get("Project");
                var jobTags = studioApp.models.jobModel.get("Tags");
                var jobDescription = studioApp.models.jobModel.get("Description");
                var jobDocumentation = studioApp.models.jobModel.get("Generic Info Documentation");
                var jobGenericInfos = studioApp.models.jobModel.get("Generic Info");

                var validationData = validate();

                if (!validationData.valid) {
                    var jobVariables = extractUpdatedVariables(inputVariables, validationData);
                    studioApp.views.jobVariableView.render({
                        'jobVariables': jobVariables,
                        'jobName': jobName,
                        'jobProjectName': jobProjectName,
                        'jobTags': jobTags,
                        'jobDescription': jobDescription,
                        'jobDocumentation': jobDocumentation,
                        'jobGenericInfos': jobGenericInfos,
                        'errorMessage': validationData.errorMessage,
                        'infoMessage': '',
                        'showAdvanced': showAdvanced,
                        'showHidden': showHidden,
                        'toggledTasks': toggledTasks
                    });
                } else if (check) {
                    studioApp.views.jobVariableView.render({
                        'jobVariables': extractUpdatedVariables(inputVariables, validationData),
                        'jobName': jobName,
                        'jobProjectName': jobProjectName,
                        'jobTags': jobTags,
                        'jobDescription': jobDescription,
                        'jobDocumentation': jobDocumentation,
                        'jobGenericInfos': jobGenericInfos,
                        'errorMessage': '',
                        'infoMessage': 'Workflow is valid.',
                        'showAdvanced': showAdvanced,
                        'showHidden': showHidden,
                        'toggledTasks': toggledTasks
                    });
                } else {
                    $('#execute-workflow-modal').modal("hide");
                    if (!plan) {
                        submit();
                    } else {
                        $("#plan-workflow-modal").modal();
                    }
                }
                readOrStoreVariablesInModel(oldVariables);

                initializeSubmitFormForTaskVariables();

                if (handler) {
                    handler(validationData);
                }
            })
        }

        function extractUpdatedVariables(inputVariables, validationData) {
            var studioApp = require('StudioApp');
            if (validationData.hasOwnProperty('updatedVariables')) {
                var updatedVariables = validationData.updatedVariables;
                if (updatedVariables != null) {
                    var extractVariableName = function (key) { return (key.split(":").length == 2 ? key.split(":")[1] : key) };
                    for (var key in inputVariables) {
                        if (inputVariables.hasOwnProperty(key)) {
                            var variable = inputVariables[key];
                            var containsPattern = false;
                            if (variable.Value) {
                                for (var variablePatternCheck in inputVariables) {
                                    if (variable.Value.indexOf("$" + extractVariableName(variablePatternCheck)) >= 0 ||
                                    variable.Value.indexOf("${" + extractVariableName(variablePatternCheck) + "}") >= 0) {
                                        containsPattern = true;
                                    }
                                }
                            }
                            if (!containsPattern) {
                                variable.Value = updatedVariables[key];
                            }
                        }
                        inputVariables[key].resolvedModel = validationData.updatedModels[key];
                        inputVariables[key].resolvedHidden = validationData.updatedHidden[key];
                        //Variables substitution:: When one changes the reference model we should initialize the Value and not show error message
                        var jobVariables = studioApp.views.jobVariableView.model.jobVariables;
                        if( jobVariables[key].resolvedModel && jobVariables[key].resolvedModel !== inputVariables[key].resolvedModel ){// compare old resolvedModel with the new resolvedModel
                            inputVariables[key]['Value'] = "";
                            validationData.errorMessage = "";
                        }
                    }

                }
            }
            return inputVariables;
        }

        function readOrStoreVariablesInModel(updatedVariables) {
            var studioApp = require('StudioApp');
            var jobVariables = {};
            if (!studioApp.models.jobModel.has('Variables')) {
                studioApp.models.jobModel.set('Variables', [])
            }
            var variables = studioApp.models.jobModel.get('Variables');

            function findAndReplaceVariableOrAppend(key, variablesArray, sourceVariablesMap, variablesBackup) {
                for (var i = 0; i < variablesArray.length; i++) {
                    if (variablesArray[i].Name == key) {
                        variablesBackup[key] = variablesArray[i];
                        variablesArray[i] = sourceVariablesMap[key];
                        return;
                    }
                }
                // appending new variable
                var variable = sourceVariablesMap[key];
                variablesArray.push(variable);
                variablesBackup[key] = variable;
            }

            function removeVariablesNotPresent(variablesArray, sourceVariablesMap) {
                for (var i = variablesArray.length - 1; i >= 0; i--) {
                    var key = variablesArray[i].Name;
                    if (!sourceVariablesMap.hasOwnProperty(key)) {
                        variablesArray.splice(i, 1);
                    }
                }
            }

            if (!(!updatedVariables || updatedVariables == null)) {
                var i;
                var jobOnlyUpdatedVariables = {}
                // filter only job variables in the provided map
                for (i = 0; i < Object.keys(updatedVariables).length; i++) {
                    var key = Object.keys(updatedVariables)[i];
                    if (key.indexOf(":") < 0) {
                       jobOnlyUpdatedVariables[key] = updatedVariables[key];
                    }
                }
                // the goal is to replace the contents of studioApp.models.jobModel.get('Variables') with jobOnlyUpdatedVariables
                // unfortunately, one is an array and the other is an object
                for (var key of Object.keys(jobOnlyUpdatedVariables)) {
                    findAndReplaceVariableOrAppend(key, variables, jobOnlyUpdatedVariables, jobVariables);
                }
                removeVariablesNotPresent(variables, jobOnlyUpdatedVariables);
            } else {
                for (var i = 0; i < variables.length; i++) {
                    var variable = variables[i];
                    jobVariables[variable.Name] = variable;
                }
            }
            readOrStoreTaskVariablesInModel(studioApp, updatedVariables, jobVariables);
            return jobVariables;
        }

        function readOrStoreTaskVariablesInModel(studioApp, updatedVariables, jobVariables) {
            var tasks = studioApp.models.jobModel.tasks;
            var orderedTasks = [];
            for (var i = 0; i < tasks.length; i++) {
                orderedTasks[i] = tasks[i];
            }
            orderedTasks.sort(function(task_a, task_b){ return task_a.get('Task Name').localeCompare(task_b.get('Task Name'))});

            for (var i = 0; i < orderedTasks.length; i++) {
                var task = orderedTasks[i];
                if (task.has('Variables')) {
                    var variables = task.get('Variables');
                    for (var j = 0; j < variables.length; j++) {
                        var variable = variables[j];
                        var isInherited;
                        if (typeof variable.Inherited === 'string' || variable.Inherited instanceof String) {
                            isInherited = (variable.Inherited == "true");
                        } else {
                            isInherited = variable.Inherited;
                        }
                        if (!isInherited) {
                            if (!(!updatedVariables || updatedVariables == null)) {
                                variables[j] = updatedVariables[task.get('Task Name') + ":" + variable.Name];
                            }
                            jobVariables[task.get('Task Name') + ":" + variable.Name] = variable;
                        }
                    }
                }
            }
        }

        function executeIfConnected(action) {
            var studioApp = require('StudioApp');
            StudioClient.isConnected(action, function () {
                // ask to login first
                studioApp.views.loginView.render();
            })
        }

        function submit() {
            var studioApp = require('StudioApp');
            var xml = studioApp.views.xmlView.generateXml();
            StudioClient.submit(xml);
        }

        function validate(checkCredentials) {
            var studioApp = require('StudioApp');
            var xml = studioApp.views.xmlView.generateXml();
            return StudioClient.validate(xml, studioApp.models.jobModel, checkCredentials!==undefined?checkCredentials:true);
        }

        $("#clear-button, #clear-button-tool").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();
            console.log("Clearing the workflow");
            studioApp.clear();
        });

        $("#save-button, #save-button-tool").click(function (event) {

            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            closeCollapsedMenu();
            save_workflow();

            StudioClient.alert('Saved', 'Workflow has been saved',  'success');
        });

        $("#close-button").click(function (event) {

            event.preventDefault();

            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen()) {
                studioApp.emptyWorkflowView(true);
                studioApp.router.gotoWorkflows();
                $('#breadcrumb-list-workflows').click();
            }

            closeCollapsedMenu();
        });


        $("#about-button").click(function (event) {

            event.preventDefault();

            var url = window.location.href;
            var arr = url.split("/");
            var result = arr[0] + "//" + arr[2] + "/rest";

            $("#version").text( conf.studioVersion);
            $("#restServer").text( result );
            $("#restServer").attr("href", result);
            $("#restVersion").text( conf.studioVersion );
            $("#studioVersion").text( conf.studioVersion );
            $('#about-modal').modal('show');
            return;

        });

        $("#account-info-button").click(function (event) {
            $.ajax({
                type: "GET",
                headers : { 'sessionID': localStorage['pa.session'] },
                async: false,
                url: '/rest/common/currentuserdata',
                success: function (result) {
                       $("#accountUsername").text(result.userName);
                       if (result.domain != null) {
                            $("#accountDomain").text(result.domain);
                       }
                       var accountGroups = "";
                       for (var i=0; i<result.groups.length; i++) {
                          accountGroups = accountGroups + result.groups[i];
                          if (i< result.groups.length -1) {
                            accountGroups = accountGroups + ", ";
                          }
                       }
                       if (accountGroups != null) {
                            $("#accountGroups").text(accountGroups);
                       }
                       if (result.tenant != null) {
                            $("#accountTenant").text(result.tenant);
                       }
                       var accountAdminRoles = "";
                        for (var i=0; i<result.adminRoles.length; i++) {
                            accountAdminRoles = accountAdminRoles + result.adminRoles[i];
                             if (i< result.adminRoles.length -1) {
                                accountAdminRoles = accountAdminRoles + ", ";
                            }
                        }
                        if (accountAdminRoles != null) {
                            $("#accountAdminRoles").text(accountAdminRoles);
                        }
                        var accountPortalAccessPermissionDisplay = "";
                        for (var i=0; i<result.portalAccessPermissionDisplay.length; i++) {
                            accountPortalAccessPermissionDisplay = accountPortalAccessPermissionDisplay + result.portalAccessPermissionDisplay[i];
                             if (i< result.portalAccessPermissionDisplay.length -1) {
                                accountPortalAccessPermissionDisplay = accountPortalAccessPermissionDisplay + ", ";
                            }
                        }
                        if (accountPortalAccessPermissionDisplay != null) {
                            $("#accountPortalAccessPermissionDisplay").text(accountPortalAccessPermissionDisplay);
                        }
                        $('#account-info-modal').modal('show');
                    },
                error: function () {
                    console.log('Could not get current user data.');
                }
            });
            return;
        });

        $("#download-xml-button").click(function (event) {
            event.preventDefault();

            console.log("Saving xml");
            var studioApp = require('StudioApp');
            var jobName = studioApp.models.jobModel.get("Name")
            var blob = new Blob([studioApp.views.xmlView.generatedXml]);
            saveAs(blob, jobName + ".xml")
        })

        $("#confirm-import-from-catalog").click(function () {
            add_workflow_to_current(true);
        });

        $("#confirm-add-from-catalog").click(function () {
            add_workflow_to_current(false);
        });

        $("#confirm-import-catalog-object-from-catalog").click(function () {
            var studioApp = require('StudioApp');
            studioApp.views.catalogGetView.importCatalogObject();
        });

        function add_workflow_to_current(clearCurrentFirst){
            var studioApp = require('StudioApp');

            // Workflow should be clear only if a workflow is currently open
            if (studioApp.isWorkflowOpen()) {
                if (clearCurrentFirst){
                    console.log("A workflow is already open, let's clear it first");
                    studioApp.clear();
                }
                studioApp.importFromCatalog();
                console.log("A workflow was imported!");
                $('#catalog-get-close-button').click();
            }
            else {
                // create a new workflow, open it and import the xml into it
                var clickAndOpenEvent = jQuery.Event( "click" );
                clickAndOpenEvent.openWorkflow = true;
                $('.create-workflow-button').trigger(clickAndOpenEvent);
            }
            save_workflow();
        }

        function open_catalog_workflow() {
            var studioApp = require('StudioApp');

            // If a workflow is already opened, we don't import it (we would lose the current one)
            if (studioApp.isWorkflowOpen()) {
                var router = studioApp.router;
                router.navigate("workflows/"+ studioApp.models.currentWorkflow.id, {trigger: true});
            }
            else {
                // create a new workflow, open it and import the xml into it
                var clickAndOpenEvent = jQuery.Event( "click" );
                clickAndOpenEvent.openWorkflow = true;
                if(!$('.create-workflow-button').length){
                    // we set an observation in order to wait for the render of create-workflow-button
                    let observer = new MutationObserver((mutations) => {
                      if(mutations.length && $('.create-workflow-button').length){
                        $('.create-workflow-button').trigger(clickAndOpenEvent);
                        // stop watching
                        observer.disconnect()
                      }
                    })
                    observer.observe($('#properties-container')[0], {
                        childList: true,
                        subtree: true
                    })
                } else {
                    $('.create-workflow-button').trigger(clickAndOpenEvent);
                }
            }
        }

        $("#confirm-publication-to-catalog").click(function () {
            var studioApp = require('StudioApp');
            studioApp.views.catalogPublishView.publishToCatalog();
        })
        // The aim object of this function is to remove selected tasks
        function removeTasks(withDependencies){
            var selectedTask = $(".selected-task");
            if (selectedTask.length > 0) {
                selectedTask.each(function (i, t) {
                    var taskView = $(t).data('view');
                    if(withDependencies){
                        require('StudioApp').views.workflowView.removeViewWithDependencies(taskView);
                    } else {
                        require('StudioApp').views.workflowView.removeViewWithoutDependencies(taskView);
                    }

                })
            }
        }
        // removing a task when we click on delete in the menu
        $('.delete-task').on("click", function() {
                            removeTasks(true);
                          });
        // removing a task by del
        $('body').keyup(function (e) {
            if (e.keyCode == 46) {
                // del pressed
                removeTasks(true);
            }
        })

        $('#script-save-modal').on('keypress', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                $("#script-save-button").click();
            }
        });

        function save_workflow() {
            var studioApp = require('StudioApp');
            if (studioApp.models.jobModel && !$("#workflow-variables-modal").data('bs.modal') || !$("#workflow-variables-modal").data('bs.modal').isShown) {
                studioApp.views.propertiesView.saveCurrentWorkflow(
                    studioApp.models.jobModel.get("Name"),
                    studioApp.views.xmlView.generateXml(),
                    {
                        project: studioApp.models.jobModel.get("Project"),
                        detailedView: studioApp.models.currentWorkflow.getMetadata()['detailedView']
                    }
                );
            }
        }

        function validate_job(automaticValidation) {
            $(".invalid-task").removeClass("invalid-task");
            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen() && !$("#workflow-variables-modal").data('bs.modal') || !$("#workflow-variables-modal").data('bs.modal').isShown) {
                // disable checking the validity of PA:CREDENTIALS variables in case of automaticValidation, to facilitate workflow designer
                var disableCheckCredential = automaticValidation;
                StudioClient.validateWithPopup(studioApp.views.xmlView.generateXml(), studioApp.models.jobModel, automaticValidation, disableCheckCredential);
            }
        }

        $('#validate-button, #validate-button-tool').click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();
            StudioClient.resetLastValidationResult()
            validate_job(false);
        });

        function validateAndUpdateVariables(newVariables) {
            var studioApp = require('StudioApp');
            var backupVariables = studioApp.models.jobModel.get('Variables') ? JSON.parse(JSON.stringify(studioApp.models.jobModel.get('Variables'))) : [];
            studioApp.models.jobModel.set({"BackupVariables": backupVariables});
            studioApp.models.jobModel.set({"Variables": newVariables});

            var validationData = validate(false);
            if (validationData.valid) {
                studioApp.views.workflowView = new WorkflowView({model: studioApp.models.jobModel, app: studioApp});
                studioApp.views.xmlView = new JobXmlView({model: studioApp.models.jobModel});
                studioApp.views.workflowView.importNoReset();
                delete studioApp.models.jobModel.attributes.BackupVariables;
                return {valid: true}
            } else {
                studioApp.models.jobModel.set({"Variables": studioApp.models.jobModel.get('BackupVariables')});
                return {
                    valid: false,
                    errorMessage: validationData.errorMessage,
                    backupVariables: studioApp.models.jobModel.get('BackupVariables')
                };
            }
        }

        function refreshVariablesView(existingVariables, updatedVariable, originalName) {
            var studioApp = require('StudioApp');
            var jobModel = studioApp.models.jobModel;
            var jobVariables = {};

            var jobVariablesByGroup = new Map();
            jobVariablesByGroup.set("NOGROUP", new Map());
            for (var variable of existingVariables) {
                variable.isTop = false;
                variable.isBottom = false;
            }
            // first, add only job variables defined in the workflow
            for (var variable of existingVariables) {
                if (originalName) {
                    if (variable.Name === originalName) {
                        variable = updatedVariable;
                    }
                }
                addVariableToGroup(variable.Name, variable, jobVariablesByGroup);
            }
            // Add all grouped variables to the final structure
            addVariablesInGroupOrder(jobVariablesByGroup, jobVariables);

            $('#variable-editor-modal').modal('hide');
            studioApp.views.workflowVariablesView.render({
                'jobModel': jobModel,
                'jobVariables': jobVariables,
                'showAdvanced': $('#advanced-checkbox').is(":checked"),
                'showHidden': $('#hidden-checkbox').is(":checked")
            });
        }

        function deleteVariable(variableName){
            var studioApp = require('StudioApp');
            var filteredExistingVariables = studioApp.views.workflowVariablesView.deleteVariable(variableName);

            studioApp.models.jobModel.set({"Variables": filteredExistingVariables});
            studioApp.views.workflowView = new WorkflowView({model: studioApp.models.jobModel, app: studioApp});
            studioApp.views.xmlView = new JobXmlView({model: studioApp.models.jobModel});
            studioApp.views.workflowView.importNoReset();

            refreshVariablesView(filteredExistingVariables)
        }

        $("#undo-button, #undo-button-tool").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }
            closeCollapsedMenu();
            undoManager.undo()
        });

        $("#redo-button, #redo-button-tool").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }
            closeCollapsedMenu();
            undoManager.redo();
        });


        $(document).on('focusout', function () {
            undoManager._enable();
        });
        $(window).on('hashchange', function(e){
         undoManager._enable();
         undoManager.save();
        });

        (function scriptManagement() {
            $(document).on("click", '.edit-full-screen', function () {

                $(".CodeMirror").remove();
                var relatedInputId = $(this).data('related-input');
                var isUrl = $(this).data('is-url');
                var catalogKind = $(this).data('catalog-kind');
                var inputValue = document.getElementById(relatedInputId).value;
                var languageElementId;
                if (isUrl) {
                    languageElementId = relatedInputId.replace('_Url', '_Language');
                    $("#cancel-script-changes").text("Close");
                }
                else {
                    languageElementId = relatedInputId.replace('_Code', '_Language');
                    $("#cancel-script-changes").text("Cancel");
                }
                var languageElement = document.getElementById(languageElementId);
                var selectedLanguage = languageElement.options[languageElement.selectedIndex].value;
                if (isUrl && (!selectedLanguage || selectedLanguage == '')) {
                    var indexExt = inputValue.lastIndexOf('.');
                    if (indexExt > -1) {
                        var extension = inputValue.substring(indexExt+1, inputValue.length);
                        selectedLanguage = config.extensions_to_languages[extension.toLowerCase()] || '';
                    }
                }
                selectedLanguage = selectedLanguage.toLowerCase()
                var modes = config.modes
                var language = 'text/plain'
                for (var property in modes) {
                     if (modes.hasOwnProperty(property) && selectedLanguage == property) {
                        language = modes[property]
                     }
                }

                var dictionary = config.dictionary.concat(config.keywords[selectedLanguage])

                var WORD = /[\w]+$/, WORD2 = /[\w$]+/g, RANGE = 500;

                CodeMirror.registerHelper("hint", "anyword", function(editor, options) {
                    var word = options && options.word || WORD;
                    var word2 = options && options.word || WORD2;
                    var range = options && options.range || RANGE;
                    var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
                    var start = cur.ch, end = start;
                    while (end < curLine.length && word.test(curLine.charAt(end))) ++end;
                    while (start && word.test(curLine.charAt(start - 1))) --start;
                    var curWord = start != end && curLine.slice(start, end);

                    var list = [], seen = {};
                    for (var i=0; i < dictionary.length; i++) {
                        var m = dictionary[i];
                        if ((!curWord || m.indexOf(curWord) == 0) && !seen.hasOwnProperty(m)) {
                            seen[m] = true;
                            list.push(m);
                        }
                    }


                    function scan(dir) {
                      var line = cur.line, end = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
                      for (; line != end; line += dir) {
                        var text = editor.getLine(line), m;
                        word2.lastIndex = 0;
                        while (m = word2.exec(text)) {
                          if ((!curWord || m[0].indexOf(curWord) == 0) && !seen.hasOwnProperty(m[0])) {
                            seen[m[0]] = true;
                            list.push(m[0]);
                          }
                        }
                      }
                    }
                    scan(-1);
                    scan(1);
                    return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
                });
                var content = '';
                var setScriptContentButton = $("#set-script-content");
                var commitScriptChangesButton = $("#commit-script-changes");
                if (isUrl) {
                    if (inputValue.trim()!='') {
                        var isCatalogScript = inputValue.startsWith(window.location.origin + '/catalog/');
                        // Check if catalog object URL is relative (using ${PA_CATALOG_REST_URL})
                        var isRelativeCatalogScript = inputValue.startsWith('${PA_CATALOG_REST_URL}');
                        var headers = {};
                        if (isCatalogScript || isRelativeCatalogScript) {
                            headers = { 'sessionID': localStorage['pa.session'] };
                        }
                        // Replace ${PA_CATALOG_REST_URL} with an absolute URL.
                        if (isRelativeCatalogScript){
                            inputValue = inputValue.replace('${PA_CATALOG_REST_URL}',window.location.origin + '/catalog/');
                        }
                        $.ajax({
                            url: inputValue,
                            type: 'GET',
                            headers: headers,
                            async: false,
                            dataType: 'text' //without this option, it will execute the response if it's JS code
                        }).success(function (response) {
                            content = response;
                            setScriptContentButton.hide();
                            commitScriptChangesButton.show();
                        }).error(function (response) {
                            StudioClient.alert('Error', 'The code could not be opened. Please check that you entered a correct URL.', 'error');
                            console.error('Error importing the script from the Catalog : '+JSON.stringify(response));
                            commitScriptChangesButton.hide();
                            setScriptContentButton.hide();
                        });
                    } else {
                        StudioClient.alert('No script to display.', 'There is no URL value. Please enter a URL in the input field.', 'error');
                        return false;
                    }
                } else {
                    content = inputValue;
                    commitScriptChangesButton.hide();
                    setScriptContentButton.show();
                    $("#set-script-content").data("area", relatedInputId);
                }
                $("#full-edit-modal-script-content").data('language', selectedLanguage);
                $("#full-edit-modal-script-content").data('catalog-kind', catalogKind);
                $('#full-edit-modal-script-content').data("related-url-input", relatedInputId);
                $("#full-edit-modal-script-content").val(content);
                CodeMirror.commands.autocomplete = function(cm) {
                    cm.showHint({hint: CodeMirror.hint.anyword});
                }
                var editor = CodeMirror.fromTextArea($("#full-edit-modal-script-content").get(0), {
                    lineNumbers: true,
                    lineWrapping: true,
                    mode: language,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    styleActiveLine: true,
                    indentUnit: 4,
                    extraKeys: {
                    "Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); },
                    "Ctrl-Space": "autocomplete", "Cmd-Space": "autocomplete",
                    "Shift-Ctrl-F": "replace",
                    "Shift-Cmd-F": "replace",
                    "Shift-Tab": "indentAuto",
                    "Ctrl-]":"indentMore",
                    "Ctrl-[":"indentLess",
                    "Ctrl-K Ctrl-1":"foldAll","Cmd-K Cmd-1":"foldAll"
                    },
                    foldGutter: true,
                    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                    highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
                    scrollbarStyle: "simple",
                    keyMap: "sublime",
                    theme: "eclipse"
                });
                if ($(this).attr('data-catalog-kind') === 'Script/selection') {
                    //Fixing modals overlay bug
                    var zIndexModal = parseInt($(".selection-script-code-form").parents().find(".modal").css("z-index"));
                    $("#full-edit-modal").css("z-index", (zIndexModal+1).toString());
                }
                $('#full-edit-modal').modal({backdrop: 'static', keyboard: false});
                $('#full-edit-modal').modal('show');
                $('#full-edit-modal').data("editor", editor);

                var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                if (is_firefox) {
                    var table = $('#full-edit-modal table');
                    var firstCol = table.find("td:first")
                    var lastCol = table.find("td:last")
                    $(".code-editor-container").height($("#full-edit-modal").height() * 0.8 - firstCol.height() - lastCol.height())
                }

                return false;
            })

            $('#full-edit-modal').on('shown.bs.modal', function () {
                $('#variable_reference_link').attr("href", config.docUrl + "/user/ProActiveUserGuide.html#_variables_quick_reference")
                $(".CodeMirror").height($(".code-editor-container").height())
                $('#full-edit-modal').data("editor").refresh()
            })

            $("#set-script-content").click(function () {
                var editor = $('#full-edit-modal').data("editor");
                editor.save();
                document.getElementById($(this).data("area")).value = $("#full-edit-modal-script-content").val();

                var studioApp = require('StudioApp');
                // propagating changes to the model
                var form = studioApp.views.propertiesView.$el.data('form')
                form.commit();
            })

            $('#commit-script-changes').click(function () {
                var textAreaEditor = $("#full-edit-modal-script-content");
                var editorValue = $('#full-edit-modal').data("editor").getValue();
                var language = textAreaEditor.data('language');
                var catalogKind = textAreaEditor.data('catalog-kind');
                var urlInputId = textAreaEditor.data('related-url-input');

                //Fixing modals overlay bug
                var zIndexModal = parseInt($("#full-edit-modal-script-content").parents().find(".modal").css("z-index"));
                $("#catalog-publish-modal").css("z-index", (zIndexModal+2).toString());
                $("#publish-current-confirmation-modal").css("z-index", (zIndexModal+3).toString());

                var studioApp = require('StudioApp');
                studioApp.views.catalogPublishView.setKind(catalogKind, "Script");
                studioApp.views.catalogPublishView.setScriptLanguage(language);
                studioApp.views.catalogPublishView.setContentToPublish(editorValue, "text/plain");
                studioApp.views.catalogPublishView.setRelatedInputId(urlInputId, true);
                studioApp.views.catalogPublishView.render();
                $('#catalog-publish-modal').modal();
            })

            $(document).on("click", '.get-script-from-catalog', function (event) {
                event.preventDefault();
                var relatedInputId = $(this).attr('data-related-input');
                var catalogKind = $(this).attr('data-catalog-kind');
                if (catalogKind === 'Script/selection') {
                    //Fixing modals overlay bug
                    var zIndexModal = parseInt($(".selection-script-code-form").parents().find(".modal").css("z-index"));
                    $("#catalog-get-modal").css("z-index", (zIndexModal+1).toString());
                    $("#import-catalog-object-confirmation-modal").css("z-index", (zIndexModal+2).toString());
                }
                var studioApp = require('StudioApp');
                studioApp.views.catalogGetView.setInputToImportId(relatedInputId);
                studioApp.views.catalogGetView.setKind(catalogKind, "Script");
                studioApp.views.catalogGetView.setObjectNameFilter(""); // ensure that the bucket buckets and objects are not filtered
                studioApp.views.catalogGetView.render();
                $('#catalog-get-modal').modal();
            })

            $(document).on("click", '.publish-script-to-catalog', function (event) {
                event.preventDefault();
                var relatedInputId = $(this).attr('data-related-input');
                var textAreaValue = document.getElementById(relatedInputId).value;
                var languageElement = document.getElementById(relatedInputId.replace('_Code', '_Language'));
                var language = languageElement.options[languageElement.selectedIndex].value.toLowerCase();
                var catalogKind = $(this).attr('data-catalog-kind');
                if (catalogKind === 'Script/selection') {
                    //Fixing modals overlay bug
                    var zIndexModal = parseInt($(".selection-script-code-form").parents().find(".modal").css("z-index"));
                    $("#catalog-publish-modal").css("z-index", (zIndexModal+1).toString());
                    $("#publish-current-confirmation-modal").css("z-index", (zIndexModal+2).toString());
                }
                var studioApp = require('StudioApp');
                studioApp.views.catalogPublishView.setKind(catalogKind, "Script");
                studioApp.views.catalogPublishView.setScriptLanguage(language);
                studioApp.views.catalogPublishView.setContentToPublish(textAreaValue, "text/plain");
                studioApp.views.catalogPublishView.setRelatedInputId(relatedInputId, false);
                studioApp.views.catalogPublishView.render();
                $('#catalog-publish-modal').modal();
            })

        })();

        $(document).ready(function () {
            var copiedTasks = [];
            var positions = [];

            $("body").tooltip({ selector: '[data-toggle=tooltip]' });

            $.getScript("studio-conf.js", function () {
                var docUrl = config.docUrl;
                if (!docUrl.endsWith("/")) {
                    docUrl = docUrl + "/";
                }
                $("#documentationLinkId").attr("href", config.docUrl);
            });
            $('#workflow-designer-outer').on('contextmenu', function(e) {
                    var top = e.offsetY + 30;
                    var left = e.offsetX - 10;
                    $(".context-menu-task").hide();
                    $(".context-menu-canvas").css({
                      top: top,
                      left: left
                    }).show();
                    return false; //blocks default Webbrowser right click menu
                  }).on("click", function() {
                     $(".context-menu-canvas").hide();
                   });
            $(".context-menu-canvas li").on("click", function() {
                                 $(".context-menu-canvas").hide();
                               });

            var ctrlDown = false;
            var ctrlKey = 17, commandKey = 91, vKey = 86, cKey = 67, zKey = 90, yKey = 89, aKey = 65, xKey = 88;
            var pasteAllow = true;
            $('#workflow-designer-outer').bind('keydown', function (e) {
                if (e.keyCode == ctrlKey || e.keyCode == commandKey) ctrlDown = true;
            }).keyup(function (e) {
                if (e.keyCode == ctrlKey || e.keyCode == commandKey) ctrlDown = false;
            });
            function copyTasks(){
                copiedTasks = [];
                positions = [];
                console.log("copy");
                $(".selected-task").each(function (i, t) {
                positions.push({left: $(t).position().left, top: $(t).position().top})
                    copiedTasks.push($(t).data( "view" ))
                })
                // let the user how he can do past(ctr-v)
                if(copiedTasks.length > 0){
                    StudioClient.alert('Copy/Paste', 'Click on the canvas where you want to paste and then do ctrl-V.', 'warning');
                } else {
                    StudioClient.alert('Copy/Paste', 'Select at least one task.', 'warning');
                }
            }

            function pasteTasks(){
                var newTaskModel = [];
                var tasksView = [];
                var newTasksJson = [];
                var studioApp = require('StudioApp');
                 $.each(copiedTasks, function (i) {
                    tasksView.push(copiedTasks[i]);
                    // build new task models by converting existing models to xml and reparse it
                    var taskModel = new Task();
                    taskModel.isDragAndDrop = false;
                    var taskXmlView = new TaskXmlView({model: copiedTasks[i].model, jobView: studioApp.views.workflowView}).render();
                    var taskJson = xml2json.xmlToJson(xml2json.parseXml(taskXmlView.$el.text()))
                    taskModel.populateSchema(taskJson.task, false, false);
                    taskModel.populateSimpleForm();
                    newTaskModel.push(taskModel);
                    newTasksJson.push(taskJson);

                });
                studioApp.views.workflowView.copyPasteTasks(pasteAllow, newTaskModel, tasksView, newTasksJson, positions);
            }
            $('.copy-task').on("click", function() {
                        copyTasks();
                      });
            $('.paste-task').on("click", function() {
                if(pasteAllow){
                    pasteTasks();
                }
            });
            $('.select-all').on("click", function(){
                $(".task").addClass("selected-task");
            });
            $('.cut-task').on("click", function(){
                copyTasks();
                removeTasks(false);
            })
            $('#workflow-designer-outer').bind('keydown',function (e) {
                if (ctrlDown && e.keyCode == cKey) {
                   copyTasks();

                }
                if (ctrlDown && e.keyCode == vKey) {
                    if (pasteAllow) {
                        pasteTasks();
                    }
                }
                if(ctrlDown && e.keyCode == xKey){
                    copyTasks();
                    removeTasks(false);
                }
                if ( (ctrlDown && e.keyCode == zKey)) {
                    // copiedTasks.length number of the tasks that we added to the workflow
                    undoManager.undoIfEnabled(positions.length);
                }
                if (ctrlDown && e.keyCode == yKey) {
                    undoManager.redoIfEnabled();
                }
                if(ctrlDown  && e.keyCode == aKey ){
                       e.preventDefault();
                       $(".task").addClass("selected-task");
                }
            });

            $('body').mousedown(function (e) {
                if (e.isPropagationStopped()) {
                    return;
                }

                $(".selected-task").removeClass("selected-task");
                pasteAllow = false;
            })
            $('#workflow-designer-outer').mousedown(function (e) {
                pasteAllow = {left: e.pageX, top: e.pageY};
                e.stopPropagation();
            })

            $("#submit-button").click(function (event) {
                openSubmissionView(event)
            });

            $("#variables-button").click(function (event) {
                openVariablesView(event)
            });

            $("#save-variables-button").click(function () {
                var studioApp = require('StudioApp');
                var updatedVariablesArray = studioApp.views.workflowVariablesView.updateVariables();
                var validationResult = validateAndUpdateVariables(updatedVariablesArray);
                if (validationResult.valid) {
                    $('#workflow-variables-modal').modal('hide');
                    delete studioApp.models.jobModel.attributes.InitialVariables;
                } else {
                    $("#variables-view-error").text(validationResult.errorMessage)
                }
            });

            $("#save-var-edit-btn").click(function () {
                var studioApp = require('StudioApp');
                var updatedVariable = studioApp.views.variableEditorView.updateVariable();
                var originalName = studioApp.views.variableEditorView.originalName();

                var existingVariables = studioApp.views.workflowVariablesView.updateVariables();
                for (let i = 0; i < existingVariables.length; i++) {
                    if (existingVariables[i].Name === originalName) {
                        existingVariables[i] = updatedVariable;
                    }
                }
                // Case: new variable
                if (originalName === '') {
                    existingVariables.push(updatedVariable)
                }

                var validationResult = validateAndUpdateVariables(existingVariables);

                if (validationResult.valid) {
                    refreshVariablesView(existingVariables,updatedVariable)
                } else {
                    $("#variable-editor-error").text(validationResult.errorMessage)
                }
            });

        });

        $('#workflow-variables-modal').on('hidden.bs.modal', function () {
            var studioApp = require('StudioApp');

            if (studioApp.models.jobModel.get("InitialVariables")) {
                var initialVariables = JSON.parse(JSON.stringify(studioApp.models.jobModel.get('InitialVariables')));
                studioApp.models.jobModel.set({"Variables": initialVariables});
                delete studioApp.models.jobModel.attributes.InitialVariables;

                //Refresh Variables view in side menu
                studioApp.views.workflowView = new WorkflowView({model: studioApp.models.jobModel, app: studioApp});
                studioApp.views.xmlView = new JobXmlView({model: studioApp.models.jobModel});
                studioApp.views.workflowView.importNoReset();
            }
        });

        // adding form-control classes to new input elements after clicking on "add"
        // button in forms
        $(document).on('click', 'button[data-action="add"]', function () {
            $('input').addClass("form-control");
        })

        $(document).on('click', 'a[id="Workflow Variables"]', function (event) {
            event.preventDefault();
            openVariablesView(event)
        })

        $(document).on('click', '.var-delete-btn', function (event) {
            event.preventDefault();
            deleteVariable(event.target.getAttribute('value'))
        })

        $(document).on('click', '.var-up-btn', function (event) {
            event.preventDefault();
            changeVariableOrder(event.target.getAttribute('value'), -1);
        })

        $(document).on('click', '.var-down-btn', function (event) {
            event.preventDefault();
            changeVariableOrder(event.target.getAttribute('value'), 1);
        })

        // saving job xml every min to local store
        setInterval(save_workflow, 10000);
        // validating job periodically
        setInterval(function(){validate_job(true);}, 30000);

       return {
           saveWorkflow: save_workflow,
           getWorkflowFromCatalog : getWorkflowFromCatalog,
           getWorkflowFromScheduler : getWorkflowFromScheduler,
           open_catalog_workflow : open_catalog_workflow
       };

    });
