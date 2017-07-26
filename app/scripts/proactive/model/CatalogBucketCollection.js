define(
    [
        'backbone',
        'proactive/model/CatalogRestBucket'
    ],

    function (Backbone, RestBucket) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestBucket,
            url: '/catalog/buckets/?kind=workflow',
            parse: function(data) {
                return data;
            }
        });
    })
