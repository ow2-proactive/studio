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
                "submit form"              : "login"            ,
                "click #create-credentials": "createCredentials",
                "click #login-option-plus" : "showOptions"      ,
                "click #login-option-minus": "hideOptions"      ,
                "change #login-mode"       : "switchMode"       ,
                "click #login-ssh-checkbox": "sshOption"        ,
                "click #login-ssh-label"   : "sshOption"
            },

            login: function(event) {
                event.preventDefault();
                var that = this;
                var form = $(event.target);
                var loginData = new FormData();//document.getElementById('login-form'));
                if($('#login-mode').val() === "credentials"){
                    loginData.append("credential", $("#credential")[0].files[0]);
                }else{
                    loginData.append("username", $('#user').val());
                    loginData.append("password", $('#password').val());
                    loginData.append("sshKey", $("#sshKey")[0].files[0]);
                }

                StudioClient.login(loginData, function() {
                    // on success
                    //set the localStorage['pa.login'] with the user returned from the server
                    StudioClient.setCurrentUser();
                    that.remove();
                    that.options.app.login();
                });
            },

           createCredentials: function(event) {
                event.preventDefault();
                console.log("Not implemented yet!!!");
            },

            showOptions : function () {
                $('#login-option-plus').hide();
                $('#login-option-minus').show();
                $('#login-options').show();
                if($('#login-mode').val() === "basic"){
                    $('#login-credentials').hide();
                    $('#login-basic').show();
                    $('#login-ssh').show();
                }else{
                    $('#login-credentials').show();
                    $('#login-basic').hide();
                }
            },

            hideOptions : function () {
                $('#login-option-minus').hide();
                $('#login-option-plus').show();
                $('#login-options').hide();
                $('#login-credentials').hide();
                $('#login-basic').show();
                $('#login-ssh').hide();
            },

            switchMode : function () {
                if($('#login-mode').val() === "basic"){
                    $('#login-credentials').hide();
                    $('#login-basic').show();
                    $('#login-ssh').show();
                }else{
                    $('#login-credentials').show();
                    $('#login-ssh').hide();
                    $('#login-basic').hide();
                }
            },

            sshOption : function () {
                if($('#login-ssh-checkbox').is(":checked")) {
                    $('#sshKey').show();
                }else{
                    $('#sshKey').hide();
                }
                $('#login-ssh-checkbox').blur();
            },

            fill: function() {
                var user = this.getCookie('user');
                if (user!= "null") {
                    $("#user").val(user);
                }

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

                // get the cookie variable "user"
                var user = this.getCookie('user');

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
                    // Set user input field value to "user" cookie variable if defined
                    // Otherwise, keep the usual browser's behavior (stored credentials, cached login name)
                    that.fill();
                });

                return this;
            }
        })

    }
)