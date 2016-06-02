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
                console.log("fetching buckets via REST");
                console.log(data._embedded.bucketMetadataList);
                return data._embedded.bucketMetadataList;
            }
        });
    })
