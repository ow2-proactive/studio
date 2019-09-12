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

        model: undefined,

        events: {
            'click #third-party-credential-button': 'showThirdPartyCredentialModal',
        },

        initialize: function () {
            this.$el = $('#job-variables');
        },

        render: function (jobInfos) {
            this.model = $.extend(this.model, jobInfos);
            this.$el.html(this.template(this.model));
            return this;
        },

        showThirdPartyCredentialModal: function() {
            new ThirdPartyCredentialView().render();
        }
    })
})
