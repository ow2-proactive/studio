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
                    } else {
                        var connectionError = $('<div id="connection-error" class="btn-group pa-tools"><label style="color:red; font-weight:bold; font-size:15px; padding-left:4px; padding-top:4px;">You have been disconnected from the server. Reload the page in order to log into the portal again. </label></div>');
                        if (!$("#connection-error").is(":visible")) {
                            $("#tool-bar").append(connectionError);
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
