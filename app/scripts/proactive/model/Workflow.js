define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        var backboneSync = Backbone.sync;

        Backbone.sync = function (method, model, options) {
            options.headers = {
                'sessionid': localStorage['pa.session']
            };
            backboneSync(method, model, options);
        };

        return Backbone.Model.extend({
            defaults: {
                name: "",
                xml: "",
                metadata: ""
            },
            getMetadata: function () {
                try {
                    return JSON.parse(this.get('metadata'));
                } catch (e) {
                    return {};
                }
            },
            getProject: function () {
                return this.getMetadata().project;
            },
            setMetadata: function (metadata) {
                this.set('metadata', JSON.stringify(metadata));
            },
            setProject: function (project) {
                var metadata = this.getMetadata();
                metadata.project = project;
                this.setMetadata(metadata);
            }
        });
})
