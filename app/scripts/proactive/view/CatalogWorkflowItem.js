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
                "click #btn-remove-workflow": "removeWorkflow",
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
                        StudioApp.clear();
                        StudioApp.mergeXML(xmlContent.responseText, null);
                        StudioApp.views.workflowView.importNoReset();
                    }
                });
            },
            removeWorkflow: function(event) {
                event.stopPropagation();
                var StudioApp = require('StudioApp');
                var bucketId = this.model.get('bucket_id');
                var workflowsCollection = StudioApp.models.catalogBuckets.get(bucketId).get('workflows');
                StudioApp.views.catalogView.listenTo(workflowsCollection, 'remove',
                                    StudioApp.views.catalogView.internalSwitchBucket(bucketId));
                var workflowId = this.model.get('id');
                this.model.destroy();
                workflowsCollection.remove(workflowId);
                StudioApp.views.catalogView.listenTo(workflowsCollection, 'remove',
                                                    StudioApp.views.catalogView.internalSwitchBucket(bucketId));
                console.log('collection a jour:');
                console.log(workflowsCollection);

            },
            render: function () {
                var workflowList = _.template(catalogWorkflowList);
                $(this.el).append(workflowList({ workflow: this.model }));
                return this;
            }
        })
    })
