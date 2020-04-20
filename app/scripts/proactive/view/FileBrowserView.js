define(
    [
        'backbone',
        'text!proactive/templates/file-browser-template.html'
    ],
    function (Backbone, fileBrowserTemplate) {

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
            this.model['currentPath'] = event.target.getAttribute('value');
            this.refreshFiles();
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
                    that.model['files'] = data.fileListing.sort();
                    that.model['directories'] = data.directoryListing.sort();
                    that.$el.html(that.template(that.model));
                    if(that.uploadRequest) {
                        that.switchToUploadingState();
                    }
                }
            });
        },

        switchSelected: function(event) {
            if ($(event.target).hasClass('selected')) {
                // deselect
                $(event.target).removeClass("selected");
            } else {
                // mark the previous selected item as non-selected, as only one item could be selected at once.
                var selectedElement=$("ul#files-ul > li.selected");
                if (selectedElement) {
                    selectedElement.removeClass("selected");
                }
                // highlight currently selected item
                $(event.target).addClass("selected");
                $("#file-browser-error-message").text("");
            }
        },

        selectFile: function() {
            var selectedElement=$("ul#files-ul > li.selected");
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
                        alert("Failed to upload the file " + selectedFile.name + ": "+ xhr.statusText);
                    }
                });
            }
        },

        createFolder: function() {
            var that = this;
            $("#files-ul").prepend('<li> <i class="far fa-folder"> </i> <input class="new-folder" value="untitled-folder"/> </li>');
            $(".new-folder").keyup(function(event) {
                if ($(this).is(":focus") && event.key == "Enter") {
                    var pathname = that.model['currentPath'] + $(this).val();
                    $.ajax({
                        type: "POST",
                        url: that.dataspaceRestUrl + encodeURIComponent(pathname),
                        data: {"mimetype": "application/folder"},
                        headers: { "sessionid": localStorage['pa.session'] },
                        success: function (data){
                            that.refreshFiles();
                        },
                        error: function (xhr, status, error) {
                            alert("Failed to create the new folder " + pathname + ": "+ xhr.statusText);
                        }
                    });
                }
            });
        },

        deleteFile: function(event) {
            var selectedElement=$("ul#files-ul > li.selected");
            if (selectedElement.length == 0) {
                alert("No file chosen to be deleted.");
                return;
            }
            var selectedFilePath = selectedElement.attr('value');
            var result;
            if(selectedElement.hasClass("file-browser-dir")) {
                result = confirm(`Are you sure you want to permanently delete the folder "${selectedFilePath}" and all the files in it ?`);
            } else {
                result = confirm(`Are you sure you want to permanently delete the file "${selectedFilePath}" ?`);
            }
            if (result) {
                var that = this;
                $.ajax({
                    type: "DELETE",
                    url: that.dataspaceRestUrl + encodeURIComponent(selectedFilePath),
                    headers: { "sessionid": localStorage['pa.session'] },
                    success: function (data){
                        that.refreshFiles();
                    },
                    error: function (xhr, status, error) {
                        alert("Failed to delete the file " + selectedFilePath + ": "+ xhr.statusText);
                    }
                });
            }
        },

        switchToUploadingState: function() {
            $("#upload-file-btn").removeClass('fa-upload').addClass('fa-spinner fa-pulse');
            $("#upload-file-btn").attr("disabled", true);
        },

        switchToNothingUploadingState: function() {
            $("#upload-file-btn").removeClass('fa-spinner fa-pulse').addClass('fa-upload');
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
