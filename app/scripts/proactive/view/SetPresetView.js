define(
    [
        'jquery',
        'backbone',
        'text!proactive/templates/presets-set-preset.html',
        'text!proactive/templates/presets-item.html'
    ],

    function ($, Backbone, presetsBrowser, presetsList) {

    "use strict";

    return Backbone.View.extend({
        template: _.template(presetsBrowser),
        initialize: function (options) {
            this.$el = $("<div id='set-preset-container'></div>");
            $("#set-preset-body").append(this.$el);
            this.presets = options.presets;
        },
        events: function(){
            var _events = {};
            _events['click #presets-set-preset-table tr'] = 'selectPreset';
            return _events;
        },
        internalSelectPreset: function (currentPresetRow) {
            var setPresetButton = $('#set-preset-select-button');
            setPresetButton.prop('disabled', !currentPresetRow);

            if (currentPresetRow){
	            this.highlightSelectedRow('#presets-set-preset-table', currentPresetRow);
            }
        },
        highlightSelectedRow: function(tableId, row){
        	var selectedClassName = 'preset-selected-row';
        	var selected = $(tableId + " ." + selectedClassName);
        	if (selected[0]) {
        		$(selected[0]).removeClass(selectedClassName);
        	}
        	$(row).addClass(selectedClassName);
        },
        selectPreset: function(e){
        	var row = $(e.currentTarget);
            this.internalSelectPreset(row);
        },
        render: function () {
            this.$el.html(this.template());
            var PresetsList = _.template(presetsList);
            _(this.presets).each(function(preset) {
                var presetName = preset.name;
                this.$('#presets-set-preset-table').append(PresetsList({preset: preset, presetname: presetName}));
            }, this);
            // to open the browser on the first bucket
            this.internalSelectPreset(this.$('#presets-set-preset-table tr')[0]);
            return this;
        },
    })

})