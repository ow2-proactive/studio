define(
    [
        'backbone',
        'text!proactive/templates/job-variable-template.html',
        'text!proactive/templates/third-party-credential.html',
        'proactive/model/ThirdPartyCredentialCollection'
    ],

    function (Backbone, jobVariableTemplate, thirdPartyCredentialTemplate, ThirdPartyCredentialCollection) {

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
            var objectsModel = new ThirdPartyCredentialCollection({
                callback: function (thirdPartyCredentialObjects) {
                    $('#third-party-credential-table tbody').empty();
                    _.each(thirdPartyCredentialObjects, function (obj) {
                        var credentialTemplate = _.template(thirdPartyCredentialTemplate);
                        $('#third-party-credential-table tbody').append(credentialTemplate({credentialKey: obj}));
                    });
                }
            });
            objectsModel.fetch({async:false});
            $('#third-party-credential-modal').modal();
        },

        closeThirdPartyCredential: function (event) {
            $('#third-party-credential-modal').modal('hide');
        }
    })
})
