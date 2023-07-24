define(
    [
        'backbone',
        'proactive/model/CatalogRestWorkflow'
    ],

    function (Backbone, RestWorkflow) {

        "use strict";

        return Backbone.Collection.extend(
            _.extend({}, {
                model: RestWorkflow,
                initialize: function(options) {
                    this.bucketname = options.bucketname;
                    this.kind = options.kind;
                    this.objectName = options.objectName;
                    this.contentType = options.contentType;
                    this.callback = options.callback;
                },
                url: function() {
                    var kindFilter = (this.kind && this.kind.toLowerCase() != 'all') ? 'kind=' + encodeURIComponent(this.kind) : '';
                    var contentFilter = (this.contentType && this.contentType.toLowerCase() != 'all') ? 'contentType=' + encodeURIComponent(this.contentType) : '';
                    var objectName = this.objectName ? "objectName=" + encodeURIComponent(this.objectName) : '';
                    var params =  [kindFilter, contentFilter, objectName].filter(x => typeof x === 'string' && x.length > 0).join('&');
                    return '/catalog/buckets/' + this.bucketname + '/resources/' + "?" + params;
                },
                parse: function(data) {
                    if (this.callback)
                        this.callback(data);
                    return data;
                }
        }));
    })
