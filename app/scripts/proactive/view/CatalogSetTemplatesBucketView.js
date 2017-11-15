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
            this.$el = $("<div id='set-templates-"+ options.order +"-bucket-container'></div>");
            $("#set-templates-"+ options.order +"-bucket-body").append(this.$el);
            this.buckets = options.buckets;
            this.order = options.order;
        },
        events: function(){
            var _events = {};
            _events['click #catalog-set-templates-'+ this.order +'-bucket-table tr'] = 'selectBucket';
            return _events;
        },
        internalSelectBucket: function (currentBucketRow) {
            var studioApp = require('StudioApp');

            var setTemplatesBucketButton = $('#set-templates-'+ this.order +'-bucket-select-button');
            setTemplatesBucketButton.prop('disabled', !currentBucketRow);

            if (currentBucketRow){
	        	var currentBucketId= $(currentBucketRow).data("bucketid");
	            this.highlightSelectedRow('#catalog-set-templates-'+ this.order +'-bucket-table', currentBucketRow);

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
                this.$('#catalog-set-templates-'+ this.order +'-bucket-table').append(BucketList({bucket: bucket, bucketid: id}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectBucket(this.$('#catalog-set-templates-'+ this.order +'-bucket-table tr')[0]);
            return this;
        },
    })

})