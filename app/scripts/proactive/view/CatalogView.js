define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/catalog-browser.html',
        'text!proactive/templates/catalog-list.html',
        'text!proactive/templates/catalog-bucket-empty.html',
        'proactive/view/CatalogWorkflowItem',
        'proactive/model/CatalogBucketCollection',
        'proactive/model/CatalogWorkflowCollection',
    ],

    function ($, Backbone, catalogBrowser, catalogList, catalogEmpty, CatalogWorkflowItem, catalogBucket, catalogWorkflow) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-browser-container'></div>");
            $("#catalog-browser-body").append(this.$el);
            this.buckets = options.buckets;
            this.render();
        },
        events: {
            'change #select-bucket': 'switchBucket'
        },
        internalSwitchBucket: function (currentBucketID) {
            this.$('#catalog-workflow-list').empty();
            var emptyView = _.template(catalogEmpty);
            if (currentBucketID == -1) {
                this.$('#catalog-workflow-list').append(emptyView);
            }
            else {
                var currentBucket = this.buckets.get(currentBucketID);
                var currentBucketSize = currentBucket.get("workflows").length;
                if (currentBucketSize == 0) {
                    this.$('#catalog-workflow-list').append(emptyView);
                }
                else {
                    _(currentBucket.get("workflows").models).each(function (workflow) {
                        var catalogWorkflowItem = new CatalogWorkflowItem({model: workflow});
                        catalogWorkflowItem.render();
                        this.$('#catalog-workflow-list').append(catalogWorkflowItem.el);
                    }, this);
                }
            }
            require('StudioApp').resetDeleteCollection();
        },
        switchBucket: function(e){
            this.internalSwitchBucket(e.target.value);
        },
        render: function () {
            this.$el.html(this.template());
            var BucketList = _.template(catalogList);
            _(this.buckets.models).each(function(bucket) {
                var id = bucket.get("id");
                this.$('#bucket-list select').append(BucketList({bucket: bucket}));
            }, this);
            // to open the browser on the "No Bucket Selected" Bucket
            this.internalSwitchBucket(-1);
            return this;
        },
    })

})
