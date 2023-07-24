define(
    [
        'backbone',
        'proactive/model/CatalogRestBucket'
    ],

    function (Backbone, RestBucket) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestBucket,
            comparator: 'name',
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
            setObjectName: function(newName){
                this.objectName = newName;
            },
            url: function() {
                var kindFilter = (this.kind && this.kind.toLowerCase() != 'all') ? 'kind=' + encodeURIComponent(this.kind) : '';
                var contentFilter = (this.contentType && this.contentType.toLowerCase() != 'all') ? 'contentType=' + encodeURIComponent(this.contentType) : '';
                var objectName = this.objectName ? "objectName=" + encodeURIComponent(this.objectName) : '';
                var params = [kindFilter, contentFilter, objectName].filter(x => typeof x === 'string' && x.length > 0).join('&');
                return '/catalog/buckets/?' + params;
            },
            parse: function(data) {
                return data;
            }
        });
    })
