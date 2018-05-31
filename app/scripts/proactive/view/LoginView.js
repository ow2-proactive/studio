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
                this.render();
                if (Backbone.history.location.hostname === 'try.activeeon.com'|| Backbone.history.location.hostname === 'azure-try.activeeon.com')
                    $("#login-container").append("<a href='https://www.activeeon.com/register/web-download' target='_blank'>Or create an account</a>");
            },
            events: {
                "submit form": "login",
            },

            fill: function() {
                var username = this.getCookie('username');
                if (username != "null") {
                    $("#user").val(username);
                }

            },
            login: function(event) {
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
            },

            render: function() {
                var that = this;
                that.$el = $(that.template());

                // get the cookie variable "username"
                var username = this.getCookie('username');

                $('body').append(that.$el).show();

                $('#login-option-plus').click(function () {
                    $('#login-option-plus').hide();
                    $('#login-option-minus').show();
                    $('#login-options').show();
                    console.log("login-mode value : "+$('#login-mode').val());
                    if($('#login-mode').val() === "basic"){
                        $('#login-credentials').hide();
                        $('#login-ssh').show();
                    }else{
                        $('#login-credentials').show();
                        $('#login-ssh').hide();
                        $('#login-basic').hide();
                    }
                });

                $('#login-option-minus').click(function () {
                    $('#login-option-minus').hide();
                    $('#login-option-plus').show();
                    $('#login-options').hide();
                    $('#login-credentials').hide();
                    $('#login-ssh').hide();
                    $('#login-basic').show();
                })

                $('#login-mode').change(function () {
                   if($('#login-mode').val() === "basic"){
                       $('#login-credentials').hide();
                       $('#login-basic').show();
                       $('#login-ssh').show();
                   }else{
                       $('#login-credentials').show();
                       $('#login-ssh').hide();
                       $('#login-basic').hide();
                   }
                });

                $('#login-ssh-checkbox').change(function () {
                    if($(this).is(":checked")) {
                        $('#login-ssh-button').show();
                    }else{
                        $('#login-ssh-button').hide();
                    }
                });

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
                    // Set username input field value to "username" cookie variable if defined
                    // Otherwise, keep the usual browser's behavior (stored credentials, cached login name)
                    that.fill();
                });

                return this;
            }
        })

    }
)