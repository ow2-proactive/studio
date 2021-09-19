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
        //This method is used for the imported job xml
        populateSchema: function (obj, merging) {
            this.populateSchemaOrTemplate.call(this, obj, merging, false);
        },

        populateSchemaOrTemplate: function (obj, merging, isTemplate) {
            var that = this;
            // change this to true to display in the console the model parsing
            var logEnabled = false;

            var selectedNestedModel = null;
            var radioButtonNestedModelOptions = [];

            var isCurrentSelectedNestedModelIfRequired = function(selectedModel, modelOptions, currentProperty) {
                // returns true if the current schema does not use a TaskTypeRadioEditor,
                // if the current property/model is not part of the radio editor choice,
                // or if the current property/model is the selected choice.
                return (selectedModel == null || modelOptions == null || modelOptions.indexOf(currentProperty) < 0 || currentProperty === selectedModel)
            }


            for (var prop in this.schema) {
                if (this.schema[prop] && this.schema[prop].fieldAttrs && this.schema[prop].fieldAttrs.placeholder) {

                    var placeholder = this.schema[prop].fieldAttrs.placeholder;

                    if (this.schema[prop].type && this.schema[prop].type == 'List') {
                        var currentElements = this.get(prop) || [];
                        var newElements = [];
                        var value = this.getValue(placeholder, obj);
                        if (value) {
                            if (prop == "Node Selection" && Array.isArray(value.script)) {
                                value = value.script.map(function(val){
                                            return { script: val}
                                        })
                            } else if (!Array.isArray(value)) {
                                value = [value];
                            }

                            $.each(value, function(i, v) {
                                var listElemValue = that.getListElementValue(that.schema[prop], v)
                                if (listElemValue) {
                                    newElements.push(listElemValue)
                                } else if (placeholder === "arguments->argument" || placeholder === "file->arguments->argument") {
                                    newElements.push(listElemValue)
                                }
                            })

                            // In the case where we have duplicated variables, we privilege the previous variables and delete the new variables
                            if(placeholder === "variables->variable"){
                                if(value && currentElements.length && newElements.length){
                                    var dupElementIndex = -1;
                                    currentElements.forEach(function(variable){
                                        dupElementIndex = newElements.findIndex(function(vr){return variable.Name === vr.Name});
                                        if(  dupElementIndex !== -1){
                                            newElements.splice(dupElementIndex, 1);
                                        }
                                    })
                                }
                            }

                            if (placeholder === "arguments->argument" || placeholder === "file->arguments->argument") {
                                this.set(prop, currentElements.concat(newElements));
                            } else {
                                this.set(prop, this._mergeListsRemovingDuplicates(currentElements, newElements));
                            }
                        }
                    } else if (this.schema[prop].type && this.schema[prop].type == 'TaskTypeRadioEditor') {
                        // the radio editor model specifies a ordered choice placeholder separated by |
                        // each choice corresponds to one NestedModel named after the radio button values
                        // for example, if placeholder is "code|file" and radio values are ScriptCode, ScriptFile
                        // it means that when the "code" tag is present, the ScriptCode nested model will be populated
                        var choicePlaceholders = placeholder.split("|");
                        for (var i in choicePlaceholders) {
                            var choicePh = choicePlaceholders[i];
                            var value = this.getValue(choicePh, obj);
                            if (value) {
                                this.set(prop, this.schema[prop].options[i].val);
                                // in the current schema, only the following NestedModel will be populated.
                                selectedNestedModel = this.schema[prop].options[i].val;
                                radioButtonNestedModelOptions = this.schema[prop].options.map( elem => elem.val);
                            }
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
                                    // looking for a field in the value matching select options
                                    if (this.schema[prop].fieldAttrs.strategy && this.schema[prop].fieldAttrs.strategy == 'checkpresence') {
                                        if (value) {
                                            that.set(prop, "true")
                                        }
                                    } else {
                                        $.each(this.schema[prop].options, function(i, option) {
                                            if (value[option] || value[option.val]) {
                                                that.set(prop, option.val ? option.val : option)
                                                return false;
                                            }
                                        });
                                    }
                                } else if (this.schema[prop].type == "NestedModel" &&
                                    isCurrentSelectedNestedModelIfRequired(selectedNestedModel, radioButtonNestedModelOptions, prop)) {
                                    var model = new this.schema[prop].model();
                                    model.populateSchema(value)
                                    that.set(prop, model)
                                }
                            } else {
                                if (isTemplate && merging && that.get(prop) && typeof that.get(prop) == 'string' && that.get(prop).toLowerCase().includes('untitled workflow')){
                                    value = value.trim()
                                    that.set(prop, value)
                                }
								else if (this.hasOwnProperty("isDragAndDrop") && this.isDragAndDrop && (prop == "PositionTop" || prop == "PositionLeft")) {
                                    // skip absolute positions when doing drap/drop
                                }
								else if (prop == "PositionTop" || prop == "PositionLeft") {
									// convert position to float
                                    value = value.trim()
                                    that.set(prop, parseFloat(value))
                                }
                                else if (isTemplate && merging && that.get(prop)) {
                                    // do not override existing value when merging
                                }
                                else {
                                    value = value.trim()
                                    if (this.schema[prop].type && this.schema[prop].type == "Checkbox") {
                                        that.set(prop, value === true || value === "true")
                                    } else {
                                        that.set(prop, value)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },

        //This method is used for the templates
        populateTemplate: function (obj, merging) {
            this.populateSchemaOrTemplate.call(this, obj, merging, true);
        },
        _mergeListsRemovingDuplicates: function (a, b) {
            return _.uniq(a.concat(b), false, JSON.stringify);
        },
        mergeObjectsPreserveOrder: function (original, overriding) {
            var answer = {};
            for (var key in original) {
               if (original.hasOwnProperty(key) && overriding.hasOwnProperty(key)) {
                  answer[key] = overriding[key];
               } else if (original.hasOwnProperty(key)) {
                    answer[key] = original[key];
               }
            }
            for (var key in overriding) {
               if (overriding.hasOwnProperty(key) && original.hasOwnProperty(key)) {
                  // was treated by previous loop
               } else if (overriding.hasOwnProperty(key)) {
                    // append new properties at the end
                    answer[key] = overriding[key];
               }
            }
            return answer;
        }
    });
    return SchemaModel;
})