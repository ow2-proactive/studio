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
                    if (this.kind && this.kind != null)
                        return '/catalog/buckets/' + this.bucketname + '/resources/?kind=' + this.kind;
                    else
                        return '/catalog/buckets/' + this.bucketname + '/resources/';
                },
                parse: function(data) {
                    if (this.callback)
                        this.callback(data);
                    return data;
                }
        }));
    })
