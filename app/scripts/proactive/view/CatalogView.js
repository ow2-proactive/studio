define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/catalog-browser.html',
        'text!proactive/templates/catalog-list.html',
        'text!proactive/templates/catalog-workflow.html',
        'proactive/model/CatalogBucketCollection',
        'proactive/model/CatalogWorkflowCollection'
    ],

    function ($, Backbone, catalogBrowser, catalogList, catalogWorkflowList, catalogBucket, catalogWorkflow) {

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
//            console.log("Full CatalogBucketCollection:");
//            console.log(this.buckets);

            this.$el.html(this.template())
            var BucketList = _.template(catalogList);

            _(this.buckets.models).each(function(bucket) {
//                console.log(bucket.get("id"));
                var id = bucket.get("id");

                this.$('#bucket-list').append(BucketList({bucket: "Bucket" + id}));

                var WorkflowList = _.template(catalogWorkflowList);
                _(bucket.get("workflows").models).each(function(workflow) {
                    console.log('workflow:');
                    console.log(workflow);
                    var name = workflow.get("name");
                    console.log(name);
                    var xml = workflow.getXml();
                    console.log("XML du workflow:");
                    console.log(xml);
                    this.$('#catalog-workflow-listBucket'+id).append(WorkflowList({workflow: name}));

                }, this);

            }, this);

            return this;
        }
    })

})
