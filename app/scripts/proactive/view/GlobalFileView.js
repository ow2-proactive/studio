define(
    [
        'backbone',
        'text!proactive/templates/file-browser-template.html'
    ],
    function (Backbone, fileBrowserTemplate) {

    "use strict";

    return Backbone.View.extend({
        varKey: "",

        template: _.template(fileBrowserTemplate),

        model: {
            'files': [],
            'directories': [],
            'currentPath': "",
            'location': "Global DataSpace"
        },

        events: {
            'click .file-browser-close': 'closeFileBrowser',
            'click .file-browser-file,.file-browser-dir': 'switchSelected',
            'dblclick .file-browser-dir': 'enterGlobalFilesSubdir',
            'click .current-sub-path': 'enterGlobalFilesSubdir',
            'click .file-browser-select-btn': 'selectFile'
        },

        initialize: function (varInfo) {
            this.varKey = varInfo.varKey;
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
            this.refreshGlobalFiles();
            this.$el.html(this.template(this.model));
            this.$el.modal('show');
            return this;
        },

        enterGlobalFilesSubdir: function (event) {
            this.model['currentPath'] = event.target.getAttribute('value');
            this.refreshGlobalFiles();
        },

        refreshGlobalFiles: function() {
            var that = this;
            var pathname = that.model['currentPath'];
            if(pathname.length == 0) {
                pathname = "%2E"; // root path "." need to be encoded as "%2E"
            }
            $.ajax({
                url: "/rest/data/global/" + encodeURIComponent(pathname),
                data: { "comp": "list" },
                headers: { "sessionid": localStorage['pa.session'] },
                async: false,
                success: function (data){
                    that.model['files'] = data.fileListing.sort();
                    that.model['directories'] = data.directoryListing.sort();
                    that.$el.html(that.template(that.model));
                }
            });
        },

        switchSelected: function(event) {
            if ($(event.target).hasClass('selected')) {
                // deselect
                $(event.target).removeClass("selected");
            } else {
                // mark the previous selected item as non-selected, as only one item could be selected at once.
                var selectedElement=$("ul.files-ul > li.selected");
                if (selectedElement) {
                    selectedElement.removeClass("selected");
                }
                // highlight currently selected item
                $(event.target).addClass("selected");
                $("#file-browser-error-message").text("");
            }
        },

        selectFile: function() {
            var selectedElement=$("ul.files-ul > li.selected");
            if (selectedElement.length != 0) {
                var studioApp = require('StudioApp');
                var currentVar = studioApp.views.jobVariableView.model['jobVariables'];
                // clone the current variables to avoid changing variable default value
                var jobVariables = JSON.parse(JSON.stringify(currentVar));
                // update the variable value to the selected file path
                jobVariables[this.varKey].Value = selectedElement.attr('value');
                studioApp.views.jobVariableView.render({'jobVariables': jobVariables});
                this.closeFileBrowser();
            } else {
                $("#file-browser-error-message").text("Cannot find selected path: Please select a file or a directory!");
            }
        },

        closeFileBrowser: function () {
            this.$el.modal('hide');
        }
    })
})
