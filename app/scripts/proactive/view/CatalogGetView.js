define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/catalog-get.html',
        'text!proactive/templates/catalog-bucket.html',
        'text!proactive/templates/catalog-bucket-empty.html',
        'text!proactive/templates/catalog-workflow.html',
        'text!proactive/templates/catalog-revision.html',
        'text!proactive/templates/catalog-revision-description.html',
        'proactive/model/CatalogWorkflowRevisionCollection',
        'proactive/model/CatalogWorkflowRevisionDescription'
    ],

    function ($, Backbone, catalogBrowser, catalogList, catalogEmpty, catalogWorkflow, catalogRevision, catalogRevisionDescription, CatalogWorkflowRevisionCollection, CatalogWorkflowRevisionDescription) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-get-container'></div>");
            $("#catalog-get-body").append(this.$el);
            this.buckets = options.buckets;
            this.render();
        },
        events: {
            'click #catalog-get-buckets-table tr': 'selectBucket',
            'click #catalog-get-workflows-table tr': 'selectWorkflow',
            'click #catalog-get-revisions-table tr': 'selectRevision',
            'click #select-all-catalog-button': 'selectAll',
            'click #deselect-all-catalog-button': 'deselectAll'
        },
        internalSelectBucket: function (currentBucketRow) {
            this.$('#catalog-get-workflows-table').empty();
            var studioApp = require('StudioApp');
            
            var getAsNewButton = $('#catalog-get-as-new-button');
            var getAppendButton = $('#catalog-get-append-button');
            
            if (currentBucketRow){
	        	var currentBucketID = $(currentBucketRow).data("bucketid");
	            this.highlightSelectedRow('#catalog-get-buckets-table', currentBucketRow);
	            
                var currentBucket = this.buckets.get(currentBucketID);
                this.workflows = currentBucket.get("workflows").models;
                _(this.workflows).each(function (workflow) {
                    var WorkflowList = _.template(catalogWorkflow);
                    this.$('#catalog-get-workflows-table').append(WorkflowList({workflow: workflow}));
                }, this);
            }
            this.internalSelectWorkflow(this.$('#catalog-get-workflows-table tr')[0]);
            
            getAsNewButton.prop('disabled', !currentBucketRow || !studioApp.isWorkflowOpen());
            getAppendButton.prop('disabled', !currentBucketRow || !studioApp.isWorkflowOpen());       
        },
        internalSelectWorkflow: function (currentWorkflowRow) {
            this.$('#catalog-get-revisions-table').empty();
            var studioApp = require('StudioApp');
            
            if (currentWorkflowRow){
	        	var currentWorkflowID = $(currentWorkflowRow).data("workflowid");
	            this.highlightSelectedRow('#catalog-get-workflows-table', currentWorkflowRow);
	            var that = this;

	            var bucketId = that.getSelectedBucketId();
	            var revisionsModel = new CatalogWorkflowRevisionCollection(
	            	{
	            		bucketid: bucketId, 
	            		workflowid: currentWorkflowID,
		            	callback: function (revisions) {
		            		_.each(
		            			revisions, 
		            			function (revision) {
		            				var RevisionList = _.template(catalogRevision);
		            				$('#catalog-get-revisions-table').append(RevisionList({revision: revision}));
		            			}
	            			);
            				that.internalSelectRevision(that.$('#catalog-get-revisions-table tr')[0])
		            	}
	            	});
	            revisionsModel.fetch();
            }  
        },
        internalSelectRevision: function (currentRevisionRow) {
            var studioApp = require('StudioApp');
            this.$('#catalog-get-description-container').empty();
            
            if (currentRevisionRow){
	        	var currentRevisionId = $(currentRevisionRow).data("revisionid");
	            this.highlightSelectedRow('#catalog-get-revision-table', currentRevisionRow);

	        	var currentBucketId = this.getSelectedBucketId();
	        	var currentWorkflowId = this.getSelectedWorkflowId();
	            var that = this;

	            var revisionsModel = new CatalogWorkflowRevisionDescription(
	            	{
	            		bucketid: currentBucketId, 
	            		workflowid: currentWorkflowId,
	            		revisionid: currentRevisionId,
		            	callback: function (revision) {
		            		var projectName = "";
		            		//Go through all metadata to find project name
		            		_.each(revision.object_key_values, function(keyValue){
		            			if (keyValue.key == "project_name" && keyValue.label == "job_information"){
		            				console.log(keyValue.value)
		            				projectName = keyValue.value
		            			}
		            		});
            				var RevisionDescription = _.template(catalogRevisionDescription);
            				$('#catalog-get-description-container').append(RevisionDescription({revision: revision, projectname: projectName}));
		            	}
	            	});
	            revisionsModel.fetch();
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
        getSelectedBucketId: function(){
        	return this.getSelectedRowId("#catalog-get-buckets-table .catalog-selected-row", "bucketid");
        },
        getSelectedWorkflowId: function(){
        	return this.getSelectedRowId("#catalog-get-workflows-table .catalog-selected-row", "workflowid");
        },
        getSelectedRevisionId: function(){
        	return this.getSelectedRowId("#catalog-get-revisions-table .catalog-selected-row", "revisionid");
        },
        getSelectedRowId: function(tableSelector, dataName){
        	return ($(($(tableSelector))[0])).data(dataName);
        },
        selectBucket: function(e){
        	console.log("selectBucket");
        	var row = $(e.currentTarget);
            this.internalSelectBucket(row);
        },
        selectWorkflow: function(e){
        	console.log("selectWorkflow");
        	var row = $(e.currentTarget);
            this.internalSelectWorkflow(row);
        },
        selectRevision: function(e){
        	console.log("selectRevision");
        	var row = $(e.currentTarget);
            this.internalSelectRevision(row);
        },
        render: function () {
            this.$el.html(this.template());
            var BucketList = _.template(catalogList);
            _(this.buckets.models).each(function(bucket) {
                var id = bucket.get("id");
                this.$('#catalog-get-buckets-table').append(BucketList({bucket: bucket, bucketid: id}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectBucket(this.$('#catalog-get-buckets-table tr')[0]);
            return this;
        },
    })

})
