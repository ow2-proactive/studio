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
                    this.contentType = options.contentType;
                    this.callback = options.callback;
                },
                url: function() {
                    var kindFilter = (this.kind && this.kind.toLowerCase() != 'all') ? 'kind=' + this.kind : '';
                    var contentFilter = (this.contentType && this.contentType.toLowerCase() != 'all') ? 'contentType=' + this.contentType : '';
                    var params = [kindFilter, contentFilter].join('&');
                    console.log("url params: " + params);
                    return '/catalog/buckets/' + this.bucketname + '/resources/' + "?" + params;
                },
                parse: function(data) {
                    if (this.callback)
                        this.callback(data);
                    return data;
                }
        }));
    })
