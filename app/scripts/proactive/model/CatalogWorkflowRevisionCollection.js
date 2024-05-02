define(
    [
        'backbone',
        'proactive/config',
        'proactive/model/CatalogRestWorkflow'
    ],

    function (Backbone, config, RestWorkflow) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestWorkflow,
            initialize: function(options) {
                this.bucketname = options.bucketname;
                this.workflowname = options.workflowname;
                this.callback = options.callback;
            },
            url: function() {
                return config.prefixURL + '/catalog/buckets/' + this.bucketname + '/resources/' + this.workflowname + '/revisions';
            },
            parse: function(data) {
            	this.callback(data);
            }
        });
    })
