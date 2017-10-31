define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                name: "",
                bucket_id: "",
                object_key_values: {}
            },
            getObjectKeyValues: function () {
                try {
                    return this.get('object_key_values');
                } catch (e) {
                    return {};
                }
            },
            getProject: function () {
                try {
                    var project_object = this.getObjectKeyValues().find(function(obj) {
                        return obj.key == "project_name";
                    });
                    if (!project_object)
                        return "";
                    return project_object.value;
                } catch (e) {
                    return "";
                }

            },
            setProject: function (project) {
                var changes_object_key_values =this.getObjectKeyValues();
                var project_object = changes_object_key_values.find(function(obj) {
                    return obj.key == "project_name";
                });
                if (project_object)
                    project_object.value = project;
                this.set('object_key_values', JSON.stringify(changes_object_key_values));
            }
        });
    })
