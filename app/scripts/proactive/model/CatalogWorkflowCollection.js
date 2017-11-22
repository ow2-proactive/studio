define(
    [
        'backbone',
        'proactive/model/CatalogRestWorkflow',
        'proactive/model/GroupByProjectMixin'
    ],

    function (Backbone, RestWorkflow, GroupByProjectMixin) {

        "use strict";

        return Backbone.Collection.extend(
            _.extend({}, GroupByProjectMixin, {
                model: RestWorkflow,
                initialize: function(options) {
                    this.id = options.id;
                    this.callback = options.callback;
                },
                url: function() {
                    return '/catalog/buckets/' + this.id + '/resources';
                },
                parse: function(data) {
                    if (this.callback)
                        this.callback(data);
                    return data;
                },
            GroupByProjectMixin
        }));
    })
