define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/catalog-browser.html',
        'text!proactive/templates/catalog-list.html',
        'proactive/view/CatalogWorkflowItem',
        'proactive/model/CatalogBucketCollection',
        'proactive/model/CatalogWorkflowCollection'
    ],

    function ($, Backbone, catalogBrowser, catalogList, CatalogWorkflowItem, catalogBucket, catalogWorkflow) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-browser-container'></div>");
            $("#catalog-browser-body").append(this.$el);
            this.buckets = options.buckets;
            this.render();
        },
        render: function () {
            this.$el.html(this.template())
            var BucketList = _.template(catalogList);
            _(this.buckets.models).each(function(bucket) {
                var id = bucket.get("id");
                this.$('#bucket-list').append(BucketList({bucket: "Bucket" + id}));

                console.log('Workflows in bucket ' + id);
                console.log(bucket.get("workflows"));

                _(bucket.get("workflows").models).each(function(workflow) {
                    var catalogWorkflowItem = new CatalogWorkflowItem({model: workflow});
                    catalogWorkflowItem.render();
                    this.$('#catalog-workflow-listBucket'+id).append(catalogWorkflowItem.el);
                }, this);
            }, this);
            return this;
        }
    })

})
