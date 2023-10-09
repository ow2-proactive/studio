define(
    [
        'jquery',
        'backbone',
        'proactive/rest/studio-client',
        'proactive/view/utils/undo',
        'pnotify'
    ],

    function ($, Backbone, StudioClient, undoManager, PNotify) {

        "use strict";

        return Backbone.View.extend({
            initialize: function () {
                this.$el = $("<div></div>");
                $("#logout-view-container").append(this.$el);
                this.render();
                document.getElementById('logout-text').style.width = (document.getElementById('logout-text').offsetWidth + 1) + 'px';
            },
            logout: function () {
                var that = this;
            },
            render: function () {
                var that = this;

                var menu = $('<button class="btn btn-small menu-button btn-default" data-toggle="dropdown">'
                    + '<div id="logout-text">'+localStorage["pa.login"] + '</div>'
                    + '<img src="images/logout_30.png" class="left-padding" style="height:25px; margin: auto;">'
                    +'</button>');

                menu.click(function () {
                    StudioClient.logout();
                    PNotify.removeAll();
                    that.options.app.logout();
                })

                this.$el.html(menu);


                var connectionCheckingTimer;

                function isConnected() {
                    StudioClient.isConnected(function () {
                    }, function () {
                        // failed to login - show login form
                        console.log("Login Required")
                        that.options.app.logout();
                    })
                }

                function tryToConnect() {
                    if (StudioClient.isLoggedIn()) {
                        isConnected()
                        if ($("#login-container").is(":visible")) {
                            StudioClient.setCurrentUser();
                            window.location.reload();
                        }
                    } else {
                        if (!$("#login-container").is(":visible")) {
                            that.options.app.logout();
                            var connectionError = $('<div id="connection-error" style="height: 50px; padding: 15px; border: 1px solid red; background-color: #fff0f0; margin-top: 10px; color:red; font-size:12px; width:100%;">You are logged out of the server. Please log into the portal again.</div>');
                            if (!$("#connection-error").is(":visible")) {
                                $("#login-header").prepend(connectionError);
                            }
                        }
                    }
                }

                function checkConnected() {
                    if (!StudioClient.isLoggedIn()) {
                        isConnected()
                    }
                }

                connectionCheckingTimer = setInterval(tryToConnect, 10000)
                isConnected()
                return this;
            }
        })

    }
)
