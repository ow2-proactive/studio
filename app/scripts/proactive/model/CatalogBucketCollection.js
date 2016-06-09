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
                console.log(data);
                if (data.page.totalElements > 0) {
                    return data._embedded.bucketMetadataList;
                }
                else {
                    return [];
                }
            }
        });
    })
