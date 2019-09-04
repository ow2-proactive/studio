define(
    [
        'backbone',
        'text!proactive/templates/third-party-credential.html'
    ],

    function (Backbone, thirdPartyCredentialTemplate) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(thirdPartyCredentialTemplate),

        initialize: function () {
            this.$el = $("<div id='third-party-credential-get-container'></div>");
            $("#third-party-credential-body").append(this.$el);
            this.render();
        },

        render: function () {
            this.$el.html(this.template);
            return this;
        }
    })

})
