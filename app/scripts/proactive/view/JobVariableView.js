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
        }
    })
})
