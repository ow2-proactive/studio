define(
    [
        'backbone',
        'proactive/model/RestWorkflowXml'
    ],

    function (Backbone, RestWorkflowXml) {

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
            initialize: function() {
                this.set("xml", "XML_NOT_SET_YET");
            },
            get: function (attr) {
                if (attr == 'xml') {
                    this.xml = new RestWorkflowXml({
                        bucket_id: this.get("bucket_id"),
                        workflow_id: this.get("id")
                    });
                    this.xml.fetch();
                    console.log('get ' + attr);
                    console.log(this.xml);
                    return this.xml;
                }
                else {
                    var res = Backbone.Model.prototype.get.call(this, attr);
                    console.log('get ' + attr);
                    console.log(res);
                    return res;
                }
            }
        });
    })
