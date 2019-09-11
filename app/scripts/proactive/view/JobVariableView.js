define(
    [
        'backbone',
        'text!proactive/templates/job-variable-template.html'
    ],
    function (Backbone, jobVariableTemplate) {

    "use strict";

    return Backbone.View.extend({

        template: _.template(jobVariableTemplate),

        viewInfos: undefined,

        events: {
            'click #third-party-credential-button': 'showThirdPartyCredentialModal',
            'click .third-party-credential-close': 'closeThirdPartyCredential',
            'click #add-third-party-credential-button': 'addThirdPartyCredential',
            'click .remove-third-party-credential': 'removeThirdPartyCredential'
        },

        initialize: function () {
            this.$el = $('#job-variables');
        },

        render: function (infos) {
            this.viewInfos = infos;
            this.viewInfos['credentialKeys'] = [];
            this.$el.html(this.template(this.viewInfos));
            return this;
        },

        showThirdPartyCredentialModal: function() {
            var that = this;
            $.ajax({
                url: "/rest/scheduler/credentials/",
                headers: { "sessionid": localStorage['pa.session'] },
                async: false,
                success: function (data){
                    that.viewInfos['credentialKeys'] = data;
                    that.$el.html(that.template(that.viewInfos));
                }
            });
            $('#third-party-credential-modal').modal();
        },

        addThirdPartyCredential: function(event) {
            this.thirdPartyCredentialRequest($('#new-cred-key').val(), "POST", { value: $('#new-cred-value').val() });
        },

        removeThirdPartyCredential: function(event) {
            this.thirdPartyCredentialRequest(event.target.id, "DELETE", {});
        },

        thirdPartyCredentialRequest: function(credentialKey, typeRequest, requestData) {
            var that = this;
            $.ajax({
                url: "/rest/scheduler/credentials/" + credentialKey,
                type: typeRequest,
                data: requestData,
                headers: { "sessionid": localStorage['pa.session'] },
                success: function (data) {
                    that.showThirdPartyCredentialModal();
                },
                error: function (xhr, status, error) {
                    alert('Failed to edit the third-party credential.' + xhr.status + ': ' + xhr.statusText);
                }
            });
        },

        closeThirdPartyCredential: function (event) {
            $('#third-party-credential-modal').modal('hide');
        }
    })
})
