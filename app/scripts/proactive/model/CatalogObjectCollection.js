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
                    var kindFilter = (this.kind && this.kind.toLowerCase() != 'all') ? 'kind=' + this.kind : '';
                    var contentFilter = (this.contentType && this.contentType.toLowerCase() != 'all') ? 'contentType=' + this.contentType : '';
                    var objectName = this.objectName ? "objectName=" + this.objectName : '';
                    var params =  [kindFilter, contentFilter, objectName].join('&');
                    return '/catalog/buckets/' + this.bucketname + '/resources/' + "?" + params;
                },
                parse: function(data) {
                    if (this.callback)
                        this.callback(data);
                    return data;
                }
        }));
    })
