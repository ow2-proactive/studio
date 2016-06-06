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
                "click #btn-import-xml": "clicked"
            },
            clicked: function(e){
                e.preventDefault();
                var xmlContent = this.model.getXml();
                $.when(xmlContent).done(function () {
                    var StudioApp = require('StudioApp');
                    StudioApp.mergeXML(xmlContent.responseText, null);
                    StudioApp.views.workflowView.importNoReset();
                });
            },
            render: function () {
                var workflowList = _.template(catalogWorkflowList);
                $(this.el).append(workflowList({ workflow: this.model }));
                return this;
            }
        })
    })
