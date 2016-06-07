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

    function ($, Backbone, undoManager, StudioClient, xml2json, CodeMirror, jobVariablesTemplate, CatalogView) {

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

            event.preventDefault();
            var studioApp = require('StudioApp');
            if (!studioApp.models.currentWorkflow) {
                $('#select-workflow-modal').modal();
                return;
            }

            closeCollapsedMenu();
            $('#import-file').parent('form').trigger('reset');
            $('#import-file').click();
        })

        $('#import-file').change(function (env) {
            var StudioApp = require('StudioApp');

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
                        StudioApp.merge(json, null);
                        StudioApp.updateWorkflowName(json.job);
                        StudioApp.views.workflowView.importNoReset();
                    }
                }
                reader.readAsBinaryString(file);
            }
        })

        $("#export-button").click(function (event) {
            event.preventDefault();

            var StudioApp = require('StudioApp');
            if (!StudioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }
            save_workflow();
            closeCollapsedMenu();
            StudioApp.views.xmlView.render();
            $('#xml-view-modal').modal();
        })

        $("#browse-catalog-button").click(function (event) {
            event.preventDefault();
            var StudioApp = require('StudioApp');
            StudioApp.views.catalogView.render();
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

            var StudioApp = require('StudioApp');
            if (!StudioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();

            var jobVariables = StudioApp.models.jobModel.get('Variables');
            if (jobVariables == null || jobVariables.length == 0) {
                executeIfConnected(submit);
                return;
            }

            var template = _.template(jobVariablesTemplate, {'jobVariables': jobVariables});
            $('#job-variables').html(template);
            $('#execute-workflow-modal').modal();
        });

        $("#exec-button").click(function (event) {
            var StudioApp = require('StudioApp');
            executeIfConnected(function () {
                var oldJobVariables = StudioApp.models.jobModel.get('Variables');
                var jobVariables = $('#job-variables').find('input').map(function() {
                    return {'Name': $(this).attr('name'), 'Value': $(this).val()};
                });
                StudioApp.models.jobModel.set('Variables', jobVariables);
                submit();
                StudioApp.models.jobModel.set('Variables', oldJobVariables);
            })
        });

        function executeIfConnected(action) {
            var StudioApp = require('StudioApp');
            StudioClient.isConnected(action, function () {
                // ask to login first
                StudioApp.views.loginView.render();
            })
        }

        function submit() {
            var StudioApp = require('StudioApp');
            var xml = StudioApp.views.xmlView.generateXml();
            var htmlVisualization = StudioApp.views.xmlView.generateHtml();
            StudioClient.submit(xml, htmlVisualization);
        }

        $("#clear-button").click(function (event) {
            event.preventDefault();

            var StudioApp = require('StudioApp');
            if (!StudioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();
            console.log("Clearing the workflow");
            StudioApp.clear();
        });

        $("#save-button").click(function (event) {
        	
            event.preventDefault();

            var StudioApp = require('StudioApp');
            if (!StudioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            closeCollapsedMenu();
            save_workflow();

            PNotify.removeAll();

            new PNotify({
                title: 'Saved',
                text: 'Workflow has been saved',
                type: 'success',
                buttons: {
                    closer: true,
                    sticker: false
                },
                opacity: .8,
                width: '20%',
                history: {
                    history: false
                }
            });
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
            var StudioApp = require('StudioApp');
            var jobName = StudioApp.models.jobModel.get("Name")
            var blob = new Blob([StudioApp.views.xmlView.generatedXml]);
            saveAs(blob, jobName + ".xml")
        })

        $("#publish-to-catalog-button").click(function (event) {
            console.log("publish-to-catalog-button event !");
            var StudioApp = require('StudioApp');

            // TODO how do I get the selected Bucket from the dropdown list ?
            var mockedBucketId = 2;
            var xmlToPublish = StudioApp.views.xmlView.generateXml();
            var layout = JSON.stringify(StudioApp.models.currentWorkflow.getMetadata());
            var createdWorkflowPromise = publish_to_catalog(mockedBucketId, xmlToPublish, layout);
            var newWorkflow = undefined;
            $.when(createdWorkflowPromise).then(function () {
                newWorkflow = createdWorkflowPromise.responseJSON;
                console.log(newWorkflow);
                console.log('JSON:');
                console.log(newWorkflow);
                var newWorkflowModel = StudioApp.models.catalogBuckets.models[1].get('workflows').create(
                    {
                        // id: newWorkflow.id,
                        // name: newWorkflow.name,
                        // variables: newWorkflow.variables,
                        // generic_information: newWorkflow.generic_information,
                        // created_at: newWorkflow.created_at,
                        // revision_id: newWorkflow.revision_id,
                        // bucket_id: newWorkflow.bucket_id,
                        // project_name: newWorkflow.project_name,
                        // layout: newWorkflow.layout
                    },
                    {
                        xmlContent: xmlToPublish,
                        layout: layout
                    });
                console.log("new workflow model created:");
                console.log(newWorkflowModel);
            });
            // TODO create a new RestWorkflow and add it to the adequate bucket

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

        function publish_to_catalog (bucketId, xmlContent, layoutContent) {

            var payload = new FormData();
            var blob = new Blob([xmlContent], { type: "text/xml" });
            payload.append('file', blob);

            // TODO add the layout as a query parameter

            return $.ajax({
                url: '/workflow-catalog/buckets/' + bucketId + '/workflows',
                type: 'POST',
                contentType: false,
                processData: false,
                cache: false,
                data: payload
            }).success(function (response) {
                return response;
            });
        }

        function save_workflow() {
            var StudioApp = require('StudioApp');
            if (StudioApp.models.jobModel) {
                StudioApp.views.propertiesView.saveCurrentWorkflow(
                    StudioApp.models.jobModel.get("Name"),
                    StudioApp.views.xmlView.generateXml(),
                    {
                        offsets: undoManager.getOffsetsFromDOM(),
                        project: StudioApp.models.jobModel.get("Project"),
                        detailedView: StudioApp.models.currentWorkflow.getMetadata()['detailedView']
                    }
                );
            }
        }

        function validate_job() {
            $(".invalid-task").removeClass("invalid-task");
            var StudioApp = require('StudioApp');
            if (StudioApp.isWorkflowOpen()) {
                StudioClient.validate(StudioApp.views.xmlView.generateXml(), StudioApp.models.jobModel);
            }
        }

        $("#validate-button").click(function (event) {
            event.preventDefault();

            var StudioApp = require('StudioApp');
            if (!StudioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }

            save_workflow();
            closeCollapsedMenu();
            StudioClient.resetLastValidationResult()
            validate_job();
        });

        $("#undo-button").click(function (event) {
            event.preventDefault();

            var StudioApp = require('StudioApp');
            if (!StudioApp.isWorkflowOpen()) {
                $('#select-workflow-modal').modal();
                return;
            }
            closeCollapsedMenu();
            undoManager.undo()
        });

        $("#redo-button").click(function (event) {
            event.preventDefault();

            var StudioApp = require('StudioApp');
            if (!StudioApp.isWorkflowOpen()) {
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

                var StudioApp = require('StudioApp');
                // propagating changes to the model
                var form = StudioApp.views.propertiesView.$el.data('form')
                form.commit();
            })
        })();

        $(document).ready(function () {
        	
        	var result = "http://doc.activeeon.com/" ;
        	
        	if (conf.studioVersion.indexOf("SNAPSHOT") > -1){
        		result = result + "latest";
        	}else{
        		result = result + conf.studioVersion;
        	}
        	
        	
        	
        	$("#documentationLinkId").attr("href", result);
        	
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
        setInterval(validate_job, 30000);

       return {
           saveWorkflow: save_workflow
       };

    });
