define(
    [
        'backbone',
        'proactive/model/CatalogRestWorkflow'
    ],

    function (Backbone, RestWorkflow) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestWorkflow,
            initialize: function(options) {
                this.bucketid = options.bucketid;
                this.workflowid = options.workflowid;
                this.callback = options.callback;
            },
            url: function() {
                return '/catalog/buckets/' + this.bucketid + '/resources/' + this.workflowid + '/revisions';
            },
            parse: function(data) {
                if (data.page.totalElements > 0) {
                	var dataList = data._embedded.catalogObjectMetadataList;
                	this.callback(dataList);
                    return dataList;
                }
                else {
                    return [];
                }

            }
        });
    })
