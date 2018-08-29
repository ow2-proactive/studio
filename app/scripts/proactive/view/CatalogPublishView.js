define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/rest/studio-client',
        'text!proactive/templates/catalog-publish.html',
        'text!proactive/templates/catalog-bucket.html',
        'text!proactive/templates/catalog-publish-description.html',
        'text!proactive/templates/catalog-publish-description-first.html',
        'proactive/model/CatalogObjectLastRevisionDescription',
        'proactive/model/CatalogObjectCollection'
    ],

    function ($, Backbone, config, StudioClient, catalogBrowser, catalogList, publishDescription, publishDescriptionFirst, CatalogObjectLastRevisionDescription, CatalogObjectCollection) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(catalogBrowser),
        initialize: function (options) {
            this.$el = $("<div id='catalog-publish-container'></div>");
            $("#catalog-publish-body").append(this.$el);
            this.buckets = options.buckets;
            this.buckets.on('reset', this.updateBuckets, this);
        },
        events: {
            'click #catalog-publish-buckets-table tr': 'selectBucket',
            'change #publish-show-all-checkbox input:checkbox':  function(){this.showAllChanged(this.kind);}
        },
        setKind : function(newKind, newKindLabel) {
            this.kind = newKind;
            this.kindLabel = newKindLabel;
        },
        getCatalogObjectRevision : function(name, bucketName) {
            var revision;
            var filterKind = this.kind;
            //for workflows, we don't want subkind filters (ie we want to check if there is a revision, no matter which subkind)
            if (this.kind.toLowerCase().indexOf('workflow') == 0){
                filterKind = "workflow";
            }
            var catalogObjectsModel = new CatalogObjectCollection(
            {
                bucketname: bucketName,
                kind: filterKind,
                callback: function (catalogObjects) {
                    _.each(
                    catalogObjects,
                    function (catalogObject) {
                        if (catalogObject.name == name){
                            revision = catalogObject;
                        }
                    });
                }
            });
            catalogObjectsModel.fetch({async:false});
            return revision;
        },
        internalSelectBucket: function (currentBucketRow) {
            this.$('#catalog-publish-description-container').empty();
            var studioApp = require('StudioApp');

            var publishCurrentButton = $('#catalog-publish-current');
            publishCurrentButton.prop('disabled', !currentBucketRow);

            if (currentBucketRow){
                var currentBucketName= $(currentBucketRow).data("bucketname");
                this.highlightSelectedRow('#catalog-publish-buckets-table', currentBucketRow);
                if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                    var name = studioApp.models.currentWorkflow.attributes.name;
                    var editedCatalogObject = this.getCatalogObjectRevision(name, currentBucketName);

                    var that = this;
                    if (editedCatalogObject){
                        var revisionsModel = new CatalogObjectLastRevisionDescription(
                            {
                                bucketname: currentBucketName,
                                name: editedCatalogObject.name,
                                callback: function (revision) {
                                    var objectDescription = _.template(publishDescription);
                                    $('#catalog-publish-description-container').append(objectDescription({revision: revision, name: name, kind: that.kind, kindLabel: that.kindLabel}));
                                }
                            });
                        revisionsModel.fetch();
                    }else{
                      var objectDescription = _.template(publishDescriptionFirst);
                      this.$('#catalog-publish-description-container').append(objectDescription({name: name, kind: that.kind, kindLabel: that.kindLabel}));
                    }
                } else {
                    var name = 'Untitled'+ this.kindLabel;
                    var objectDescription = _.template(publishDescriptionFirst);
                    this.$('#catalog-publish-description-container').append(objectDescription({name: name, kind: this.kind, kindLabel: this.kindLabel}));
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
        setContentToPublish: function(content){
            this.contentToPublish = content;
        },
        setRelatedTextArea: function(relatedTextArea){
            this.relatedTextArea = relatedTextArea;
        },
        publishToCatalog: function() {
            var headers = { 'sessionID': localStorage['pa.session'] };
            var bucketName = ($(($("#catalog-publish-buckets-table .catalog-selected-row"))[0])).data("bucketname");

            var studioApp = require('StudioApp');
            var objectName;
            var fileName;
            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                objectName = studioApp.models.currentWorkflow.attributes.name;
                fileName = objectName + ".xml";
            } else {
                objectName = $("#catalog-publish-name").val();
                fileName = objectName+ ".txt";
            }
            var contentTypeToPublish = 'application/xml';
            if (this.kind.toLowerCase().indexOf('script') == 0) {
                contentTypeToPublish = 'text/plain';
                try {
                    var languageElement = document.getElementById(this.relatedTextArea.replace('_Code', '_Language'));
                    var language = languageElement.options[languageElement.selectedIndex].value.toLowerCase();
                    var extension = config.languages_to_extensions[language];
                    if (extension)
                        fileName = objectName+'.'+extension;
                    var contentType = config.languages_content_type[language];
                    if (contentType)
                        contentTypeToPublish = contentType;
                } catch(e) {
                    console.error("Error while getting the language of the selected element. "+ e);
                }
            }

            var blob = new Blob([this.contentToPublish], { type: contentTypeToPublish });
            var payload = new FormData();
            payload.append('file', blob, fileName);
            payload.append('name', objectName);
            payload.append('commitMessage', $("#catalog-publish-commit-message").val());
            payload.append('kind', $("#catalog-publish-kind").val());
            payload.append('objectContentType', contentTypeToPublish );

            var url = '/catalog/buckets/' + bucketName + '/resources';
            var isWorkflowRevision = ($("#catalog-publish-description").data("first") != true)
            var isRevision = isWorkflowRevision;
            if (!isWorkflowRevision){
                var revision = this.getCatalogObjectRevision(objectName, bucketName);
                isRevision = (revision != null);
            }
            if (isRevision){
                url += "/" + objectName + "/revisions";
            }

            var postData = {
                    url: url,
                    type: 'POST',
                    headers: headers,
                    processData: false,
                    contentType: false,
                    cache: false,
                    data: payload
                };

            var that = this;
            $.ajax(postData).success(function (response) {
                StudioClient.alert('Publish successful', 'The ' + that.kindLabel + ' has been successfully published to the Catalog', 'success');
                $('#catalog-publish-close-button').click();
            }).error(function (response) {
                StudioClient.alert('Error', 'Error publishing the '+ that.kindLabel +' to the Catalog', 'error');
            });
        },
        showAllChanged : function(kind) {
            var filterKind = undefined;
            if (!$('#publish-show-all-checkbox input:checkbox').is(':checked')) {
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
            this.$('#catalog-publish-buckets-table').empty();
            var BucketList = _.template(catalogList);
            _(this.buckets.models).each(function(bucket) {
                var bucketName = bucket.get("name");
                this.$('#catalog-publish-buckets-table').append(BucketList({bucket: bucket, bucketname: bucketName}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectBucket(this.$('#catalog-publish-buckets-table tr')[0]);
        },
        render: function () {
            this.$el.html(this.template());
            var bucketKind = this.kind;
            //for workflows, we don't want subkind filters
            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                bucketKind = "workflow";
            }
            this.buckets.setKind(bucketKind);
            this.buckets.fetch({reset: true, async: false});
            return this;
        },
    })

})