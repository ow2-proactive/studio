define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                id: "",
                name: "",
                variables: [],
                generic_information: [],
                created_at: "",
                revision_id: "",
                bucket_id: "",
                project_name: "",
                layout: ""
            },
            save: function (attrs, options) {

                var payload = new FormData();
                var blob = new Blob([options.xmlContent], { type: "text/xml" });
                payload.append('file', blob);

                // TODO add the layout as a query parameter

                console.log('sending save request');

                return $.ajax({
                    url: this.collection.url(),
                    type: 'POST',
                    contentType: false,
                    processData: false,
                    cache: false,
                    data: payload
                }).success(function (response) {
                    console.log('sending save request SUCCEEDED');
                    console.log(response);
                    return this;
                });
            },
            getXml: function() {
                console.log('collection parent:');
                console.log(this.collection);
                console.log('collection parent url:');
                console.log(this.collection.url());

                return $.ajax({
                    url: this.collection.url() + '/' + this.id + '?alt=xml'
                }).done(function (response) {
                    return new XMLSerializer().serializeToString(response);
                });
            }
        });
    })
