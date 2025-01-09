define(
    [
        'backbone'
    ],

    function (Backbone) {

        "use strict";

        return Backbone.Model.extend({
            defaults: {
                name: "",
                bucket_name: "",
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
            getName: function () {
                try {
                    var name_object = this.getObjectKeyValues().find(function(obj) {
                        return obj.key == "name";
                    });
                    if (!name_object) {
                        return "";
                    }
                    return name_object.value;
                } catch (e) {
                    return "error while getting workflow name ";
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
