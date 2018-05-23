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
                this.bucketname = options.bucketname;
                this.workflowname = options.workflowname;
                this.callback = options.callback;
            },
            url: function() {
                return '/catalog/buckets/' + this.bucketname + '/resources/' + this.workflowname + '/';
            },
            parse: function(data) {
            	this.callback(data);
                return data;
            }
        });
    })
