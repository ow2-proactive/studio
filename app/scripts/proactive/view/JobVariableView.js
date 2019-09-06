define(
    [
        'backbone',
        'text!proactive/templates/job-variable-template.html',
        'proactive/model/ThirdPartyCredentialCollection'
    ],
    function (Backbone, jobVariableTemplate, ThirdPartyCredentialCollection) {

    "use strict";

    return Backbone.View.extend({

        template: _.template(jobVariableTemplate),

        viewInfos: undefined,

        events: {
            'click #third-party-credential-button': 'showThirdPartyCredentialModal',
            'click .third-party-credential-close': 'closeThirdPartyCredential',
            'submit #add-third-party-credential': 'submitThirdPartyCredential',
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
            var objectsModel = new ThirdPartyCredentialCollection({
                callback: function (thirdPartyCredentialObjects) {
                    that.viewInfos['credentialKeys'] = thirdPartyCredentialObjects;
                    that.$el.html(that.template(that.viewInfos));
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

        removeThirdPartyCredential: function(event) {
            var credentialKey = event.target.id;
            var that = this;
            $.ajax({
                url: "/rest/scheduler/credentials/" + credentialKey,
                type: "DELETE",
                headers: { "sessionid": localStorage['pa.session'] },
                success: function (data) {
                    that.showThirdPartyCredentialModal();
                },
                error: function (xhr, status, error) {
                    alert('Failed to removing the third-party credential.' + xhr.status + ': ' + xhr.statusText);
                }
            });
        },

        closeThirdPartyCredential: function (event) {
            $('#third-party-credential-modal').modal('hide');
        }
    })
})
