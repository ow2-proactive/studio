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
                "click #btn-remove-workflow": "removeConfirm",
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
            removeConfirm: function(){
                var StudioApp = require('StudioApp');
                StudioApp.workflowToRemove = this.model;
                $('#delete-workflow-confirmation-modal').modal();

            },
            removeWorkflow: function(event) {

            },
            render: function () {
                var workflowList = _.template(catalogWorkflowList);
                $(this.el).append(workflowList({ workflow: this.model }));
                return this;
            }
        })
    })
