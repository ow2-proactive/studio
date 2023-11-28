define(
    [
        'underscore',
        'backbone',
        'proactive/model/CatalogRestWorkflow',
        'proactive/model/GroupByProjectMixin'
    ],

    function (_, Backbone, RestWorkflow, GroupByProjectMixin) {

        "use strict";

        return Backbone.Collection.extend(
            _.extend({}, GroupByProjectMixin, {
                model: RestWorkflow,
                initialize: function(options) {
                    this.bucketname = options.bucketname;
                    this.callback = options.callback;
                },
                url: function() {
                    return '/catalog/buckets/' + this.bucketname + '/resources/?kind=workflow';
                },
                parse: function(data) {
                    if (this.callback)
                        this.callback(data);
                    return data;
                },
            GroupByProjectMixin
        }));
    })
