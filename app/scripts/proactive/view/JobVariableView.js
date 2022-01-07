define(
    [
        'backbone',
        'text!proactive/templates/job-variable-template.html',
        'proactive/view/ThirdPartyCredentialView',
        'proactive/view/FileBrowserView',
        'proactive/view/BeautifiedModalAdapter'
    ],
    function (Backbone, jobVariableTemplate, ThirdPartyCredentialView, FileBrowserView, BeautifiedModalAdapter) {

    "use strict";

    return Backbone.View.extend({

        template: _.template(jobVariableTemplate),

        model: {
            'jobVariables': {},
            'jobName':'',
            'jobProjectName':'',
            'jobDescription':'',
            'jobDocumentation':'',
            'jobGenericInfos':[],
            'errorMessage':'',
            'infoMessage' :''
        },

        events: {
            'click .third-party-credential-button': 'showThirdPartyCredentialModal',
            'click .var-globalfile-button': 'showGlobalFileModal',
            'click .var-userfile-button': 'showUserFileModal',
            'click .var-globalfolder-button': 'showGlobalFolderModal',
            'click .var-userfolder-button': 'showUserFolderModal',
            'click .var-catalogobject-button': 'showCatalogModal'
        },

        initialize: function () {
            this.$el = $('#job-variables');
            // fix overlays of nested modal "third-party-credential-modal" inside "execute-workflow-modal" (backdrop overlays the previous modal)
            $(document).on('show.bs.modal', '.nested-modal', function() {
                var zIndex = 1040 + (10 * $('.modal:visible').length);
                $(this).css('z-index', zIndex);
                // setTimeout is used because the .modal-backdrop isn't created when the event show.bs.modal is triggered.
                setTimeout(function() {
                    $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
                }, 0);
            });
        },

        render: function (jobInfos) {
            var jobInfosCloned = JSON.parse(JSON.stringify(jobInfos));
            this.model = $.extend(this.model, jobInfosCloned);
            this.$el.html(this.template(this.model));
            new BeautifiedModalAdapter().beautifyForm(this.$el);
            return this;
        },

        updateVariableValue: function(jobVariables) {
            for(var key in jobVariables) {
                this.model.jobVariables[key].Value = jobVariables[key];
                var updatedVarElement = $(document.getElementById(key));
                updatedVarElement.text(jobVariables[key]);
            }
        },

        showThirdPartyCredentialModal: function() {
            new ThirdPartyCredentialView().render();
        },

        showGlobalFileModal: function(event) {
            new FileBrowserView({dataspace: "global", varKey: event.target.getAttribute('value'), selectFolder: false}).render();
        },

        showUserFileModal: function(event) {
            new FileBrowserView({dataspace: "user", varKey: event.target.getAttribute('value'), selectFolder: false}).render();
        },

        showGlobalFolderModal: function(event) {
            new FileBrowserView({dataspace: "global", varKey: event.target.getAttribute('value'), selectFolder: true}).render();
        },

        showUserFolderModal: function(event) {
            new FileBrowserView({dataspace: "user", varKey: event.target.getAttribute('value'), selectFolder: true}).render();
        },

        showCatalogModal: function(event) {
            event.preventDefault();
            var studioApp = require('StudioApp');
            studioApp.views.catalogGetView.setKind("all", "Object");
            studioApp.views.catalogGetView.setVarKey(event.currentTarget.getAttribute('value'));
            // retrieve the filter of kind and contentType from variable model definition
            var model = event.currentTarget.previousElementSibling.getAttribute('title');
            var matches = model.match(/\((.*)\)/); //matches[1] contains the value between the parentheses
            if (matches && matches.length > 1) {
                var params = matches[1].split(',');
                studioApp.views.catalogGetView.setFilter(params[0], params[1]); //filterKind, filterContentType
            }
            studioApp.views.catalogGetView.render();

            var previousZIndex = $("#catalog-get-modal").css("z-index");
            studioApp.views.catalogGetView.setPreviousZIndex(previousZIndex);
            var zIndexModal = parseInt($("#catalog-get-modal").parents().find(".modal").css("z-index")); // #execute-workflow-modal
            $("#catalog-get-modal").css("z-index", (zIndexModal+1).toString());
            $('#catalog-get-modal').modal();
        },
    })
})
