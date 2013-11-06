var StudioClient = {

	alert: function(message, type) {
		var alert = $('<div class="alert '+type+'">'+message+'</div>');
		$('#alert-placeholder').empty().append(alert);
	},
	
	login: function(creds, onSuccess) {
		var that = this;
		
		console.log("Authenticating", creds)
		this.alert("Connecting to ProActive Studio at " + StudioREST, 'alert-success')
		
		$.ajax({
		    type : "POST",
		    url : StudioREST+"/login",
		    data : {username:creds['user'], password:creds['pass']},
		    success: function(data) {
		    	// ProActive Studio login request return invalid json with status code 200
		    	console.log("Should not be there", data)
		    },
		    error: function(data) {
		    	// even id successful we are here
		    	if (data.status==200) {
		    		that.alert("Successfully connected to ProActive Studio at " + StudioREST, 'alert-success');
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
        var that = this;
        that.connected = false;
        if (localStorage['sessionId']) {
            $.ajax({
                type : "GET",
                url : StudioREST+"/connected",
                beforeSend: function(xhr){ xhr.setRequestHeader('sessionid', localStorage['sessionId']) },
                success: function(data) {
                    if (data) {
                        console.log("Connected to the studio", data)
                        that.connected = true;
                        success()
                    } else {
                        console.log("Not connected to the studio", data)
                        fail()
                    }
                },
                error: function(data) {
                    console.log("Not connected to the studio", data)
                    fail()
                }
            });
        } else {
            fail();
        }
    },

    getWorkflowsSynchronously: function() {

        if (!this.connected) return;

        var workflows = undefined;
        console.log("Getting workflows from the server")

        var that = this;
        $.ajax({
            type : "GET",
            url : StudioREST+"/workflows",
            async: false,
            beforeSend: function(xhr){ xhr.setRequestHeader('sessionid', localStorage['sessionId']) },
            success: function(data) {
                workflows = data;
            },
            error: function(data) {
                console.log("Cannot retrieve workflows", data)
                that.alert("Cannot retrieve workflows. Please refresh the page!", 'alert-error');
            }
        });

        console.log("Workflows", workflows)
        return workflows;

    },

    createWorkflowSynchronously: function(workflow) {

        if (!this.connected) return;
        var that = this;

        var id = undefined;

        console.log("Creating workflow on the server", workflow)
        $.ajax({
            type : "POST",
            url : StudioREST+"/workflows",
            async: false,
            data : workflow,
            beforeSend: function(xhr){ xhr.setRequestHeader('sessionid', localStorage['sessionId']) },
            success: function(data) {
                if (data) {
                    console.log("Workflow " + data + " created on the server");
                    that.alert("Workflow with id " + data + " was created on the server", 'alert-success');
                    id = data;
                }
            },
            error: function(data) {
                var reason = data.responseText.length>0?": "+data.responseText:"";
                that.alert("Cannot create workflow. "+reason, 'alert-error');
                console.log("Error", data)
            }
        });

        return id;
    },

    updateWorkflow: function(id, workflow) {

        if (!this.connected || !id) return;
        var that = this;

        console.log("Updating workflow on the server", id, workflow)
        $.ajax({
            type : "POST",
            url : StudioREST+"/workflows/"+id,
            data : workflow,
            beforeSend: function(xhr){ xhr.setRequestHeader('sessionid', localStorage['sessionId']) },
            success: function(data) {
                if (data) {
                    that.alert("Workflow " + workflow.name + " updated on the server", 'alert-success');
                }
            },
            error: function(data) {
                var reason = data.responseText.length>0?": "+data.responseText:"";
                that.alert("Cannot create workflow. "+reason, 'alert-error');
                console.log("Error", data)
            }
        });
    },

    removeWorkflow: function(id) {

        if (!this.connected || !id) return;
        var that = this;

        console.log("Deleting workflow on the server", id)
        $.ajax({
            type : "DELETE",
            url : StudioREST+"/workflows/"+id,
            beforeSend: function(xhr){ xhr.setRequestHeader('sessionid', localStorage['sessionId']) },
            success: function(data) {
                console.log("Workflow with id " + id + " deleted on the server", data)
                that.alert("Workflow with id " + id + " deleted on the server", 'alert-success');
            },
            error: function(data) {
                var reason = data.responseText.length>0?": "+data.responseText:"";
                that.alert("Cannot create workflow. "+reason, 'alert-error');
                console.log("Error", data)
            }
        });
    }
}
