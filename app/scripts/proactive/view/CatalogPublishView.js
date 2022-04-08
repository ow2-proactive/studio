define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/rest/studio-client',
        'text!proactive/templates/catalog-publish.html',
        'text!proactive/templates/catalog-bucket.html',
        'text!proactive/templates/catalog-publish-object.html',
        'text!proactive/templates/catalog-publish-description.html',
        'text!proactive/templates/catalog-publish-description-first.html',
        'proactive/model/CatalogObjectLastRevisionDescription',
        'proactive/model/CatalogObjectCollection'
    ],

    function ($, Backbone, config, StudioClient, catalogBrowser, catalogList, catalogObject, publishDescription, publishDescriptionFirst, CatalogObjectLastRevisionDescription, CatalogObjectCollection) {

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
            'click #catalog-publish-objects-table tr': 'selectObject',
            'change #publish-show-all-checkbox input:checkbox':  function(){this.showAllChanged(this.kind);},
            'submit #publish-object-by-name': 'filterByObjectsByName'
        },
        setKind : function(newKind, newKindLabel) {
            this.kind = newKind;
            this.kindLabel = newKindLabel;
            $("#catalog-publish-modal-title").text("Publish the "+ newKindLabel +" to the Catalog");
        },
        getBucketCatalogObjects : function(bucketName, callbackFunction) {
            var filterKind = this.kind;
            const that = this
            //for workflows, we don't want subkind filters (ie we want to check if there is a revision, no matter which subkind)
            if (this.kind.toLowerCase().indexOf('workflow') == 0){
                filterKind = "workflow";
            }
            var catalogObjectsModel = new CatalogObjectCollection(
            {
                bucketname: bucketName,
                kind: filterKind,
                objectName: this.getPreferenceObjectName(),
                callback: callbackFunction
            });
            setTimeout(function(){
              catalogObjectsModel.fetch({async:false});
            }, 10)
        },
        internalSelectBucket: function (currentBucketRow, shouldScrollToTheSelectedBucket) {
            this.$('#catalog-publish-description-container').empty();
            this.$('#catalog-publish-objects-table').empty();
            this.$('#catalog-publish-objects-table').html("<th>Loading ....</th>");

            var publishCurrentButton = $('#catalog-publish-current');
            publishCurrentButton.prop('disabled', !currentBucketRow);

            if (currentBucketRow){
                var currentBucketName= $(currentBucketRow).data("bucketname");
                this.highlightSelectedRow('#catalog-publish-buckets-table', currentBucketRow);
                var that = this;

                if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                    var studioApp = require('StudioApp');
                    var currentWorkflowName = studioApp.models.currentWorkflow.attributes.name;
                    var currentProjectName = studioApp.models.currentWorkflow.getProject();
                    var currentWorkflowExists = false;//current workflow exists in selected bucketfilterKind = "workflow";
                    this.getBucketCatalogObjects(currentBucketName, function(catalogObjects) {
                        that.$('#catalog-publish-objects-table').empty();
                        _.each(
                        catalogObjects,
                        function (obj) {
                            var ObjectList = _.template(catalogObject);
                            that.$('#catalog-publish-objects-table').append(ObjectList({catalogObject: obj}));
                            if (obj.name == currentWorkflowName)
                                currentWorkflowExists = true;
                        });
                        if (currentWorkflowExists){
                            that.addWorkflowRevisionDescription(currentBucketName, currentWorkflowName, currentProjectName);
                        } else {
                          var objectDescription = _.template(publishDescriptionFirst);
                          that.$('#catalog-publish-description-container').append(objectDescription({name: currentWorkflowName, kind: that.kind, kindLabel: that.kindLabel, projectname: currentProjectName}));
                        }
                        setTimeout(function(){
                            if(shouldScrollToTheSelectedBucket){
                              that.PublishScrollToBucket();
                            }
                        }, 500)
                    });
                } else {
                    //when a script has been imported or already been published, we want to select it again. Its name is saved in the data
                    var scriptName = document.getElementById(this.relatedInputId).dataset.scriptName;
                    var selectedIndex = 0;
                    var index = 0;
                    var projectName = "";
                    this.getBucketCatalogObjects(currentBucketName, function(catalogObjects) {
                        that.$('#catalog-publish-objects-table').empty();
                        _.each(
                        catalogObjects,
                        function (obj) {
                            var ObjectList = _.template(catalogObject);
                            that.$('#catalog-publish-objects-table').append(ObjectList({catalogObject: obj}));
                            if (obj.name == scriptName)
                                selectedIndex = index;
                            index++;
                        });
                        setTimeout(function(){
                            if(shouldScrollToTheSelectedBucket){
                              that.PublishScrollToBucket();
                            }
                        }, 500)
                    })
                    var name = scriptName || 'Untitled '+ this.kindLabel;
                    var objectDescription = _.template(publishDescriptionFirst);
                    this.$('#catalog-publish-description-container').append(objectDescription({name: name, kind: this.kind, kindLabel: this.kindLabel, projectname: projectName}));
                    this.internalSelectObject(this.$('#catalog-publish-objects-table tr')[selectedIndex]);
                }
            }

        },
        addWorkflowRevisionDescription: function(bucketName, workflowName, projectName) {
            var that = this;
            var revisionsModel = new CatalogObjectLastRevisionDescription(
                {
                    bucketname: bucketName,
                    name: workflowName,
                    callback: function (revision) {
                        var objectDescription = _.template(publishDescription);
                        $('#catalog-publish-description-container').append(objectDescription({revision: revision, name: workflowName, kind: that.kind, kindLabel: that.kindLabel, projectname: projectName}));
                    }
                });
            revisionsModel.fetch();
        },
        internalSelectObject: function (currentObjectRow) {
            this.$('#catalog-get-revisions-table').empty();

            if (currentObjectRow){
                var selectedObjectName = $(currentObjectRow).data("objectname");
                $("#catalog-publish-name").val(selectedObjectName);//copy object name in name input field
                this.highlightSelectedRow('#catalog-publish-objects-table', currentObjectRow);
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
        getPreferenceObjectName: function(){
            return $('#publish-object-by-name input').val();
        },
        selectBucket: function(e){
        	var row = $(e.currentTarget);
        	localStorage.setItem("selectBucket", row[0].getAttribute("data-bucketname"));
            this.internalSelectBucket(row, false);
        },
        selectObject: function(e){
            if (this.kind.toLowerCase().indexOf('workflow') != 0) {
                var row = $(e.currentTarget);
                this.internalSelectObject(row);
            }
        },
        setContentToPublish: function(content){
            this.contentToPublish = content;
        },
        setScriptLanguage: function(language){
            this.scriptLanguage = language;
        },
        setRelatedInputId: function(inputId, isUrl){
            this.relatedInputId = inputId;
            this.isRelatedInputUrl = isUrl;
        },
        publishToCatalog: function() {
            var headers = { 'sessionID': localStorage['pa.session'] };
            var bucketName = ($(($("#catalog-publish-buckets-table .catalog-selected-row"))[0])).data("bucketname");

            var studioApp = require('StudioApp');
            var objectName;
            var fileName;
            var projectName;
            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                objectName = studioApp.models.currentWorkflow.attributes.name;
                fileName = objectName + ".xml";
                projectName = $("#workflow-publish-project-name").val();
                //synchronize project name values
                studioApp.models.jobModel.set("Project", $("#workflow-publish-project-name").val());
            } else {
                projectName = $("#script-publish-project-name").val();
                objectName = $("#catalog-publish-name").val();
                fileName = objectName+ ".txt";
            }
            var contentTypeToPublish = 'application/xml';
            if (this.kind.toLowerCase().indexOf('script') == 0) {
                //saving script name and bucket for next commits
                document.getElementById(this.relatedInputId).dataset.scriptName = objectName;
                document.getElementById(this.relatedInputId).dataset.bucketName = bucketName;
                contentTypeToPublish = 'text/plain';
                try {
                    var extension = config.languages_to_extensions[this.scriptLanguage];
                    if (extension)
                        fileName = objectName+'.'+extension;
                    var contentType = config.languages_content_type[this.scriptLanguage];
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
            payload.append('projectName', projectName);
            payload.append('objectContentType', contentTypeToPublish );

            var url = '/catalog/buckets/' + bucketName + '/resources';
            var isWorkflowRevision = ($("#catalog-publish-description").data("first") != true)
            var isRevision = isWorkflowRevision;
            if (!isWorkflowRevision) {
                this.getBucketCatalogObjects(bucketName, function(catalogObjects){
                    _.each(
                    catalogObjects,
                    function (catalogObject) {
                        if (catalogObject.name == objectName){
                            isRevision = true;
                        }
                    });
                });
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
                if (that.isRelatedInputUrl) {
                    //If the URL is a specific revision of the same script (and not the latest one), we set the URL to the new revision
                    var oldUrlValue = document.getElementById(that.relatedInputId).value;
                    if (oldUrlValue.indexOf('revisions') > -1 && oldUrlValue.indexOf('resources/'+objectName) > -1) {
                        var newUrlValue = window.location.origin + '/catalog/buckets/' + bucketName + '/resources/' + objectName + '/revisions/'+ response.commit_time_raw +'/raw';
                        var urlInput = document.getElementById(that.relatedInputId);
                        urlInput.value = newUrlValue;
                        //trigger input keyup event for model update
                        urlInput.dispatchEvent(new Event('keyup'));
                    }
                }
            }).error(function (response) {
                try{
                    var errorObject = response['responseText'];
                    var errorMessage = JSON.parse(errorObject)['errorMessage'].split('Error')[0];
                    StudioClient.alert('Error', errorMessage, 'error');
                } catch(error){
                    StudioClient.alert('Error', 'Error publishing the '+ that.kindLabel +' to the Catalog', 'error');
                }

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
        filterByObjectsByName : function (event){
            event.preventDefault();
            const objectName = $('#publish-object-by-name input').val();
            var studioApp = require('StudioApp');
            studioApp.models.catalogBuckets.setObjectName(objectName);
            studioApp.models.catalogBuckets.fetch({reset: true});
        },
        updateBuckets : function() {
            const that = this;
            this.$('#catalog-publish-buckets-table').empty();
            var BucketList = _.template(catalogList);
            var i = 0;
            var selectIndex;
            if (this.kind) {
                var isWorkflow = this.kind.toLowerCase().indexOf('workflow') == 0;
                if (!isWorkflow) {
                    var alreadyPublishedBucketName = document.getElementById(this.relatedInputId).dataset.bucketName;
                }
            }

            if( typeof alreadyPublishedBucketName === "undefined"){
                var studioApp = require('StudioApp');
                const bucketNameObject = studioApp.models.jobModel.get("Generic Info").filter(function(item){
                                            return item["Property Name"] === "bucketName";
                                        })
                alreadyPublishedBucketName = bucketNameObject.length ? bucketNameObject[0]["Property Value"] : "";
            }


            const countNotEmptyBuckets = this.buckets.models.filter(function(bucket){ return bucket.get('objectCount') > 0}).length;
            if(!countNotEmptyBuckets) {
                $("#publish-catalog-view table").hide()
                if($("#publish-catalog-view p").length){
                    var obj = $("#publish-catalog-view p").text("No results for \"" + that.getPreferenceObjectName() + "\".\n Check your spelling or use more general terms.")
                    obj.html(obj.html().replace(/\n/g,'<br/>'));
                }
            } else {
                $("#publish-catalog-view table").show();
                $("#publish-catalog-view p").text('');
                _(this.buckets.models).each(function(bucket) {
                    var bucketName = bucket.get("name");
                    this.$('#catalog-publish-buckets-table').append(BucketList({bucket: bucket, bucketname: bucketName}));
                    if ( bucketName == alreadyPublishedBucketName ){
                        selectIndex = i;
                    }
                    i++;
                }, this);

                if(typeof selectIndex !== "undefined"){
                    // to open the browser on the right bucket
                    localStorage.setItem("selectBucket", that.$('#catalog-publish-buckets-table tr')[selectIndex].getAttribute("data-bucketname"));
                    this.internalSelectBucket(this.$('#catalog-publish-buckets-table tr')[selectIndex], true);
                } else {
                    // Select the previous bucket if it isn't the first time, otherwise, select the first bucket on the list
                    if(localStorage.selectBucket && that.$('#catalog-publish-buckets-table tr')[0]){
                        const indexOfSelectedBucket = (new Array(that.$('#catalog-publish-buckets-table tr').length)).findIndex(function(elem, index){
                            return that.$('#catalog-publish-buckets-table tr')[index].getAttribute("data-bucketname") == localStorage.selectBucket;
                        })
                        this.internalSelectBucket(this.$('#catalog-publish-buckets-table tr')[indexOfSelectedBucket > 0 ? indexOfSelectedBucket : 0], true);
                    } else {
                        if(that.$('#catalog-publish-buckets-table tr').length){
                            localStorage.setItem("selectBucket", that.$('#catalog-publish-buckets-table tr')[0].getAttribute("data-bucketname"));
                            this.internalSelectBucket(this.$('#catalog-publish-buckets-table tr')[0], true);
                        }
                    }
                }
            }
        },
        PublishScrollToBucket: function() {
            var scrollToVal = $('#catalog-publish-modal .catalog-selected-row').offset().top - $('#catalog-publish-buckets-table').parent().offset().top + $('#catalog-publish-buckets-table').parent().scrollTop()
            $('#catalog-publish-buckets-table').parent().scrollTop(scrollToVal);
        },
        render: function () {
            this.$el.html(this.template());
            var bucketKind = this.kind;
            //for workflows, we don't want subkind filters
            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                bucketKind = "workflow";
            }
            this.buckets.setKind(bucketKind);
            this.buckets.setObjectName("");
            this.buckets.fetch({reset: true, async: false});
            if (this.kind.toLowerCase().indexOf('script') == 0) {
                $('#publish-current-confirmation-modal .modal-body').html("Publishing this script will impact all workflows using it. Do you confirm publication?");
            } else {
                $('#publish-current-confirmation-modal .modal-body').html("Do you want to publish your object in the Catalog?");
            }
            $("#catalog-publish-objects-title").text(this.kindLabel +"s and Projects");
            return this;
        },
    })

})