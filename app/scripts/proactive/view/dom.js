define(
    [
        'jquery',
        'backbone',
        'proactive/view/utils/undo',
        'proactive/rest/studio-client',
        'xml2json',
        'codemirror',
        'text!proactive/templates/job-variable-template.html',
        'proactive/view/CatalogView',
        'pnotify',
        'pnotify.buttons',
        'codemirrorJs',
        'codemirrorComment',
        'codemirrorMB',
        'backbone-forms',
        'list',
        'backboneFormsAdapter',
        'StudioApp',
        'bootstrap',
        'filesaver'
    ],

    function ($, Backbone, undoManager, StudioClient, xml2json, CodeMirror, jobVariablesTemplate, CatalogView, PNotify) {

        "use strict";

        Backbone.Form.editors.List.Modal.ModalAdapter = Backbone.BootstrapModal;

        Backbone.Form.editors.TaskTypeRadioEditor = Backbone.Form.editors.Radio.extend({
            /** A simple override to add a class to the label */
            _arrayToHtml: function (array) {
                var html = [];
                var self = this;

                _.each(array, function (option, index) {
                    var itemHtml = '<li>';
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
            }
        });

        Backbone.Form.editors.Text.prototype.setValue = function(value) {
            this.previousValue = value;
            this.$el.val(value);
        }

        function closeCollapsedMenu() {
            $('.navbar-collapse.in').collapse('hide');
        }

        $("#import-button").click(function (event) {
            add_or_import(event, '#import-file');
        })

        $("#add-button").click(function (event) {
            add_or_import(event, '#add-file');
        })
        
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
        })

        $('#add-file').change(function (env) {
            import_file(env, false);
        })
        
        function import_file(env, clearFirst){
            var studioApp = require('StudioApp');
            if (clearFirst){
                studioApp.clear();
            }
            var files = env.target.files;
            if (files.length > 0) {
                var file = files[0];
                if (!file.type.match('text/xml')) {
                    return;
                }
                var reader = new FileReader();
                reader.onloadend = function (evt) {

                    if (evt.target.readyState == FileReader.DONE) {
                        var json = xml2json.xmlToJson(xml2json.parseXml(evt.target.result));
                        studioApp.merge(json, null);
                        studioApp.updateWorkflowName(json.job);
                        studioApp.views.workflowView.importNoReset();
                    }
                }
                reader.readAsBinaryString(file);
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
        })

        $("#browse-catalog-button").click(function (event) {
            event.preventDefault();
            var studioApp = require('StudioApp');
            studioApp.models.catalogBuckets.fetch({reset: true});
            studioApp.modelsToRemove = [];
            var publishButton = $('#publish-to-catalog-button');
            studioApp.views.catalogView.render();
            if (studioApp.isWorkflowOpen() && $("#select-bucket").val() != -1) {
                publishButton.prop('disabled', false);
            }  
            else {
                publishButton.prop('disabled', true);
            }
            $('#catalog-browser-view-modal').modal();
        })

        $("#layout-button").click(function (event) {
            event.preventDefault();
            require('StudioApp').views.workflowView.autoLayout();
            save_workflow();
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

        $("#submit-button").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();

            var jobVariables = readOrStoreVariablesInModel();
            if (jobVariables == null || $.isEmptyObject(jobVariables)) {
                executeIfConnected(submit);
                return;
            }

            var template = _.template(jobVariablesTemplate, {'jobVariables': jobVariables, 'errorMessage':'', 'infoMessage' :''});
            $('#job-variables').html(template);
            $('#execute-workflow-modal').modal();
        });

	$("#plan-button").click(function (event) {
            event.preventDefault();
	    
            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();

            var jobVariables = readOrStoreVariablesInModel();
            if (jobVariables == null || $.isEmptyObject(jobVariables)) {
                executeIfConnected(planned_submit);
                return;
            }
            var template = _.template(jobVariablesTemplate, {'jobVariables': jobVariables, 'errorMessage':'', 'infoMessage' :''});
            $('#job-variables').html(template);
            $('#execute-workflow-modal').modal();
        });

        $("#exec-button").click(function (event) {
            executeOrCheck(event, false)
        });

        $("#check-button").click(function (event) {
            executeOrCheck(event, true)
        });

        function executeOrCheck(event, check) {
            var studioApp = require('StudioApp');
            executeIfConnected(function () {
                var oldVariables = readOrStoreVariablesInModel();
                var inputVariables = {};
                var inputReceived = $('#job-variables').find('input');
                for (var i = 0; i < inputReceived.length; i++) {
                    var input = inputReceived[i];
                    inputVariables[input.id] = {'Name': input.name, 'Value': input.value, 'Model': input.placeholder}
                }
                readOrStoreVariablesInModel(inputVariables);
                
                var validationData = validate();

                if (!validationData.valid) {
                    var template = _.template(jobVariablesTemplate, {'jobVariables': extractUpdatedVariables(inputVariables, validationData), 'errorMessage': validationData.errorMessage, 'infoMessage' : ''});
                    $('#job-variables').html(template);
                } else if (check) {
                    var template = _.template(jobVariablesTemplate, {'jobVariables': extractUpdatedVariables(inputVariables, validationData), 'errorMessage': '', 'infoMessage' : 'Workflow is valid.'});
                    $('#job-variables').html(template);
                } else {
                    $('#execute-workflow-modal').modal("hide");
                    submit();
                }
                readOrStoreVariablesInModel(oldVariables);
            })
        }
        
        function extractUpdatedVariables(inputVariables, validationData) {
            if (validationData.hasOwnProperty('updatedVariables')) {
                var updatedVariables = validationData.updatedVariables;
                if (updatedVariables != null) {
                    for (var key in inputVariables) {
                        if (inputVariables.hasOwnProperty(key)) {
                            var variable = inputVariables[key];
                            variable.Value = updatedVariables[key];
                        }
                    }
                }
            } 
            return inputVariables;
        }

        function readOrStoreVariablesInModel(updatedVariables) {
            var studioApp = require('StudioApp');
            var jobVariables = {};
            if (studioApp.models.jobModel.has('Variables')) {
                var variables = studioApp.models.jobModel.get('Variables');

                for (var i = 0; i < variables.length; i++) {
                    var variable = variables[i];
                    if (!(!updatedVariables || updatedVariables === null)) {
                        variables[i] = updatedVariables[variable.Name];
                    }
                    jobVariables[variable.Name] = variable;
                }
            }
            // task variables are for now disabled in the job execution form
            // readOrStoreTaskVariablesInModel(studioApp, updatedVariables, jobVariables);
            return jobVariables;
        }

        function readOrStoreTaskVariablesInModel(studioApp, updatedVariables, jobVariables) {
            var tasks = studioApp.models.jobModel.tasks;
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
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
                            if (!(!updatedVariables || updatedVariables === null)) {
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
            var htmlVisualization = studioApp.views.xmlView.generateHtml();
            StudioClient.submit(xml, htmlVisualization);
        }

	function planned_submit() {
            var studioApp = require('StudioApp');
            var xml = studioApp.views.xmlView.generateXml();
            var htmlVisualization = studioApp.views.xmlView.generateHtml();
            StudioClient.planned_submit(xml, htmlVisualization);
        }

        function validate() {
            var studioApp = require('StudioApp');
            var xml = studioApp.views.xmlView.generateXml();
            return StudioClient.validate(xml, studioApp.models.jobModel);
        }

        $("#clear-button").click(function (event) {
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

        $("#save-button").click(function (event) {
        	
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            closeCollapsedMenu();
            save_workflow();

            notify_message('Saved', 'Workflow has been saved', true);
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
            
            
            jQuery.get('file.txt', function(data) {
            	   alert(data);
            	   //process text file line by line
            	   $('#div').html(data.replace('n',''));
            });
            
            
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
        })

        $("#confirm-add-from-catalog").click(function () {
            add_workflow_to_current(false);
        })

        $("#confirm-publication-to-catalog").click(function () {
            var selectedBucketId = $("#select-bucket").val();
            var studioApp = require('StudioApp');
            var xmlToPublish = studioApp.views.xmlView.generateXml();
            var layout = JSON.stringify(studioApp.models.currentWorkflow.getMetadata());
            var workflowPromise = publish_to_catalog(selectedBucketId, xmlToPublish, layout);
            add_workflow_promise_to_collection(workflowPromise, xmlToPublish);
        })
        
        $("#catalog-action-button").click(function (event) {
        	var actionID = $("#catalog-select-action").val();
            switch (actionID){
            case "0": $('#send-to-remote-confirmation-modal').modal(); break;
            case "1": window.location.replace(get_workflows_archive_URL()); break;
            case "2": {
	            var studioApp = require('StudioApp');
	            closeCollapsedMenu();
	            $("#import-archive-file").parent('form').trigger('reset');
	            $("#import-archive-file").click();
            }
            break;
            case "3": $('#delete-workflow-confirmation-modal').modal(); break;
            case "4": {
	            if ($("#select-bucket").val()== -1) {
	                $('#select-bucket-modal').modal();
	            }
	            else {
	                $('#publish-workflow-confirmation-modal').modal();
	            }
            } break;
            }
        })

        $("#confirm-delete-from-catalog").click(function (event) {
            var studioApp = require('StudioApp');
            var wfToRemove = studioApp.modelsToRemove;
            var wId;
            var bucketId;
            var workflowId;
            var workflowsCollection;
            for (wId in wfToRemove) {
                bucketId = wfToRemove[wId].get('bucket_id');
                workflowId = wfToRemove[wId].get('id');
                workflowsCollection = studioApp.models.catalogBuckets.get(bucketId).get('workflows');
                studioApp.views.catalogView.listenTo(workflowsCollection, 'remove',
                    studioApp.views.catalogView.internalSwitchBucket(bucketId));
                wfToRemove[wId].destroy();
                workflowsCollection.remove(workflowId);
                studioApp.views.catalogView.listenTo(workflowsCollection, 'remove',
                    studioApp.views.catalogView.internalSwitchBucket(bucketId));
            }
            studioApp.resetDeleteCollection();
        })
        
        function get_workflows_archive_URL(bucketId){
            var studioApp = require('StudioApp');
            var wfToRemove = studioApp.modelsToRemove;
            var wfIds = "";
            var first = true;
            for (var wfIndex in wfToRemove){
            	if (first) first = false;
            	else wfIds += ","
            	wfIds += wfToRemove[wfIndex].get('id');
            }
            var selectedBucketId = bucketId ? bucketId : $("#select-bucket").val();
            return '/workflow-catalog/buckets/' + selectedBucketId + '/workflows/' + wfIds + '?alt=zip';
        }
        
        $("#import-archive-file").change(function (event) {
        	var studioApp = require('StudioApp');
            var files = event.target.files;
            if (files.length > 0) {
                var file = files[0];
                if (!file.type.match('application/zip')) {
                    return;
                }
                var reader = new FileReader();
                reader.onloadend = function (evt) {

                    if (evt.target.readyState == FileReader.DONE) {
            			var blob = new Blob([file], { type: "application/zip" });
                        var createdListOfWorkflows = send_archive_to_catalog(blob);

                        $.when(createdListOfWorkflows).then(function () {
                            var newWorkflows = createdListOfWorkflows.responseJSON;
                            for (var i = 0; i < newWorkflows["workflow"].length; i++){
                                add_workflow_to_collection(newWorkflows["workflow"][i]);
                            }
                        });
                    }
                }
                reader.readAsBinaryString(file);
            }
        })
        
        $("#confirm-send-to-remote").click(function( event ) {
        	var remoteURL = $( "#remoteCatalogURL" ).val();
        	var bucketId = $( "#remoteCatalogBucketId" ).val();
        	//Can't use AJAX for download
        	var xhr = new XMLHttpRequest();
			xhr.open('GET', get_workflows_archive_URL(), true);
			xhr.responseType = 'blob';
			xhr.onload = function(e) {
			    if (this.status == 200) {
                    send_archive_to_catalog(this.response, remoteURL, bucketId);
			    } 
			};
			xhr.send(null);
        });
        
        function send_archive_to_catalog(blob, remoteURL, bucketId){
            var payload = new FormData();
            payload.append('file', blob);
            var selectedBucketId = bucketId ? bucketId : $("#select-bucket").val();
            var server = remoteURL ? remoteURL : "/workflow-catalog";
            var url = server + '/buckets/' + selectedBucketId + '/workflows?alt=zip';
            
            return $.ajax({
                url: url,
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                crossDomain: true,
                data: payload
            }).success(function (response) {
            	if (remoteURL)
                    notify_message('Sending successful', 'The Workflows have been successfully sent to the remote Catalog', true);
            	else
                    notify_message('Import successful', 'The Workflows have been successfully imported into the Catalog', true);
                return response;
            }).error(function (response) {
            	if (remoteURL)
                    notify_message('Error', 'Error sending the Workflows to the remote Catalog', false);
            	else
                    notify_message('Error', 'Error importing the Workflows into the Catalog', false);
                return response;
            });
        }

        // removing a task by del
        $('body').keyup(function (e) {
            if (e.keyCode == 46) {
                // del pressed
                var selectedTask = $(".selected-task");
                if (selectedTask.length > 0) {
                    selectedTask.each(function (i, t) {
                        var taskView = $(t).data('view');
                        require('StudioApp').views.workflowView.removeView(taskView);
                    })
                }
            }
        })

        $('#script-save-modal').on('keypress', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                $("#script-save-button").click();
            }
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
                $('#catalog-browser-close-button').click();
            }
            else {
                // create a new workflow, open it and import the xml into it
                var clickAndOpenEvent = jQuery.Event( "click" );
                clickAndOpenEvent.openWorkflow = true;
                $('.create-workflow-button').trigger(clickAndOpenEvent);
            }
        }

        function publish_to_catalog (bucketId, xmlContent, layoutContent) {

            var payload = new FormData();
            var blob = new Blob([xmlContent], { type: "text/xml" });
            payload.append('file', blob);

            // TODO add the layout as a query parameter

            var createdWorkflowPromise = $.ajax({
                url: '/workflow-catalog/buckets/' + bucketId + '/workflows',
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                data: payload
            }).success(function (response) {
                notify_message('Published', 'The Workflow has been published to the Catalog', true);
                return response;
            });
            return createdWorkflowPromise;
        }

        function add_workflow_promise_to_collection (createdWorkflowPromise, xmlContent) {
            $.when(createdWorkflowPromise).then(function () {
                var newWorkflow = createdWorkflowPromise.responseJSON;
                add_workflow_to_collection(newWorkflow["workflow"][0], xmlContent);
            });
        }

        function add_workflow_to_collection (newWorkflow, xmlContent) {
            var studioApp = require('StudioApp');
            // We manually add the newly published workflow into the right bucket
            // without relying on Backbone's persistence layer
            studioApp.models.catalogBuckets.get(newWorkflow.bucket_id).get('workflows').add(
                {
                    id: newWorkflow.id,
                    name: newWorkflow.name,
                    variables: newWorkflow.variables,
                    generic_information: newWorkflow.generic_information,
                    created_at: newWorkflow.created_at,
                    revision_id: newWorkflow.revision_id,
                    bucket_id: newWorkflow.bucket_id,
                    project_name: newWorkflow.project_name,
                    layout: newWorkflow.layout
                },
                {
                    xmlContent: xmlContent,
                    layout: newWorkflow.layout
                }
            );
            studioApp.views.catalogView.internalSwitchBucket(newWorkflow.bucket_id);
        }

        function save_workflow() {
            var studioApp = require('StudioApp');
            if (studioApp.models.jobModel) {
            	studioApp.views.propertiesView.saveCurrentWorkflow(
                    studioApp.models.jobModel.get("Name"),
                    studioApp.views.xmlView.generateXml(),
                    {
                        offsets: undoManager.getOffsetsFromDOM(),
                        project: studioApp.models.jobModel.get("Project"),
                        detailedView: studioApp.models.currentWorkflow.getMetadata()['detailedView']
                    }
                );
            }
        }

        function validate_job(automaticValidation) {
            $(".invalid-task").removeClass("invalid-task");
            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen()) {
                StudioClient.validateWithPopup(studioApp.views.xmlView.generateXml(), studioApp.models.jobModel, automaticValidation);
            }
        }

        $("#validate-button").click(function (event) {
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

        $("#undo-button").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }
            closeCollapsedMenu();
            undoManager.undo()
        });

        $("#redo-button").click(function (event) {
            event.preventDefault();

            var studioApp = require('StudioApp');
            if (!studioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }
            closeCollapsedMenu();
            undoManager.redo()
        });

        $(document).on('focus', "*", function () {
            undoManager._disable();
        });

        $(document).on('focusout', function () {
            undoManager._enable();
            undoManager.save();
        });
        
        function notify_message(title, text, typeSuccess){
        	PNotify.removeAll();
        	var type = typeSuccess ? 'success' : 'error';
        	new PNotify({
        	    title: title,
        	    text: text,
        	    type: type,
        	    text_escape: true,
        	    buttons: {
        	        closer: true,
        	        sticker: false
        	    },
        	    addclass: 'translucent', // is defined in studio.css
        	    width: '20%',
        	    history: {
        	        history: false
        	    }
        	});
        }

        (function scriptManagement() {
            $(document).on("click", '.edit-full-screen', function () {
                $(".CodeMirror").remove();
                var textarea = $(this).parents('form').find('textarea');
                var content = textarea.val();
                $("#set-script-content").data("area", textarea);
                $("#full-edit-modal-script-content").val(content);
                var editor = CodeMirror.fromTextArea($("#full-edit-modal-script-content").get(0), {
                    lineNumbers: true,
                    mode: "javascript"

                });
                $('#full-edit-modal').modal('show');
                $("#set-script-content").data("editor", editor);

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
                $(".CodeMirror").height($(".code-editor-container").height())
                $("#set-script-content").data("editor").refresh()
            })

            $("#set-script-content").click(function () {
                var editor = $("#set-script-content").data("editor");
                editor.save()
                $(this).data("area").val($("#full-edit-modal-script-content").val());

                var studioApp = require('StudioApp');
                // propagating changes to the model
                var form = studioApp.views.propertiesView.$el.data('form')
                form.commit();
            })
        })();

        $(document).ready(function () {
        	
        	var result = "http://doc.activeeon.com/" ;

            $.getScript("studio-conf.js", function () {
                console.log('conf:');
                console.log(conf);
                if (conf.studioVersion.indexOf("SNAPSHOT") > -1){
                    result = result + "dev";
                }
                else{
                    result = result + conf.studioVersion;
                }

                $("#documentationLinkId").attr("href", result);
            });


        	
            var ctrlDown = false;
            var ctrlKey = 17, commandKey = 91, vKey = 86, cKey = 67, zKey = 90, yKey = 89;
            var copied = false;
            var pasteAllow = true;

            $(document).keydown(function (e) {
                if (e.keyCode == ctrlKey || e.keyCode == commandKey) ctrlDown = true;
            }).keyup(function (e) {
                if (e.keyCode == ctrlKey || e.keyCode == commandKey) ctrlDown = false;
            });

            $(document).keydown(function (e) {
                if (ctrlDown && e.keyCode == cKey) {
                    console.log("copy");
                    copied = [];
                    $(".selected-task").each(function (i, t) {
                        copied.push(t);
                    })
                }
                if (ctrlDown && e.keyCode == vKey) {
                    if (pasteAllow) {
                        console.log("paste");
                        require('StudioApp').views.workflowView.copyPasteTasks(copied, pasteAllow);
                    }
                }
                if (ctrlDown && e.keyCode == zKey) {
                    undoManager.undoIfEnabled();
                }
                if (ctrlDown && e.keyCode == yKey) {
                    undoManager.redoIfEnabled();
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

                $.when(createdWorkflowPromise).then(function () {
                    var newWorkflow = createdWorkflowPromise.responseJSON;
                    add_workflow_to_collection(newWorkflow, xmlContent);
                });
            })
        });

        // adding form-control classes to new input elements after clicking on "add"
        // button in forms
        $(document).on('click', 'button[data-action="add"]', function () {
            $('input').addClass("form-control");
        })

        // saving job xml every min to local store
        setInterval(save_workflow, 10000);
        // validating job periodically
        setInterval(function(){validate_job(true);}, 30000);

       return {
           saveWorkflow: save_workflow
       };

    });
