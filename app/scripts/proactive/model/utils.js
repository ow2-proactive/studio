define(
    [
        'backbone',
        'underscore'
    ],

    function (Backbone, _) {
	
        return {
            inlineName: function(prop) {
                var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
                return _.escape(name);
            },
            inlineNameValueNotEditable: function(prop) {
                return "<div class='property-field'>" + _.escape(prop['Name']) + "</div><div class='property-field'>" + _.escape(prop["Value"]) + "</div>";
            },
            inlineNameValue: function(prop) {
                var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
                var value = prop['Value'] ? prop['Value'] : prop['Property Value'];

                return "<input class='input-property-field' type=\"text\" value=\"" + _.escape(name) +
                "\"><input class='input-property-field' type=\"text\"  value=\""+ _.escape(value) + "\">";
            },
            inlineNameValueInherited: function(prop) {
                prop['Inherited'] = (prop['Inherited'] && (prop['Inherited'] == true || prop['Inherited'] == "true"));

                var value = prop['Value'] ? prop['Value'] : "";
                var checked = "";
                if (prop['Inherited']){
                    checked=" checked"
                }

                return "<input class='input-property-field' type=\"text\" value=\"" + _.escape(prop['Name']) +
                "\"><input class='input-property-field' type=\"text\"  value=\""+ _.escape(value) +
                "\"><input class='input-property-field' type=\"checkbox\"" + checked + " onclick=\"return false;\">";
            },
            bigCrossTemplate: _.template('<div><span data-editor></span><button type="button" class="btn btn-danger" data-action="remove">x</button></div>'),

            isUrl: function(url) {
                var urlMatcher = /^([a-z]+\:\/+)([^\/\s]*)([a-z0-9\-@\^=%&;\/~\+]*)[\?]?([^ \#]*)#?([^ \#]*)/ig;

                return (! _.isEmpty(url) && url.match(urlMatcher));

            }
        }
})