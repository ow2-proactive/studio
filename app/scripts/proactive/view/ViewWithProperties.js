define(
    [
        'jquery',
        'backbone',
        'proactive/view/ViewWatchingModelChange'
    ],

    function ($, Backbone, ViewWatchingModelChange) {

    "use strict";

    return ViewWatchingModelChange.extend({

        render: function () {
            var that = this;
            if (this.element) this.$el = this.element;

            this.$el.unbind('click');

            this.$el.click(function (event) {
                event.stopPropagation();
                that.renderForm()
            });
            this.$el.dblclick(function () {
                event.stopPropagation();
            })

            return this;
        },

        renderForm: function () {

            var StudioApp = require('StudioApp');

            var that = this
            that.clearTextSelection();

            var form = new Backbone.Form({
                'model': that.model
            }).render();

            var breadcrumb = $('<ul id="breadcrumb" class="breadcrumb"></ul>');
            var workflows = $('<li class="active"><a href="#" id="breadcrumb-list-workflows">Workflows</a></li>');
            breadcrumb.append(workflows)
            breadcrumb.append('<li class="active"><span id="breadcrumb-job-name">' + StudioApp.models.jobModel.get("Job Name") + '</span></li>')

            if (that.model.get("Task Name")) {
                breadcrumb.append('<li class="active"><span id="breadcrumb-task-name">' + that.model.get("Task Name") + '</span></li>')

                var removeTask = $('<a href="#" class="glyphicon glyphicon-trash pull-right" title="Remove task"></a>');
                removeTask.click(function () {
                    workflowView.removeView(that);
                    return false;
                })
                breadcrumb.append(removeTask)
            } else {
                // selected-task class is used for copy/paste, delete operations, group task moving etc
                $(".selected-task").removeClass("selected-task");
                // active-task class is used to identify which task is currently shown in the properties view
                $(".active-task").removeClass("active-task");
            }

            workflows.click(function () {
                return StudioApp.views.propertiesView.listWorkflows();
            })

            that.form = form;
            StudioApp.views.propertiesView.$el.data('form', form);

            form.on('change', function (f, changed) {
                form.commit();
            })


            form.$el.find("input").addClass("form-control");
            form.$el.find("select").addClass("form-control");
            form.$el.find("textarea").addClass("form-control");

            var tabs = form.$el.find("[data-tab]");
            if (tabs.length > 0) {
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

                        var accordionGroup = $('<div class="panel panel-default"><div class="panel-heading"><a data-toggle="collapse" data-parent="#accordion-properties" href="#' + accId + '">' + el.attr("data-tab") + '</a></div></div>');
                        currentAccordionGroup = $('<div id="' + accId + '" class="panel-body collapse ' + (openAccordion ? "in" : "") + '"></div>');
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
                        el = el.find("label").addClass("checkbox").append(checkbox);
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
            } else {
                StudioApp.views.propertiesView.$el.html(breadcrumb);
                StudioApp.views.propertiesView.$el.append(form.$el);
            }

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
