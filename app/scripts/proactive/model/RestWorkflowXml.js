define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Model.extend({
            mainUrl: '/workflow-catalog/buckets/',
            initialize: function (options) {
                this.bucket_id = options.bucket_id;
                this.workflow_id = options.workflow_id;
                this.content = undefined;
            },
            url: function () {
                return this.mainUrl + this.bucket_id + '/workflows/' + this.workflow_id + '?alt=xml';
            },
            fetch: function () {
                Backbone.Model.prototype.fetch.call(this, {dataType: 'text'});
            },
            parse: function (response) {
                this.content = response;
                return this.content ;
            }
        });
    })
