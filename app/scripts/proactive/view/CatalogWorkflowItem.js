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
                var name = this.model.get("name");
                var xmlContent = this.model.getXml();
                console.log("fetched XML from the clicked event:");
                $.when(xmlContent).done(function () {
                    var StudioApp = require('StudioApp');
                    StudioApp.mergeXML(xmlContent.responseText, null);
                    StudioApp.views.workflowView.importNoReset();
                });

            },
            render: function () {
                var workflowList = _.template(catalogWorkflowList);
                console.log('Model for this view:');
                console.log(this.model);
                $(this.el).append(workflowList({ workflow: this.model }));
                return this;
            }
        })

    })
