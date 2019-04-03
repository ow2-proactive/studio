define(
    [
        'jquery',
        'proactive/config',
        'pnotify',
        'pnotify.buttons'
    ],

    function($, config, PNotify) {

        "use strict";

        PNotify.prototype.options.styling = "bootstrap3";

        var cachedScripts;

        return {

            alert: function(caption, message, type) {
                var text_escape = message.indexOf("<html>") == -1 ? true : false;

                new PNotify({
                    title: caption,
                    text: message,
                    type: type,
                    text_escape: text_escape,
                    buttons: {
                        closer: true,
                        sticker: false
                    },
                    addclass: 'translucent', // defined in studio.css
                    width: '20%'
                });
            },

/*
 * Need to send a application/multipart-form, need to use the sshKey like this K must be a capital letter.
 *
 * examples from scheduler/portal/login:
 *
 * First login using simply the credentials:
 * ```
 * -----------------------------11455341699611662118707578
 * Content-Disposition: form-data; name="credential"; filename="admin_cred.txt"
 * Content-Type: text/plain
 *
 * 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
 * -----------------------------11455341699611662118707578--
 * ```
 *
 * Second login using username and password, without SSH key.
 *
 * ```
 * -----------------------------106259393478037601194543269
 * Content-Disposition: form-data; name="username"
 *
 * admin
 * -----------------------------106259393478037601194543269
 * Content-Disposition: form-data; name="password"
 *
 * asdfasdf
 * -----------------------------106259393478037601194543269
 * Content-Disposition: form-data; name="sshKey"; filename="admin_cred.txt"
 * Content-Type: text/plain
 *
 * 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
 * -----------------------------106259393478037601194543269--
 * ```
 *
*/
            login: function(creds, onSuccess) {
                var that = this;
                $.ajax({
                    url: config.restApiUrl + "/login",
                    data: creds,
                    cache: false,
                    contentType: false,
                    processData: false,
                    method: 'POST',
                    type: 'POST',
                    success: function(data) {
                        // ProActive Studio login request return invalid json with status code 200
                        console.log("Should not be there", data)
                    },
                    error: function(data) {
                        // even id successful we are here
                        if (data.status == 200) {
                            that.alert("Connected", "Successfully connected user", 'success');
                            localStorage['pa.session'] = data.responseText;
                            return onSuccess();
                        } else {
                            var reason = data.responseText.length > 0 ? data.responseText : "";
                            try {
                                var json = JSON.parse(reason);
                                if (json.errorMessage) {
                                    reason = json.errorMessage;
                                }
                            } catch (e) {}

                            if (data.status == 404) {
                                if (data.responseText.indexOf("login.LoginException") >= 0) {
                                    reason = "Invalid Login or Password";
                                } else {
                                    reason = "The studio rest server is not available at the following url: " + config.restApiUrl;
                                }

                            }

                            that.alert("Cannot connect to ProActive Studio", reason, 'error');
                            console.log("Error", data)
                        }
                    }
                });
            },

            logout: function() {
                var that = this;
                $.ajax({
                    type: "PUT",
                    url: config.restApiUrl + "/logout",
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                    },
                    success: function(data) {
                        console.log("Logged out")
                    },
                    error: function(data) {
                        console.log("Failed to logout", data)
                    }
                });
                localStorage.removeItem("pa.session");
            },

            /* check if session is opened from here or from another tab (scheduler/rm portals) */
            isLoggedIn: function() {
                return localStorage['pa.session'] != null
            },

            isConnected: function(success, fail) {
                var that = this;
                if (localStorage['pa.session']) {
                    $.ajax({
                        type: "GET",
                        url: config.restApiUrl + "/connected",
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                        },
                        success: function(data) {
                            if (data) {
                                console.log("Connected to the studio", data)
                                success()
                            } else {
                                console.log("Not connected to the studio", data)
                                localStorage.removeItem('pa.session');
                                fail()
                            }
                        },
                        error: function(data) {
                            console.log("Not connected to the studio", data)
                            localStorage.removeItem('pa.session')
                            fail()
                        }
                    });
                } else {
                    fail();
                }
            },

            //customize client side, set localStorage['pa.login'] with server username for current session
            setCurrentUser : function () {
                $.ajax({
                    type: 'GET',
                    url: config.restApiUrl + "/currentuser",
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session']);
                    },
                    async: false,
                    success: function(data) {
                        //does not  return a json so even in case of success goes to error callback
                        console.log("Should not be here")
                    },
                    error: function(data) {
                        if (data.status == 200) {
                            // ProActive Studio login request return invalid json with status code 200
                            console.log("Current username is " + data.responseText)
                            localStorage['pa.login'] = data.responseText;
                        }else{
                            console.log("Problems to retrieve current user " + data.responseText)
                        }

                    }
                });
            },

            uploadBinaryFile: function(data, success, error) {
                var that = this;

                $.ajax({
                    url: config.restApiUrl + '/classes',
                    data: data,
                    cache: false,
                    contentType: false,
                    processData: false,
                    type: 'POST',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                    },
                    success: function(data) {
                        console.log("Should not be there", data)
                        error();
                    },
                    error: function(data) {
                        if (data.status == 200) {
                            console.log("Success", data);
                            that.alert("File uploaded", "File successfully uploaded", 'success');
                            success(data.responseText);
                        } else {
                            console.log("Error", data);
                            var reason = "Unknown reason";
                            try {
                                var err = JSON.parse(data.responseText);
                                if (err.errorMessage) {
                                    reason = err.errorMessage;
                                }
                            } catch (e) {}

                            that.alert("Cannot upload a file", reason, 'error');
                            error();
                        }
                    }
                });
            },

            getClassesSynchronously: function() {
                if (!localStorage['pa.session']) return;
                var that = this;

                console.log("Getting classes list")
                var classes = undefined;
                $.ajax({
                    type: "GET",
                    url: config.restApiUrl + "/classes",
                    async: false,
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                    },
                    success: function(data) {
                        classes = data;
                    },
                    error: function(data) {
                        console.log("Cannot retrieve classes", data)
                        that.alert("Cannot retrieve classes", "Please refresh the page!", 'error');
                    }
                });
                return classes;
            },

            submit: function(jobXml) {
                if (!localStorage['pa.session']) return;

                var that = this;

                that.send_multipart_request(config.restApiUrl + "/submit", jobXml, {
                    "sessionid": localStorage['pa.session']
                }, function(result) {
                    that.pausecomp(2000);
                    if (result.errorMessage) {
                        that.alert("Cannot submit the job", result.errorMessage, 'error');
                    } else if (result.id) {
                        that.alert("Job submitted", "<html></html><a href='/scheduler' target='_blank'>'" + result.readableName + "' submitted successfully (Id " + result.id + ")</a></html>", 'success');
                    } else {
                        that.alert("Job submission", request.responseText, 'error');
                    }
                }, true);

            },

            validateWithPopup: function(jobXml, jobModel, automaticValidation) {
                if (!localStorage['pa.session']) return false;

                if (automaticValidation) {
                    if ((jobModel.getTasksCount() == 0)) {
                        return false;
                    }

                }
                var that = this;
                return Boolean([that.send_multipart_request(config.restApiUrl + "/validate", jobXml, {}, function(result) {

                    if (that.lastResult) {

                        // avoiding similar messages in the log history
                        if (that.lastResult.errorMessage == result.errorMessage) {
                            // same error message
                            return false;
                        }
                        if (result.valid && that.lastResult.valid == result.valid) {
                            // valid
                            return true;
                        }
                    }

                    if (!result.valid) {
                        that.alert("Invalid workflow", result.errorMessage, 'error');
                        if (result.taskName != null) {
                            var taskModel = jobModel.getTaskByName(result.taskName);
                            if (taskModel) taskModel.trigger("invalid")
                        }
                        return false;
                    } else {
                        that.alert("Workflow is valid", "It can be executed now", 'success');
                        return true;
                    }
                    that.lastResult = result;
                }, true)]);
            },
            validate: function(jobXml, jobModel) {
                if (!localStorage['pa.session']) return;

                var that = this;
                return that.send_multipart_request(config.restApiUrl + "/validate", jobXml, {}, null, false);
            },
            resetLastValidationResult: function() {
                this.lastResult = undefined;
            },
            send_multipart_request: function(url, content, headers, callback, async) {

                var that = this;

                var request = new XMLHttpRequest();
                var multipart = "";

                request.open("POST", url, async);

                var boundary = Math.random().toString().substr(2);

                request.setRequestHeader("content-type",
                    "multipart/form-data; charset=utf-8; boundary=" + boundary);

                for (var key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        request.setRequestHeader(key, headers[key]);
                    }
                }

                multipart += "--" + boundary +
                    "\r\nContent-Disposition: form-data; name=job.xml" +
                    "\r\nContent-type: application/xml" +
                    "\r\n\r\n" + content + "\r\n";

                multipart += "--" + boundary + "--\r\n";

                if (async) {
                    request.onreadystatechange = function() {
                        if (request.readyState == 4) {
                            try {
                                var result = JSON.parse(request.responseText)
                            } catch (err) {
                                console.log("Cannot parse json response", err)
                                that.alert(request.responseText, 'error');
                                return;
                            }
                            callback(result);
                        }
                    }
                }

                request.send(multipart);

                if (!async) {
                    try {
                        return JSON.parse(request.responseText)
                    } catch (err) {
                        console.log("Cannot parse json response", err)
                        that.alert(request.responseText, 'error');
                        return;
                    }
                }
            },

            pausecomp: function(millis) {
                var date = new Date();
                var curDate = null;
                do {
                    curDate = new Date();
                }
                while (curDate - date < millis);
            }
        }

    })