define(
    [
        'backbone',
        'backbone-forms',
    ],

    function(Backbone) {

        "use strict";

        if(Backbone.Form.editors.Base){
            console.log('Backbone.Form.editors.Base loaded !');
        }

        Backbone.Form.editors.Link = Backbone.Form.editors.Base.extend({

            tagName: 'a',
            attributes: {
                'target': '_blank',
                'href': '#'
            },

            events: {
                'change': function() {
                    // The 'change' event should be triggered whenever something happens
                    // that affects the result of `this.getValue()`.
                    this.trigger('change', this);
                },
                'focus': function() {
                    // The 'focus' event should be triggered whenever an input within
                    // this editor becomes the `document.activeElement`.
                    this.trigger('focus', this);
                    // This call automatically sets `this.hasFocus` to `true`.
                },
                'blur': function() {
                    // The 'blur' event should be triggered whenever an input within
                    // this editor stops being the `document.activeElement`.
                    this.trigger('blur', this);
                    // This call automatically sets `this.hasFocus` to `false`.
                }
            },

            initialize: function(options) {
                // Call parent constructor
                Backbone.Form.editors.Base.prototype.initialize.call(this, options);

                // Custom setup code.
                if (this.schema.customParam) this.doSomething();
            },

            render: function() {
                this.setValue(this.value);

                return this;
            },

            getValue: function() {
                return this.$el[0].innerHTML;
            },
            // Value: JSON of name and url, where name is the link name and the url is the value for the href attribute
            setValue: function(value) {
                try {
                    // Parse recieved value
                    var parsedValue = JSON.parse(value);

                    // Set InnerHTML and href
                    if (parsedValue.name.length < 40){
                        this.$el[0].innerHTML = parsedValue.name;
                    }else{
                        this.$el[0].innerHTML= parsedValue.name.substring(0, 37)+ "...";
                    } 
                   
                    this.$el[0].href = parsedValue.url;

                } catch (e) {
                    if (typeof value === "string") {
                        var parsedValue = {
                            name: value,
                            url: value
                        }

                        //var parsedValue = JSON.parse(value);

                        // Set InnerHTML and href
                        if (parsedValue.name.length < 40){
                            this.$el[0].innerHTML = parsedValue.name;
                        }else{
                            this.$el[0].innerHTML= parsedValue.name.substring(0, 37)+ "...";
                        } 
                       
                        this.$el[0].href = parsedValue.url;
                    }else{
                        // console.log('error parsing json', e);
                        // Default Link name: Undefined
                        this.$el[0].innerHTML = 'Undefined';
                    }
                }
            },

            focus: function() {
                if (this.hasFocus) return;
                this.$el.focus();
            },

            blur: function() {
                if (!this.hasFocus) return;

                this.$el.blur();
            }
        });
    });