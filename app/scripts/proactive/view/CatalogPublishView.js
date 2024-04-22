define(
    [
        'underscore',
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

    function (_,$, Backbone, config, StudioClient, catalogBrowser, catalogList, catalogObject, publishDescription, publishDescriptionFirst, CatalogObjectLastRevisionDescription, CatalogObjectCollection) {

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
            'submit #new-script-form': 'addNewScript',
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
            this.$('#new-script-form input').val('');
            this.disablePublishButton(!currentBucketRow, '');

            if (!currentBucketRow){
                return;
            }
            var currentBucketName= $(currentBucketRow).data("bucketname");
            this.highlightSelectedRow('#catalog-publish-buckets-table', currentBucketRow);

            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                $('#new-script-form').hide();
                this.retrieveWorkflowsInBucket(currentBucketName, shouldScrollToTheSelectedBucket);
            } else {
                // when publishing a script, allow the user to either to create a new object in the bucket, or select an existing object to publish its new version
                $('#new-script-form').show();
                // when the user has neither selected a script nor create a new one, the publish button is disabled.
                this.disablePublishButton(true, "Please create a new catalog object or select an existing catalog object first.");
                this.retrieveScriptsInBucket(currentBucketName, shouldScrollToTheSelectedBucket);
            }
        },
        retrieveWorkflowsInBucket: function(currentBucketName, shouldScrollToTheSelectedBucket) {
            var studioApp = require('StudioApp');
            var currentWorkflowName = studioApp.models.currentWorkflow.attributes.name;
            var currentProjectName = studioApp.models.currentWorkflow.getProject();
            var currentTags = studioApp.models.jobModel.get("Tags");
            var matchedObject; // the catalog object which match to the workflow who is about to be published.
            var that = this;
            this.getBucketCatalogObjects(currentBucketName, function(catalogObjects) {
                that.$('#catalog-publish-objects-table').empty();
                _.each(
                catalogObjects,
                function (obj) {
                    var ObjectList = _.template(catalogObject);
                    that.$('#catalog-publish-objects-table').append(ObjectList({catalogObject: obj}));
                    if (obj.name == currentWorkflowName) {
                        matchedObject = obj;
                    }
                });
                if (matchedObject){
                    // publishing a new version of an existing catalog object
                    that.addRevisionDescription(currentBucketName, currentWorkflowName, currentProjectName, currentTags);
                    that.disablePublishWhenNoPermission(matchedObject.rights, "workflow " + currentWorkflowName);
                } else {
                    // publish a new catalog object
                    that.addObjectDescription(currentWorkflowName, currentProjectName, currentTags);
                    var currentBucket = that.buckets.models.find(function(bucket){ return bucket.get('name') == currentBucketName})
                    that.disablePublishWhenNoPermission(currentBucket.get('rights'), "bucket " + currentBucketName);
                }
                setTimeout(function(){
                    if(shouldScrollToTheSelectedBucket){
                      that.PublishScrollToBucket();
                    }
                }, 500)
            });
        },
        retrieveScriptsInBucket: function(currentBucketName, shouldScrollToTheSelectedBucket) {
            // when a script has been imported or already been published, we want to select it again. Its name is saved in the data
            var scriptName = document.getElementById(this.relatedInputId).dataset.scriptName;
            var selectedIndex = 0;
            var index = 0;
            var that = this;
            this.getBucketCatalogObjects(currentBucketName, function(catalogObjects) {
                that.$('#catalog-publish-objects-table').empty();
                _.each(
                catalogObjects,
                function (obj) {
                    var ObjectList = _.template(catalogObject);
                    that.$('#catalog-publish-objects-table').append(ObjectList({catalogObject: obj}));
                    if (obj.name == scriptName) {
                        selectedIndex = index;
                        that.internalSelectObject(that.$('#catalog-publish-objects-table tr')[selectedIndex]);
                    }
                    index++;
                });
                setTimeout(function(){
                    if(shouldScrollToTheSelectedBucket){
                      that.PublishScrollToBucket();
                    }
                }, 500)
            })
        },
        addRevisionDescription: function(bucketName, objectName, projectName, tags) {
            var that = this;
            var revisionsModel = new CatalogObjectLastRevisionDescription(
                {
                    bucketname: bucketName,
                    name: objectName,
                    callback: function (revision) {
                        $('#catalog-publish-description-container').empty();
                        var objectDescription = _.template(publishDescription);
                        var objectKind = that.isPsaWorkflow(that.kind) ? "workflow/psa" : that.kind;
                        $('#catalog-publish-description-container').append(objectDescription({revision: revision, name: objectName, kind: objectKind, kindLabel: that.kindLabel, projectname: projectName, tags: tags}));
                    }
                });
            revisionsModel.fetch();
        },
        addObjectDescription: function(objectName, projectName, tags) {
            var objectDescription = _.template(publishDescriptionFirst);
            this.$('#catalog-publish-description-container').empty();
            var objectKind = this.isPsaWorkflow(this.kind) ? "workflow/psa" : this.kind;
            this.$('#catalog-publish-description-container').append(objectDescription({name: objectName, kind: objectKind, kindLabel: this.kindLabel, projectname: projectName, tags: tags}));
        },
        disablePublishWhenNoPermission: function(rights, targetDescription) {
            if (['write', 'admin'].indexOf(rights) >= 0) {
                this.disablePublishButton(false, ""); // enable publish button
            } else {
                this.disablePublishButton(true, "You don't have the write permission to the " + targetDescription); // disable publish button with error message in the tooltip.
            }
        },
        disablePublishButton: function(isDisabled, title) {
            $('#catalog-publish-current').prop('disabled', isDisabled);
            $('#catalog-publish-current').prop('title', title);
        },
        internalSelectObject: function (currentObjectRow) {
            this.$('#catalog-get-revisions-table').empty();

            if (currentObjectRow){
                this.highlightSelectedRow('#catalog-publish-objects-table', currentObjectRow);
                var bucketName = this.getSelectedBucketRow().data("bucketname");
                var selectedObjectName = $(currentObjectRow).data("objectname");
                var selectedProjectName = $(currentObjectRow).data("projectname");
                var selectedTags = $(currentObjectRow).data("tags");
                this.addRevisionDescription(bucketName, selectedObjectName, selectedProjectName, selectedTags);
                var objectRights = $(currentObjectRow).data("objectrights");
                this.disablePublishWhenNoPermission(objectRights, "object " + selectedObjectName);
            }
        },
        getSelectedBucketRow: function() {
            return ($(($("#catalog-publish-buckets-table .catalog-selected-row"))[0]));
        },
        deselectSelectedRow: function(tableId) {
            var selectedClassName = 'catalog-selected-row';
            var selected = $(tableId + " ." + selectedClassName);
            if (selected[0]) {
                $(selected[0]).removeClass(selectedClassName);
            }
        },
        highlightSelectedRow: function(tableId, row){
            var selectedClassName = 'catalog-selected-row';
            this.deselectSelectedRow(tableId);
            $(row).addClass(selectedClassName);
        },
        getPreferenceObjectName: function(){
            return $('#publish-object-by-name input').length ? $('#publish-object-by-name input').val() : "";
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
        addNewScript: function(event) {
            event.preventDefault();
            this.deselectSelectedRow('#catalog-publish-objects-table');
            var objectName = $("#new-script-form input").val() || 'Untitled '+ this.kindLabel;
            this.addObjectDescription(objectName, '')

            var currentBucketName = this.getSelectedBucketRow().data("bucketname");
            var currentBucket = this.buckets.models.find(function(bucket){ return bucket.get('name') == currentBucketName});
            this.disablePublishWhenNoPermission(currentBucket.get('rights'), "bucket " + currentBucketName);
        },
        publishToCatalog: function() {
            var headers = { 'sessionID': localStorage['pa.session'] };
            var bucketName = this.getSelectedBucketRow().data("bucketname");

            var studioApp = require('StudioApp');
            var objectName;
            var fileName;
            var projectName;
            var tags;
            if (this.kind.toLowerCase().indexOf('workflow') == 0) {
                objectName = studioApp.models.currentWorkflow.attributes.name;
                fileName = objectName + ".xml";

                projectName = $("#workflow-publish-project-name").val();
                //synchronize project name values
                studioApp.models.jobModel.set("Project", projectName);

                tags = $("#workflow-publish-tags").val();
                //synchronize tags values
                studioApp.models.jobModel.set("Tags", tags.split(","));
                // add/update bucket name in the generic info
                const genericInformation = studioApp.models.jobModel.get("Generic Info");
                var BucketNameIndex = genericInformation.findIndex(function (gen) {
                    return gen["Property Name"] === "bucketName";
                });
                if(localStorage.selectBucket && BucketNameIndex !== -1) {
                    genericInformation[BucketNameIndex]["Property Value"] = localStorage.selectBucket;
                    // Update the ui: not the best solution but there's no other option for now
                    $("#workflow-designer").click()
                } else if( localStorage.selectBucket ) {
                    const genericItem = {
                        "Property Name": "bucketName",
                        "Property Value": localStorage.selectBucket
                    }
                    genericInformation.push(genericItem);
                    // Update the ui: not the best solution but there's no other option for now
                    $("#workflow-designer").click()
                }
                studioApp.models.jobModel.set("Generic Info", genericInformation);
            } else {
                projectName = $("#script-publish-project-name").val();
                tags = $("#script-publish-tags").val();
                objectName = $("#catalog-publish-name").val();
                if (!objectName) {
                    // in case of publishing a new revision of script, the objectname is the selected object row
                    objectName = ($(($("#catalog-publish-objects-table .catalog-selected-row"))[0])).data("objectname");
                }
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
            payload.append('tags', tags);
            payload.append('objectContentType', contentTypeToPublish );

            var url = config.prefixURl + '/catalog/buckets/' + bucketName + '/resources';
            var isRevision = ($("#catalog-publish-description").data("first") != true)
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
                        var newUrlValue = window.location.origin + config.prefixURl + '/catalog/buckets/' + bucketName + '/resources/' + objectName + '/revisions/'+ response.commit_time_raw +'/raw';
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
        triggerClickShowAll : function () {
            $('#publish-show-all-checkbox input:checkbox').trigger('click');
        },
        isPsaWorkflow : function (kind) {
            if (kind.toLowerCase().indexOf('workflow') != 0) {
                return false;
            }
            var studioApp = require('StudioApp');
            var genericInfo = studioApp.models.jobModel.get("Generic Info");
            if (genericInfo) {
                var pcaStates = genericInfo.filter(function(item){ return item["Property Name"] === "pca.states";})
                var pcaServiceId = genericInfo.filter(function(item){ return item["Property Name"] === "pca.service.id";})
                return pcaStates.length && pcaServiceId.length;
            } else {
                return false;
            }
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

            this.buckets.models.forEach(function(bucket) {
                var owner = (bucket.get('owner') === 'GROUP:public-objects') ? 'public' : bucket.get('owner').replace('GROUP:', '');
                bucket.tooltip = bucket.get('name') + '\nowner:' + owner + '\nrights:' + bucket.get('rights');
            });
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
                    /*
                      * Display buckets with workflows, and empty buckets when not filter is applied
                    */
                    if( bucket.get('objectCount') || (!bucket.get('objectCount') && !this.getPreferenceObjectName().length )){
                        var bucketName = bucket.get("name");
                        this.$('#catalog-publish-buckets-table').append(BucketList({bucket: bucket, bucketname: bucketName}));
                        if ( bucketName == alreadyPublishedBucketName ){
                            selectIndex = i;
                        }
                    }
                    i++;
                }, this);
                if(that.$('#catalog-publish-buckets-table tr').length) {
                    if(typeof selectIndex !== "undefined"){
                        // to open the browser on the right bucket
                        localStorage.setItem("selectBucket", that.$('#catalog-publish-buckets-table tr')[selectIndex].getAttribute("data-bucketname"));
                        this.internalSelectBucket(this.$('#catalog-publish-buckets-table tr')[selectIndex], true);
                    } else {
                        // Select the previous bucket if it isn't the first time, otherwise, select the first bucket on the list
                        if(localStorage.selectBucket){
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