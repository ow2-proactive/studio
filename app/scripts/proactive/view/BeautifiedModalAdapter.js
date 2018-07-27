define(
    [
        'jquery',
        'backbone',
        'pnotify',
        'list',
        'backboneFormsAdapter',
        'StudioApp',
        'bootstrap',
    ],

    function ($, Backbone, PNotify) {

        "use strict";

        // Extension of the bootstrap modal form to operate some cosmetic operations on the form.
        return Backbone.BootstrapModal.extend({

            beautifyForm: function(container) {
                container.find("input").addClass("form-control");
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

                addHelpAfter.after(help);

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