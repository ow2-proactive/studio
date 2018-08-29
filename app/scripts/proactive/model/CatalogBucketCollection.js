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
            url: function() {
                if (this.kind && this.kind != null)
                    return '/catalog/buckets/?kind='+this.kind;
                else
                    return '/catalog/buckets/';
            },
            parse: function(data) {
                return data;
            }
        });
    })
