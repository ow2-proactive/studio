define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/rest/studio-client',
        'text!proactive/templates/catalog-get.html',
        'text!proactive/templates/catalog-bucket.html',
        'text!proactive/templates/catalog-get-object.html',
        'text!proactive/templates/catalog-get-revision.html',
        'text!proactive/templates/catalog-get-revision-description.html',
        'proactive/model/CatalogObjectRevisionCollection',
        'proactive/model/CatalogObjectCollection'
    ],

    function ($, Backbone, config, StudioClient, catalogBrowser, catalogList, catalogObject, catalogRevision, catalogRevisionDescription, CatalogObjectRevisionCollection, CatalogObjectCollection) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-get-container'></div>");
            $("#catalog-get-body").append(this.$el);
            this.buckets = options.buckets;
            this.buckets.on('reset', this.updateBuckets, this);
        },
        events: {
            'click #catalog-get-buckets-table tr': 'selectBucket',
            'click #catalog-get-objects-table tr': 'selectObject',
            'click #catalog-get-revisions-table tr': 'selectRevision',
            'change #get-show-all-checkbox input:checkbox':  function(){this.showAllChanged(this.kind);}
        },
        setKind : function(newKind, newKindLabel) {
            this.kind = newKind;
            this.kindLabel = newKindLabel;
            //if it's not a workflow, we hide workflow import buttons and display generic import
            if (this.kind.toLowerCase().indexOf('workflow') != 0) {
                $("#catalog-get-as-new-button").hide();
                $("#catalog-get-append-button").hide();
                $("#catalog-get-import-button").show();
                if (this.kind.toLowerCase().indexOf('script') == 0) {
                    if (this.inputToImportId.indexOf('_Code') > -1) {
                        $("#get-modal-title").text("Import a Script by copy from the Catalog");
                        $("#confirm-import-object-message").text("You are about to import a script (inline) from the Catalog. If you continue it will replace and remove the current inline code.");
                    } else if (this.inputToImportId.indexOf('_Url') > -1) {
                        $("#get-modal-title").text("Import a Script by reference from the Catalog");
                        $("#confirm-import-object-message").text("You are about to import a script (reference) from the Catalog. If you continue it will replace and remove the current reference.");
                    }
                } else {
                    $("#get-modal-title").text("Import from the Catalog");
                    $("#confirm-import-object-message").text("You are about to import an object from the Catalog. If you continue it will replace and remove its current value.");
                }
            } else {
                $("#catalog-get-as-new-button").show();
                $("#catalog-get-append-button").show();
                $("#catalog-get-import-button").hide();
                $("#get-modal-title").text("Import a Workflow from the Catalog");
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
                var filterKind = this.kind;
                //for workflows, we don't want subkind filters (ie we want to be able to import workflow/pca and workflow/standard)
                if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                    filterKind = "workflow";
                }
                var objectsModel = new CatalogObjectCollection(
                {
                    bucketname: bucketName,
                    kind: filterKind,
                    callback: function (catalogObjects) {
                        if (catalogObjects.length === 0)
                            $('#catalog-get-import-button').prop('disabled', true);
                        else {
                            $('#catalog-get-import-button').prop('disabled', false);
                            _.each(
                            catalogObjects,
                            function (obj) {
                                var ObjectList = _.template(catalogObject);
                                that.$('#catalog-get-objects-table').append(ObjectList({catalogObject: obj}));
                            });
                        }
                    }
                });
                objectsModel.fetch({async:false});
            }
            this.internalSelectObject(this.$('#catalog-get-objects-table tr')[0]);
            
        },
        disableActionButtons: function (enableGetAsNew, enableAppend){
        	 $('#catalog-get-as-new-button').prop('disabled', enableGetAsNew);
        	 $('#catalog-get-append-button').prop('disabled', enableAppend);       
        },
        getRevisionProjectName: function(revision){
            for (var i = 0 ; i < revision.object_key_values.length ; i++){
                var keyValue = revision.object_key_values[i];
                if (keyValue.key == "project_name" && keyValue.label == "job_information"){
                    return keyValue.value;
                }
            }
            return "";
        },
        internalSelectObject: function (currentObjectRow) {
            this.$('#catalog-get-revisions-table').empty();
            
            if (currentObjectRow){
                var currentWorkflowName = $(currentObjectRow).data("objectname");
	            this.highlightSelectedRow('#catalog-get-objects-table', currentObjectRow);
	            var that = this;

	            var bucketName = that.getSelectedBucketName();
	            var revisionsModel = new CatalogObjectRevisionCollection(
	            	{
	            		bucketname: bucketName,
	            		name: currentWorkflowName,
		            	callback: function (revisions) {
                            var latestRevision = JSON.parse(JSON.stringify(revisions[0]));//Copy of the fist revision: the latest one
                            latestRevision.links[1].href = 'buckets/'+latestRevision.bucket_name+'/resources/'+latestRevision.name;
                            var latestRevisionProjectName = that.getRevisionProjectName(latestRevision);
                            var RevisionList = _.template(catalogRevision);
                            $('#catalog-get-revisions-table').append(RevisionList({revision: latestRevision, projectname: latestRevisionProjectName, isLatest : true}));
		            		_.each(
		            			revisions, 
		            			function (revision) {
		            				var projectName = that.getRevisionProjectName(revision);
		            				var RevisionList = _.template(catalogRevision);
		            				$('#catalog-get-revisions-table').append(RevisionList({revision: revision, projectname: projectName, isLatest : false}));
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
	        	var commitMessage = $(currentRevisionRow).data("commitmessage");
        		var projectName = $(currentRevisionRow).data("projectname");
        		var username = $(currentRevisionRow).data("username");
        		
	            this.highlightSelectedRow('#catalog-get-revisions-table', currentRevisionRow);
        		
				var RevisionDescription = _.template(catalogRevisionDescription);
				$('#catalog-get-description-container').append(RevisionDescription({
					rawurl: rawurl, 
					name: name,
					commitmessage: commitMessage,
					username: username,
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
        getSelectedObjectName: function(){
        	return this.getSelectedRowId("#catalog-get-objects-table .catalog-selected-row", "objectname");
        },
        getSelectedRowId: function(tableSelector, dataName){
        	return ($(($(tableSelector))[0])).data(dataName);
        },
        selectBucket: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectBucket(row);
        },
        selectObject: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectObject(row);
        },
        selectRevision: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectRevision(row);
        },
        setInputToImportId: function(inputToImportId) {
            //setting the text area where we will import the object
            this.inputToImportId = inputToImportId;
        },
        importCatalogObject: function(){
            var headers = { 'sessionID': localStorage['pa.session'] };
            var that = this;
            var request = $.ajax({
                url: $("#catalog-get-revision-description").data("selectedrawurl"),
                type: 'GET',
                headers: headers,
                dataType: 'text' //without this option, it will execute the response if it's JS code
            }).success(function (response) {
                var inputToImport = document.getElementById(that.inputToImportId);
                var isUrlImport = that.inputToImportId.indexOf('_Url') > -1;
                if (isUrlImport) //if input id contains 'Url', we only import the URL of the selected catalog object
                    // if catalog host is the same as the studio, make catalog object url relative with ${PA_CATALOG_REST_URL}.
                    inputToImport.value = $("#catalog-get-revision-description").data("selectedrawurl").replace(window.location.origin + '/catalog/','${PA_CATALOG_REST_URL}/');
                else //Otherwise, we import the content of the catalog object
                    inputToImport.value = response;
                $('#catalog-get-close-button').click();
                StudioClient.alert('Import successful', 'The ' + that.kindLabel + ' has been successfully imported from the Catalog', 'success');
                if (that.kind.toLowerCase().indexOf('script') == 0) {
                    //saving script name and bucket for next commits
                    inputToImport.dataset.scriptName = that.getSelectedObjectName();
                    inputToImport.dataset.bucketName = that.getSelectedBucketName();
                    try {
                        //if it's a script, we set the language depending on the file extension
                        var contentDispositionHeader = request.getResponseHeader('content-disposition');
                        var fileName = contentDispositionHeader.split('filename="')[1].slice(0, -1);
                        var indexExt = fileName.lastIndexOf('.');
                        var language  = '';
                        if (indexExt > -1) {
                            var extension = fileName.substring(indexExt+1, fileName.length);
                            language = config.extensions_to_languages[extension.toLowerCase()] || '';
                        }
                        var languageElementId;
                        if (isUrlImport)
                            languageElementId = that.inputToImportId.replace('_Url', '_Language');
                        else
                            languageElementId = that.inputToImportId.replace('_Code', '_Language');
                        var languageElement = document.getElementById(languageElementId);
                        languageElement.value = language;
                    } catch (e) {
                        console.error('Error while setting language of the imported script: '+e);
                    }
                }
                //trigger input keyup event for model update
                inputToImport.dispatchEvent(new Event('keyup'));
            }).error(function (response) {
                StudioClient.alert('Error', 'Error importing the '+ that.kindLabel +' from the Catalog', 'error');
                console.error('Error importing the '+ that.kindLabel +' from the Catalog : '+JSON.stringify(response));
            });
        },
        showAllChanged : function(kind) {
            var filterKind = undefined;
            if (!$('#get-show-all-checkbox input:checkbox').is(':checked')) {
                filterKind = kind;
                //for workflows, we don't want subkind filters (ie we want to be able to import workflow/pca and workflow/standard)
                if (kind.toLowerCase().indexOf('workflow') == 0) {
                    filterKind = "workflow";
                }
            }
            var studioApp = require('StudioApp');
            studioApp.models.catalogBuckets.setKind(filterKind);
            studioApp.models.catalogBuckets.fetch({reset: true});
        },
        updateBuckets : function() {
            this.$('#catalog-get-buckets-table').empty();
            var BucketList = _.template(catalogList);
            _(this.buckets.models).each(function(bucket) {
                var bucketName = bucket.get("name");
                this.$('#catalog-get-buckets-table').append(BucketList({bucket: bucket, bucketname: bucketName}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectBucket(this.$('#catalog-get-buckets-table tr')[0]);
        },
        render: function () {
            this.$el.html(this.template());
            var bucketKind = this.kind;
            //for workflows, we don't want subkind filters (ie we want to be able to import workflow/pca and workflow/standard)
            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                bucketKind = "workflow";
            }
            this.buckets.setKind(bucketKind);
            this.buckets.fetch({reset: true, async: false});
            //setting kind in catalogBrowser (catalog-get.html) because it can't be
            //passed as parameter (on page load, we don't know the kind yet)
            this.$('#catalog-objects-legend').text(this.kindLabel+'s');
            return this;
        },
    })

})
