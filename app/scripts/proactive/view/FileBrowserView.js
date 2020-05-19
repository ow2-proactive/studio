define(
    [
        'backbone',
        'text!proactive/templates/file-browser-template.html',
        'proactive/rest/studio-client',
    ],
    function (Backbone, fileBrowserTemplate, StudioClient) {

    "use strict";

    return Backbone.View.extend({

        dataspace: "",

        varKey: "",

        dataspaceRestUrl: "/rest/data/",

        uploadRequest: undefined,

        template: _.template(fileBrowserTemplate),

        model: {
            'files': [],
            'directories': [],
            'currentPath': "",
            'locationDescription': ""
        },

        events: {
            'click .file-browser-close': 'closeFileBrowser',
            'click .file-browser-file,.file-browser-dir': 'switchSelected',
            'dblclick .file-browser-dir': 'enterFilesSubdir',
            'click .current-sub-path': 'enterFilesSubdir',
            'click .file-browser-select-btn': 'selectFile',
            'click #upload-file-btn': 'chooseUploadFile',
            'change #selected-upload-file': 'uploadFile',
            'click #refresh-file-btn': 'refreshFiles',
            'click #new-folder-btn': 'createFolder',
            'click #delete-file-btn': 'deleteFile'
        },

        initialize: function (options) {
            this.dataspace = options.dataspace;
            this.varKey = options.varKey;
            this.dataspaceRestUrl += options.dataspace + "/";
            this.model['locationDescription'] = options.dataspace.toUpperCase() + " DataSpace";

            this.$el = $('#file-browser-modal');
            var that = this;
            this.$el.on('hidden.bs.modal', function(event) {
                // stop inside modal trigger parent modal hidden event
                event.stopPropagation();
                // when the modal is closed, remove its events to avoid trigger duplicated events when reopen the modal
                that.undelegateEvents();
            });
            // whenever parent modal is hidden, close inside modal
            $('#execute-workflow-modal').on('hidden.bs.modal', function() {
                that.closeFileBrowser();
            });
        },

        render: function () {
            this.model['currentPath'] = "";
            this.refreshFiles();
            this.$el.html(this.template(this.model));
            this.$el.modal('show');
            return this;
        },

        enterFilesSubdir: function (event) {
            if( event.target.hasAttribute('value') ){
                this.model['currentPath'] = event.target.getAttribute('value');
                this.refreshFiles();
            }
        },

        refreshFiles: function() {
            var that = this;
            var pathname = that.model['currentPath'];
            if(pathname.length == 0) {
                pathname = "%2E"; // root path "." need to be encoded as "%2E"
            }
            $.ajax({
                url: that.dataspaceRestUrl + encodeURIComponent(pathname),
                data: { "comp": "list" },
                headers: { "sessionid": localStorage['pa.session'] },
                async: false,
                success: function (data){
                    that.model['files'] = that.getFilesMetadata(data.fileListing.sort());
                    that.model['directories'] = that.getFilesMetadata(data.directoryListing.sort());
                    that.$el.html(that.template(that.model));
                    if(that.uploadRequest) {
                        that.switchToUploadingState();
                    }
                }
            });
        },

        getFilesMetadata: function(fileNames) {
            var that = this;
            var filesMetadata = [];
            for (let i = 0; i < fileNames.length; i++) {
                var filePath = that.model['currentPath'] + fileNames[i];
                $.ajax({
                    url: that.dataspaceRestUrl + encodeURIComponent(filePath),
                    type: "HEAD",
                    headers: { "sessionid": localStorage['pa.session'] },
                    async: false,
                    success: function (response, status, xhr){
                        filesMetadata[i] = {
                            name: fileNames[i],
                            type: xhr.getResponseHeader('x-proactive-ds-type'),
                            modified: that.toDateInClientFormat(xhr.getResponseHeader('Last-Modified'))
                        };
                        if(filesMetadata[i].type == 'FILE') {
                            filesMetadata[i].type = xhr.getResponseHeader('Content-Type');
                            filesMetadata[i].size = that.toReadableFileSize(xhr.getResponseHeader('Content-Length'));
                        }
                    }
                });
            }
            return filesMetadata;
        },

        toReadableFileSize: function(size) {
            if (typeof bytes !== 'number') {
                size = parseInt(size);
            }
            var units = [' B', ' KB', ' MB', ' GB', ' TB']
            let unitIndex = 0;
            while(size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024 ;
                unitIndex++;
            }
            return size.toFixed(1) + units[unitIndex];
        },

        toDateInClientFormat: function(serverDate) {
            return new Date(serverDate).toLocaleString(undefined, { hour12: false });
        },

        switchSelected: function(event) {
            if ($(event.target).hasClass('selected')) {
                // deselect
                $(event.target).removeClass("selected");
            } else {
                // mark the previous selected item as non-selected, as only one item could be selected at once.
                var selectedElement=$("#files-tbody  td.selected");
                function SelectedElementIcon(){
                    return $("#files-tbody  td.selected i");
                }
                if (selectedElement) {
                    SelectedElementIcon().removeClass("fas");
                    SelectedElementIcon().addClass("far");
                    selectedElement.removeClass("selected");
                }
                // highlight currently selected item
                $(event.target).addClass("selected");
                SelectedElementIcon().removeClass("far");
                SelectedElementIcon().addClass("fas");
                $("#file-browser-error-message").text("");
            }
        },

        selectFile: function() {
            var selectedElement=$("#files-tbody  td.selected");
            if (selectedElement.length == 0) {
                $("#file-browser-error-message").text("Cannot find any file selected: please select a regular file !");
                return;
            }
            var selectedFile = selectedElement.filter(".file-browser-file");
            if (selectedFile.length == 0) {
                $("#file-browser-error-message").text("Directory is disallowed as the variable value: please select a regular file !");
            } else {
                // update the variable value to the selected file path
                var studioApp = require('StudioApp');
                var updatedVar = {[this.varKey]: selectedFile.attr('value')};
                studioApp.views.jobVariableView.updateVariableValue(updatedVar);
                this.closeFileBrowser();
            }
        },

        chooseUploadFile: function(event) {
            event.preventDefault();
            $('#selected-upload-file').click();
        },

        uploadFile: function(event) {
            var that = this;
            var selectedFile = event.target.files[0];
            if (selectedFile) {
                if (selectedFile.name.includes(':')) {
                    StudioClient.alert('Error', 'Uploading failed: the uploaded file name "' + selectedFile.name + '" should not contain colon.', 'error');
                    return;
                }
                var pathname = that.model['currentPath'] + selectedFile.name;
                that.switchToUploadingState();
                that.uploadRequest = $.ajax({
                    type: "PUT",
                    url: that.dataspaceRestUrl + encodeURIComponent(pathname),
                    data: selectedFile,
                    processData: false,
                    headers: { "sessionid": localStorage['pa.session'] },
                    success: function (data){
                        that.refreshFiles();
                        that.switchToNothingUploadingState();
                        that.uploadRequest = undefined;
                    },
                    error: function (xhr, status, error) {
                        var errorMessage = "";
                        if(xhr) {
                            errorMessage = ": "+ xhr.errorMessage;
                        }
                        StudioClient.alert('Error', "Failed to upload the file " + selectedFile.name + errorMessage, 'error');
                        that.switchToNothingUploadingState();
                        that.uploadRequest = undefined;
                    }
                });
            }
        },

        createFolder: function() {
            var that = this;
            $("#files-tbody").prepend('<tr><td> <i class="far fa-folder"> </i> <input class="new-folder" value="untitled-folder"/> </td></tr>');
            // workaround to focus the cursor at the end of the input
            var input = $(".new-folder");
            var value = input.val();
            input.focus().val("").blur().focus().val(value).select();

            // Create the new folder in server side
            $(".new-folder").keyup(function(event) {
                if ($(this).is(":focus") && event.key == "Enter") {
                    var pathname = that.model['currentPath'] + $(this).val();
                    if (pathname.includes(':')) {
                        StudioClient.alert('Create New Folder', 'Failed to create the new folder "' + pathname + '": it should not contain colon.', 'error');
                        return;
                    }
                    $.ajax({
                        type: "POST",
                        url: that.dataspaceRestUrl + encodeURIComponent(pathname),
                        data: {"mimetype": "application/folder"},
                        headers: { "sessionid": localStorage['pa.session'] },
                        success: function (data){
                            that.refreshFiles();
                        },
                        error: function (xhr, status, error) {
                            StudioClient.alert('Create New Folder', "Failed to create the new folder " + pathname + ": "+ xhr.statusText , 'error');
                        }
                    });
                }
            });
        },

        deleteFile: function(event) {
            var selectedElement=$("#files-tbody  td.selected");
            if (selectedElement.length == 0) {
                StudioClient.alert('Delete', "No file chosen to be deleted." , 'error');
                return;
            }
            var selectedFilePath = selectedElement.attr('value');
            var confirmMessage;
            if(selectedElement.hasClass("file-browser-dir")) {
                confirmMessage = `Are you sure you want to permanently delete the folder "${selectedFilePath}" and all the files in it ?`;
            } else {
                confirmMessage = `Are you sure you want to permanently delete the file "${selectedFilePath}" ?`;
            }
            if (confirm(confirmMessage)) {
                var that = this;
                $.ajax({
                    type: "DELETE",
                    url: that.dataspaceRestUrl + encodeURIComponent(selectedFilePath),
                    headers: { "sessionid": localStorage['pa.session'] },
                    success: function (data){
                        that.refreshFiles();
                    },
                    error: function (xhr, status, error) {
                        StudioClient.alert('Delete', "Failed to delete the file " + selectedFilePath + ": "+ xhr.statusText, 'error');
                    }
                });
            }
        },

        switchToUploadingState: function() {
            $("#upload-file-btn > i").removeClass('fa-upload').addClass('fa-spinner fa-pulse');
            $("#upload-file-btn").attr("disabled", true);
        },

        switchToNothingUploadingState: function() {
            $("#upload-file-btn > i").removeClass('fa-spinner fa-pulse').addClass('fa-upload');
            $("#upload-file-btn").attr("disabled", false);
        },

        closeFileBrowser: function () {
            this.$el.modal('hide');
            if(this.uploadRequest) {
                this.uploadRequest.abort();
            }
        }
    })
})
