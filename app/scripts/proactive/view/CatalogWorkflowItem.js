define(
    [
        'jquery',
        'backbone',
        'xml2json',
        'text!proactive/templates/catalog-workflow.html',
        'proactive/view/CatalogView'
    ],

    function ($, Backbone, xml2json, catalogWorkflowList, CatalogView) {

        "use strict";

        return Backbone.View.extend({
            tagName: "li",
            events: {
                "click #btn-pull-workflow-xml": "pullWorkflow",
		        "click #btn-toggle-removal-state": "toggleRemovalState"
            },
            // Pull from the Catalog to the Studio
            pullWorkflow: function (e) {
                e.preventDefault();
                var xmlContent = this.model.getXml();
                var StudioApp = require('StudioApp');
                $.when(xmlContent).done(function () {
                    StudioApp.xmlToImport = xmlContent.responseText;
                    $('#import-workflow-confirmation-modal').modal();
                });
            },
            toggleRemovalState: function (event) {
                var StudioApp = require('StudioApp');
                var currentModel = this.model;

                if (this.$('#btn-toggle-removal-state input').prop('checked')) {
                    this.$('#btn-toggle-removal-state input').prop('checked', false);
                    this.$('#btn-toggle-removal-state i')
                        .removeClass()
                        .addClass('state-icon glyphicon glyphicon-unchecked');
                    StudioApp.modelsToRemove = $.grep(StudioApp.modelsToRemove, function (model, index) {
                        console.log('currentModel id: ' + currentModel.get('id'));
                        console.log('model from array:' + model.get('id'));
                        return currentModel.get('id') != model.get('id');
                    })
                }
                else {
                    this.$('#btn-toggle-removal-state input').prop('checked', true);
                    this.$('#btn-toggle-removal-state i')
                        .removeClass()
                        .addClass('state-icon glyphicon glyphicon-check');
                    StudioApp.modelsToRemove.push(this.model);
                }
                this._notifyDeleteButton();
            },
            _notifyDeleteButton: function() {
                var deleteButton = $('#delete-selection-catalog');

                // how many workflowitems are ticked ?
                var nbTickedWorkflows = $('#catalog-workflow-list li').has('input:checkbox:checked').length;

                // if there's at least one ticked workflow item, enable the button
                if (nbTickedWorkflows > 0) {
                    deleteButton.text("Delete (" + nbTickedWorkflows + ")");
                    deleteButton.prop('disabled', false);
                }
                else {
                    deleteButton.text("Delete");
                    deleteButton.prop('disabled', true);
                }
            },
            render: function () {
                var workflowList = _.template(catalogWorkflowList);
                $(this.el).html(workflowList({ workflow: this.model }));
                return this;
            }
        })
    })
