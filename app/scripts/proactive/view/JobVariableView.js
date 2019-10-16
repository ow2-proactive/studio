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

        model: {'jobVariables': {}, 'jobName':'', 'jobProjectName':'', 'jobDescription':'', 'jobDocumentation':'', 'jobGenericInfos':[], 'errorMessage':'', 'infoMessage' :''},

        events: {
            'click #third-party-credential-button': 'showThirdPartyCredentialModal',
        },

        initialize: function () {
            this.$el = $('#job-variables');
            // fix overlays of nested modal "third-party-credential-modal" inside "execute-workflow-modal" (backdrop overlays the previous modal)
            $(document).on('show.bs.modal', '.nested-modal', function() {
                var zIndex = 1040 + (10 * $('.modal:visible').length);
                $(this).css('z-index', zIndex);
                // setTimeout is used because the .modal-backdrop isn't created when the event show.bs.modal is triggered.
                setTimeout(function() {
                    $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
                }, 0);
            });
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
