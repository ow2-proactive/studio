define(
    [
        'jquery',
        'backbone',
        'proactive/model/Job'
    ],

    function ($, Backbone, Job) {

    "use strict";

    return Backbone.View.extend({
        listWorkflows: function () {

            var that = this;

            var breadcrumb = $('<ul class="breadcrumb"></ul>');
            var workflows = $('<li class="active"><span>Workflows</span></li>');
            breadcrumb.append(workflows)

            var newWorkflow = $('<button type="button" class="btn btn-success btn-small create-workflow-button">Create Workflow</button>')

            newWorkflow.click(function () {
                var jobModel = new Job();
                var jobName = jobModel.get("Job Name");
                jobName += (that.options.projects.getSavedWorkflowCount()+1);
                jobModel.set("Job Name", jobName);

                var jobXml = that.options.xmlView.xml(jobModel);
                that.options.projects.addEmptyWorkflow(jobName, jobXml);

                var workflowJson = that.options.projects.getCurrentWorkFlowAsJson()
                if (workflowJson) {
                    var StudioApp = require('StudioApp');
                    StudioApp.import(workflowJson)
                }

                that.listWorkflows();
            })

            this.$el.html(breadcrumb);
            this.$el.append(newWorkflow);

            var workflows = that.options.projects.getWorkFlows();
            var selectedWorkflow = that.options.projects.getSelectWorkflowIndex();
            if (workflows.length > 0) {
                var table = $('<table class="table table-striped table-hover"></table>');
                var rows = $('<tbody></tbody>')

                table.append('<thead><tr><th>#</th><th>Name</th><th>Actions</th></tr></thead>');
                table.append(rows);

                for (var i = workflows.length - 1; i >= 0; i--) {
                    var rowClass = "";
                    if (i == selectedWorkflow) rowClass = "success";
                    rows.append('<tr data-id="' + i + '" class="' + rowClass + '"><td>' + (i + 1) + '</td><td title="Click to edit">' + workflows[i].name + '</td><td><button type="button" class="btn btn-success btn-mini btn-open">Open</button> <button type="button" class="btn btn-info btn-mini btn-clone">Clone</button> <button type="button" class="btn btn-danger btn-mini btn-remove">Remove</button></td></tr>')
                }

                this.$el.append(table);

                table.find('.btn-clone').click(function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    var workflowIndex = $(this).parents("tr").attr('data-id');
                    if (workflowIndex) {
                        console.log("Cloning the workflow number ", workflowIndex)
                        that.options.projects.cloneWorkflow(workflowIndex);
                        that.listWorkflows();
                    }
                })
                table.find('.btn-remove').click(function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    var workflowIndex = $(this).parents("tr").attr('data-id');
                    if (workflowIndex) {
                        console.log("Removing the workflow number ", workflowIndex)
                        that.options.projects.removeWorkflow(workflowIndex);
                        that.listWorkflows();
                    }
                })
                table.find('tr').click(function () {
                    var workflowIndex = $(this).attr('data-id');
                    if (workflowIndex) {
                        that.options.projects.setSelectWorkflowIndex(workflowIndex);
                        var workflowJson = that.options.projects.getCurrentWorkFlowAsJson()
                        if (workflowJson) {
                            var StudioApp = require('StudioApp');
                            StudioApp.import(workflowJson)
                        }
                    }
                    that.listWorkflows();
                })
            }

            return false;
        }
    })

})
