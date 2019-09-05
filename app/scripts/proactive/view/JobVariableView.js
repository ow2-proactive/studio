define(
    [
        'backbone',
        'text!proactive/templates/job-variable-template.html'
    ],

    function (Backbone, jobVariableTemplate) {

    "use strict";

    return Backbone.View.extend({

        template: _.template(jobVariableTemplate),

        events: {
            'click #third-party-credential-button': 'showThirdPartyCredentialModal',
            'click .third-party-credential-close': 'closeThirdPartyCredential'
        },

        initialize: function () {
            this.$el = $('#job-variables');
        },

        render: function (infos) {
            this.$el.html(this.template({'jobVariables': infos.jobVariables, 'jobName': infos.jobName, 'jobProjectName': infos.jobProjectName, 'jobDescription': infos.jobDescription, 'jobDocumentation': infos.jobDocumentation, 'jobGenericInfos': infos.jobGenericInfos, 'errorMessage': infos.errorMessage, 'infoMessage': infos.infoMessage}));
            return this;
        },

        showThirdPartyCredentialModal: function(event){
            $('#third-party-credential-modal').modal();
        },

        closeThirdPartyCredential: function (event) {
            $('#third-party-credential-modal').modal('hide');
        }
    })
})
