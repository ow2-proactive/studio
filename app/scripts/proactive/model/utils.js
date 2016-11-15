define(function (require) {
	
    return {
        inlineNameNotEditable: function(prop) {
            var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
            return name;
        },
        inlineName: function(prop) {
            var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
            return "<input class='input-property-field' type=\"text\" value=\"" + name + "\">";
        },
        inlineNameValueNotEditable: function(prop) {
            return "<div class='property-field'>" + prop['Name'] + "</div><div class='property-field'>" + prop["Value"] + "</div>";
        },
        inlineNameValue: function(prop) {        			
            return "<input class='input-property-field' type=\"text\" value=\"" + prop['Name'] + 
            "\"><input class='input-property-field' type=\"text\"  value=\""+ prop["Value"] + "\">";
        },
        inlineNameValueInherited: function(prop) {
        	var checked = "";
        	// update datatype if wrong, otherwise dislay is not correct
        	if (prop['Inherited'] == "true") prop['Inherited'] = true;
        	if (prop['Inherited'] == "false") prop['Inherited'] = false;

        	if (prop['Inherited']){
        		checked=" checked"
        	}
        			
            return "<input class='input-property-field' type=\"text\" value=\"" + prop['Name'] + 
            "\"><input class='input-property-field' type=\"text\"  value=\""+ prop["Value"] +
            "\"><input class='input-property-field' type=\"checkbox\"" + checked + " onclick=\"return false;\">";
        }
    }
})