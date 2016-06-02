define(
    [
        'backbone',
        'proactive/model/RestWorkflow'
    ],

    function (Backbone, RestWorkflow) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestWorkflow,
            initialize: function(options) {
                this.id = options.id;
            },
            url: function() {
                return '/workflow-catalog/buckets/' + this.id + '/workflows';
            },
            parse: function(data) {
                console.log("fetching workflows (bucket " + this.id + ") via REST");
                console.log(data._embedded.workflowMetadataList);
                return data._embedded.workflowMetadataList;
            }
        });
    })
