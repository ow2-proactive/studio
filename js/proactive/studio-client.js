var StudioClient = {

	alert: function(message, type) {
		var alert = $('<div class="alert '+type+'">'+message+'</div>');
		$('#alert-placeholder').empty().append(alert);
	},
	
	login: function(creds, onSuccess) {
		var that = this;
		
		console.log("Authenticating", creds)
		this.alert("Connecting to ProActive Studio at " + creds['url'], 'alert-success')
		
		$.ajax({
		    type : "POST",
		    url : creds['url']+"/login",
		    data : {username:creds['user'], password:creds['pass']},
		    success: function(data) {
		    	// ProActive Studio login request return invalid json with status code 200
		    	console.log("Should not be there", data)
		    },
		    error: function(data) {
		    	// even id successful we are here
		    	if (data.status==200) {
		    		that.alert("Successfully connected to ProActive Studio at " + creds['url'], 'alert-success');
		    		console.log("Session ID is " + data.responseText)
		    		localStorage['sessionId'] = data.responseText;
                    localStorage['user'] = creds['user'];
		    		return onSuccess();
		    	} else {
					var reason = data.responseText.length>0?": "+data.responseText:""; 
					that.alert("Cannot connect to ProActive Studio "+reason, 'alert-error');
					console.log("Error", data)
		    	}
			}
		});		
	},

    isConnected: function(success, fail) {
        if (localStorage['sessionid']) {
            $.ajax({
                type : "GET",
                url : creds['url']+"/connected",
                beforeSend: function(xhr){ xhr.setRequestHeader('sessionid', localStorage['sessionid']) },
                success: function(data) {
                    success()
                },
                error: function() {
                    fail()
                }
            });
        } else {
            fail();
        }
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
