define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/model/CatalogWorkflowCollection'
    ],

    function ($, Backbone, config, CatalogWorkflowCollection) {

        "use strict";

        return Backbone.View.extend({

        initialize: function () {
            this.$el = $("<div></div>")
            $("#palette-container").append(this.$el);

            this.options.templates.on('add', this.render, this);
            this.options.templates.on('remove', this.render, this);
            this.options.templates.on('reset', this.render, this);
            this.options.templates.fetch();
        },
        changeTemplates : function (bucket_id) {
            this.options.templates =  new CatalogWorkflowCollection({id : bucket_id});
            this.options.templates.fetch();
        },
        createMenuFromConfig: function (template, menu) {
            var that = this;

            for (var property in template) {
                if (template.hasOwnProperty(property)) {
                    if (typeof template[property] == "object") {
                        var header = $('<li role="presentation" class="dropdown-header">'+property+'</li>');
                        menu.append(header);

                        this.createMenuFromConfig(template[property], menu);
                    } else {
                    	var iconName = property.replace(/\s+/g, '');
                        var subMenu = $('<li id="'+property+'" class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me"><a class="" href="#" onclick="return false;"><img src="images/'+iconName+'.png"  style="width:20px;height:20px;">&nbsp;&nbsp;'+property+' </a></li>');
                        subMenu.tooltip();
                        menu.append(subMenu);
                        subMenu.data("templateName", property);
                        subMenu.data("templateUrl", template[property]);
                        subMenu.draggable({helper: "clone", scroll: true, distance:0});
                    }
                }
            }
        },
        pinUnpin : function(e){
            var menuElement = $(this).parent().parent();
            var keepFromClosing = function(event){
                return false;
            };
            if(!menuElement.hasClass('pinned')){ //not pinned yet
                menuElement.addClass('pinned');
                menuElement.bind('hide.bs.dropdown', keepFromClosing);
                $(this).html('<span class="glyphicon glyphicon-pushpin"></span> Unpin');
            } else { //pinned
                menuElement.removeClass('pinned');
                menuElement.unbind('hide.bs.dropdown', keepFromClosing);
                menuElement.removeClass('open');//close the dropdown
                $(this).html('<span class="glyphicon glyphicon-pushpin"></span> Pin open');
            }
        },
        setPin : function(menu){
            var pinOpen = $('<li role="presentation" class="dropdown-header"><span class="glyphicon glyphicon-pushpin"></span> Pin open</li>');
            pinOpen.on('click', this.pinUnpin);
            menu.append(pinOpen);
        },
        initMenu: function(menu, config) {
            menu.draggable({helper: "original", distance : 20});
            var menuContent = $('<ul class="dropdown-menu templates-menu" role="menu" aria-labelledby="dropdown-templates-menu"></ul>');
            this.setPin(menuContent);
            this.createMenuFromConfig(config, menuContent);
            menu.append(menuContent);
        },
        render: function () {
            this.$el.html('');
            var that = this;
            var taskWidget = $(
                '<span ><span id="task-menu" class="label job-element job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="30px" type="button" >Tasks <span class="caret"></span></span></span>');

            this.initMenu($(taskWidget), config.tasks);

            var manualWidget = $(
                '<span ><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Manuals <span class="caret"></span></span></span>');

            this.initMenu($(manualWidget), config.manuals);

            var controlWidget = $(
                '<span ><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Controls <span class="caret"></span></span></span>');

            this.initMenu($(controlWidget), config.controls);

            var templateWidget = $(
                '<span ><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Templates <span class="caret"></span></span></span>');
            templateWidget.draggable({helper: "original", distance : 20});
            var menuContent = $('<ul class="dropdown-menu templates-menu" role="menu" aria-labelledby="dropdown-templates-menu"></ul>');
            this.setPin(menuContent);
            $(templateWidget).append(menuContent);

            this.options.templates.groupByProject(function (project, templates) {
                var header = $('<li role="presentation" class="dropdown-header">'+project+'</li>');
                menuContent.append(header);
                _.each(templates, function(template) {
                    if (template.get("name")) {
                        var menuItem = $('<li class="sub-menu draggable ui-draggable job-element" data-toggle="tooltip" data-placement="right" title="Drag&nbsp;&&nbsp;drop&nbsp;me"><a class="" href="#" onclick="return false;">' + template.get("name") + '</a></li>');
                        menuItem.tooltip();
                        menuContent.append(menuItem);
                        menuItem.data("templateName", template.get("name"));
                        menuItem.draggable({helper: "clone", scroll: true});

                        menuItem.click(function(event) {
                            // simulating drag and drop of this element
                            var workflowView = that.options.app.views.workflowView
                            workflowView.dropElement(event, {draggable:this, offset: {left: event.pageX, top: event.pageY}})
                        })
                    }
                })
            }, this);

            this.$el.append(taskWidget).append(manualWidget).append(controlWidget).append(templateWidget);
        }
    })

})
