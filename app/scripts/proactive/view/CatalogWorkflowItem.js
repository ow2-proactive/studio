define(
    [
        'jquery',
        'backbone',
        'xml2json',
        'text!proactive/templates/catalog-workflow.html'
    ],

    function ($, Backbone, xml2json, catalogWorkflowList) {

        "use strict";

        return Backbone.View.extend({
            tagName: "li",
            events: {
                "click #btn-pull-workflow-xml": "pullWorkflow",
                "click #btn-push-workflow-xml": "pushWorkflow"
            },
            // Pull from the Catalog to the Studio
            pullWorkflow: function(e){
                e.preventDefault();
                var xmlContent = this.model.getXml();
                $.when(xmlContent).done(function () {
                    var StudioApp = require('StudioApp');
                    if (!StudioApp.models.currentWorkflow) {
                        $('#select-workflow-modal').modal();
                        return;
                    }
                    else {
                        StudioApp.mergeXML(xmlContent.responseText, null);
                        StudioApp.views.workflowView.importNoReset();
                    }
                });
            },
            render: function () {
                var workflowList = _.template(catalogWorkflowList);
                $(this.el).append(workflowList({ workflow: this.model }));
                return this;
            }
        })
    })
