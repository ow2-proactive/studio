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
            },
            url: function() {
                return '/catalog/buckets/' + this.id + '/resources';
            },
            parse: function(data) {
                if (data.object) {
                    return data.object;
                }
                else {
                    return [];
                }

            }
        });
    })
