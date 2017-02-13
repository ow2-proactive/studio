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
            'change #select-bucket': 'switchBucket',
            'click #select-all-catalog-button': 'selectAll',
            'click #deselect-all-catalog-button': 'deselectAll'
        },
        internalSwitchBucket: function (currentBucketID) {
            this.$('#catalog-workflow-list').empty();
            var emptyView = _.template(catalogEmpty);
            var publishButton = $('#publish-to-catalog-button');
            var StudioApp = require('StudioApp');
            var disabled;
            if (currentBucketID == -1) {
                this.$('#catalog-workflow-list').append(emptyView);
                disabled = true;
                publishButton.prop('disabled', true);
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
                disabled = false;
                
                publishButton.prop('disabled', !StudioApp.isWorkflowOpen());
            }
            //Enable or disable buttons for selecting/deselecting all workflows
            this.$('#select-all-catalog-button').prop('disabled', disabled);
            this.$('#deselect-all-catalog-button').prop('disabled', disabled);
            //Enable or disable button for importing workflows archive
            $('#import-archive-button').prop('disabled', disabled);
            
            StudioApp.resetDeleteCollection();
        },
        internalSelection: function(select){
            $('#catalog-workflow-list li').each(function( index ) {
                var buttonCheckbox = $( this ).find('#btn-toggle-removal-state');
                if (buttonCheckbox.find(':checkbox').is(':checked') != select){
                    buttonCheckbox.click();
                }
            });
        },
        selectAll: function(){
            this.internalSelection(true);
        },
        deselectAll: function(){
            this.internalSelection(false);
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
