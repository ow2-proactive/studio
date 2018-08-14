define(
    [
        'backbone',
        'proactive/model/CatalogRestObject'
    ],

    function (Backbone, RestObject) {

        "use strict";

        return Backbone.Collection.extend({
            model: RestObject,
            initialize: function(options) {
                this.bucketname = options.bucketname;
                this.name = options.name;
                this.callback = options.callback;
            },
            url: function() {
                return '/catalog/buckets/' + this.bucketname + '/resources/' + this.name + '/';
            },
            parse: function(data) {
            	this.callback(data);
                return data;
            }
        });
    })
