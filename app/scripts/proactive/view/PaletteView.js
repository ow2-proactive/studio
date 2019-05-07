define(
    [
        'jquery',
        'backbone',
        'proactive/config',
        'proactive/model/CatalogWorkflowCollection',
        'proactive/rest/studio-client'
    ],

    function ($, Backbone, config, CatalogWorkflowCollection, StudioClient) {

        "use strict";

        return Backbone.View.extend({

        initialize: function () {
            this.$el = $("<div></div>");
            $("#palette-container-div").append(this.$el);
            if (!localStorage['paletteBuckets'])
                localStorage.setItem('paletteBuckets',"[]");
            this.options.app.models.templates = {};
            //rendering page title
            this.createPresetsMenu();
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
                        subMenu.draggable({helper: "clone", scroll: true, appendTo: "#workflow-designer", opacity:0.85, zIndex: 999, containment:"#workflow-designer"});
                        subMenu.bind("drag", function(event, ui) {
                            ui.helper.css("background-color", "white");
                            ui.helper.css("padding", "3px 20px");
                        });
                        subMenu.click(function(event) {
                            // simulating drag and drop of this element
                            var workflowView = that.options.app.views.workflowView
                            workflowView.dropElement(event, {draggable:this, offset: {left: event.pageX, top: event.pageY}})
                        })
                    }
                }
            }
        },
        pinUnpin : function(){
            var menuElement = $(this).parent().parent();
            var keepFromClosing = function(){
                return false;
            };
            if(menuElement.hasClass('dropdown')){ //not pinned yet
                menuElement.removeClass('dropdown');
                menuElement.bind('hide.bs.dropdown', keepFromClosing);
                $(this).html('<img src="images/icon-unpin.png"> Unpin');
            } else { //pinned
                menuElement.addClass('dropdown');
                menuElement.unbind('hide.bs.dropdown');
                menuElement.removeClass('open');//close the dropdown
                $(this).html('<img src="images/icon-pin.png"> Pin open');
            }
        },
        setPinMenu : function(menu){
            var pinOpen = $('<li role="presentation" class="dropdown-header"><img src="images/icon-pin.png"> Pin open</li>');
            pinOpen.on('click', this.pinUnpin);
            menu.append(pinOpen);
        },
        isPalettePinned : function(){
            var lockStatus = $('#tools-table').css('position')
            return (lockStatus==='sticky'||lockStatus==='-webkit-sticky');
        },
        pinPalette : function(){
            if (this.isPalettePinned()) {
                $('#tools-table').toggleClass('unpinned');
                $('#pin-palette-button').html('<img width="14px" src="images/icon-pin.png">');
                $('.templates-menu.locked').toggleClass("locked");

            } else {
                $('#tools-table').toggleClass('unpinned');
                $('#pin-palette-button').html('<img width="14px" src="images/icon-unpin.png">');
                $('.templates-menu').toggleClass("locked");
            }
        },
        setPositionRelativeToAbsoluteEvent : function(event, ui) {
            if (this.style.position != "absolute") {
                // resetting position to absolute as it can be removed and we don't want it to move relative elements
                var leftPosition = $(this).position().left;
                this.style.position = "absolute";
                $(this).css({'left' : leftPosition});
            }
        },
        initMenu: function(menu, config) {
            menu.draggable({helper: "original", distance : 20, stop : this.setPositionRelativeToAbsoluteEvent});
            menu.addClass("dropdown");
            var menuContent = $('<ul class="dropdown-menu templates-menu locked" role="menu" aria-labelledby="dropdown-templates-menu"></ul>');
            this.setPinMenu(menuContent);
            this.createMenuFromConfig(config, menuContent);
            menu.append(menuContent);
        },
        render: function (palettePresetIndex, reset) {
            this.$el.html('');
            var taskWidget = $(
                '<span class="palette"><span id="task-menu" class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                    '<img src="images/gears.png" width="20px" type="button" >Tasks<span class="caret"></span></span></span>');

            this.initMenu($(taskWidget), config.tasks);

            this.$el.append(taskWidget);

            palettePresetIndex = this.setPalettePreset(palettePresetIndex);

            var that = this;
            if(reset || localStorage.getItem('paletteBuckets')==='[]'){
                // clear the list of palette bucket menus
                localStorage.setItem('paletteBuckets',"[]");
                config.palette_presets[palettePresetIndex].buckets.forEach(function (mainBucketName) {
                    that.addPaletteBucketMenu(mainBucketName, false);
                });
            } else {
                var localStorageTemplates = JSON.parse(localStorage.getItem('paletteBuckets'));
                var that = this;
                localStorageTemplates.forEach(function (secondaryBucketName) {
                    that.addPaletteBucketMenu(secondaryBucketName, true);
                });
            }
        },
        checkAndGetBucketByName : function(bucketName, onPageLoad, callback){
            $.ajax({
                type: "GET",
                headers : { 'sessionID': localStorage['pa.session'] },
                async: false,
                url: '/catalog/buckets/?kind=workflow',
                success: function (data) {
                    var foundBucket = data.find(function(bucket){
                        return bucket.name.toLowerCase() == bucketName.toLowerCase();
                    });
                    callback(foundBucket);
                },
                error: function () {
                    if (!onPageLoad)
                        StudioClient.alert('Bucket not found!', 'The bucket "' + bucketName + '" couldn\'t be found.', 'error');
                    else
                        console.log('The bucket "'+ bucketName + '" couldn\'t be found.');
                    return;
                }
            });
        },
        beautifyBucketName: function(bucketName){
            if (bucketName.length > 30) {
                return bucketName.substr(0,27)+'...'.replace(/_/g,' ').replace(/-/g,' ');
            } else {
                return bucketName.replace(/_/g,' ').replace(/-/g,' ');
            }
        },
        createPaletteMenu: function (bucketName, menuContent, project, templates) {
            var header = $('<li role="presentation" class="dropdown-header">' + project + '</li>');
            menuContent.append(header);
            var that = this;
            _.each(templates, function (template) {
                if (template.get("name")) {
                    var iconName;
                    var description='';
                    var menuItem;
                    var objectKeyVal = template.get("object_key_values");
                    for (var i in objectKeyVal) {
                        if (objectKeyVal[i]["key"].toLowerCase() == 'workflow.icon'.toLowerCase()) {
                            iconName = objectKeyVal[i]["value"];
                        }
                        if (objectKeyVal[i]["key"].toLowerCase() === 'description'.toLowerCase()) {
                            description = objectKeyVal[i]["value"];
                        }
                    }
                    if (iconName)
                        menuItem = $('<li class="sub-menu draggable ui-draggable job-element"><a class="" onclick="return false;"> <img src=" ' + iconName + '" width="20px"> ' + template.get("name") + '</a></li>');
                    else
                        menuItem = $('<li class="sub-menu draggable ui-draggable job-element"><a class="" href="#" onclick="return false;">' + template.get("name") + '</a></li>');
                    menuItem.tooltip({title: description?description:"Drag&Drop me", placement: "top", delay:300});
                    menuContent.append(menuItem);
                    menuItem.data("templateName", template.get("name"));
                    menuItem.data("bucketName", bucketName);
                    menuItem.draggable({
                        helper: "clone",
                        scroll: true,
                        appendTo: "#workflow-designer",
                        opacity: 0.85,
                        zIndex: 999,
                        containment: "#workflow-designer"
                    });
                    menuItem.bind("drag", function (event, ui) {
                        ui.helper.css("background-color", "white");
                        ui.helper.css("padding", "3px 20px");
                    });
                    menuItem.click(function (event) {
                        // simulating drag and drop of this element
                        var workflowView = that.options.app.views.workflowView;
                        workflowView.dropElement(event, {
                            draggable: this,
                            offset: {left: event.pageX, top: event.pageY}
                        })
                    })
                }
            })
        },
        setPalettePreset: function(presetIndex){
            if (!presetIndex && presetIndex !== 0) {
                presetIndex = localStorage.getItem('palettePreset');
            } else {
                localStorage.setItem('palettePreset', presetIndex);
            }
            var presetName = config.palette_presets[presetIndex].name;
            $('#preset-title-text').text(presetName);
            //$("#studio-bucket-title").empty();
            //$("#studio-bucket-title").append(presetsMenu);
            this.updateDimensions();
            // return Preset Index
            return presetIndex;
        },
        getSecondaryBucketWidget : function(bucketName, nameToDisplay){
            return  $('<span class="secondary-palette palette" id="secondary-palette-'+bucketName+'"><span class="label job-element top-level-menu btn dropdown-toggle" data-toggle="dropdown">' +
                '<img src="images/gears.png" width="20px" type="button" >'+ nameToDisplay +'<span class="caret"></span></span>'+
                '<span class="label top-level-menu btn remove-secondary-bucket-btn" id="remove-secondary-bucket-btn-'+bucketName+'">&times;</span></span>');
        },
        renderPaletteBucketMenu : function(secondaryTemplates, bucketName){
            var nameToDisplay = this.beautifyBucketName(bucketName);
            var templateWidget = this.getSecondaryBucketWidget(bucketName, nameToDisplay);
            templateWidget.draggable({helper: "original", distance : 20, stop : this.setPositionRelativeToAbsoluteEvent});
            templateWidget.addClass("dropdown");
            var menuContent = $('<ul class="dropdown-menu templates-menu locked" role="menu" aria-labelledby="dropdown-secondary-templates-menu"></ul>');
            this.setPinMenu(menuContent);
            $(templateWidget).append(menuContent);

            var that = this;
            secondaryTemplates.groupByProject(function (project, templates) {
                return that.createPaletteMenu(bucketName, menuContent, project, templates);
            }, this);
            this.$el.append(templateWidget);
            // Add remove bucket from palette action
            this.setRemoveBucketAction(bucketName);
        },
        setRemoveBucketAction:function(bucketName){
            var that = this;
            $('#remove-secondary-bucket-btn-'+bucketName).click(function(){
                $('#secondary-palette-'+bucketName).remove();
                var localStorageTemplates = JSON.parse(localStorage.getItem('paletteBuckets'));
                var index = localStorageTemplates.indexOf(bucketName);
                localStorageTemplates.splice(index, 1);
                localStorage.setItem('paletteBuckets', JSON.stringify(localStorageTemplates));
                delete that.options.app.models.templates[bucketName];
            });
        },
        addPaletteBucketMenu : function(bucketName, onPageLoad) {
            if (!onPageLoad && JSON.parse(localStorage.getItem('paletteBuckets')).indexOf(bucketName)>-1){
                alert("The bucket "+ bucketName +" is already open.");
                return false;
            }

            var foundBucketName;
            this.checkAndGetBucketByName(bucketName, onPageLoad, function(foundBucket){
                if (foundBucket)
                    foundBucketName = foundBucket.name;
                else {
                    if (!onPageLoad)
                        StudioClient.alert('Bucket not found!','The bucket "'+ bucketName + '" couldn\'t be found.','error');
                    else
                        console.log('The bucket "'+ bucketName + '" couldn\'t be found.');
                }
            });

            if(!foundBucketName) {
                return false;
            }
            var bucketTemplates = new CatalogWorkflowCollection({bucketname : foundBucketName});
            bucketTemplates.fetch({async: false});
            this.renderPaletteBucketMenu(bucketTemplates, bucketName);
            if(!onPageLoad){
                var localStorageTemplates = JSON.parse(localStorage.getItem('paletteBuckets'));
                localStorageTemplates.push(bucketName);
                localStorage.setItem('paletteBuckets', JSON.stringify(localStorageTemplates));
            }
            this.options.app.models.templates[bucketName] = bucketTemplates;
            return true;
        },
            createPresetsMenu : function () {
                var allPresetNames = config.palette_presets.map(function(p) {return p.name});
                var divBucketName = $('#preset-title');
                var presetsDropDown = $('<ul id = "presets-list" class="dropdown-menu" role="menu"></ul>');
                var presetsMenuHeader = $('<li><span class="preset-menu-header dropdown-header"><i class="fas fa-th-large"></i> Change palette preset</span></li>' +
                    '<li role="separator" class="divider"></li>');
                presetsDropDown.append(presetsMenuHeader);
                allPresetNames.forEach(function (preset) {
                    // calling href="#" would wrong the router to un-display the current workflow
                    var item = $('<li><a href="javascript:void(0)" class="pointer">'+preset+'</a></li>');
                    presetsDropDown.append(item);
                });
                divBucketName.append(presetsDropDown);
                //return divBucketName;
                $("#studio-bucket-title").empty();
                $("#studio-bucket-title").append(divBucketName);
            },
            updateDimensions: function () {

                var windowWidth = document.documentElement.clientWidth;

                var right = document.getElementById('ae-logo').offsetWidth;
                var left = document.getElementById('shortcuts-toolbar').offsetWidth;
                var container = document.getElementById('preset-caret').offsetWidth + 20; //20 is the left/right padding value of the container

                var presetTitle = document.getElementById('preset-title-text');
                var oldWidth = presetTitle.offsetWidth;
                var availableWidth = windowWidth - (right + left + container);

                if (windowWidth == 1200) {
                    presetTitle.style.width = '31px';
                } else if (oldWidth >= availableWidth || availableWidth > 10) {
                    presetTitle.style.width = (availableWidth-10) + 'px';
                }
            }
    })
});
