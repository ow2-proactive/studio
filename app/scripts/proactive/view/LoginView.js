define(
    [
        'jquery',
        'backbone',
        'proactive/rest/studio-client',
        'text!proactive/templates/login-template.html'
    ],

    function ($, Backbone, StudioClient, loginTemplate) {

        "use strict";

        return Backbone.View.extend({
            template: _.template(loginTemplate),

            initialize: function () {
                this.render();
            },
            events: {
                "submit form": "login"
            },
            login: function (event) {
                event.preventDefault();
                var that = this;
                var form = $(event.target);

                StudioClient.login({
                    user: $("#user").val(),
                    pass: $("#password").val()
                }, function () {
                    // on success
                    that.remove();
                    that.options.app.login();
                })
            },
            render: function () {
                var that = this;

                that.$el = $(that.template());
                $('body').append(that.$el).show();

                StudioClient.isConnected(function () {
                    // logged in successfully - show user name
                    console.log("Logged in");
                    that.remove();
                    that.options.app.login();
                    $('body').show();
                }, function () {
                    // failed to login - show login form
                    console.log("Login Required");
                });

                return this;
            }
        })

    }
)
