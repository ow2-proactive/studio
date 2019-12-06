define(
    [
        'backbone',
        'text!proactive/templates/third-party-credential-template.html'
    ],
    function (Backbone, credentialTemplate) {

    "use strict";

    return Backbone.View.extend({

        template: _.template(credentialTemplate),

        model: {'credentialKeys': []},

        events: {
            'click .third-party-credential-close': 'closeThirdPartyCredential',
            'click #add-third-party-credential-button': 'addThirdPartyCredential',
            'click .remove-third-party-credential': 'removeThirdPartyCredential'
        },

        initialize: function () {
            this.$el = $('#third-party-credential-modal');
            var that = this;
            // stop inside modal trigger parent modal hidden event
            this.$el.on('hidden.bs.modal', function(event) {
                event.stopPropagation();
            });
            // whenever parent modal is hidden, close inside modal
            $('#execute-workflow-modal').on('hidden.bs.modal', function() {
                that.closeThirdPartyCredential()
            });
        },

        render: function () {
            this.refreshThirdPartyCredential();
            this.$el.html(this.template(this.model));
            this.$el.modal('show');
            return this;
        },

        refreshThirdPartyCredential: function() {
            var that = this;
            $.ajax({
                url: "/rest/scheduler/credentials/",
                headers: { "sessionid": localStorage['pa.session'] },
                async: false,
                success: function (data){
                    that.model['credentialKeys'] = data.sort();
                    that.$el.html(that.template(that.model));
                }
            });
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
                url: "/rest/scheduler/credentials/" + encodeURIComponent(credentialKey),
                type: typeRequest,
                data: requestData,
                headers: { "sessionid": localStorage['pa.session'] },
                success: function (data) {
                    that.refreshThirdPartyCredential();
                },
                error: function (xhr, status, error) {
                    alert('Failed to edit the third-party credential.' + xhr.status + ': ' + xhr.statusText);
                }
            });
        },

        closeThirdPartyCredential: function () {
            this.$el.modal('hide');
        }
    })
})
