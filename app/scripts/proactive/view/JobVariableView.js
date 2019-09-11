define(
    [
        'backbone',
        'text!proactive/templates/job-variable-template.html',
        'proactive/view/ThirdPartyCredentialView'
    ],
    function (Backbone, jobVariableTemplate, ThirdPartyCredentialView) {

    "use strict";

    return Backbone.View.extend({

        template: _.template(jobVariableTemplate),

        viewInfos: undefined,

        events: {
            'click #third-party-credential-button': 'showThirdPartyCredentialModal',
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
            new ThirdPartyCredentialView().render();
        },

        refreshThirdPartyCredential: function() {
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
        }
    })
})
