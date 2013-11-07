var SchedulerClient = {

	alert: function(caption, message, type) {
        $.pnotify({
            title: caption,
            text: message,
            type: type,
            text_escape: true,
            opacity: .8,
            width: '20%'
        });
	},

    submit: function (jobXml) {
        var that = this;
        that.send_multipart_request(SchedulerREST + "/submit", jobXml, {"sessionid": localStorage['sessionId']}, function (result) {
            if (result.errorMessage) {
                that.alert("Cannot submit the job", result.errorMessage, 'error');
            } else if (result.id) {
                that.alert("Job submitted", "Successfully submitted " + result.readableName + " with id " + result.id, 'success');
            } else {
                that.alert("Job submission", request.responseText, 'error');
            }
        });
    },

    validate: function (jobXml, jobModel) {
        var that = this;
        that.send_multipart_request(SchedulerREST + "/validate", jobXml, {}, function (result) {

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
                    taskModel.trigger("invalid")
                }
            } else {
                that.alert("Workflow is valid", "It can be executed now", 'success');
            }
            that.lastResult = result;
        })
    },
    resetLastValidationResult: function() {
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
    }
}
