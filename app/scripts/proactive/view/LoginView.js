define(
    [
        'underscore',
        'jquery',
        'backbone',
        'proactive/rest/studio-client',
        'text!proactive/templates/login-template.html'
    ],

    function(_, $, Backbone, StudioClient, loginTemplate) {

        "use strict";
        var connectionCheckingTimer;

        return Backbone.View.extend({
            template: _.template(loginTemplate),

            initialize: function() {
                this.render();
                if (Backbone.history.location.hostname === 'try.activeeon.com'|| Backbone.history.location.hostname === 'azure-try.activeeon.com')
                    $("#login-container").append("<a href='https://www.activeeon.com/register/web-download' target='_blank'>Or create an account</a>");
                this.connectionCheckingTimer = setInterval(this.isSessionPresent, 10000);
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

            isSessionPresent: function() {
                if (StudioClient.isLoggedIn()) {
                    if ($("#login-container").is(":visible")) {
                        var isConnectedUrl = StudioClient.getIsConnectedUrl();
                        $.ajax({
                            type: "GET",
                            url: isConnectedUrl,
                            beforeSend: function(xhr) {
                                xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                            },
                            success: function(data) {
                                if (data) {
                                    StudioClient.setCurrentUser();
                                    window.location.reload();
                                    clearInterval(this.connectionCheckingTimer);
                                    this.connectionCheckingTimer = null;
                                } else {
                                    localStorage.removeItem('pa.session');
                                }
                            },
                            error: function(data) {
                                localStorage.removeItem('pa.session');
                            }
                        });
                    }
                }
            },

            login: function(event) {
                event.preventDefault();
                var that = this;
                var form = $(event.target);
                var loginData = new FormData();//document.getElementById('login-form'));
                if ($('#login-mode').val() === "credentials") {
                    loginData.append("credential", $("#credential")[0].files[0]);
                } else {
                    var username = $('#user').val();
                    var domain = $('#domain-mode').val();
                    if(domain) {
                        username = $('#domain-mode').val() + "\\" + $('#user').val();
                    }
                    loginData.append("username", username);
                    loginData.append("password", $('#password').val());
                    if ($("#sshKey")[0].files[0]) {
                        loginData.append("sshKey", $("#sshKey")[0].files[0]);
                    }
                }

                StudioClient.login(loginData, function() {
                    // on success
                    //set the localStorage['pa.login'] with the user returned from the server
                    StudioClient.setCurrentUser();
                    that.remove();
                    that.options.app.login();
                    that.showHideShortcuts();
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
                if($('#login-mode').val() === "standard"){
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
                if($('#login-mode').val() === "standard"){
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
                var domain = null;
                if (user && user.includes("\\")) {
                    var domainUsername = user.split("\\");
                    domain = domainUsername[0];
                    user = domainUsername[1];
                }
                if (user!= "null") {
                    $("#user").val(user);
                }
                if (domain !== null) {
                    $("#domain-mode").val(domain);
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

            showHideShortcuts: function() {
                var authorizedPortals = StudioClient.getPortalsAuthorizations();
                if (authorizedPortals) {
                    if (_.intersection(authorizedPortals, ["catalog-portal","workflow-execution","service-automation","job-analytics","job-gantt","node-gantt","job-planner-calendar-def","job-planner-calendar-def-workflows","job-planner-execution-planning","job-planner-gantt-chart","notification-portal"]).length > 0) {
                        $('#automation-dashboard-shortcut').show();
                    } else {
                        $('#automation-dashboard-shortcut').hide();
                    }
                    if (_.contains(authorizedPortals, "scheduler")) {
                        $('#scheduler-portal-shortcut').show();
                    } else {
                        $('#scheduler-portal-shortcut').hide();
                    }
                    if (_.contains(authorizedPortals, "rm")) {
                        $('#rm-portal-shortcut').show();
                    } else {
                        $('#rm-portal-shortcut').hide();
                    }
                }
            },

            render: function() {
                var that = this;
                that.$el = $(that.template());
                var domains = StudioClient.getDomains();
                var user =  this.getCookie('user') ? this.getCookie('user') : localStorage['pa.login'];
                var userName = '';
                var domainName = '';

                if (user) {
                    var userData = user.split("\\");
                    if (userData.length > 1) {
                        domainName = userData[0];
                        userName = userData[1];
                    } else {
                        userName = userData[0];
                    }
                }

                $('body').append(that.$el).show();

                StudioClient.isConnected(function() {
                    // logged in successfully - show user name
                    console.log("Logged in");
                    that.remove();
                    that.options.app.login();
                    that.showHideShortcuts();
                    $('body').show();
                }, function() {
                    // failed to login - show login form
                    console.log("Login Required");

                    $('body').show();
                    // Set user input field value to "user" cookie variable if defined
                    // Otherwise, keep the usual browser's behavior (stored credentials, cached login name)
                    that.fill();
                });
                if (domains.length !== 0) {
                    var domainOptionString = '<div class="form-group"><label class="control-label">Domain | Tenant: </label><select id="domain-mode" name="domain-mode" class="controls font-size-11" style="width:170px;">';
                    for(var i = 0; i < domains.length ; i++) {
                        domainOptionString = domainOptionString + '<option value="' + domains[i] + '">' +  new String(domains[i]) + '</option>';
                    }
                    domainOptionString = domainOptionString + '</select></div>';
                    var domainOption = $(domainOptionString);
                    $("#login-basic").prepend(domainOption);

                    if (domainName && domains.includes(domainName)) {
                        $('#domain-mode').val(domainName);
                    }
                } else {
                    var domainOption = $('<div class="form-group"><label class="control-label">Domain | Tenant: </label><select id="domain-mode" name="domain-mode" disabled="disabled" class="controls font-size-11" style="width:170px;"> </select></div>');
                    $("#login-options").append(domainOption);
                }

                if (userName) {
                    $('#user').val(userName);
                }
                return this;
            }
        })

    }
)