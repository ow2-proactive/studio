define(
    [
        'jquery',
        'proactive/config',
        'pnotify.core',
        'pnotify.buttons'
    ],

    function ($, config) {

    "use strict";

    var cachedScripts;

    return {

        alert: function (caption, message, type) {
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
                opacity: .8,
                width: '20%'
            });
        },

        login: function (creds, onSuccess) {
            var that = this;

            console.log("Authenticating", creds)

            $.ajax({
                type: "POST",
                url: config.restApiUrl + "/login",
                data: {username: creds['user'], password: creds['pass']},
                success: function (data) {
                    // ProActive Studio login request return invalid json with status code 200
                    console.log("Should not be there", data)
                },
                error: function (data) {
                    // even id successful we are here
                    if (data.status == 200) {
                        that.alert("Connected", "Successfully connected", 'success');
                        console.log("Session ID is " + data.responseText)
                        localStorage['pa.session'] = data.responseText;
                        localStorage['pa.login'] = creds['user'];
                        return onSuccess();
                    } else {
                        var reason = data.responseText.length > 0 ? data.responseText : "";
                        try {
                            var json = JSON.parse(reason);
                            if (json.errorMessage) {
                                reason = json.errorMessage;
                            }
                        } catch (e) {}
                        that.alert("Cannot connect to ProActive Studio", reason, 'error');
                        console.log("Error", data)
                    }
                }
            });
        },

        logout: function () {
            var that = this;
            $.ajax({
                type: "PUT",
                url: config.restApiUrl + "/logout",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                },
                success: function (data) {
                    console.log("Logged out")
                },
                error: function (data) {
                    console.log("Failed to logout", data)
                }
            });
            localStorage.removeItem("pa.session");
        },

        /* check if session is opened from here or from another tab (scheduler/rm portals) */
        isLoggedIn: function () {
            return localStorage['pa.session'] != null
        },

        isConnected: function (success, fail) {
            var that = this;
            if (localStorage['pa.session']) {
                $.ajax({
                    type: "GET",
                    url: config.restApiUrl + "/connected",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                    },
                    success: function (data) {
                        if (data) {
                            console.log("Connected to the studio", data)
                            success()
                        } else {
                            console.log("Not connected to the studio", data)
                            localStorage.removeItem('pa.session');
                            fail()
                        }
                    },
                    error: function (data) {
                        console.log("Not connected to the studio", data)
                        localStorage.removeItem('pa.session')
                        fail()
                    }
                });
            } else {
                fail();
            }
        },

        getScriptsSynchronosly: function () {
            if (!localStorage['pa.session']) return;
            var that = this;

            console.log("Getting scripts")
            $.ajax({
                type: "GET",
                url: config.restApiUrl + "/scripts",
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                },
                success: function (data) {
                    cachedScripts = data;
                },
                error: function (data) {
                    console.log("Cannot retrieve scripts", data)
                    that.alert("Cannot retrieve scripts", "Please refresh the page!", 'error');
                }
            });
            return cachedScripts;
        },

        saveScriptSynchronously: function (name, content) {

            if (!localStorage['pa.session']) return;
            var that = this;

            var id = undefined;

            console.log("Saving script:", name)

            $.ajax({
                type: "POST",
                url: config.restApiUrl + "/scripts/" + name,
                data: {name: name, content: content},
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                },
                success: function (data) {
                    console.log("Should not be there", data)
                },
                error: function (data) {
                    if (data.status == 200) {
                        if (data) {
                            that.alert("Script updated", "Script " + name + " updated on the server", 'success');
                            that.getScriptsSynchronosly()
                        }
                    } else {
                        var reason = data.responseText.length > 0 ? ": " + data.responseText : "";
                        that.alert("Cannot save script", reason, 'error');
                        console.log("Error", data)
                    }
                }
            });

            return id;

        },

        listScripts: function () {
            this.getScriptsSynchronosly();
            return _.map(cachedScripts,function (script) {
                return script.name;
            }).sort()
        },

        getScript: function (name) {
            console.log("Loading script:", name)
            return _.find(cachedScripts, function (script) {
                return name === script.name;
            });
        },

        uploadBinaryFile: function (data, success, error) {
            var that = this;

            $.ajax({
                url: config.restApiUrl + '/classes',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                type: 'POST',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                },
                success: function (data) {
                    console.log("Should not be there", data)
                    error();
                },
                error: function (data) {
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
                        } catch (e) {
                        }

                        that.alert("Cannot upload a file", reason, 'error');
                        error();
                    }
                }
            });
        },

        getClassesSynchronously: function () {
            if (!localStorage['pa.session']) return;
            var that = this;

            console.log("Getting classes list")
            var classes = undefined;
            $.ajax({
                type: "GET",
                url: config.restApiUrl + "/classes",
                async: false,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                },
                success: function (data) {
                    classes = data;
                },
                error: function (data) {
                    console.log("Cannot retrieve classes", data)
                    that.alert("Cannot retrieve classes", "Please refresh the page!", 'error');
                }
            });
            return classes;
        },

        submit: function (jobXml, visualization) {
            if (!localStorage['pa.session']) return;

            var that = this;
            that.send_multipart_request(config.restApiUrl + "/submit", jobXml, {"sessionid": localStorage['pa.session']}, function (result) {
                if (result.errorMessage) {
                    that.alert("Cannot submit the job", result.errorMessage, 'error');
                } else if (result.id) {
                    that.alert("Job submitted", "<html></html><a href='/scheduler' target='_blank'>Successfully submitted " + result.readableName + " with id " + result.id +"</a></html>", 'success');
                    that.setVisualization(result.id, visualization);
                } else {
                    that.alert("Job submission", request.responseText, 'error');
                }
            });
        },

        validate: function (jobXml, jobModel) {
            if (!localStorage['pa.session']) return;

            var that = this;
            that.send_multipart_request(config.restApiUrl + "/validate", jobXml, {}, function (result) {

                if (that.lastResult) {

                    // avoiding similar messages in the log history
                    if (that.lastResult.errorMessage == result.errorMessage) {
                        // same error message
                        return;
                    }
                    if (result.valid && that.lastResult.valid == result.valid) {
                        // valid
                        return;
                    }
                }

                if (!result.valid) {
                    that.alert("Invalid workflow", result.errorMessage, 'error');
                    if (result.taskName != null) {
                        var taskModel = jobModel.getTaskByName(result.taskName);
                        if (taskModel) taskModel.trigger("invalid")
                    }
                } else {
                    that.alert("Workflow is valid", "It can be executed now", 'success');
                }
                that.lastResult = result;
            })
        },
        resetLastValidationResult: function () {
            this.lastResult = undefined;
        },
        send_multipart_request: function (url, content, headers, callback) {

            var that = this;

            var request = new XMLHttpRequest();
            var multipart = "";

            request.open("POST", url, true);

            var boundary = Math.random().toString().substr(2);

            request.setRequestHeader("content-type",
                "multipart/form-data; charset=utf-8; boundary=" + boundary);

            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    request.setRequestHeader(key, headers[key]);
                }
            }

            multipart += "--" + boundary
                + "\r\nContent-Disposition: form-data; name=job.xml"
                + "\r\nContent-type: application/xml"
                + "\r\n\r\n" + content + "\r\n";

            multipart += "--" + boundary + "--\r\n";

            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    console.log("Response", request)
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

            request.send(multipart);
        },

        setVisualization: function (jobId, visualization) {
            var that = this;

            $.ajax({
                url: config.restApiUrl + '/visualizations/' + jobId,
                data: {visualization: visualization},
                type: 'POST',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('sessionid', localStorage['pa.session'])
                },
                success: function (data) {
                    console.log("Success", data)
                },
                error: function (data) {
                    console.log("Error", data);
                }
            });
        }
    }

})
