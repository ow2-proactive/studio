define(
    [
        'backbone',
        'text!proactive/templates/job-variable-template.html',
        'proactive/view/ThirdPartyCredentialView'
    ],

    function (Backbone, jobVariableTemplate, ThirdPartyCredentialView) {

    "use strict";

    return Backbone.View.extend({

        template: undefined,

        initialize: function (infos) {
            this.$el = $('#job-variables');
            this.template = _.template(jobVariableTemplate, {'jobVariables': infos.jobVariables, 'jobName': infos.jobName, 'jobProjectName': infos.jobProjectName, 'jobDescription': infos.jobDescription, 'jobDocumentation': infos.jobDocumentation, 'jobGenericInfos': infos.jobGenericInfos, 'errorMessage': infos.errorMessage, 'infoMessage': infos.infoMessage});
            this.render();
        },

        render: function () {
            this.$el.html(this.template);

            $("#third-party-credential-button").click(function (event) {
                new ThirdPartyCredentialView().render();
                $('#third-party-credential-modal').modal();
            });

            return this;
        }
    })
});
