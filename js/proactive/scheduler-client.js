var SchedulerClient = {

	alert: function(message, type) {
		var alert = $('<div class="alert '+type+'">'+message+'</div>');
		$('#alert-placeholder').empty().append(alert);
	},
	
	authenticate: function(creds, onSuccess) {
		var that = this;
		
//		if (this.sessionId) {
//			console.log("Session ID is ", this.sessionId)
//			return onSuccess();
//		}
		
		console.log("Authenticating", creds)
		this.alert("Connecting to the scheduler at " + creds['url'], 'alert-success')
		
		$.ajax({
		    type : "POST",
		    url : creds['url']+"/login",
		    data : {username:creds['user'], password:creds['pass']},
		    success: function(data) {
		    	// scheduler login request return invalid json with status code 200
		    	console.log("Should not be there", data)
		    },
		    error: function(data) {
		    	// even id successful we are here
		    	if (data.status==200) {
		    		that.alert("Successfully connected to the scheduler at " + creds['url'], 'alert-success');
		    		console.log("Session ID is " + data.responseText)
		    		that.sessionId = data.responseText;
		    		return onSuccess();
		    	} else {
					var reason = data.responseText.length>0?": "+data.responseText:""; 
					that.alert("Cannot connect to the scheduler"+reason, 'alert-error');
					console.log("Error", data)
		    	}
			}
		});		
	},
	
	submit: function (creds, jobXml) {
		var that = this;
		
		this.authenticate(creds, function() {
		    var request = new XMLHttpRequest();
		    var multipart = "";
	
			console.log("Submitting", jobXml)
		    request.open("POST",creds['url']+"/submit",true);
	
		    var boundary=Math.random().toString().substr(2);
		    request.setRequestHeader("sessionid", that.sessionId);
		    request.setRequestHeader("content-type",
		                  "multipart/form-data; charset=utf-8; boundary=" + boundary);
		    multipart += "--" + boundary
		               + "\r\nContent-Disposition: form-data; name=job.xml"
		               + "\r\nContent-type: application/xml"
		               + "\r\n\r\n" + jobXml + "\r\n";
		    multipart += "--"+boundary+"--\r\n";
	
		    request.onreadystatechange=function(){
		      try{
		        if(request.readyState==4){
		        	try {
			        	console.log("Response", request)
			        	var result = JSON.parse(request.responseText)
			        	
			        	if (result.errorMessage) {
			        		that.alert(result.errorMessage, 'alert-error');
			        	} else if (result.id) {
			        		that.alert("Successfully submitted " + result.readableName + " with id " + result.id, 'alert-success');
			        	} else {
			        		that.alert(request.responseText, 'alert-success');
			        	}
		        	} catch (err) {
		        		console.log("Cannot parse json response")
		        		that.alert(request.responseText, 'alert-error');
		        	}
		        }
		      }
		      catch(e){}
		    }
	
		    request.send(multipart);
		})
	}
}