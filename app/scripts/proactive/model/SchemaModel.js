define(
    [
        'backbone'
    ],

    function (Backbone) {

    "use strict";

        // populates model according to the schema (xml import)
    // it uses placeholder of the model schema to find values in xml
    var SchemaModel = Backbone.Model.extend({

        getValue: function (placeholder, obj) {
            if (!placeholder) return;
            placeholder = placeholder.split("->");
            var val = obj;
            for (var i in placeholder) {
                var ph = placeholder[i];
                if (val[ph]) {
                    val = val[ph];
                } else {
                    val = undefined;
                    break;
                }
            }
            return val;
        },
        getListElementValue: function (listSchema, listElemObj) {

            if (listSchema.model) {
                var model = new listSchema.model();
                model.populateSchema(listElemObj)
                return model.toJSON();
            } else if (listSchema.subSchema) {
                var model = new SchemaModel();
                model.schema = listSchema.subSchema;
                model.populateSchema(listElemObj)
                return model.toJSON();
            } else {
                return this.getValue(listSchema.fieldAttrs.itemplaceholder, listElemObj);
            }
        },convertCancelJobOnErrorToOnTaskError: function (obj) {
            if (obj["@attributes"]['cancelOnJobError'] && obj["@attributes"]['cancelOnJobError']  == "true") {
                this.set("On Task Error Policy", "cancelJob")
            }
        },
        populateSchema: function (obj, merging) {
            var that = this;

            for (var prop in this.schema) {
                if (this.schema[prop] && this.schema[prop].fieldAttrs && this.schema[prop].fieldAttrs.placeholder) {

                    var placeholder = this.schema[prop].fieldAttrs.placeholder;

                    if (this.schema[prop].type && this.schema[prop].type == 'List') {
                        var currentElements = this.get(prop) || [];
                        var newElements = [];
                        var value = this.getValue(placeholder, obj);
                        if (value) {
                            if (!Array.isArray(value)) {
                                value = [value];
                            }
                            $.each(value, function (i, v) {
                                var listElemValue = that.getListElementValue(that.schema[prop], v)
                                if (listElemValue) {
                                    newElements.push(listElemValue)
//                                    console.log("Adding to list", prop, listElemValue)
                                }
                            })
                            this.set(prop, this._mergeListsRemovingDuplicates(currentElements, newElements));
                        }
                    } else {
                        var value = null;
                        if (!value && placeholder instanceof Array) {
                            for (var ph in placeholder) {
                                value = this.getValue(placeholder[ph], obj)
                                if (value) {
                                    break;
                                }
                            }
                        } else {
                            var value = this.getValue(placeholder, obj);
                        }
                        if (value) {
                            if (typeof value === 'object') {
                                if (this.schema[prop].type == "Select") {
                                    // looking for a filed in the value matching select options
                                    if (this.schema[prop].fieldAttrs.strategy && this.schema[prop].fieldAttrs.strategy == 'checkpresence') {
                                        if (value) {
//                                            console.log("Setting", prop, "from", placeholder, "to", "true")
                                            that.set(prop, "true")
                                        }
                                    } else {
                                        $.each(this.schema[prop].options, function (i, option) {
                                            if (value[option] || value[option.val]) {
//                                                console.log("Setting", prop, "from", placeholder, "to", option.val ? option.val : option)
                                                that.set(prop, option.val ? option.val : option)
                                                return false;
                                            }
                                        });
                                    }
                                } else if (this.schema[prop].type == "NestedModel") {
                                    var model = new this.schema[prop].model();
                                    model.populateSchema(value)
//                                    console.log("Setting", prop, "from", placeholder, "to", model)
                                    that.set(prop, model)
                                } else {
                                    console.log("Should no be here", prop, value);
                                }
                            } else {
                                if (merging && that.get(prop)) {
                                    // do not override existing value when merging, except for workflow name
                                } else {
//                                    console.log("Setting", prop, "from", placeholder, "to", value)
                                    value = value.trim()
                                    that.set(prop, value)
                                }
                            }
                        }
                    }
                }
            }
        },
        _mergeListsRemovingDuplicates: function (a, b) {
            return _.uniq(a.concat(b), false, JSON.stringify);
        }
    });
    return SchemaModel;
})
