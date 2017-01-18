define(function (require) {
	
    return {
    	inlineName: function(prop) {
            var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
            return name;
        },
        inlineNameValueNotEditable: function(prop) {
            return "<div class='property-field'>" + prop['Name'] + "</div><div class='property-field'>" + prop["Value"] + "</div>";
        },
        inlineNameValue: function(prop) {   
            var name = prop['Name'] ? prop['Name'] : prop['Property Name'];
            var value = prop['Value'] ? prop['Value'] : prop['Property Value'];
            
            return "<input class='input-property-field' type=\"text\" value=\"" + name + 
            "\"><input class='input-property-field' type=\"text\"  value=\""+ value + "\">";
        },
        inlineNameValueInherited: function(prop) {
        	prop['Inherited'] = (prop['Inherited'] && prop['Inherited'] != "false");
        	
        	var value = prop['Value'] ? prop['Value'] : "";
        	var checked = "";
        	if (prop['Inherited']){
        		checked=" checked"
        	}
        			
            return "<input class='input-property-field' type=\"text\" value=\"" + prop['Name'] + 
            "\"><input class='input-property-field' type=\"text\"  value=\""+ value +
            "\"><input class='input-property-field' type=\"checkbox\"" + checked + " onclick=\"return false;\">";
        }
    }
})