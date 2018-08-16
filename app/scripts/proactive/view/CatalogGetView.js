define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'text!proactive/templates/catalog-get.html',
        'text!proactive/templates/catalog-bucket.html',
        'text!proactive/templates/catalog-get-object.html',
        'text!proactive/templates/catalog-get-revision.html',
        'text!proactive/templates/catalog-get-revision-description.html',
        'proactive/model/CatalogObjectRevisionCollection',
        'proactive/model/CatalogObjectCollection'
    ],

    function ($, Backbone, config, catalogBrowser, catalogList, catalogObject, catalogRevision, catalogRevisionDescription, CatalogObjectRevisionCollection, CatalogObjectCollection) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-get-container'></div>");
            $("#catalog-get-body").append(this.$el);
            this.buckets = options.buckets;
        },
        events: {
            'click #catalog-get-buckets-table tr': 'selectBucket',
            'click #catalog-get-objects-table tr': 'selectWorkflow',
            'click #catalog-get-revisions-table tr': 'selectRevision'
        },
        setKind : function(newKind, newKindLabel) {
            this.kind = newKind;
            this.kindLabel = newKindLabel;
            //if it's not a workflow, we hide workflow import buttons and display generic import
            if (this.kind.toLowerCase().indexOf('workflow') < 0) {
                $("#catalog-get-as-new-button").hide();
                $("#catalog-get-append-button").hide();
                $("#catalog-get-import-button").show();
            } else {
                $("#catalog-get-as-new-button").show();
                $("#catalog-get-append-button").show();
                $("#catalog-get-import-button").hide();
            }
        },
        internalSelectBucket: function (currentBucketRow) {
            this.$('#catalog-get-objects-table').empty();
            this.$('#catalog-get-description-container').empty();
            this.disableActionButtons(true, true);
            
            if (currentBucketRow){
	            this.highlightSelectedRow('#catalog-get-buckets-table', currentBucketRow);

	            var that = this;
                var bucketName = that.getSelectedBucketName();
                var objectsModel = new CatalogObjectCollection(
                {
                    bucketname: bucketName,
                    kind: this.kind,
                    callback: function (catalogObjects) {
                        _.each(
                        catalogObjects,
                        function (obj) {
                            var ObjectList = _.template(catalogObject);
                            that.$('#catalog-get-objects-table').append(ObjectList({catalogObject: obj}));
                        });
                    }
                });
                objectsModel.fetch({async:false});
            }
            this.internalSelectWorkflow(this.$('#catalog-get-objects-table tr')[0]);
            
        },
        disableActionButtons: function (enableGetAsNew, enableAppend){
        	 $('#catalog-get-as-new-button').prop('disabled', enableGetAsNew);
        	 $('#catalog-get-append-button').prop('disabled', enableAppend);       
        },
        internalSelectWorkflow: function (currentWorkflowRow) {
            this.$('#catalog-get-revisions-table').empty();
            
            if (currentWorkflowRow){
                var currentWorkflowName = $(currentWorkflowRow).data("objectname");
	            this.highlightSelectedRow('#catalog-get-objects-table', currentWorkflowRow);
	            var that = this;

	            var bucketName = that.getSelectedBucketName();
	            var revisionsModel = new CatalogObjectRevisionCollection(
	            	{
	            		bucketname: bucketName,
	            		name: currentWorkflowName,
		            	callback: function (revisions) {
		            		_.each(
		            			revisions, 
		            			function (revision) {
		            				var projectName = "";
		                    		//Go through all metadata to find project name
		                    		_.each(revision.object_key_values, function(keyValue){
		                    			if (keyValue.key == "project_name" && keyValue.label == "job_information"){
		                    				projectName = keyValue.value;
		                    			}
		                    		});
		                    		
		            				var RevisionList = _.template(catalogRevision);
		            				$('#catalog-get-revisions-table').append(RevisionList({revision: revision, projectname: projectName}));
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
	        	var rawurl = window.location.origin + '/catalog/' + $(currentRevisionRow).data("rawurl") + '/raw';
	        	var name = $(currentRevisionRow).data("name");
	        	var commitmessage = $(currentRevisionRow).data("commitmessage");
        		var projectName = $(currentRevisionRow).data("projectname");
        		
	            this.highlightSelectedRow('#catalog-get-revisions-table', currentRevisionRow);
        		
				var RevisionDescription = _.template(catalogRevisionDescription);
				$('#catalog-get-description-container').append(RevisionDescription({
					rawurl: rawurl, 
					name: name,
					commitmessage: commitmessage,
					projectname: projectName,
					kindLabel: this.kindLabel
					}));

	            this.disableActionButtons(false, !studioApp.isWorkflowOpen());
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
        getSelectedBucketName: function(){
        	return this.getSelectedRowId("#catalog-get-buckets-table .catalog-selected-row", "bucketname");
        },
        getSelectedWorkflowName: function(){
        	return this.getSelectedRowId("#catalog-get-objects-table .catalog-selected-row", "objectname");
        },
        getSelectedRowId: function(tableSelector, dataName){
        	return ($(($(tableSelector))[0])).data(dataName);
        },
        selectBucket: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectBucket(row);
        },
        selectWorkflow: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectWorkflow(row);
        },
        selectRevision: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectRevision(row);
        },
        setTextAreaToImport: function(textAreaToImport) {
            //setting the text area where we will import the object
            this.textAreaToImport = textAreaToImport;
        },
        importCatalogObject: function(){
            var headers = { 'sessionID': localStorage['pa.session'] };
            var that = this;
            var studioApp = require('StudioApp');
            var request = $.ajax({
                url: $("#catalog-get-revision-description").data("selectedrawurl"),
                type: 'GET',
                headers: headers
            }).success(function (response) {
                document.getElementById(that.textAreaToImport).value = response;
                $('#catalog-get-close-button').click();
                studioApp.displayMessage('Import successful', 'The ' + that.kindLabel + ' has been successfully imported from the Catalog', 'success');
                //if it's a script, we set the language depending on the file extension
                if (that.kind.toLowerCase().indexOf('script') > -1) {
                    try {
                        var contentDispositionHeader = request.getResponseHeader('content-disposition');
                        var fileName = contentDispositionHeader.split('filename="')[1].slice(0, -1);
                        var indexExt = fileName.lastIndexOf('.');
                        var language  = '';
                        if (indexExt > -1) {
                            var extension = fileName.substring(indexExt+1, fileName.length);
                            language = config.extensions_to_languages[extension.toLowerCase()];
                        }
                        var languageElement = document.getElementById(that.textAreaToImport.replace('_Code', '_Language'));
                        languageElement.value = language;
                    } catch (e) {
                        console.error('Error while setting language of the imported script: '+e);
                    }
                }
            }).error(function (response) {
                studioApp.displayMessage('Error', 'Error importing the '+ that.kindLabel +' from the Catalog', 'error');
                console.error('Error importing the '+ that.kindLabel +' from the Catalog : '+JSON.stringify(response));
            });
        },
        render: function () {
            this.$el.html(this.template());
            var BucketList = _.template(catalogList);
            _(this.buckets.models).each(function(bucket) {
                var bucketName = bucket.get("name");
                this.$('#catalog-get-buckets-table').append(BucketList({bucket: bucket, bucketname: bucketName}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectBucket(this.$('#catalog-get-buckets-table tr')[0]);
            //setting kind in catalogBrowser (catalog-get.html) because it can't be
            //passed as parameter (on page load, we don't know the kind yet)
            this.$('#catalog-objects-legend').text(this.kindLabel+'s');
            return this;
        },
    })

})
