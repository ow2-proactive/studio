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
                this.workflowname = options.workflowname;
                this.callback = options.callback;
            },
            url: function() {
                return '/catalog/buckets/' + this.bucketid + '/resources/' + this.workflowname + '/revisions';
            },
            parse: function(data) {
            	this.callback(data);
            }
        });
    })
