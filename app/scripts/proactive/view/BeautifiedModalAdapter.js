define(
    [
        'jquery',
        'backbone',
        'pnotify',
        'proactive/config',
        'autoComplete',
        'list',
        'backboneFormsAdapter',
        'StudioApp',
        'bootstrap',
    ],

    function ($, Backbone, PNotify, config, autoComplete) {

        "use strict";

        // Extension of the bootstrap modal form to operate some cosmetic operations on the form.
        return Backbone.BootstrapModal.extend({

            beautifyForm: function(container) {
                container.find("input").addClass("form-control");
                container.find(":radio").removeClass("form-control");
                container.find("select").addClass("form-control");
                container.find("textarea").addClass("form-control");
                container.find("button").addClass("btn").addClass("btn-default");
                container.find("button[data-action='add']").addClass("btn").addClass("btn-success");
                container.find("button[data-action='remove']").addClass("btn").addClass("btn-danger");

                // adding help info
                var that = this;
                container.find("[data-help]").each(function() {
                    that.addHelpTooltip($(this))
                })
                // adding auto-complete
                container.find("input").each(function() {
                    that.addAutoComplete($(this))
                })
                // adding auto-complete for variable model
                container.find("textarea").each(function() {
                    that.addAutoComplete($(this))
                })

            },
            addAutoComplete: function(el) {
                if (el.hasClass("jobGenericInfo")) {
                    var configAC = config.autoCompleteJobGenericInfo;
                    configAC.selector = function() { return el[0]};
                    var autoCompleteJS = new autoComplete(configAC);
                    autoCompleteJS.init();
                } else if (el.hasClass("taskGenericInfo")) {
                    var configAC = config.autoCompleteTaskGenericInfo;
                    configAC.selector = function() { return el[0]};
                    var autoCompleteJS = new autoComplete(configAC);
                    autoCompleteJS.init();
                } else if (el.attr("id") === "Model") {
                    var configAC = config.autoCompleteVariableModel;
                    configAC.selector = function() { return el[0]};
                    var autoCompleteJS = new autoComplete(configAC);
                    autoCompleteJS.init();
                }
            },
            addHelpTooltip: function(el) {

                var help = $("<span class='glyphicon glyphicon-info-sign pointer help-sign' data-toggle='tooltip' data-placement='right' title='"+el.attr("data-help")+"'></span>")
                help.tooltip({html: true});

                var addHelpAfter = el.find("label:first")

                if (addHelpAfter.length==0) {
                    addHelpAfter = el.parents(".panel").find(".panel-heading a");
                } else if (addHelpAfter.hasClass("checkbox")) {
                    addHelpAfter = addHelpAfter.find("input:last");
                }
                // if already exist - remove it (see tricky case for control flows in tasks)
                var next = addHelpAfter.next();
                if (next && next.hasClass("help-sign")) {
                    next.remove();
                }

                if (el.attr("data-help-self") === "") {
                    if (el.attr("data-help").length > 0) {
                        el.attr("data-placement", "top")
                        el.attr("data-toggle", "tooltip")
                        el.attr("title", el.attr("data-help"))
                        el.tooltip({html: true, "trigger": "hover focus click"});
                    }
                } else if (el.attr("data-help-self-noclick") === "") {
                    if (el.attr("data-help").length > 0) {
                        el.attr("data-placement", "top")
                        el.attr("data-toggle", "tooltip")
                        el.attr("title", el.attr("data-help"))
                        el.tooltip({html: true, "trigger": "hover focus"});
                    }
                } else {
                    addHelpAfter.after(help);
                }

            },
            /**
             * Creates the DOM element
             *
             * @api private
             */
            render: function() {
              var $el = this.$el,
                  options = this.options,
                  content = options.content;
              options.modalOptions = {backdrop : 'static'};

              //Create the modal container
              $el.html(options.template(options));

              var $content = this.$content = $el.find('.modal-body');

              //Insert the main content if it's a view
              if (content.$el) {
                content.render();
                $el.find('.modal-body').html(content.$el);
                this.beautifyForm(content.$el);
              }

              if (options.animate) $el.addClass('fade');

              this.isRendered = true;

              return this;
            }

        });
    }
)