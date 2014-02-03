define(
    [
        'jquery',
        'backbone',
        'proactive/view/utils/undo',
        'proactive/rest/studio-client',
        'xml2json',
        'codemirror',
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

    function ($, Backbone, undoManager, StudioClient, xml2json, CodeMirror) {

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

    $("#import-button").click(function () {
        $('#import-file').click();
    })

    $('#import-file').change(function (env) {
        var files = env.target.files;
        if (files.length > 0) {
            var file = files[0];
            if (!file.type.match('text/xml')) {
                return;
            }
            var reader = new FileReader();
            reader.onloadend = function (evt) {

                if (evt.target.readyState == FileReader.DONE) {
                    var json = xml2json.xmlToJson(xml2json.parseXml(evt.target.result))
                    var StudioApp = require('StudioApp');
                    StudioApp.import(json)
                }
            }
            reader.readAsBinaryString(file);
        }
    })

    $("#export-button").click(function () {
        require('StudioApp').views.xmlView.render();
        $('#xml-view-modal').modal();
    })

    $("#layout-button").click(function () {
        require('StudioApp').views.workflowView.autoLayout();
    });
    $("#zoom-in-button").click(function () {
        require('StudioApp').views.workflowView.zoomIn();
    });
    $("#zoom-out-button").click(function () {
        require('StudioApp').views.workflowView.zoomOut();
    });
    $("#zoom-reset-button").click(function () {
        require('StudioApp').views.workflowView.setZoom(1);
    });

    $("#submit-button").click(function () {

        StudioClient.isConnected(function () {
            // submitting
            var StudioApp = require('StudioApp');
            StudioApp.views.xmlView.render();

            var button = $(this);
            var xml = StudioApp.views.xmlView.generateXml()
            var htmlVisualization = StudioApp.views.xmlView.generateHtml();
            StudioClient.submit(xml, htmlVisualization)
        }, function () {
            // ask to login first
            $('#scheduler-connect-modal').modal();
        })

    });

    $("#clear-button").click(function () {
        console.log("Removing the workflow");
        localStorage.removeItem('job-model');
        var StudioApp = require('StudioApp');
        StudioApp.clear();
        StudioApp.views.workflowView.$el.click();
    });

    $("#save-button").click(function () {
        save_workflow_to_storage();
    });

    $("#download-xml-button").click(function () {
        console.log("Saving xml");
        var StudioApp = require('StudioApp');
        var jobName = StudioApp.models.jobModel.get("Job Name")
        var blob = new Blob([StudioApp.views.xmlView.generatedXml]);
        saveAs(blob, jobName + ".xml")
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

    // submitting job by pressing enter
    $('#scheduler-connect-modal').on('keypress', function (e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $("#submit-button-dialog").click();
        }
    });

    $('#script-save-modal').on('keypress', function (e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            $("#script-save-button").click();
        }
    });

    function save_workflow_to_storage() {
        var StudioApp = require('StudioApp');
        StudioApp.models.projects.saveCurrentWorkflow(
            StudioApp.models.jobModel.get("Job Name"), StudioApp.views.xmlView.generateXml(), undoManager.getOffsetsFromDOM());
    }

    function validate_job() {
        console.log("Validating");
        $(".invalid-task").removeClass("invalid-task");
        var StudioApp = require('StudioApp');
        StudioClient.validate(StudioApp.views.xmlView.generateXml(), StudioApp.models.jobModel);
    }

    $("#validate-button").click(function () {
        StudioClient.resetLastValidationResult()
        validate_job();
    });

    $("#undo-button").click(function () {
        undoManager.undo()
    });

    $("#redo-button").click(function () {
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

        function loadSelectedScript() {
            var scriptName = $(this).find(":selected").text();
            var form = $(this).parents('form')
            var textarea = form.find('textarea');
            var libraryPath = form.find('input[name="Library Path"]');
            var fileArguments = form.find('div[placeholder="file->arguments->argument"]');
            var engine = form.find('div[placeholder="code->@attributes->language"]')
            var saveButton = form.find('button.save-script')
            var saveAsButton = form.find('button.save-script-as');
            if (scriptName === "--inline--") {
                libraryPath.val('');
                fileArguments.hide();
                engine.show();
                saveButton.attr("disabled", true);
                StudioClient.isConnected(function () {}, function () {
                    saveAsButton.attr("disabled", true);
                });
            } else {
                var script = StudioClient.getScript(scriptName);
                textarea.val(script.content);
                libraryPath.val(script.absolutePath);
                fileArguments.show();
                engine.hide();
                saveButton.attr("disabled", false);
            }
            getCurrentForm().commit();
        }

        function getCurrentTaskView() {
            var taskName = $("#properties-container").find('#breadcrumb-task-name').text();
            return require('StudioApp').views.workflowView.getTaskViewByName(taskName)
        }

        function getCurrentForm() {
            return require('StudioApp').views.propertiesView.$el.data('form')
        }

        $(document).on("click", 'select[name="Library"]', loadSelectedScript)

        $(document).on("click", '.save-script', function () {
            var scriptName = $(this).parents("form").find('select[name="Library"] :selected').text();
            if (!scriptName) {
                return;
            }
            var content = $(this).parents('form').find('textarea').val();
            StudioClient.saveScriptSynchronously(scriptName, content);
            getCurrentForm().commit();
        })
        $(document).on("click", '.save-script-as', function () {
            var content = $(this).parents('form').find('textarea').val();
            var placeholder = $(this).parents('form').find("div[placeholder]").attr("placeholder");
            $("#script-save-modal").modal()
            $("#script-save-button").unbind("click").click(function () {

                var scriptName = $('#script-save-modal input').val();
                StudioClient.saveScriptSynchronously(scriptName, content);
                getCurrentTaskView().renderForm();

                var select = $('div[placeholder=' + placeholder + '] select[name=Library]');
                select.val(scriptName);
                loadSelectedScript.call(select);
            })
        })
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
                $(".code-editor-container").height($("#full-edit-modal").height()*0.8 - firstCol.height() - lastCol.height())
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

    (function jobClassPathManagement() {
        $(document).on("click", '.choose-job-classpath', function () {
            var inputFile = $(this).parents("li").find("input[type='file']");
            inputFile.click();

            inputFile.unbind("change");
            inputFile.change(function (env) {

                if ($(this)[0].files.length == 0) {
                    // no files selected
                    return;
                }

                var selectedFileName = undefined;
                var data = new FormData();
                jQuery.each($(this)[0].files, function (i, file) {
                    data.append(file.name, file);
                    selectedFileName = file.name;
                });

                StudioClient.uploadBinaryFile(data, function (fullPath) {
                    if (selectedFileName) {

                        var fullJobClassPath = inputFile.parents("li").find("input[name='Job Classpath']");
                        fullJobClassPath.val(fullPath);

                        var fileName = fullPath.replace(/^.*[\\\/]/, '')
                        var shortJobClassPath = inputFile.parents("li").find(".visible-job-classpath input");
                        shortJobClassPath.val(fileName);
                        shortJobClassPath.attr('readonly', true);

                        var StudioApp = require('StudioApp');
                        if (StudioApp.views.propertiesView.$el.data('form')) {
                            StudioApp.views.propertiesView.$el.data('form').commit();
                        }
                    }
                }, function () {
                    // TODO hide loading icon
                });
            })
        })

        $(document).on('click', 'input[name="Class"]', function () {
            if (!classes) {
                var classes = StudioClient.getClassesSynchronously();
                $(this).autocomplete({
                    source: classes,
                    messages: {
                        noResults: '',
                        results: function () {
                        }
                    }
                });
            }
        })

        $(document).ready(function () {
            var ctrlDown = false;
            var ctrlKey = 17, vKey = 86, cKey = 67, zKey = 90, yKey = 89;
            var copied = false;

            $(document).keydown(function (e) {
                if (e.keyCode == ctrlKey) ctrlDown = true;
            }).keyup(function (e) {
                    if (e.keyCode == ctrlKey) ctrlDown = false;
                });

            $(document).keydown(function (e) {
                if (ctrlDown && e.keyCode == cKey) {
                    console.log("copy");
                    copied = [];
                    $(".selected-task").each(function (i, t) {
                        copied.push(t);
                    })
                }
                ;
                if (ctrlDown && e.keyCode == vKey) {
                    if (copied) {
                        console.log("paste");
                        if (copied) {
                            require('StudioApp').views.workflowView.copyPasteTasks(copied);
                        }
                    }
                }
                ;
                if (ctrlDown && e.keyCode == zKey) {
                    undoManager.undoIfEnabled();
                }
                if (ctrlDown && e.keyCode == yKey) {
                    undoManager.redoIfEnabled();
                }
            });

            $('body').mousedown(function (e) {

                console.log("clearing all selected tasks", e)
                if (e.isPropagationStopped()) {
                    return;
                }

                $(".selected-task").removeClass("selected-task");
                copied = false;
            })

        });
    })();

    // FIX for Firefox that ignores height 100%
    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (is_firefox) {
        $("#workflow-designer").height($("#body-container").height() - 10)
        $("#properties-container").height($("#body-container").height() - 10)
        $(window).resize(function () {
            console.log("resize")
            $("#workflow-designer").height($("#body-container").height() - 10)
            $("#properties-container").height($("#body-container").height() - 10)
        })
    }

    // saving job xml every min to local store
    setInterval(save_workflow_to_storage, 10000);
    // validating job periodically
    setInterval(validate_job, 30000);

})
