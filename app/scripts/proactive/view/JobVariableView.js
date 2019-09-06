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
            'click .third-party-credential-close': 'closeThirdPartyCredential',
            'submit #add-third-party-credential': 'submitThirdPartyCredential'
        },

        initialize: function () {
            this.$el = $('#job-variables');
        },

        render: function (infos) {
            this.$el.html(this.template({'jobVariables': infos.jobVariables, 'jobName': infos.jobName, 'jobProjectName': infos.jobProjectName, 'jobDescription': infos.jobDescription, 'jobDocumentation': infos.jobDocumentation, 'jobGenericInfos': infos.jobGenericInfos, 'errorMessage': infos.errorMessage, 'infoMessage': infos.infoMessage}));
            return this;
        },

        showThirdPartyCredentialModal: function() {
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

        submitThirdPartyCredential: function(event) {
            event.preventDefault();
            var that = this;
            $.ajax({
                url: "/rest/scheduler/credentials/" + $('#new-cred-key').val(),
                type: "POST",
                headers: { "sessionid": localStorage['pa.session'] },
                data: { value: $('#new-cred-value').val() },
                success: function (data) {
                    that.showThirdPartyCredentialModal();
                },
                error: function (xhr, status, error) {
                    alert('Failed to adding the third-party credential.' + xhr.status + ': ' + xhr.statusText);
                }
            });
        },

        closeThirdPartyCredential: function (event) {
            $('#third-party-credential-modal').modal('hide');
        }
    })
})
