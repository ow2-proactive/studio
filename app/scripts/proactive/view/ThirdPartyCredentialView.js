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
            'click .remove-third-party-credential': 'removeThirdPartyCredential',
            'input #new-cred-value': 'changeCredValue',
            'change #multiline-cred': 'changeMultilineCredential'
        },

        initialize: function () {
            this.$el = $('#third-party-credential-modal');
            var that = this;
            this.$el.on('hidden.bs.modal', function(event) {
                // stop inside modal trigger parent modal hidden event
                event.stopPropagation();
                // when the modal is closed, remove its events to avoid trigger duplicated events when reopen the modal
                that.undelegateEvents();
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
            var credValue = $('#multiline-cred').prop('checked') ? $('#new-cred-value-multiline').val() : $('#new-cred-value').val();
            this.thirdPartyCredentialRequest($('#new-cred-key').val(), "POST", { value: credValue });
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

        changeMultilineCredential: function(event) {
            if (event.target.checked) {
                // switch to multi-lines credential
                // previous single-line credential value will be copied into multi-line cred
                var credValue = $('#new-cred-value').val();
                $('#new-cred-value-multiline').val(credValue);
                $('#new-cred-value').hide();
                $('#new-cred-value-multiline').show();
            } else {
                // switch to single-line credential
                // if the user has entered multi-lines credential, it will be erased when switching to single-line credential mode
                var credValue = $('#new-cred-value-multiline').val();
                if (credValue.includes('\n')) {
                    $('#new-cred-value').val("");
                    $("#add-cred-error-message").text("Switching to single-line credentials has deleted the multiline credential value, please re-enter your credential.");
                } else {
                    $('#new-cred-value').val(credValue);
                    $("#add-cred-error-message").text("");
                }
                $('#new-cred-value-multiline').hide();
                $('#new-cred-value').show();
            }
        },

        changeCredValue: function() {
            if ($('#new-cred-value').val()) {
                $("#add-cred-error-message").text("");
            }
        },

        closeThirdPartyCredential: function () {
            this.$el.modal('hide');
        }
    })
})
