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
                this.contentType = options.contentType;
            },
            setKind: function(newKind) {
                this.kind= newKind;
            },
            setContentType: function(newContentType) {
                this.contentType = newContentType;
            },
            url: function() {
                var kindFilter = (this.kind && this.kind.toLowerCase() != 'all') ? 'kind=' + this.kind : '';
                var contentFilter = (this.contentType && this.contentType.toLowerCase() != 'all') ? 'contentType=' + this.contentType : '';
                var params = [kindFilter, contentFilter].join('&');
                return '/catalog/buckets/?' + params;
            },
            parse: function(data) {
                return data;
            }
        });
    })
