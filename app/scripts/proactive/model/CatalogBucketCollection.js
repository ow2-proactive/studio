define(
    [
        'backbone',
        'proactive/model/RestBucket'
    ],

    function (Backbone, RestBucket) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestBucket,
            url: '/workflow-catalog/buckets',
            parse: function(data) {
                return data._embedded.bucketMetadataList;
            }
        });
    })
