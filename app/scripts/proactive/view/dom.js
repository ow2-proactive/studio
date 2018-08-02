define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/view/utils/undo',
        'proactive/rest/studio-client',
        'xml2json',
        'codemirror',
        'text!proactive/templates/job-variable-template.html',
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
        'codemirror/mode/powershell/powershell',
        'codemirror/mode/r/r',
        'codemirror/mode/yaml/yaml',
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

    function ($, Backbone, config, undoManager, StudioClient, xml2json, CodeMirror, jobVariablesTemplate, BeautifiedModalAdapter, PNotify) {

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
            PNotify.removeAll();

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
                   StudioClient.alert("Job descriptor must be a valid XML. Content is not allowed in prolog", "", 'error');
                    return;
                }
                var reader = new FileReader();
                reader.onloadend = function (evt) {

                    if (evt.target.readyState == FileReader.DONE) {
                        var json = xml2json.xmlToJson(xml2json.parseXml(evt.target.result));
                        StudioClient.resetLastValidationResult();
                        if(!StudioClient.validateWithPopup(evt.target.result, json, false)){
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
        })

        $("#get-from-catalog-button").click(function (event) {
            event.preventDefault();
            var studioApp = require('StudioApp');
            studioApp.models.catalogBuckets.setKind("workflow");
            studioApp.models.catalogBuckets.fetch({reset: true, async: false});
            studioApp.modelsToRemove = [];
            studioApp.views.catalogGetView.setKind("workflow/standard", "Workflow");
            studioApp.views.catalogGetView.render();
            $('#catalog-get-modal').modal();
        });

        $("#publish-to-catalog-button").click(function (event) {
            event.preventDefault();
            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen()){
                studioApp.models.catalogBuckets.setKind("workflow");
                studioApp.models.catalogBuckets.fetch({reset: true, async: false});
                studioApp.modelsToRemove = [];
                studioApp.views.catalogPublishView.setKind("workflow/standard", "Workflow");
                studioApp.views.catalogPublishView.setContentToPublish(studioApp.views.xmlView.generateXml(), 'text/xml');
                studioApp.views.catalogPublishView.render();
                $('#catalog-publish-modal').modal();
            }else{
                $('#open-a-workflow-modal').modal();
            }
        });

        function openSetTemplatesMenuModal(order){
            var studioApp = require('StudioApp');
            if (studioApp.isWorkflowOpen()){
                studioApp.models.catalogBuckets.setKind("workflow");
                studioApp.models.catalogBuckets.fetch({reset: true, async: false});
                studioApp.modelsToRemove = [];
                if (order=='main')
                    studioApp.views.catalogSetMainTemplatesBucketView.render();
                else if (order=='secondary')
                    studioApp.views.catalogSetSecondaryTemplatesBucketView.render();
                $('#set-templates-'+order+'-bucket-modal').modal();
            }else{
                $('#open-a-workflow-modal').modal();
            }
        }
        $("#set-templates-main-bucket-button").click(function (event) {
            event.preventDefault();
            openSetTemplatesMenuModal('main');
        });

        $("#set-templates-secondary-bucket-button").click(function (event) {
            event.preventDefault();
            openSetTemplatesMenuModal('secondary');
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
                notify_message('Error', 'Error importing selected Workflow: ' + JSON.stringify(response), false);
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
            require('StudioApp').views.palleteView.setSecondaryTemplatesBucket(bucketName, false);
        });

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

            var jobName = studioApp.models.jobModel.get("Name");
            var jobProjectName = studioApp.models.jobModel.get("Project");
            var jobDescription = studioApp.models.jobModel.get("Description");
            var jobDocumentation = studioApp.models.jobModel.get("Generic Info Documentation");
            var jobGenericInfos = studioApp.models.jobModel.get("Generic Info");


            var jobVariables = readOrStoreVariablesInModel();
            if (jobVariables == null || $.isEmptyObject(jobVariables)) {
                executeIfConnected(submit);
                return;
            }

            var template = _.template(jobVariablesTemplate, {'jobVariables': jobVariables, 'jobName':jobName, 'jobProjectName':jobProjectName, 'jobDescription':jobDescription, 'jobDocumentation':jobDocumentation, 'jobGenericInfos':jobGenericInfos, 'errorMessage':'', 'infoMessage' :''});
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

            $("#plan-workflow-modal").modal();
        });

        $("#exec-button").click(function (event) {
            executeOrCheck(event, false, false)
        });

        $("#check-button").click(function (event) {
            executeOrCheck(event, true, false)
        });

        function executeOrCheck(event, check, plan) {
            var studioApp = require('StudioApp');
            executeIfConnected(function () {
                var oldVariables = readOrStoreVariablesInModel();
                var inputVariables = {};
                var inputReceived = $('#job-variables .variableValue');
                for (var i = 0; i < inputReceived.length; i++) {
                    var input = inputReceived[i];
                    if ($(input).prop("tagName")==='SELECT')
                        inputVariables[input.id] = {'Name': input.name, 'Value':  $(input).find(':selected').text(), 'Model': $(input).data("variable-model")};
                    else if ($(input).prop("tagName")==='INPUT'){
                        inputVariables[input.id] = {'Name': input.name, 'Value': input.value, 'Model': $(input).data("variable-model")};
                    } else if ($(input).prop("tagName")==='DIV'){
                        var checkedRadio = $(input).find("input[type='radio']:checked");
                        var checkRadioValue = $(checkedRadio).val();
                        var inputName = $(checkedRadio).attr('name');
                        inputVariables[input.id] = {'Name': inputName, 'Value': checkRadioValue, 'Model': $(input).data("variable-model")};
                    }
                }
                readOrStoreVariablesInModel(inputVariables);
                var jobName = studioApp.models.jobModel.get("Name");
                var jobProjectName = studioApp.models.jobModel.get("Project");
                var jobDescription = studioApp.models.jobModel.get("Description");
                var jobDocumentation = studioApp.models.jobModel.get("Generic Info Documentation");
                var jobGenericInfos = studioApp.models.jobModel.get("Generic Info");

                var validationData = validate();

                if (!validationData.valid) {
                    var template = _.template(jobVariablesTemplate, {'jobVariables': extractUpdatedVariables(inputVariables, validationData), 'jobName':jobName, 'jobProjectName':jobProjectName, 'jobDescription':jobDescription, 'jobDocumentation':jobDocumentation, 'jobGenericInfos':jobGenericInfos, 'errorMessage': validationData.errorMessage, 'infoMessage' : ''});
                    $('#job-variables').html(template);
                } else if (check) {
                    var template = _.template(jobVariablesTemplate, {'jobVariables': extractUpdatedVariables(inputVariables, validationData), 'jobName':jobName, 'jobProjectName':jobProjectName, 'jobDescription':jobDescription, 'jobDocumentation':jobDocumentation, 'jobGenericInfos':jobGenericInfos, 'errorMessage': '', 'infoMessage' : 'Workflow is valid.'});
                    $('#job-variables').html(template);
                } else {
                    $('#execute-workflow-modal').modal("hide");
                    if(!plan){
                        submit();
                    }else{
                        $("#plan-workflow-modal").modal();
                    }

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
                $('.create-workflow-button').trigger(clickAndOpenEvent);
            }
        }

        $("#confirm-publication-to-catalog").click(function () {
            var studioApp = require('StudioApp');
            studioApp.views.catalogPublishView.publishToCatalog();
        })

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

        function save_workflow() {
            var studioApp = require('StudioApp');
            if (studioApp.models.jobModel) {
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
                var select = $(this).parents('form').find('select');
                var selectedLanguage = select.val()
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

                var content = textarea.val();
                $("#set-script-content").data("area", textarea);
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
                    "Ctrl-]":"indentMore", "Cmd-]":"indentMore",
                    "Ctrl-[":"indentLess", "Cmd-]":"indentLess",
                    "Ctrl-K Ctrl-1":"foldAll","Cmd-K Cmd-1":"foldAll"
                    },
                    foldGutter: true,
                    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                    highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true},
                    scrollbarStyle: "simple",
                    keyMap: "sublime",
                    theme: "eclipse"
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
                $('#variable_reference_link').attr("href", config.docUrl + "/user/ProActiveUserGuide.html#_variables_quick_reference")
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

            $(document).on("click", '.get-script-from-catalog', function (event) {
                var relatedTextAreaId = $(this).attr('data-related-textArea');
                event.preventDefault();
                var studioApp = require('StudioApp');
                studioApp.models.catalogBuckets.setKind("script");
                studioApp.models.catalogBuckets.fetch({reset: true, async: false});
                studioApp.modelsToRemove = [];
                studioApp.views.catalogGetView.setKind('script', "Script");
                studioApp.views.catalogGetView.setTextAreaToImport(relatedTextAreaId);
                studioApp.views.catalogGetView.render();
                $('#catalog-get-modal').modal();
            })

            $(document).on("click", '.publish-script-to-catalog', function (event) {
                var relatedTextAreaId = $(this).attr('data-related-textArea');
                var textAreaValue = document.getElementById(relatedTextAreaId).value;
                var catalogKind = $(this).attr('data-catalog-kind');
                event.preventDefault();
                var studioApp = require('StudioApp');
                studioApp.models.catalogBuckets.setKind("script");
                studioApp.models.catalogBuckets.fetch({reset: true, async: false});
                studioApp.modelsToRemove = [];
                studioApp.views.catalogPublishView.setKind(catalogKind, "Script");
                studioApp.views.catalogPublishView.setContentToPublish(textAreaValue, "text/plain");
                studioApp.views.catalogPublishView.render();
                $('#catalog-publish-modal').modal();
            })

        })();

        $(document).ready(function () {

            var result = "http://doc.activeeon.com/" ;

            $.getScript("studio-conf.js", function () {
                console.log('conf:', conf);
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
           saveWorkflow: save_workflow,
           getWorkflowFromCatalog : getWorkflowFromCatalog,
           open_catalog_workflow : open_catalog_workflow
       };

    });
