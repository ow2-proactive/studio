define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Collection.extend({
            url: '/workflow-catalog/buckets',
            parse: function(data) {
                console.log("fetching buckets via REST");
                console.log(data);
                return data._embedded.bucketMetadataList;
            }
        });
    })
