define(
    [
        'jquery',
        'backbone',
        'proactive/rest/studio-client',
        'text!proactive/templates/login-template.html'
    ],

    function($, Backbone, StudioClient, loginTemplate) {

        "use strict";

        return Backbone.View.extend({
            template: _.template(loginTemplate),

            initialize: function() {

                // fill username with the cookie variable "username"
                this.fill();

                this.render();
            },
            events: {
                "submit form": "login",
            },

            fill: function() {
                console.log('[fill] cookie ' + this.getCookie('username'));
                var username= this.getCookie('username');
                
                console.log('[fill] setting username: ' +  username);
                $("#user").val(username);

            },
            login: function(event) {
                var username= this.getCookie('username');
                $("#user").val(username);
                event.preventDefault();
                var that = this;
                var form = $(event.target);

                StudioClient.login({
                    user: $("#user").val(),
                    pass: $("#password").val()
                }, function() {
                    // on success
                    that.remove();
                    that.options.app.login();
                })
            },


            getCookie: function(cname) {
                var name = cname + "=";
                var decodedCookie = decodeURIComponent(document.cookie);
                var ca = decodedCookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return "";
            },

            render: function() {
                var that = this;
                that.$el = $(that.template());
                
                // get the cookie variable "username"
                var username= this.getCookie('username');

                $('body').append(that.$el).show();

                StudioClient.isConnected(function() {
                    // logged in successfully - show user name
                    console.log("Logged in");
                    that.remove();
                    that.options.app.login();
                    $('body').show();
                }, function() {
                    // failed to login - show login form
                    console.log("Login Required");

                    $('body').show();
                    // Set username input field value
                    $("#user").val(username);
                });

                return this;
            }
        })

    }
)