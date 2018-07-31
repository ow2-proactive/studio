define(
    [
        'backbone',
        'proactive/model/CatalogRestWorkflow'
    ],

    function (Backbone, RestWorkflow) {

        "use strict";

        return Backbone.Collection.extend(
            _.extend({}, {
                model: RestWorkflow,
                initialize: function(options) {
                    this.bucketname = options.bucketname;
                    this.kind = options.kind;
                    this.callback = options.callback;
                },
                url: function() {
                    return '/catalog/buckets/' + this.bucketname + '/resources/?kind='+this.kind;
                },
                parse: function(data) {
                    if (this.callback)
                        this.callback(data);
                    return data;
                }
        }));
    })
