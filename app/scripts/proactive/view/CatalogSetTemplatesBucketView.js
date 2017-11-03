define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/catalog-set-templates-bucket.html',
        'text!proactive/templates/catalog-bucket.html'
    ],

    function ($, Backbone, catalogBrowser, catalogList) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='set-templates-bucket-container'></div>");
            $("#set-templates-bucket-body").append(this.$el);
            this.buckets = options.buckets;
        },
        events: {
            'click #catalog-set-templates-bucket-table tr': 'selectBucket'
        },
        internalSelectBucket: function (currentBucketRow) {
            var studioApp = require('StudioApp');

            var setTemplatesBucketButton = $('#set-templates-bucket-select-button');
            setTemplatesBucketButton.prop('disabled', !currentBucketRow);

            if (currentBucketRow){
	        	var currentBucketId= $(currentBucketRow).data("bucketid");
	            this.highlightSelectedRow('#catalog-set-templates-bucket-table', currentBucketRow);

                var currentBucket = this.buckets.get(currentBucketId);
            }

        },
        highlightSelectedRow: function(tableId, row){
        	var selectedClassName = 'catalog-selected-row';
        	var selected = $(tableId + " ." + selectedClassName);
        	if (selected[0]) {
        		$(selected[0]).removeClass(selectedClassName);
        	}
        	$(row).addClass(selectedClassName);
        },
        selectBucket: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectBucket(row);
        },
        render: function () {
            this.$el.html(this.template());
            var BucketList = _.template(catalogList);
            _(this.buckets.models).each(function(bucket) {
                var id = bucket.get("id");
                this.$('#catalog-set-templates-bucket-table').append(BucketList({bucket: bucket, bucketid: id}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectBucket(this.$('#catalog-set-templates-bucket-table tr')[0]);
            return this;
        },
    })

})