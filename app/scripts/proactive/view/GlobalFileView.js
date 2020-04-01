define(
    [
        'backbone',
        'text!proactive/templates/file-browser-template.html'
    ],
    function (Backbone, fileBrowserTemplate) {

    "use strict";

    return Backbone.View.extend({

        template: _.template(fileBrowserTemplate),

        model: {
            'files': [],
            'directories': [],
            'currentPath': "",
            'location': "Global DataSpace"
        },

        events: {
            'click .file-browser-close': 'closeFileBrowser',
            'click .file-browser-dir': 'enterGlobalFilesSubdir'
        },

        initialize: function () {
            this.$el = $('#file-browser-modal');
            var that = this;
            // stop inside modal trigger parent modal hidden event
            this.$el.on('hidden.bs.modal', function(event) {
                event.stopPropagation();
            });
            // whenever parent modal is hidden, close inside modal
            $('#execute-workflow-modal').on('hidden.bs.modal', function() {
                that.closeFileBrowser();
            });
        },

        render: function () {
            this.model['currentPath'] = "";
            this.refreshGlobalFiles("%2E"); // root path "/." encoded as "%2E"
            this.$el.html(this.template(this.model));
            this.$el.modal('show');
            return this;
        },

        enterGlobalFilesSubdir: function (event) {
            this.model['currentPath'] = event.target.getAttribute('value');
            this.refreshGlobalFiles(this.model['currentPath']);
        },

        refreshGlobalFiles: function(path) {
            var that = this;
            $.ajax({
                url: "/rest/data/global/" + encodeURIComponent(path),
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

        closeFileBrowser: function () {
            this.$el.modal('hide');
        }
    })
})
