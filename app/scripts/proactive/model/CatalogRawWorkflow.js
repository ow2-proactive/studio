define(
[
    'backbone'
],

function (Backbone) {

    "use strict";

    return Backbone.Model.extend({
        defaults: {
            bucket_id : '',
            workflow_name : '',
            callback: ''
        },
        initialize: function(options) {
            this.bucket_id = options.bucket_id;
            this.workflow_name = options.workflow_name;
            this.callback = options.callback;
        },
        url: function() {
            return '/catalog/buckets/' + this.attributes.bucket_id + '/resources/'+this.attributes.workflow_name+'/raw';
        },
        parse: function(data) {
            this.callback(data);
        }
    });
})
