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
            getXml: function() {
                console.log('collection parent:');
                console.log(this.collection);
                console.log('collection parent url:');
                console.log(this.collection.url());

                return $.ajax({
                    url: this.collection.url() + '/' + this.id + '?alt=xml'
                }).done(function (response) {
                    console.log('getXml() raw response:');
                    console.log(response);
                    var strXml = new XMLSerializer().serializeToString(response);
                    console.log('getXml() stringified xml response:');
                    console.log(strXml);
                    return strXml;
                });
            }
        });
    })
