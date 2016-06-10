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
            pullWorkflow: function(e){
                e.preventDefault();
                var xmlContent = this.model.getXml();
                var StudioApp = require('StudioApp');
                $.when(xmlContent).done(function () {
                    if (!StudioApp.models.currentWorkflow) {
                        $('#select-workflow-modal').modal();
                        return;
                    }
                    else {
                        StudioApp.xmlToImport = xmlContent.responseText;
                        $('#import-workflow-confirmation-modal').modal();
                    }
                });
            },
            toggleRemovalState: function (event) {
                if (this.$('#btn-toggle-removal-state input').prop('checked')) {
                    this.$('#btn-toggle-removal-state input').prop('checked', false);
                    this.$('#btn-toggle-removal-state i')
                        .removeClass()
                        .addClass('state-icon glyphicon glyphicon-unchecked');
                }
                else {
                    this.$('#btn-toggle-removal-state input').prop('checked', true);
                    this.$('#btn-toggle-removal-state i')
                        .removeClass()
                        .addClass('state-icon glyphicon glyphicon-check');
                }
                this._notifyDeleteButton();
            },
            removeConfirm: function(){
                var StudioApp = require('StudioApp');
                StudioApp.workflowToRemove = this.model;
                $('#delete-workflow-confirmation-modal').modal();
            },
            _notifyDeleteButton: function() {
                var deleteButton = $('#delete-selection-catalog');
                console.log('Delete button:');
                console.log(deleteButton);

                // how many workflowitems are ticked ?
                var nbTickedWorkflows = $('#catalog-workflow-list li').has('input:checkbox:checked').length;
                console.log('Ticked workflows:');
                console.log(nbTickedWorkflows);

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
