define(
    [
        'backbone',
        'proactive/model/CatalogRestBucket'
    ],

    function (Backbone, RestBucket) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestBucket,
            initialize: function(options) {
                this.kind = options.kind;
            },
            setKind: function(newKind) {
                this.kind= newKind;
            },
            url: function() { return '/catalog/buckets/?kind='+this.kind; },
            parse: function(data) {
                return data;
            }
        });
    })
