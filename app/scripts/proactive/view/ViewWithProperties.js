define(
    [
        'jquery',
        'backbone',
        'proactive/view/ViewWatchingModelChange',
        'proactive/view/utils/undo'
    ],

    function ($, Backbone, ViewWatchingModelChange, undoManager) {

    "use strict";

    return ViewWatchingModelChange.extend({

        render: function () {
            var that = this;
            if (this.element) this.$el = this.element;

            this.$el.unbind('click');

            this.$el.click(function (event) {
                var target = $(event.target);
                if (!target.attr("id")) {
                    target = target.parents("[id]")
                }

                if (event.isPropagationStopped() ||
                    // preventing the execution of a handler of underlying element (e.g. when click on task handler for a job is also triggered)
                    target.attr('id') != that.$el.attr('id')) {
                    return;
                }
                event.stopPropagation();
                $(".dropdown").removeClass('open');
                that.renderForm()
            });
            this.$el.dblclick(function () {
                event.stopPropagation();
            })

            return this;
        },

        renderForm: function () {

            var StudioApp = require('StudioApp');
            var workflow = StudioApp.models.currentWorkflow;
            var detailedView = workflow.getMetadata()['detailedView'];

            var that = this
            that.clearTextSelection();

            var form = new Backbone.Form({
                'model': that.model,
                fields: detailedView?undefined:that.model.getBasicFields()
            }).render();
            this.form = form;

            var breadcrumb = $('<ul id="breadcrumb" class="breadcrumb"></ul>');

            // TODO do not duplicate breadcrumbs (see another one in WorkflowListView)
            var mode = StudioApp.views.propertiesView.mode;
            var workflows = $('<li class="active"><span><a href="#" id="breadcrumb-list-workflows">' +
                mode.charAt(0).toUpperCase() + mode.slice(1) + 's' + '</a></span></li>');
            breadcrumb.append(workflows)

            var jobBreadcrumb
            if (that.model.get("Task Name")) {
                jobBreadcrumb = $('<li class="active"><span id="breadcrumb-job-name"><a href="#" id="breadcrumb-selected-job">' + StudioApp.models.jobModel.get("Job Name") + '</a></span></li>');
                breadcrumb.append(jobBreadcrumb)

                breadcrumb.append('<li class="active"><span id="breadcrumb-task-name">' + that.model.get("Task Name") + '</span></li>')

                var removeTask = $('<a href="#" class="glyphicon glyphicon-trash pull-right" title="Remove task"></a>');
                removeTask.click(function () {
                    StudioApp.views.workflowView.removeView(that);
                    return false;
                })
                breadcrumb.append(removeTask)
            } else {
                jobBreadcrumb = $('<li class="active"><span id="breadcrumb-job-name">' + StudioApp.models.jobModel.get("Job Name") + '</span></li>');
                breadcrumb.append(jobBreadcrumb)

                // selected-task class is used for copy/paste, delete operations, group task moving etc
                $(".selected-task").removeClass("selected-task");
                // active-task class is used to identify which task is currently shown in the properties view
                $(".active-task").removeClass("active-task");

                var icon = detailedView? "glyphicon-th-list" : "glyphicon-list";
                var title = detailedView? "Switch to simple view": "Switch to detailed view";
                var changeView = $('<a href="#" class="glyphicon '+icon+' pull-right" title="'+title+'"></a>');

                changeView.click(function () {

                    if (StudioApp.models.jobModel) {
                        // saving current workflow
                        StudioApp.views.propertiesView.saveCurrentWorkflow(
                            StudioApp.models.jobModel.get("Job Name"),
                            StudioApp.views.xmlView.generateXml(),
                            {
                                offsets: undoManager.getOffsetsFromDOM(),
                                project: StudioApp.models.jobModel.get("Project"),
                                detailedView: !detailedView
                            }
                        );
                        that.renderForm();
                    }

                    return false;
                })
                breadcrumb.append(changeView)
            }

            workflows.click(function (event) {
                event.preventDefault();

                if (StudioApp.models.jobModel) {
                    StudioApp.views.propertiesView.saveCurrentWorkflow(
                        StudioApp.models.jobModel.get("Job Name"),
                        StudioApp.views.xmlView.generateXml(),
                        {
                            offsets: undoManager.getOffsetsFromDOM(),
                            project: StudioApp.models.jobModel.get("Project"),
                            detailedView: detailedView
                        }
                    );
                }

                return StudioApp.views.propertiesView.listCurrent();
            })
            jobBreadcrumb.click(function (event) {
                event.preventDefault();
                return $("#workflow-designer").click();
            })

            StudioApp.views.propertiesView.$el.data('form', form);

            form.on('change', function (f, changed) {
                form.commit()
                if (that.formChangeUpdate) that.formChangeUpdate();

                if (!detailedView && that.model.commitSimpleForm) {
                    that.model.commitSimpleForm(form)
                }
            })

            form.$el.find("input").addClass("form-control");
            form.$el.find("select").addClass("form-control");
            form.$el.find("textarea").addClass("form-control");
            form.$el.find("button").addClass("btn").addClass("btn-default");

            var tabs = form.$el.find("[data-tab]");
            if (tabs.length > 0 && detailedView) {
                var accordion = $('<div class="panel-group" id="accordion-properties">');
                var currentAccordionGroup = undefined;
                var curLabel = "";

                $.each(form.$el.children().children(), function (i, elem) {
                    var el = $(elem);
                    if (el.attr("data-tab")) {
                        var accId = "acc-" + i;
                        // defining if this accordion should be opened
                        var openAccordion = false;
                        if (i == 0 && !that.openedAccordion) {
                            openAccordion = true;
                        }
                        if (accId == that.openedAccordion) {
                            openAccordion = true;
                        }

                        var accordionGroup = $('<div class="panel panel-default"><div class="panel-heading"><a id="'+ el.attr("data-tab")+ '" data-toggle="collapse" data-parent="#accordion-properties" href="#' + accId + '">' + el.attr("data-tab") + '</a></div></div>');
                        currentAccordionGroup = $('<div id="' + accId + '" class="panel-body collapse ' + (openAccordion ? "in" : "") + '"></div>');

                        if (el.attr("data-help")) {
                            accordionGroup.attr("data-help", el.attr("data-help"));
                        }
                        accordionGroup.append(currentAccordionGroup);
                        accordion.append(accordionGroup);
                        curLabel = el.attr("data-tab").replace(/ /g, '');
                    }

                    // remove duplicate labels that comes from nested types
                    el.find("label").each(function (i, label) {
                        var labelName = $(label).text().replace(/ /g, '');
                        if (labelName && labelName == curLabel) {
                            // removing the duplicate as it's already in the accordion caption
                            $(label).remove();
                        } else {
                            curLabel = labelName;
                        }
                    })

                    // modifying checkbox layout
                    var checkbox = el.find("input[type='checkbox']");
                    if (checkbox.length > 0) {
                        var label = el.find("label");
                        label.addClass("checkbox");
                        checkbox.detach().appendTo(label);
                    }

                    if (currentAccordionGroup)
                        currentAccordionGroup.append($('<div class="form-wrap"></div>').append(el));

                })

                StudioApp.views.propertiesView.$el.html(breadcrumb);
                StudioApp.views.propertiesView.$el.append(accordion);

                // saving expanded accordion
                $('[data-toggle="collapse"]').click(function () {
                    var accordionBody = $(this).parents(".panel").find(".panel-body");
                    if (!accordionBody.hasClass("in")) {
                        that.openedAccordion = accordionBody.attr('id')
                    }
                })

                // adding help info
                accordion.find("[data-help]").each(function() {
                    var el = $(this);

                    var help = $("<span class='glyphicon glyphicon-info-sign pointer help-sign' data-toggle='tooltip' data-placement='right' title='"+el.attr("data-help")+"'></span>")
                    help.tooltip({html: true});

                    var addHelpAfter = el.find("label:first")

                    if (addHelpAfter.length==0) {
                        addHelpAfter = el.parents(".panel").find(".panel-heading a");
                    } else if (addHelpAfter.hasClass("checkbox")) {
                        addHelpAfter = addHelpAfter.find("input:last");
                    }
                    // if already exist - remove it (see tricky case for control flows in tasks)
                    var next = addHelpAfter.next();
                    if (next && next.hasClass("help-sign")) {
                        next.remove();
                    }

                    addHelpAfter.after(help);
                })

            } else {
                StudioApp.views.propertiesView.$el.html(breadcrumb);
                StudioApp.views.propertiesView.$el.append(form.$el);
            }

            if (that.formChangeUpdate) that.formChangeUpdate();

            // showinf only file names in job classpath
            $(".visible-job-classpath input").val(function () {
                var fullPath = $(this).val();
                var fileName = fullPath.replace(/^.*[\\\/]/, '')
                $(this).attr('readonly', true);
                return fileName;
            })
        },
        clearTextSelection: function () {
            if (document.selection && document.selection.empty) {
                document.selection.empty();
            } else if (window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }
        }
    })

})
