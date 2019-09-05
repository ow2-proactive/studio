define(
    [
        'backbone',
        'proactive/model/ThirdPartyCredential'
    ],

    function (Backbone, ThirdPartyCredential) {

        "use strict";

        return Backbone.Collection.extend({
            model: ThirdPartyCredential,
            initialize: function(options) {
                this.callback = options.callback;
            },
            url: function() {
                return '/rest/scheduler/credentials/';
            },
            parse: function(data) {
                if (this.callback)
                    this.callback(data);
                return data;
            }
        });
    })
