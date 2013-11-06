var SchedulerClient = {

	alert: function(message, type) {
		var alert = $('<div/>', {class: "alert " + type}).text(message);
		$('#alert-placeholder').empty().append(alert);
	},
	
    submit: function (jobXml) {
        var that = this;
        that.alert("Connecting to the scheduler at " + SchedulerREST, 'alert-success')
        that.send_multipart_request(SchedulerREST + "/submit", jobXml, {"sessionid": localStorage['sessionId']}, function (result) {
            if (result.errorMessage) {
                that.alert(result.errorMessage, 'alert-error');
            } else if (result.id) {
                that.alert("Successfully submitted " + result.readableName + " with id " + result.id, 'alert-success');
            } else {
                that.alert(request.responseText, 'alert-success');
            }
        });
    },

    validate: function (jobXml, jobModel) {
        var that = this;
        that.send_multipart_request(SchedulerREST + "/validate", jobXml, {}, function (result) {
            if (!result.valid) {
                that.alert("Invalid workflow: " + result.errorMessage, 'alert-error');
                if (result.taskName != null) {
                    var taskModel = jobModel.getTaskByName(result.taskName);
                    taskModel.trigger("invalid")
                }
            } else {
                that.alert("Workflow is valid", 'alert-success');
            }
        })
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
                    that.alert(request.responseText, 'alert-error');
                    return;
                }
                callback(result);
            }
        }

        request.send(multipart);
    }
}
