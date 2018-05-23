define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/catalog-publish.html',
        'text!proactive/templates/catalog-bucket.html',
        'text!proactive/templates/catalog-publish-description.html',
        'text!proactive/templates/catalog-publish-description-first.html',
        'proactive/model/CatalogLastWorkflowRevisionDescription',
        'proactive/model/CatalogWorkflowCollection'
    ],

    function ($, Backbone, catalogBrowser, catalogList, workflowDescription, workflowDescriptionFirst, CatalogLastWorkflowRevisionDescription, CatalogWorkflowCollection) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-publish-container'></div>");
            $("#catalog-publish-body").append(this.$el);
            this.buckets = options.buckets;
        },
        events: {
            'click #catalog-publish-buckets-table tr': 'selectBucket'
        },
        internalSelectBucket: function (currentBucketRow) {
            this.$('#catalog-publish-description-container').empty();
            var studioApp = require('StudioApp');

            var publishCurrentButton = $('#catalog-publish-current');
            publishCurrentButton.prop('disabled', !currentBucketRow);

            if (currentBucketRow){
	        	var currentBucketName= $(currentBucketRow).data("bucketname");
	            var studioApp = require('StudioApp');
	            this.highlightSelectedRow('#catalog-publish-buckets-table', currentBucketRow);

                var currentBucket = this.buckets.findWhere({name: currentBucketName});
                var workflows = currentBucket.get("workflows");
                var editedWorkflow = null;
                var name = studioApp.models.currentWorkflow.attributes.name;
                var workflowsModel = new CatalogWorkflowCollection(
                {
                    bucketname: currentBucketName,
                    callback: function (workflows) {
                        _.each(
                        workflows,
                        function (workflow) {
                            if (workflow.name == name){
                                editedWorkflow = workflow;
                            }
                        });
                    }
                });
                workflowsModel.fetch({async:false});


                if (editedWorkflow){
		            var revisionsModel = new CatalogLastWorkflowRevisionDescription(
		            	{
		            		bucketname: currentBucketName,
		            		workflowname: editedWorkflow.name,
			            	callback: function (revision) {
	            				var WorkflowDescription = _.template(workflowDescription);
	            				$('#catalog-publish-description-container').append(WorkflowDescription({revision: revision, name: name}));
			            	}
		            	});
		            revisionsModel.fetch();
                }else{
                  var WorkflowDescription = _.template(workflowDescriptionFirst);
                  this.$('#catalog-publish-description-container').append(WorkflowDescription({name: name}));
                }
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
                var bucketName = bucket.get("name");
                this.$('#catalog-publish-buckets-table').append(BucketList({bucket: bucket, bucketname: bucketName}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectBucket(this.$('#catalog-publish-buckets-table tr')[0]);
            return this;
        },
    })

})