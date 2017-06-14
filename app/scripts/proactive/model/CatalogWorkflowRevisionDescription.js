define(
    [
        'backbone',
        'proactive/model/CatalogRestWorkflow'
    ],

    function (Backbone, RestWorkflow) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestWorkflow,
            initialize: function(options) {
                this.bucketid = options.bucketid;
                this.workflowid = options.workflowid;
                this.revisionid = options.revisionid;
                this.callback = options.callback;
            },
            url: function() {
                return '/catalog/buckets/' + this.bucketid + '/resources/' + this.workflowid + '/revisions/' + this.revisionid;
            },
            parse: function(data) {
            	this.callback(data);
                return data;
            }
        });
    })
