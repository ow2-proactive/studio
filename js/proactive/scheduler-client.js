var SchedulerClient = {

	alert: function(message, type) {
		var alert = $('<div class="alert '+type+'">'+message+'</div>');
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

    validate: function (jobXml) {
        var that = this;
//        console.log("Validating", jobXml)
        that.send_multipart_request(SchedulerREST + "/validate", jobXml, {}, function (result) {
            if (!result.valid) {
                that.alert("<p>Invalid workflow:</p>" + result.errorMessage, 'alert-error');
            } else {
                that.alert("Workflow is valid", 'alert-success');
            }
        })
    },

    send_multipart_request: function (url, content, headers, callback) {

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
            try {
                if (request.readyState == 4) {
                    try {
                        console.log("Response", request)
                        var result = JSON.parse(request.responseText)
                        callback(result);
                    } catch (err) {
                        console.log("Cannot parse json response")
                        that.alert(request.responseText, 'alert-error');
                    }
                }
            } catch (e) {
            }
        }

        request.send(multipart);
    }
}
