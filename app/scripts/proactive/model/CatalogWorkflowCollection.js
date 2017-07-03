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
                this.id = options.id;
                this.callback = options.callback;
            },
            url: function() {
                return '/catalog/buckets/' + this.id + '/resources';
            },
            parse: function(data) {
            	this.callback(data);
                return data;
            }
        });
    })
